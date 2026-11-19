(function(root){
 'use strict';
 const node=typeof module==='object'&&module.exports,clubs=node?require('./clubs.js'):root.GradaClubs,metrics=node?require('./metrics.js'):root.GradaMetrics;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const scoreFormat=new Intl.NumberFormat('es-ES',{minimumFractionDigits:3,maximumFractionDigits:3});
 const numberFormat=new Intl.NumberFormat('es-ES',{maximumFractionDigits:2});
 const countFormat=new Intl.NumberFormat('es-ES',{maximumFractionDigits:0});
 const brief={rank:'Puesto dentro del orden y los filtros actuales.',radarArea:'Score de su perfil con ajuste de juego limpio. Entre 0 y 1; mayor es mejor.',teamArea:'Media de los scores individuales ponderada por minutos. Entre 0 y 1.',tacticalRole:'Puestos publicados por FotMob. Puede declarar varios; no indica minutos por puesto.',goals:'Goles publicados en esta muestra.',assists:'Último pase acreditado antes de un gol.',xg:'Calidad de los tiros: suma de sus probabilidades de acabar en gol.',xa:'Asistencias esperadas según el modelo de la fuente.',goalsPerXg:'Goles divididos entre xG de la misma muestra. Más de 1: supera lo esperado.',assistsPerXa:'Asistencias divididas entre xA de la misma muestra.',psxgEfficiency:'Eficacia del portero frente al xGOT recibido, con goles de la misma muestra.',xgPerShot:'xG dividido entre tiros: calidad media de las ocasiones.',playerBaseScore:'Área del radar antes del ajuste por tarjetas.'};
 function scoreFirst(keys,primary='radarArea'){
  return [primary,'rank',...new Set(keys.filter(k=>k!==primary&&k!=='rank'))];
 }
 function shortHelp(key,full,{team=false,per90=false}={}){
  let text=key==='radarArea'&&team?brief.teamArea:brief[key]||String(full||'Dato publicado por la fuente.').split(/(?<=\.)\s+/)[0];
  if(per90&&!text.includes('90'))text='Por 90 minutos. '+text;
  text=text.replace(/\s+/g,' ').trim();
  if(text.length>170){const cut=text.slice(0,169),last=cut.lastIndexOf(' ');text=cut.slice(0,last>95?last:169)+'…';}
  return text;
 }
 function selection(options,values){const valid=new Set(options.map(o=>String(o.id)));return new Set([...values].map(String).filter(id=>valid.has(id)));}
 function matchesTeams(record,selected,catalog,{team=false}={}){
  const ids=[...selected].filter(id=>!team||id!==clubs.multiKey);
  return !ids.length||ids.some(id=>team?String(record.id)===id:clubs.matches(record,id,catalog));
 }
 function pair(teams,values=[]){
  const valid=new Set(teams.map(t=>String(t.id))),result=[];
  for(const id of [...values,...teams.map(t=>String(t.id))])if(valid.has(String(id))&&!result.includes(String(id))){result.push(String(id));if(result.length===2)break;}
  return result;
 }
 function advantage(a,b,lower=false){
  if(!Number.isFinite(a)||!Number.isFinite(b))return null;
  const delta=Math.round(a*1000)-Math.round(b*1000);
  return delta===0?'tie':(delta>0)!==lower?'left':'right';
 }
 function unit(model,team,key){
  const summary=(key==='ALL'?model.overall:model.units.get(key))?.teams.get(String(team.id));
  return {value:summary?.area??null,known:summary?.validPlayers??0,total:summary?.totalPlayers??0,minutes:summary?.minutes??0};
 }
 function teamMetric(team,key){
  const context=metrics.context(team,key);
  return {value:metrics.metric(team,key),source:context?.source||team.fieldSources?.[key]||'',matches:context?.matches??null};
 }
 function cards(model,team,key){
  const players=model.data.players.filter(p=>p.team_id!==null&&p.team_id!==undefined&&String(p.team_id)===String(team.id));
  const known=players.filter(p=>Number.isInteger(p[key])&&p[key]>=0&&metrics.context(p,key)?.source==='FotMob');
  return {value:known.length?known.reduce((sum,p)=>sum+p[key],0):null,known:known.length,total:players.length,source:'FotMob · suma conocida de plantilla',partial:known.length!==players.length};
 }
 function compareTeams(model,ids){
  if(!model)return null;
  const chosen=pair(model.data.teams,ids);if(chosen.length!==2)return null;
  const [left,right]=chosen.map(id=>model.data.teams.find(t=>String(t.id)===id));
  const rows=[['ALL','Score general'],['POR','Portería'],['DEF','Defensa'],['MED','Centro del campo'],['DEL','Delantera'],['MED_ATT','Mediocampo ofensivo'],['MED_DEF','Mediocampo defensivo']].map(([key,label])=>{const a=unit(model,left,key),b=unit(model,right,key);return {key,label,left:a,right:b,advantage:advantage(a.value,b.value)};});
  const definitions=[['goalsPer90','Goles /90 de equipo'],['conceded90','Goles recibidos /90',true],['xg90','xG /90 de equipo'],['xga90','xG recibido /90',true],['xgDifferencePerMatch','Balance xG / partido'],['shotsOnTargetPerMatch','Tiros a puerta / partido'],['bigChancesPerMatch','Grandes ocasiones / partido'],['pointsPerMatch','Puntos / partido'],['goalsPerXg','Goles / xG'],['cleanPerMatch','Porterías a cero %']];
  const kpis=definitions.map(([key,label,lower])=>{
   const metric=team=>{const item=key==='xg90'?{...teamMetric(team,'xg'),value:metrics.metric(team,'xg','90')}:teamMetric(team,key);if(key==='cleanPerMatch'&&item.value!==null)item.value*=100;return item;};
   const a=metric(left),b=metric(right);return {key,label,left:a,right:b,advantage:advantage(a.value,b.value,lower),kind:'team'};
  });
  for(const [key,label]of [['yellowCards','Amarillas · plantilla conocida'],['redCards','Rojas · plantilla conocida']])kpis.push({key,label,left:cards(model,left,key),right:cards(model,right,key),advantage:null,kind:'roster'});
  return {left,right,rows,kpis:kpis.filter(k=>k.left.value!==null||k.right.value!==null)};
 }
 const value=(n,score=false)=>Number.isFinite(n)?(score?scoreFormat:numberFormat).format(n):'—';
 function coverage(item){return item.total?item.known+'/'+item.total+' con score · '+countFormat.format(item.minutes)+' min':'Sin jugadores con muestra';}
 function renderTeamComparison(comparison){
  if(!comparison)return '<p class="empty">Elige dos equipos distintos con datos disponibles.</p>';
  const {left,right,rows,kpis}=comparison,teams=[left,right],core=rows.slice(0,5),others=rows.slice(5);
  const matrix='<div class="tablewrap"><table class="team-comparison-matrix"><thead><tr><th>Score general</th><th>Equipo</th>'+core.slice(1).map(r=>'<th>'+esc(r.label)+'</th>').join('')+'</tr></thead><tbody>'+teams.map((t,i)=>{const side=i?'right':'left';return '<tr><td class="score-main"><strong>'+value(core[0][side].value,true)+'</strong><small>'+esc(coverage(core[0][side]))+'</small></td><th scope="row"><button class="namebtn" data-team-detail="'+esc(t.id)+'">'+esc(t.name)+'</button>'+(t.league?'<small>'+esc(t.league)+'</small>':'')+'</th>'+core.slice(1).map(r=>'<td>'+value(r[side].value,true)+'<small>'+esc(coverage(r[side]))+'</small></td>').join('')+'</tr>';}).join('')+'</tbody></table></div>';
  function result(row){return row.advantage===null?'Falta score para comparar':row.advantage==='tie'?'Iguales a tres decimales':'Mayor score: '+(row.advantage==='left'?left.name:right.name);}
  function block(row){return '<article class="unit-duel"><h4>'+esc(row.label)+'</h4>'+teams.map((t,i)=>{const side=i?'right':'left',item=row[side];return '<div class="duel-line '+side+'"><strong>'+value(item.value,true)+'</strong><div><span>'+esc(t.name)+'</span><span class="duel-track" aria-hidden="true"><svg viewBox="0 0 100 4" preserveAspectRatio="none"><rect width="'+Math.max(0,Math.min(100,(item.value??0)*100))+'" height="4"/></svg></span><small>'+esc(coverage(item))+'</small></div></div>';}).join('')+'<p class="duel-result">'+esc(result(row))+'</p></article>';}
  function metricCard(row){return '<article class="team-kpi"><h4>'+esc(row.label)+'</h4><div class="duel-values">'+teams.map((t,i)=>{const item=row[i?'right':'left'],note=row.kind==='roster'?'FotMob · '+item.known+'/'+item.total+' jugadores con dato'+(item.partial?' · parcial':''):item.source+(item.matches!==null?' · '+item.matches+' PJ':'');return '<div><span>'+esc(t.name)+'</span><strong>'+value(item.value)+(Number.isFinite(item.value)&&row.key==='goalsPerXg'?'×':'')+'</strong><small>'+esc(note)+'</small></div>';}).join('')+'</div></article>';}
  return matrix+'<div class="unit-duels">'+core.slice(1).map(block).join('')+'</div><details class="comparison-more" id="comparison-midfield"><summary>Perfiles del mediocampo</summary><div class="unit-duels">'+others.map(block).join('')+'</div></details><details class="comparison-more" id="comparison-kpis" open><summary>Goles, ocasiones, resultados y disciplina</summary><div class="team-kpis">'+kpis.map(metricCard).join('')+'</div><p class="sub">Goles/90 usa los minutos nominales de equipo de su propia fuente. Las tarjetas son sumas conocidas de jugadores, con cobertura; no representan un total oficial de equipo. xG conserva el modelo indicado por su proveedor.</p></details><p class="sub">Las medias usan los scores finales y los minutos publicados de los jugadores con datos. Consulta también la cobertura de cada línea.</p>';
 }
 const api={scoreFirst,shortHelp,selection,matchesTeams,pair,advantage,compareTeams,renderTeamComparison};if(node)module.exports=api;else root.GradaExplore=api;
})(typeof window==='object'?window:globalThis);
