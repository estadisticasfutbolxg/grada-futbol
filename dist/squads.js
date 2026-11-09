(function(root){
  'use strict';
  const radar=typeof module==='object'&&module.exports?require('./radar.js'):root.GradaRadar;
  const definition='Promedio de los mismos scores de posición mostrados en la ficha de cada jugador, ponderado por minutos: Σ(score × minutos) / Σ(minutos). Solo participan jugadores asignados por ID con score y muestra válidos. Los datos ausentes permanecen pendientes.';
  const unitKeys={
    POR:{area:'keeperArea',coverage:'keeperPlayers',position:'POR',population:'porteros',label:'Score de portería'},
    DEF:{area:'defenseArea',coverage:'defensePlayers',position:'DEF',population:'defensas',label:'Score de defensa'},
    MED:{area:'midfieldArea',coverage:'midfieldPlayers',position:'MED',population:'centrocampistas',label:'Score del centro del campo'},
    DEL:{area:'strikerArea',coverage:'strikerPlayers',position:'DEL',population:'delanteros',label:'Score de delantera'},
    ATTACK:{area:'offenseArea',coverage:'offensePlayers',population:'delanteros y centrocampistas de perfil ofensivo',label:'Score de ataque'},
    MED_ATT:{area:'midfieldAttackArea',coverage:'midfieldAttackPlayers',position:'MED',population:'centrocampistas',label:'Score del centro del campo ofensivo'},
    MED_DEF:{area:'midfieldDefenseArea',coverage:'midfieldDefensePlayers',position:'MED',population:'centrocampistas',label:'Score del centro del campo defensivo'}
  };
  function unitDefinition(key){const config=unitKeys[key];return definition+' Incluye '+config.population+(config.position?' ('+config.position+')':'')+'.'+(['MED_ATT','MED_DEF','ATTACK'].includes(key)?' El perfil MED se determina comparando sus índices estadísticos ofensivo y defensivo; no cambia su score MED ni afirma una posición táctica. Los equilibrados pueden pertenecer a ambos perfiles.':'')+' Referencia común de ligas; mínimo 450 min por eje (180 min o 2 PJ en porteros).';}
  const midfieldKeys=Object.fromEntries(Object.entries(unitKeys).filter(([key])=>key.startsWith('MED_'))),midfieldDefinition=unitDefinition('MED_ATT');
  function summarize(data,profiles=radar.profiles(data.players),{position=null,accept=()=>true}={}){
    if(new Set(data.teams.map(t=>String(t.id))).size!==data.teams.length||new Set(data.players.map(p=>String(p.id))).size!==data.players.length)throw new Error('Identidades duplicadas en la plantilla.');
    const teams=new Map(data.teams.map(t=>[String(t.id),{area:null,weightedTotal:0,minutes:0,validPlayers:0,totalPlayers:0,missingPlayers:0,unclassifiedPlayers:0,players:[]}])),unassignedPlayerIds=[];
    for(const player of data.players){
      if(position&&player.pos!==position||!accept(player))continue;
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
  function unitSummaries(data,{profiles=radar.profiles(data.players),indices=radar.midfieldIndices(data.players),roles=new Map(data.players.map(p=>[p,radar.midfieldRole(p,indices)]))}={}){
    function inRole(player,key){return roles.get(player)===key||roles.get(player)==='MED_BALANCED';}
    const result=new Map(Object.entries(unitKeys).map(([key,config])=>[key,summarize(data,profiles,{position:config.position||null,accept:player=>key==='ATTACK'?player.pos==='DEL'||player.pos==='MED'&&inRole(player,'MED_ATT'):key.startsWith('MED_')?inRole(player,key):true})]));
    for(const key of ['ATTACK','MED_ATT','MED_DEF'])for(const player of data.players)if(player.pos==='MED'&&!roles.get(player)){const team=result.get(key).teams.get(String(player.team_id));if(team)team.unclassifiedPlayers++;}
    return result;
  }
  function midfieldSummaries(data){return new Map([...unitSummaries(data)].filter(([key])=>key.startsWith('MED_')));}
  function serialize(summary){return {area:summary.area,minutes:summary.minutes,weightedTotal:summary.weightedTotal,coverage:{valid:summary.validPlayers,total:summary.totalPlayers,missing:summary.missingPlayers,unclassified:summary.unclassifiedPlayers},contributions:summary.players};}
  function withTeamAreas(data,summary=summarize(data),units=unitSummaries(data),{reference=data.metadata.scope==='all'?'Todas las ligas':data.metadata.competition}={}){
    return {...data,metadata:{...data.metadata,derived_metrics:{...data.metadata.derived_metrics,teamArea:{definition,method:'minutes_weighted_mean',reference,unassigned_player_ids:summary.unassignedPlayerIds},unitScores:{definition,method:'minutes_weighted_mean',reference,profiles:Object.keys(unitKeys)}}},
      teams:data.teams.map(team=>{const id=String(team.id),s=summary.teams.get(id),next={...team,teamArea:s.area,teamAreaMinutes:s.minutes,teamAreaCoverage:{valid:s.validPlayers,total:s.totalPlayers,missing:s.missingPlayers},teamAreaContributions:s.players,unitScores:Object.fromEntries([...units].map(([key,values])=>[key,serialize(values.teams.get(id))]))};delete next.attackArea;delete next.midfieldAreas;for(const [key,config] of Object.entries(unitKeys)){const value=units.get(key).teams.get(id);next[config.area]=value.area;next[config.coverage]=value.validPlayers;}return next;})};
  }
  const api={summarize,withTeamAreas,definition,unitKeys,unitDefinition,unitSummaries,midfieldDefinition,midfieldKeys,midfieldSummaries};if(typeof module==='object'&&module.exports)module.exports=api;else root.GradaSquads=api;
})(typeof window==='object'?window:globalThis);
