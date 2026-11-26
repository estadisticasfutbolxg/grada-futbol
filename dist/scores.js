(function(root){
 'use strict';
 const node=typeof module==='object'&&module.exports,radar=node?require('./radar.js'):root.GradaRadar,squads=node?require('./squads.js'):root.GradaSquads;
 const tactical=node?require('./roles.js'):root.GradaRoles;
 const competitions=node?require('./competitions.js'):root.GradaCompetitions;
 const positionLabels={POR:'Portería',DEF:'Defensa',MED:'Centro del campo',DEL:'Delantera'};
 function build(data,{referencePlayers=data.players,referenceLabel='competiciones disponibles'}={}){
  const scoring=competitions.scoringRows(data.players,referencePlayers),rawIndices=radar.midfieldIndices(scoring,{referencePlayers});
  const rawRoles=new Map(scoring.map(p=>[p,radar.midfieldRole(p,rawIndices)]));
  const rawProfiles=radar.profiles(scoring,{referencePlayers,midfieldRoles:rawRoles});
  const indices=new Map([...rawIndices].map(([key,values])=>[key,new Map(data.players.map((p,i)=>[p,values.get(scoring[i])]))]));
  const roles=new Map(data.players.map((p,i)=>[p,rawRoles.get(scoring[i])]));
  const players=new Map(data.players.map((p,i)=>[p,{...rawProfiles.get(scoring[i]),...(scoring[i].identityConflict?{identityConflict:true,score:null,comparableArea:null}:{}),...(scoring[i].competitionAggregate?{scoreRecord:scoring[i],scoreSample:{minutes:scoring[i].minutes,competitions:scoring[i].competitionBreakdown}}:{})}]));
  const overall=squads.summarize(data,players),units=squads.unitSummaries(data,{profiles:players,indices,roles}),teams=new Map();
  for(const profile of players.values())profile.referenceRule+=' · referencia común: '+referenceLabel;
  for(const team of data.teams){
   const id=String(team.id),summary=overall.teams.get(id),axes=[],missing=[];
   for(const [key,label] of Object.entries(positionLabels)){
    const unit=units.get(key).teams.get(id);
    if(unit.area===null)missing.push(key);else axes.push({key,label,value:unit.area,percentile:unit.area*100,referenceCount:unit.validPlayers,lowerBetter:false});
   }
   teams.set(team,{kind:'team',method:'minutes_weighted_mean',profileLabel:'Scores por posición',axes:axes.length>=3?axes:[],score:summary.area,area:summary.area,comparableArea:summary.area,expectedAxes:Object.keys(positionLabels),missingAxes:missing,referenceRule:referenceLabel,minimumMinutes:null,minimumMatches:5});
  }
  return {data,players,indices,roles,overall,units,teams,referenceLabel};
 }
 function value(model,record,definition){
  if(definition.kind==='player')return model.players.get(record)?.score??null;
  return (definition.aggregateProfile?model.units.get(definition.aggregateProfile):model.overall)?.teams.get(String(record.id))?.area??null;
 }
 function eligible(model,record,definition,minimum=definition.minimum,{includePending=false}={}){
  if(!Number.isFinite(minimum)||minimum<0)return false;
  if(definition.kind==='team')return Number.isFinite(record.matches)&&record.matches>=minimum&&(includePending||value(model,record,definition)!==null);
  if(value(model,record,definition)===null)return false;
  if(record.pos!==definition.position||!radar.rankingEligible(record,model.players.get(record),minimum))return false;
  if(definition.roleKey&&!tactical.matches(model.players.get(record)?.scoreRecord||record,definition.roleKey))return false;
  if(definition.key.startsWith('MED_'))return model.roles.get(record)===definition.key;
  return true;
 }
 function rankingAxes(model,definition){
  if(definition.kind==='team')return [];
  const profiles=model.data.players.filter(p=>eligible(model,p,definition)).map(p=>model.players.get(p)).sort((a,b)=>(a.profileKey===definition.key?0:1)-(b.profileKey===definition.key?0:1)||a.profileKey.localeCompare(b.profileKey));
  return [...new Set(profiles.flatMap(p=>p.attack?[...p.expectedAxes,...radar.attackKeys]:p.expectedAxes))];
 }
 function withScores(data,options={}){
  data=competitions.alignPositions(data,options.referencePlayers||data.players);
  const seasonal=(options.referencePlayers||data.players).some(p=>p.competitionAggregate);
  const model=build(data,options),result=squads.withTeamAreas(data,model.overall,model.units,{reference:model.referenceLabel});
  return {...result,metadata:{...result.metadata,derived_metrics:{...result.metadata.derived_metrics,playerScore:{method:'role_fairplay_radar_v11',scope:seasonal?'season_all_competitions':'selected_competition',reference:model.referenceLabel,attack_max_weights:radar.attackWeights,attack_calibration:radar.weightCalibration,minimum_minutes:Object.fromEntries(Object.keys(positionLabels).map(pos=>[pos,radar.minimumScoreMinutes])),definition:(seasonal?'Score de temporada por ID FotMob entre las competiciones disponibles, con muestras propias, posición publicada y desglose. ':'')+'Un score por jugador desde '+radar.minimumScoreMinutes+' minutos verificados. El perfil MED y el puesto publicado de lateral eligen los ejes originales antes de separar el bloque ofensivo, sin promover métricas de respaldo a requisitos nuevos. El radar visual conserva el perfil completo; el cálculo usa una sola vez los ejes no ofensivos y cada métrica del bloque. En jugadores de campo, goles, asistencias, xG y xA por 90 tienen pesos propios por perfil: magnitud del coeficiente estandarizado repartido sobre la suma de magnitudes de todos los predictores Fantasy, incluidos minutos y extras. Calibración LaLiga 2026/27 del 26 de noviembre, aplicada por perfil a todas las competiciones; no es calibración propia de otras ligas. El peso restante conserva el área no ofensiva original. No se aplican signos negativos ni se añaden los predictores de control como ejes. Se usan percentiles al cuadrado frente a su posición, con referencia de laterales separada y minutos propios. Si falta una métrica válida, su peso se queda en el radar. La base resultante se multiplica por el ajuste de juego limpio verificado, con descuento relativo lineal 0,10 × (amarillas + 10 × rojas) × 90 / minutos propios, limitado solo por el score mínimo 0. Se añade 0,50 × penaltis cometidos × 90 / minutos propios verificados (mínimo 200), con su muestra independiente; un penalti pesa cinco amarillas. Sin dato o muestra suficiente no se imputa cero ni se retira el score. Son pesos manuales, no una estimación de sanciones cumplidas o minutos en inferioridad. Sin tarjetas emparejadas/suficientes se conserva base y se declara sin ajuste. Cambiar de ranking no recalcula el score.'}}},players:data.players.map(p=>{const profile=model.players.get(p);return {...p,playerScore:profile.score,scoreMinutes:profile.scoreSample?.minutes??p.minutes,scoreCompetitions:profile.scoreSample?.competitions.map(c=>c.competition)||[data.metadata.league_key],playerBaseScore:profile.baseScore,scorePosition:p.pos,scoreProfile:profile.profileKey,scoreProfileLabel:profile.profileLabel,fairPlay:profile.fairPlay,midfieldProfile:model.roles.get(p)};})};
 }
 const api={build,value,eligible,rankingAxes,withScores,positionLabels};if(node)module.exports=api;else root.GradaScores=api;
})(typeof window==='object'?window:globalThis);
