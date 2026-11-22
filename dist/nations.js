(function(root){
 'use strict';
 const node=typeof module==='object'&&module.exports,nationality=node?require('./nationality.js'):root.GradaNationality,roles=node?require('./roles.js'):root.GradaRoles,branding=node?require('./branding.js'):root.GradaBranding;
 const minimumScoreMinutes=node?require('./sampling.js').minimumScoreMinutes:root.GradaSampling.minimumScoreMinutes;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=value=>Number.isFinite(value)?new Intl.NumberFormat('es-ES',{minimumFractionDigits:3,maximumFractionDigits:3}).format(value):'—';
 const method='national_xi_442_minutes_v1';
 const positions={POR:{label:'Portería',count:1},DEF:{label:'Defensa',count:4},MED:{label:'Centro del campo',count:4},DEL:{label:'Delantera',count:2}};
 const backs=[{key:'LI',label:'Lateral izquierdo',codes:['LB','LWB']},{key:'DC1',label:'Central',codes:['CB']},{key:'DC2',label:'Central',codes:['CB']},{key:'LD',label:'Lateral derecho',codes:['RB','RWB']}];
 const weighted=rows=>rows.length?rows.reduce((s,p)=>s+p.score*p.player.minutes,0)/rows.reduce((s,p)=>s+p.player.minutes,0):null;
 const candidateOrder=(a,b)=>b.score-a.score||b.player.minutes-a.player.minutes||a.player.name.localeCompare(b.player.name,'es')||String(a.player.id).localeCompare(String(b.player.id));
 function defense(candidates){
  // At most 16 states. Match versatile defenders to four distinct published
  // positions; greedy selection can strand a fullback who is also a centreback.
  const states=new Map([[0,{sum:0,minutes:0,items:[],key:''}]]);
  const better=(a,b)=>!b||a.sum>b.sum||a.sum===b.sum&&(a.minutes>b.minutes||a.minutes===b.minutes&&a.key<b.key);
  for(const p of [...candidates].sort(candidateOrder)){const codes=new Set(roles.info(p.player).codes);for(const [mask,state]of [...states].sort((a,b)=>b[0]-a[0]))for(let i=0;i<backs.length;i++){
   if(mask&(1<<i)||!backs[i].codes.some(code=>codes.has(code)))continue;
   const nextMask=mask|(1<<i),items=[...state.items,{slot:i,candidate:p}],next={sum:state.sum+p.score,minutes:state.minutes+p.player.minutes,items,key:items.map(x=>x.slot+':'+x.candidate.person).sort().join('|')};if(better(next,states.get(nextMask)))states.set(nextMask,next);
  }}
  const count=mask=>mask.toString(2).replace(/0/g,'').length;
  const best=[...states].sort((a,b)=>count(b[0])-count(a[0])||b[1].sum-a[1].sum||b[1].minutes-a[1].minutes||a[1].key.localeCompare(b[1].key))[0][1];
  return backs.map((slot,i)=>({...slot,pos:'DEF',candidate:best.items.find(item=>item.slot===i)?.candidate||null}));
 }
 function build(model){
  const data=model.data,people=new Map(),countries=new Map();let known=0,conflicts=0,duplicateRecords=0;
  for(const player of data.players){const country=nationality.info(player);if(!country)continue;known++;const person=String(country.context.player_id),profile=model.players.get(player),score=profile?.score;
   const row={person,player,country,score:Number.isFinite(score)&&score>=0&&score<=1?score:null};if(!people.has(person))people.set(person,[]);people.get(person).push(row);
  }
  for(const entries of people.values()){
   if(new Set(entries.map(p=>p.country.code)).size!==1){conflicts++;continue;}
   duplicateRecords+=entries.length-1;
   // One league record per person, chosen by minutes, never by best score.
   const p=[...entries].sort((a,b)=>(b.player.minutes??-1)-(a.player.minutes??-1)||String(a.player.id).localeCompare(String(b.player.id)))[0],code=p.country.code;
   if(!countries.has(code))countries.set(code,{code,name:nationality.label(p.country),country:p.country,players:[]});countries.get(code).players.push(p);
  }
  for(const country of countries.values()){
   const pool=country.players.filter(p=>p.score!==null&&Number.isFinite(p.player.minutes)&&p.player.minutes>=minimumScoreMinutes&&Object.hasOwn(positions,p.player.pos)).sort(candidateOrder),byPos=pos=>pool.filter(p=>p.player.pos===pos),slots=[];
   slots.push({key:'POR',label:'Portero',pos:'POR',candidate:byPos('POR')[0]||null},...defense(byPos('DEF')));
   for(const [pos,n]of [['MED',4],['DEL',2]])for(let i=0;i<n;i++)slots.push({key:pos+(i+1),label:pos==='MED'?'Centrocampista':'Delantero',pos,candidate:byPos(pos)[i]||null});
   const chosen=slots.map(s=>s.candidate).filter(Boolean);country.slots=slots;country.eligible=pool.length;country.complete=chosen.length===11;country.score=country.complete?weighted(chosen):null;country.selected=chosen.length;country.missing=slots.filter(s=>!s.candidate).map(s=>s.label);
   country.units=Object.fromEntries(Object.entries(positions).map(([pos,definition])=>{const items=slots.filter(s=>s.pos===pos&&s.candidate).map(s=>s.candidate);return [pos,{score:items.length===definition.count?weighted(items):null,known:items.length,total:definition.count}];}));
  }
  const rows=[...countries.values()].sort((a,b)=>(b.score??-1)-(a.score??-1)||a.name.localeCompare(b.name,'es'));
  return {method,formation:'4-4-2',countries:rows,data,coverage:{records:data.players.length,known,people:people.size-conflicts,duplicateRecords,conflicts,countries:rows.length,complete:rows.filter(c=>c.complete).length}};
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
  return '<div class="tablewrap national-ranking"><table><thead><tr><th scope="col">Score teórico</th><th scope="col">Selección</th><th scope="col">XI</th><th scope="col">Con score</th></tr></thead><tbody>'+rows.map(c=>'<tr'+(c.code===selected?' class="national-selected"':'')+'><td class="national-score">'+fmt(c.score)+'</td><td><button type="button" class="nation-choice" data-nation="'+c.code+'" aria-label="Ver once de '+esc(c.name)+'">'+label(c.country)+'</button></td><td>'+c.selected+'/11</td><td>'+c.eligible+'</td></tr>').join('')+'</tbody></table></div>';
 }
 function lineup(country,model){
  if(!country)return '<p class="empty">No hay países verificados en las fichas disponibles.</p>';
  const pitch=['DEL','MED','DEF','POR'].map(pos=>'<ol class="nation-line nation-line-'+pos+'" aria-label="'+positions[pos].label+'">'+country.slots.filter(s=>s.pos===pos).map(s=>'<li>'+(!s.candidate?'<div class="nation-player nation-vacant"><b>—</b><span>'+esc(s.label)+'</span><small>Sin candidato verificado</small></div>':'<button type="button" class="nation-player" data-national-player="'+esc(s.candidate.player.id)+'"><b>'+fmt(s.candidate.score)+'</b><span class="nation-player-name">'+esc(s.candidate.player.name)+'</span><small>'+esc(s.label)+'</small></button>')+'</li>').join('')+'</ol>').join('');
  const units=Object.entries(positions).map(([pos,d])=>{const u=country.units[pos];return '<div class="nation-unit"><span>'+d.label+'</span><b>'+fmt(u.score)+'</b>'+(u.score===null?'<small>'+u.known+'/'+u.total+' puestos cubiertos</small>':'<meter min="0" max="1" value="'+u.score+'" aria-label="Score de '+d.label+'"></meter>')+'</div>';}).join('');
  const roster=country.slots.filter(s=>s.candidate).map(s=>{const p=s.candidate.player;return '<tr><td>'+fmt(s.candidate.score)+'</td><td><button type="button" class="nation-choice" data-national-player="'+esc(p.id)+'">'+esc(p.name)+'</button></td><td>'+esc(s.label)+'</td><td>'+branding.playerClub(p,model.data.teams)+'</td><td>'+new Intl.NumberFormat('es-ES').format(p.minutes)+'</td></tr>';}).join('');
  return '<div class="national-heading"><div><span class="badge">Once teórico · 4-4-2</span><h2>'+label(country.country)+'</h2></div><div class="national-total"><span>Score teórico</span><b>'+fmt(country.score)+'</b><small>'+country.selected+'/11 puestos</small></div></div>'+(country.complete?'':'<p class="nation-warning">Once incompleto. Faltan: '+esc(country.missing.join(', '))+'. El score de selección queda pendiente.</p>')+'<div class="nation-pitch" aria-label="Once 4-4-2 de '+esc(country.name)+'">'+pitch+'</div><p class="sub">Laterales y centrales con puesto publicado; el mediocampo se representa por su posición amplia, sin asignar bandas. Selecciona un jugador para ver su ficha.</p><div class="national-units">'+units+'</div><details class="national-ledger"><summary>Jugadores, minutos y cálculo del once</summary><p class="sub">Promedio ponderado: Σ(score × minutos de club) / Σ(minutos de club). No son minutos ni estadísticas de partidos internacionales.</p><div class="tablewrap"><table><thead><tr><th scope="col">Score</th><th scope="col">Jugador</th><th scope="col">Puesto</th><th scope="col">Club</th><th scope="col">Minutos</th></tr></thead><tbody>'+roster+'</tbody></table></div></details>';
 }
 const api={method,build,defense,weighted,positions,label,options,ranking,lineup};if(node)module.exports=api;else root.GradaNations=api;
})(typeof window==='object'?window:globalThis);
