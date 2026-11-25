(function(root){
 'use strict';
 const node=typeof module==='object'&&module.exports,nationality=node?require('./nationality.js'):root.GradaNationality,formations=node?require('./formations.js'):root.GradaFormations,branding=node?require('./branding.js'):root.GradaBranding;
 const minimumScoreMinutes=node?require('./sampling.js').minimumScoreMinutes:root.GradaSampling.minimumScoreMinutes;
 const leagues=node?require('./leagues.js'):root.GradaLeagues;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=value=>Number.isFinite(value)?new Intl.NumberFormat('es-ES',{minimumFractionDigits:3,maximumFractionDigits:3}).format(value):'—';
 const method=formations.method,mean=formations.mean;
 const positions={POR:{label:'Portería'},DEF:{label:'Defensa y carriles'},MED:{label:'Centro del campo'},DEL:{label:'Delantera'}};
 function build(model){
  const scope=leagues.group('all'),input=model.data;
  const leagueKey=player=>player.league_key||input.metadata?.league_key;
  const players=input.players.filter(p=>scope.leagueIds.includes(leagueKey(p))),data={...input,players},people=new Map(),countries=new Map();let known=0,conflicts=0,duplicateRecords=0;
  const available=new Set([...(input.metadata?.leagues||[]).map(l=>l.id),input.metadata?.league_key,...players.map(leagueKey)]);
  for(const player of data.players){
   const country=nationality.info(player);if(!country)continue;known++;const person=String(country.context.player_id),profile=model.players.get(player),score=profile?.score;
   const row={person,player,country,score:Number.isFinite(score)&&score>=0&&score<=1?score:null,midfieldProfile:model.roles?.get(player)||null,profileLabel:profile?.profileLabel||player.pos};
   if(!people.has(person))people.set(person,[]);people.get(person).push(row);
  }
  for(const entries of people.values()){
   if(new Set(entries.map(p=>p.country.code)).size!==1){conflicts++;continue;}
   duplicateRecords+=entries.length-1;
   const p=[...entries].sort((a,b)=>(b.player.minutes??-1)-(a.player.minutes??-1)||String(a.player.id).localeCompare(String(b.player.id)))[0],code=p.country.code;
   if(!countries.has(code))countries.set(code,{code,name:nationality.label(p.country),country:p.country,players:[]});countries.get(code).players.push(p);
  }
  for(const country of countries.values()){
   const pool=country.players.filter(p=>p.score!==null&&Number.isFinite(p.player.minutes)&&p.player.minutes>=minimumScoreMinutes&&Object.hasOwn(positions,p.player.pos));
   Object.assign(country,formations.propose(pool),{eligible:pool.length});
   country.missing=country.slots.filter(s=>!s.candidate).map(s=>s.label);
   country.units=Object.fromEntries(Object.keys(positions).map(pos=>{
    const slots=country.slots.filter(s=>s.pos===pos),items=slots.filter(s=>s.candidate).map(s=>s.candidate);
    return [pos,{score:items.length===slots.length?mean(items):null,known:items.length,total:slots.length}];
   }));
  }
  const rows=[...countries.values()].sort((a,b)=>(b.score??-1)-(a.score??-1)||a.name.localeCompare(b.name,'es'));
  return {method,scope:scope.id,countries:rows,data,coverage:{records:data.players.length,excludedRecords:input.players.length-data.players.length,availableLeagues:scope.leagueIds.filter(id=>available.has(id)).length,expectedLeagues:scope.leagueIds.length,known,people:people.size-conflicts,duplicateRecords,conflicts,countries:rows.length,complete:rows.filter(c=>c.complete).length}};
 }
 function label(value){
  if(!value)return '<span class="unavailable" title="Sin país deportivo publicado para esta identidad y club.">—</span>';
  const flag=nationality.flag(value),icon=flag.path?'<img class="country-flag" data-country-flag src="'+flag.path+'" width="20" height="15" alt="" aria-hidden="true">':'<span class="national-flag" aria-hidden="true">'+esc(flag.text)+'</span>';
  return '<span class="country-identity">'+icon+'<span>'+esc(nationality.label(value))+'</span></span>';
 }
 function options(model,selected){return [...model.countries].sort((a,b)=>a.name.localeCompare(b.name,'es')).map(c=>'<option value="'+c.code+'"'+(c.code===selected?' selected':'')+'>'+esc(c.name)+(c.complete?'':' · XI incompleto')+'</option>').join('');}
 function ranking(model,{onlyComplete=true,selected=null}={}){
  const rows=model.countries.filter(c=>!onlyComplete||c.complete);
  if(!rows.length)return '<p class="empty">No hay onces completos con los puestos y scores disponibles. Puedes mostrar también las selecciones incompletas.</p>';
  return '<div class="tablewrap national-ranking"><table><thead><tr><th scope="col">Score teórico</th><th scope="col">Selección</th><th scope="col">Sistema</th><th scope="col">XI</th></tr></thead><tbody>'+rows.map(c=>'<tr'+(c.code===selected?' class="national-selected"':'')+'><td class="national-score">'+fmt(c.score)+'</td><td><button type="button" class="nation-choice" data-nation="'+c.code+'" aria-label="Ver once de '+esc(c.name)+'">'+label(c.country)+'</button></td><td>'+esc(c.formation)+'</td><td>'+c.selected+'/11</td></tr>').join('')+'</tbody></table></div>';
 }
 function card(slot,model){
  if(!slot.candidate)return '<div class="nation-player nation-vacant"><b>—</b><span>'+esc(slot.label)+'</span><small>Sin candidato verificado</small></div>';
  const p=slot.candidate.player;
  return '<button type="button" class="nation-player" data-national-player="'+esc(p.id)+'"><b>'+fmt(slot.candidate.score)+'</b><span class="nation-club">'+branding.playerClub(p,model.data.teams)+'</span><span class="nation-player-name">'+esc(p.name)+'</span><small>'+esc(slot.label)+'</small></button>';
 }
 function lineup(country,model){
  if(!country)return '<p class="empty">No hay países verificados en las fichas disponibles.</p>';
  const rows=[...new Set(country.slots.map(s=>s.row))],pitch=rows.map(row=>{
   const slots=country.slots.filter(s=>s.row===row);
   return '<ol class="nation-line nation-line-count-'+slots.length+'" aria-label="'+esc(slots.map(s=>s.label).join(', '))+'">'+slots.map(s=>'<li>'+card(s,model)+'</li>').join('')+'</ol>';
  }).join('');
  const units=Object.entries(positions).map(([pos,d])=>{
   const u=country.units[pos];return '<div class="nation-unit"><span>'+d.label+'</span><b>'+fmt(u.score)+'</b><small>'+u.known+'/'+u.total+' puestos cubiertos</small>'+(u.score===null?'':'<meter min="0" max="1" value="'+u.score+'" aria-label="Score de '+d.label+'"></meter>')+'</div>';
  }).join('');
  const roster=country.slots.filter(s=>s.candidate).map(s=>{
   const p=s.candidate.player;return '<tr><td>'+fmt(s.candidate.score)+'</td><td><button type="button" class="nation-choice" data-national-player="'+esc(p.id)+'">'+esc(p.name)+'</button></td><td>'+esc(s.label)+'</td><td>'+esc(s.evidence)+'</td><td>'+esc(s.candidate.profileLabel)+'</td><td>'+branding.playerClub(p,model.data.teams)+'</td><td>'+new Intl.NumberFormat('es-ES').format(p.minutes)+'</td></tr>';
  }).join('');
  const alternatives=country.alternatives.map(a=>'<tr'+(a.formation===country.formation?' class="national-selected"':'')+'><td>'+fmt(a.score)+'</td><td>'+esc(a.formation)+(a.formation===country.formation?' · elegido':'')+'</td><td>'+a.selected+'/11'+(!a.complete?' · Faltan: '+esc(a.slots.filter(s=>!s.candidate).map(s=>s.label).join(', ')):'')+'</td></tr>').join('');
  return '<div class="national-heading"><div><span class="badge">Once teórico · '+esc(country.formation)+'</span><h2>'+label(country.country)+'</h2></div><div class="national-total"><span>Score teórico</span><b>'+fmt(country.score)+'</b><small>'+country.selected+'/11 puestos</small></div></div>'+
   (country.complete?'':'<p class="nation-warning">Once incompleto. Faltan: '+esc(country.missing.join(', '))+'. El score de selección queda pendiente.</p>')+
   '<div class="nation-pitch" aria-label="Once '+esc(country.formation)+' de '+esc(country.name)+'">'+pitch+'</div><p class="sub">Contención, creación y puestos compatibles. Las bandas respetan el lado publicado; los interiores no tienen un lado verificado. El escudo indica el club. Selecciona un jugador para ver su ficha.</p><div class="national-units">'+units+'</div>'+
   '<details class="national-ledger"><summary>Por qué este once · jugadores y encaje</summary><p class="sub">Cada sistema elige la mayor suma de scores individuales con puestos compatibles. Entre esos siete onces se elige la mayor media simple: suma de los once scores / 11. Cada titular pesa lo mismo; las líneas también usan media simple. Los minutos sirven para comprobar el mínimo de 200, sin ponderar el score. Cada jugador conserva el score y perfil de su ficha. El puesto propuesto se apoya en posiciones publicadas; los apoyos por perfil estadístico se indican como encaje teórico. Las líneas agrupan los puestos del dibujo; incluyen carrileros en defensa. No son estadísticas de partidos internacionales.</p><div class="tablewrap"><table><thead><tr><th scope="col">Score</th><th scope="col">Jugador</th><th scope="col">Puesto propuesto</th><th scope="col">Encaje</th><th scope="col">Perfil del score</th><th scope="col">Club</th><th scope="col">Minutos</th></tr></thead><tbody>'+roster+'</tbody></table></div></details>'+
   '<details class="national-ledger"><summary>Los siete sistemas evaluados</summary><div class="tablewrap"><table><thead><tr><th scope="col">Score teórico</th><th scope="col">Sistema</th><th scope="col">Cobertura</th></tr></thead><tbody>'+alternatives+'</tbody></table></div></details>';
 }
 const api={method,build,mean,positions,label,options,ranking,lineup};if(node)module.exports=api;else root.GradaNations=api;
})(typeof window==='object'?window:globalThis);
