(function(root){
  'use strict';
  const combined=typeof module==='object'&&module.exports?require('./combined.js'):root.GradaCombined;
  const registry=typeof module==='object'&&module.exports?require('./leagues.js'):root.GradaLeagues;
  function aggregate(items,{scope='all',leagueIds=[]}={}){
    const group=registry.group(scope,leagueIds);
    if(!group||!Array.isArray(items)||!items.length&&scope==='all'||items.some(d=>!combined.isCombined(d)||registry.group(d.metadata.scope)||!group.leagueIds.includes(d.metadata.league_key))||new Set(items.map(d=>d.metadata.league_key)).size!==items.length)throw new Error('Ámbito de ligas inválido.');
    const players=[],teams=[],sources={},leagues=[];
    for(const d of items){
      const m=d.metadata,id=m.league_key;
      leagues.push({id,name:m.competition,calendar_phase:m.calendar_phase||null,sources:m.sources,imported_matches:m.imported_matches,available_matches:m.available_matches});
      for(const [name,meta] of Object.entries(m.sources))if(!sources[name]||Date.parse(meta.imported_at)<Date.parse(sources[name].imported_at))sources[name]={...meta};
      function copy(row){
        const metricContexts=Object.fromEntries(Object.entries(row.metricContexts||{}).map(([key,c])=>[key,{...c,captured_at:c.captured_at||m.sources[c.source]?.imported_at||m.imported_at,league_key:id}]));
        for(const [key,source] of Object.entries(row.fieldSources||{}))if(!metricContexts[key])metricContexts[key]={source,captured_at:m.sources[source]?.imported_at||m.imported_at,league_key:id};
        const copy={...row,id:id+':'+row.id,...(row.team_id!==undefined?{team_id:row.team_id===null?null:id+':'+row.team_id}:{}),league:m.competition,league_key:id,metricContexts};
        delete copy.teamArea;delete copy.teamAreaCoverage;delete copy.teamAreaContributions;delete copy.midfieldAreas;delete copy.attackArea;delete copy.teamAreaMinutes;
        for(const key of ['playerScore','playerBaseScore','fairPlay','scorePosition','scoreProfile','scoreProfileLabel','midfieldProfile','unitScores','keeperArea','keeperPlayers','defenseArea','defensePlayers','midfieldArea','midfieldPlayers','strikerArea','strikerPlayers','offenseArea','offensePlayers','midfieldAttackArea','midfieldAttackPlayers','midfieldDefenseArea','midfieldDefensePlayers'])delete copy[key];
        return copy;
      }
      players.push(...d.players.map(copy));teams.push(...d.teams.map(copy));
    }
    return {metadata:{kind:'combined',scope,league_key:scope,requested_league_ids:[...group.leagueIds],expected_leagues:group.leagueIds.length,primary_source:'Mixta',source:'Combinado · '+items.length+' ligas',competition:group.name,season:'2026/27',complete:false,sources,leagues,
      imported_at:items.length?new Date(Math.min(...items.map(d=>Date.parse(d.metadata.imported_at)))).toISOString():null,imported_matches:leagues.reduce((s,l)=>s+l.imported_matches,0),available_matches:leagues.reduce((s,l)=>s+l.available_matches,0),
      combination:{matched_players:items.reduce((s,d)=>s+d.metadata.combination.matched_players,0)},
      notes:'Conjunto de '+items.length+' ligas verificadas. Se conservan las fuentes y fechas de cada liga: catálogo FotMob y complemento ESPN. LaLiga puede carecer de xG de equipo; los valores ausentes permanecen desconocidos. Los recuentos de goles distintos pueden usar más PJ verificados o, con iguales PJ, una captura posterior; los derivados conservan componentes originales de una sola fuente. En las ligas por fases, la cobertura corresponde a la fase regular publicada; las posteriores no se incluyen. Los scores no ajustan la dificultad entre ligas. Los scores usan una referencia común de posición de las ligas cargadas, compartida con las vistas por liga. Los modelos xG/xA difieren por proveedor; el score es relativo a la posición. Las ausencias no se convierten en cero. No se agrupan fichas de un mismo jugador en ligas diferentes.'},players,teams,matches:[]};
  }
  const api={aggregate};if(typeof module==='object'&&module.exports)module.exports=api;else root.GradaScopes=api;
})(typeof window==='object'?window:globalThis);
