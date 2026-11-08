(function(root){
  'use strict';
  const radar=typeof module==='object'&&module.exports?require('./radar.js'):root.GradaRadar;
  const definition='Promedio de los scores de jugador ponderado por sus minutos: Σ(score × minutos) / Σ(minutos). Solo participan jugadores asignados por ID con score válido y minutos positivos. Los datos ausentes permanecen pendientes.';
  const unitKeys={
    DEL:{area:'strikerArea',coverage:'strikerPlayers',position:'DEL',population:'delanteros',label:'Score de delantera'},
    MED_ATT:{area:'midfieldAttackArea',coverage:'midfieldAttackPlayers',position:'MED',population:'centrocampistas',label:'Score del centro del campo ofensivo'},
    MED_DEF:{area:'midfieldDefenseArea',coverage:'midfieldDefensePlayers',position:'MED',population:'centrocampistas',label:'Score del centro del campo defensivo'}
  };
  function unitDefinition(key){return definition+' En este perfil se incluyen los '+unitKeys[key].population+' ('+unitKeys[key].position+'). Referencia de jugadores: 450 minutos por eje en el ámbito seleccionado.';}
  const midfieldKeys=Object.fromEntries(Object.entries(unitKeys).filter(([key])=>key.startsWith('MED_'))),midfieldDefinition=unitDefinition('MED_ATT');
  function summarize(data,profiles=radar.profiles(data.players),{position=null}={}){
    if(new Set(data.teams.map(t=>String(t.id))).size!==data.teams.length||new Set(data.players.map(p=>String(p.id))).size!==data.players.length)throw new Error('Identidades duplicadas en la plantilla.');
    const teams=new Map(data.teams.map(t=>[String(t.id),{area:null,weightedTotal:0,minutes:0,validPlayers:0,totalPlayers:0,missingPlayers:0,players:[]}])),unassignedPlayerIds=[];
    for(const player of data.players){
      if(position&&player.pos!==position)continue;
      const team=player.team_id===null||player.team_id===undefined?null:teams.get(String(player.team_id));
      if(!team){unassignedPlayerIds.push(String(player.id));continue;}
      const value=profiles.get(player)?.comparableArea;
      const area=typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=1?value:null;
      const minutes=typeof player.minutes==='number'&&Number.isFinite(player.minutes)&&player.minutes>=0?player.minutes:null,included=area!==null&&minutes!==null&&minutes>0;
      team.totalPlayers++;team.players.push({id:String(player.id),name:player.name,pos:player.pos,area,minutes,minutesSource:player.metricContexts?.minutes?.source||player.fieldSources?.minutes||data.metadata?.primary_source||data.metadata?.source||null,included,weight:null,contribution:null});
      if(!included)team.missingPlayers++;
      else{team.weightedTotal+=area*minutes;team.minutes+=minutes;team.validPlayers++;}
    }
    for(const team of teams.values())if(team.minutes>0){
      team.area=team.weightedTotal/team.minutes;
      for(const player of team.players)if(player.included){player.weight=player.minutes/team.minutes;player.contribution=player.area*player.weight;}
    }
    return {teams,unassignedPlayerIds};
  }
  function unitSummaries(data){
    return new Map(Object.entries(unitKeys).map(([key,config])=>{const players=data.players.filter(player=>player.pos===config.position);return [key,summarize(data,radar.profiles(players,{profileKey:key}),{position:config.position})];}));
  }
  function midfieldSummaries(data){return new Map([...unitSummaries(data)].filter(([key])=>key.startsWith('MED_')));}
  function serialize(summary){return {area:summary.area,minutes:summary.minutes,weightedTotal:summary.weightedTotal,coverage:{valid:summary.validPlayers,total:summary.totalPlayers,missing:summary.missingPlayers},contributions:summary.players};}
  function withTeamAreas(data,summary=summarize(data),units=unitSummaries(data)){
    const reference=data.metadata.scope==='all'?'Todas las ligas':data.metadata.competition;
    return {...data,metadata:{...data.metadata,derived_metrics:{...data.metadata.derived_metrics,teamArea:{definition,method:'minutes_weighted_mean',reference,unassigned_player_ids:summary.unassignedPlayerIds},unitScores:{definition,method:'minutes_weighted_mean',reference,profiles:Object.keys(unitKeys)}}},
      teams:data.teams.map(team=>{const id=String(team.id),s=summary.teams.get(id);return {...team,teamArea:s.area,teamAreaMinutes:s.minutes,teamAreaCoverage:{valid:s.validPlayers,total:s.totalPlayers,missing:s.missingPlayers},teamAreaContributions:s.players,attackArea:serialize(units.get('DEL').teams.get(id)),midfieldAreas:Object.fromEntries([...units].filter(([key])=>key.startsWith('MED_')).map(([key,values])=>[key,serialize(values.teams.get(id))]))};})};
  }
  const api={summarize,withTeamAreas,definition,unitKeys,unitDefinition,unitSummaries,midfieldDefinition,midfieldKeys,midfieldSummaries};if(typeof module==='object'&&module.exports)module.exports=api;else root.GradaSquads=api;
})(typeof window==='object'?window:globalThis);
