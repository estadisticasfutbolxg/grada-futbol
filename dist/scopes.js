(function(root){
  'use strict';
  const combined=typeof module==='object'&&module.exports?require('./combined.js'):root.GradaCombined;
  function aggregate(items){
    if(!items.length||items.some(d=>!combined.isCombined(d)||d.metadata.scope==='all')||new Set(items.map(d=>d.metadata.league_key)).size!==items.length)throw new Error('Ámbito de ligas inválido.');
    const players=[],teams=[],sources={},leagues=[];
    for(const d of items){
      const m=d.metadata,id=m.league_key;
      leagues.push({id,name:m.competition,sources:m.sources,imported_matches:m.imported_matches,available_matches:m.available_matches});
      for(const [name,meta] of Object.entries(m.sources))if(!sources[name]||Date.parse(meta.imported_at)<Date.parse(sources[name].imported_at))sources[name]={...meta};
      function copy(row){
        const metricContexts=Object.fromEntries(Object.entries(row.metricContexts||{}).map(([key,c])=>[key,{...c,captured_at:c.captured_at||m.sources[c.source]?.imported_at||m.imported_at,league_key:id}]));
        for(const [key,source] of Object.entries(row.fieldSources||{}))if(!metricContexts[key])metricContexts[key]={source,captured_at:m.sources[source]?.imported_at||m.imported_at,league_key:id};
        const copy={...row,id:id+':'+row.id,...(row.team_id!==undefined?{team_id:row.team_id===null?null:id+':'+row.team_id}:{}),league:m.competition,league_key:id,metricContexts};
        delete copy.teamArea;delete copy.teamAreaCoverage;delete copy.teamAreaContributions;delete copy.midfieldAreas;delete copy.attackArea;delete copy.teamAreaMinutes;
        for(const key of ['playerScore','scorePosition','midfieldProfile','unitScores','keeperArea','keeperPlayers','defenseArea','defensePlayers','midfieldArea','midfieldPlayers','strikerArea','strikerPlayers','offenseArea','offensePlayers','midfieldAttackArea','midfieldAttackPlayers','midfieldDefenseArea','midfieldDefensePlayers'])delete copy[key];
        return copy;
      }
      players.push(...d.players.map(copy));teams.push(...d.teams.map(copy));
    }
    return {metadata:{kind:'combined',scope:'all',league_key:'all',primary_source:'Mixta',source:'Combinado · '+items.length+' ligas',competition:'Todas las ligas',season:'2026/27',complete:false,sources,leagues,
      imported_at:new Date(Math.min(...items.map(d=>Date.parse(d.metadata.imported_at)))).toISOString(),imported_matches:leagues.reduce((s,l)=>s+l.imported_matches,0),available_matches:leagues.reduce((s,l)=>s+l.available_matches,0),
      combination:{matched_players:items.reduce((s,d)=>s+d.metadata.combination.matched_players,0)},
      notes:'Conjunto de '+items.length+' ligas verificadas. Se conservan las prioridades y fechas de cada liga: Understat → ESPN → FotMob en LaLiga; FotMob → ESPN en las demás. Los scores usan una referencia común de posición de las ligas cargadas, compartida con las vistas por liga. Los modelos xG/xA difieren por proveedor; el score es relativo a la posición. Las ausencias no se convierten en cero. No se agrupan fichas de un mismo jugador en ligas diferentes.'},players,teams,matches:[]};
  }
  const api={aggregate};if(typeof module==='object'&&module.exports)module.exports=api;else root.GradaScopes=api;
})(typeof window==='object'?window:globalThis);
