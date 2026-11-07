(function(root){
  'use strict';
  const radar=typeof module==='object'&&module.exports?require('./radar.js'):root.GradaRadar;
  const definition='Suma de las áreas válidas de posición de todos los jugadores asignados al equipo. Sin mínimo adicional, media, ponderación ni límite de 1. Las áreas ausentes quedan pendientes.';
  const midfieldDefinition='Suma de las áreas válidas del perfil ofensivo o defensivo de los jugadores clasificados MED y asignados al equipo por ID. Sin ponderación ni límite de 1; se informa cobertura y las áreas ausentes quedan pendientes. Referencia de jugadores: 450 minutos por eje en el ámbito seleccionado.';
  const midfieldKeys={MED_ATT:{area:'midfieldAttackArea',coverage:'midfieldAttackPlayers',label:'Centro del campo ofensivo · suma de áreas MED'},MED_DEF:{area:'midfieldDefenseArea',coverage:'midfieldDefensePlayers',label:'Centro del campo defensivo · suma de áreas MED'}};
  function summarize(data,profiles=radar.profiles(data.players),{position=null}={}){
    if(new Set(data.teams.map(t=>String(t.id))).size!==data.teams.length||new Set(data.players.map(p=>String(p.id))).size!==data.players.length)throw new Error('Identidades duplicadas en la plantilla.');
    const teams=new Map(data.teams.map(t=>[String(t.id),{area:null,validPlayers:0,totalPlayers:0,missingPlayers:0,players:[]}])),unassignedPlayerIds=[];
    for(const player of data.players){
      if(position&&player.pos!==position)continue;
      const team=player.team_id===null||player.team_id===undefined?null:teams.get(String(player.team_id));
      if(!team){unassignedPlayerIds.push(String(player.id));continue;}
      const value=profiles.get(player)?.comparableArea;
      const area=typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=1?value:null;
      team.totalPlayers++;team.players.push({id:String(player.id),name:player.name,pos:player.pos,area});
      if(area===null)team.missingPlayers++;
      else{team.area=(team.area??0)+area;team.validPlayers++;}
    }
    return {teams,unassignedPlayerIds};
  }
  function midfieldSummaries(data){
    const midfielders=data.players.filter(player=>player.pos==='MED');
    return new Map(Object.keys(midfieldKeys).map(key=>[key,summarize(data,radar.profiles(midfielders,{profileKey:key}),{position:'MED'})]));
  }
  function withTeamAreas(data,summary=summarize(data),midfields=midfieldSummaries(data)){
    const reference=data.metadata.scope==='all'?'Todas las ligas':data.metadata.competition;
    return {...data,metadata:{...data.metadata,derived_metrics:{...data.metadata.derived_metrics,teamArea:{definition,reference,unassigned_player_ids:summary.unassignedPlayerIds},midfieldAreas:{definition:midfieldDefinition,reference,profiles:Object.keys(midfieldKeys)}}},
      teams:data.teams.map(team=>{const id=String(team.id),s=summary.teams.get(id);return {...team,teamArea:s.area,teamAreaCoverage:{valid:s.validPlayers,total:s.totalPlayers,missing:s.missingPlayers},teamAreaContributions:s.players,midfieldAreas:Object.fromEntries([...midfields].map(([key,values])=>{const m=values.teams.get(id);return [key,{area:m.area,coverage:{valid:m.validPlayers,total:m.totalPlayers,missing:m.missingPlayers},contributions:m.players}];}))};})};
  }
  const api={summarize,withTeamAreas,definition,midfieldDefinition,midfieldKeys,midfieldSummaries};if(typeof module==='object'&&module.exports)module.exports=api;else root.GradaSquads=api;
})(typeof window==='object'?window:globalThis);
