(function(root){
  'use strict';
  const radar=typeof module==='object'&&module.exports?require('./radar.js'):root.GradaRadar;
  const definition='Suma de las áreas válidas de posición de todos los jugadores asignados al equipo. Sin mínimo adicional, media, ponderación ni límite de 1. Las áreas ausentes quedan pendientes.';
  function summarize(data,profiles=radar.profiles(data.players)){
    if(new Set(data.teams.map(t=>String(t.id))).size!==data.teams.length||new Set(data.players.map(p=>String(p.id))).size!==data.players.length)throw new Error('Identidades duplicadas en la plantilla.');
    const teams=new Map(data.teams.map(t=>[String(t.id),{area:null,validPlayers:0,totalPlayers:0,missingPlayers:0,players:[]}])),unassignedPlayerIds=[];
    for(const player of data.players){
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
  function withTeamAreas(data,summary=summarize(data)){
    return {...data,metadata:{...data.metadata,derived_metrics:{...data.metadata.derived_metrics,teamArea:{definition,reference:data.metadata.scope==='all'?'Todas las ligas':data.metadata.competition,unassigned_player_ids:summary.unassignedPlayerIds}}},
      teams:data.teams.map(team=>{const s=summary.teams.get(String(team.id));return {...team,teamArea:s.area,teamAreaCoverage:{valid:s.validPlayers,total:s.totalPlayers,missing:s.missingPlayers},teamAreaContributions:s.players};})};
  }
  const api={summarize,withTeamAreas,definition};if(typeof module==='object'&&module.exports)module.exports=api;else root.GradaSquads=api;
})(typeof window==='object'?window:globalThis);
