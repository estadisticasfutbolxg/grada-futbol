(function(root){
 'use strict';
 const node=typeof module==='object'&&module.exports,radar=node?require('./radar.js'):root.GradaRadar,squads=node?require('./squads.js'):root.GradaSquads;
 const tactical=node?require('./roles.js'):root.GradaRoles;
 const positionLabels={POR:'Portería',DEF:'Defensa',MED:'Centro del campo',DEL:'Delantera'};
 function build(data,{referencePlayers=data.players,referenceLabel='ligas disponibles'}={}){
  const indices=radar.midfieldIndices(data.players,{referencePlayers});
  const roles=new Map(data.players.map(p=>[p,radar.midfieldRole(p,indices)]));
  const players=radar.profiles(data.players,{referencePlayers,midfieldRoles:roles});
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
  if(definition.roleKey&&!tactical.matches(record,definition.roleKey))return false;
  if(definition.key.startsWith('MED_'))return model.roles.get(record)===definition.key||model.roles.get(record)==='MED_BALANCED';
  return true;
 }
 function rankingAxes(model,definition){
  if(definition.kind==='team')return [];
  const profiles=model.data.players.filter(p=>eligible(model,p,definition)).map(p=>model.players.get(p)).sort((a,b)=>(a.profileKey===definition.key?0:1)-(b.profileKey===definition.key?0:1)||a.profileKey.localeCompare(b.profileKey));
  return [...new Set(profiles.flatMap(p=>p.expectedAxes))];
 }
 function withScores(data,options={}){
  const model=build(data,options),result=squads.withTeamAreas(data,model.overall,model.units,{reference:model.referenceLabel});
  return {...result,metadata:{...result.metadata,derived_metrics:{...result.metadata.derived_metrics,playerScore:{method:'role_fairplay_radar_v5',reference:model.referenceLabel,minimum_minutes:{POR:180,DEF:450,MED:450,DEL:450},definition:'Un score por jugador. El perfil MED y el puesto publicado de lateral eligen los ejes; los laterales combinan ataque y defensa con referencia de laterales. El área base se multiplica por el ajuste de juego limpio verificado, con descuento relativo lineal 0,10 × (amarillas + 10 × rojas) × 90 / minutos propios, limitado solo por el score mínimo 0. Son pesos manuales, no una estimación de sanciones cumplidas o minutos en inferioridad. Sin tarjetas emparejadas/suficientes se conserva base y se declara sin ajuste. Cambiar de ranking no recalcula el score.'}}},players:data.players.map(p=>{const profile=model.players.get(p);return {...p,playerScore:profile.score,playerBaseScore:profile.baseScore,scorePosition:p.pos,scoreProfile:profile.profileKey,scoreProfileLabel:profile.profileLabel,fairPlay:profile.fairPlay,midfieldProfile:model.roles.get(p)};})};
 }
 const api={build,value,eligible,rankingAxes,withScores,positionLabels};if(node)module.exports=api;else root.GradaScores=api;
})(typeof window==='object'?window:globalThis);
