(function(root){
 'use strict';
 const node=typeof module==='object'&&module.exports;
 const leagues=node?require('./leagues.js'):root.GradaLeagues,competitions=node?require('./competitions.js'):root.GradaCompetitions,formations=node?require('./formations.js'):root.GradaFormations,nations=node?require('./nations.js'):root.GradaNations,branding=node?require('./branding.js'):root.GradaBranding;
 const minimumScoreMinutes=node?require('./sampling.js').minimumScoreMinutes:root.GradaSampling.minimumScoreMinutes;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=value=>Number.isFinite(value)?new Intl.NumberFormat('es-ES',{minimumFractionDigits:3,maximumFractionDigits:3}).format(value):'—';
 const method='league_ideal_xi_canonical_mean_v1';
 const knownPosition=pos=>Object.hasOwn(nations.positions,pos);
 const sourceOrder=(a,b)=>(Number.isFinite(b.player.minutes)?b.player.minutes:-1)-(Number.isFinite(a.player.minutes)?a.player.minutes:-1)||a.player.league_key.localeCompare(b.player.league_key)||String(a.player.id).localeCompare(String(b.player.id));
 function unique(rows){const people=new Map();for(const row of rows){if(!people.has(row.person))people.set(row.person,[]);people.get(row.person).push(row);}return [...people.values()].map(entries=>[...entries].sort(sourceOrder)[0]);}
 function summary(group){
  const pool=group.players.filter(p=>p.score!==null&&Number.isFinite(p.scoreMinutes)&&p.scoreMinutes>=minimumScoreMinutes&&knownPosition(p.player.pos));
  const result={...group,...formations.propose(pool),eligible:pool.length};
  result.missing=result.slots.filter(s=>!s.candidate).map(s=>s.label);
  result.units=Object.fromEntries(Object.keys(nations.positions).map(pos=>{
   const slots=result.slots.filter(s=>s.pos===pos),items=slots.filter(s=>s.candidate).map(s=>s.candidate);
   return [pos,{score:items.length===slots.length?formations.mean(items):null,known:items.length,total:slots.length}];
  }));
  return result;
 }
 function build(model,{datasets=[]}={}){
  const scope=leagues.group('leagues'),input=model.data,byLeague=new Map(),canonical=new Map(),conflicts=new Set(),sourceKinds=new Map();
  for(const row of input.players){const person=competitions.identity(row);if(!person)continue;if(!canonical.has(person))canonical.set(person,[]);canonical.get(person).push(row);}
  for(const [person,rows]of canonical)if(rows.length!==1||rows[0].identityConflict||model.players.get(rows[0])?.identityConflict)conflicts.add(person);
  for(const data of datasets){const id=data.metadata?.league_key;if(!scope.leagueIds.includes(id))continue;if(byLeague.has(id))throw Error('Captura de liga duplicada.');byLeague.set(id,data);
   for(const row of data.players){const person=competitions.identity(row);if(!person||!knownPosition(row.pos))continue;if(!sourceKinds.has(person))sourceKinds.set(person,new Set());sourceKinds.get(person).add(row.pos==='POR'?'keeper':'field');}
  }
  for(const [person,kinds]of sourceKinds){const canonicalPlayer=canonical.get(person)?.[0];if(canonicalPlayer&&knownPosition(canonicalPlayer.pos))kinds.add(canonicalPlayer.pos==='POR'?'keeper':'field');if(kinds.size>1)conflicts.add(person);}
  const rows=[],teams=[],leagueRows=new Map();let records=0,unknownIdentity=0,unlinked=0;
  for(const [id,data]of byLeague){
   const league=leagues.get(id),members=[];records+=data.players.length;
   const namespace=value=>value===null||value===undefined?null:String(value).startsWith(id+':')?String(value):id+':'+value;
   teams.push(...data.teams.map(t=>({...t,id:namespace(t.id),league_key:id,league:league.name})));
   for(const original of data.players){
    const person=competitions.identity(original);if(!person){unknownIdentity++;continue;}if(conflicts.has(person))continue;
    const canonicalPlayer=canonical.get(person)?.[0],profile=canonicalPlayer&&model.players.get(canonicalPlayer);if(!profile){unlinked++;continue;}
    const score=profile.score,player={...original,id:canonicalPlayer.id,pos:canonicalPlayer.pos,team_id:namespace(original.team_id),league_key:id,league:league.name};
    members.push({person,player,score:Number.isFinite(score)&&score>=0&&score<=1?score:null,scoreMinutes:profile.scoreSample?.minutes??canonicalPlayer.minutes,midfieldProfile:model.roles?.get(canonicalPlayer)||null,profileLabel:profile.profileLabel||canonicalPlayer.pos});
   }
   rows.push(...members);leagueRows.set(id,unique(members));
  }
  const people=unique(rows),global=summary({id:scope.id,name:'Todas las ligas',available:byLeague.size>0,players:people}),groups=[global,...scope.leagueIds.map(id=>summary({id,name:leagues.get(id).name,available:byLeague.has(id),players:leagueRows.get(id)||[]}))];
  return {method,groups,data:{...input,teams},coverage:{records,people:people.length,eligible:global.eligible,availableLeagues:byLeague.size,expectedLeagues:scope.leagueIds.length,duplicateRecords:rows.length-people.length,conflicts:conflicts.size,unknownIdentity,unlinked,complete:groups.slice(1).filter(g=>g.complete).length}};
 }
 function options(model,selected){return model.groups.map(group=>'<option value="'+esc(group.id)+'"'+(group.id===selected?' selected':'')+'>'+esc(group.name)+(group.available?group.complete?'':' · XI incompleto':' · sin cargar')+'</option>').join('');}
 function ranking(model,{selected=null}={}){
  const global=model.groups.find(g=>g.id==='leagues'),rows=model.groups.filter(g=>g.id!=='leagues').sort((a,b)=>(b.score??-1)-(a.score??-1)||a.name.localeCompare(b.name,'es'));
  if(global)rows.unshift(global);
  return '<div class="tablewrap national-ranking"><table><thead><tr><th scope="col">Score teórico</th><th scope="col">Liga</th><th scope="col">Sistema</th><th scope="col">XI</th></tr></thead><tbody>'+rows.map(group=>'<tr'+(group.id===selected?' class="national-selected"':'')+'><td class="national-score">'+fmt(group.score)+'</td><td><button type="button" class="nation-choice" data-ideal="'+esc(group.id)+'" aria-label="Ver once de '+esc(group.name)+'">'+branding.leagueLabel(group.id,group.name)+'</button></td><td>'+esc(group.formation)+'</td><td>'+(group.available?group.selected+'/11':'Sin cargar')+'</td></tr>').join('')+'</tbody></table></div>';
 }
 function lineup(group,model){
  if(!group)return '<p class="empty">No hay competición seleccionada.</p>';
  const global=group.id==='leagues',coverage=model.coverage;
  const note=global&&coverage.availableLeagues<coverage.expectedLeagues?'<p class="nation-warning">Ámbito parcial: '+coverage.availableLeagues+'/'+coverage.expectedLeagues+' ligas cargadas. El once global puede cambiar al recuperar las pendientes.</p>':!group.available?'<p class="nation-warning">Esta liga todavía no se ha cargado. Reintenta las competiciones pendientes para incluir sus jugadores.</p>':'';
  return note+nations.lineup(group,model,{title:group.name,league:global?null:group.id,scopeLabel:'este once',contextNote:'Candidatos de primeras divisiones, sin exigir nacionalidad. El score es el canónico de temporada con todas las competiciones disponibles del jugador; los torneos no añaden candidatos ajenos a estas ligas. No se ajusta la dificultad entre ligas ni se predice un resultado de partido.'});
 }
 const api={method,build,options,ranking,lineup};if(node)module.exports=api;else root.GradaIdeal=api;
})(typeof window==='object'?window:globalThis);
