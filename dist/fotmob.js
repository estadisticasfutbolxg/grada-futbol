(function(root) {
  'use strict';
  const leagues=typeof module==='object'&&module.exports?require('./leagues.js'):root.GradaLeagues;
  const counts=['lineBreakingPasses','clearances','blocks','highClaims','sweeperActions','saves','conceded','chancesCreated','bigChancesCreated','bigChancesMissed','yellowCards','redCards','penaltiesSaved','penaltiesFaced','clean'];
  const publishedRates=['shotsOnTargetPer90','longBallsPer90','dribblesPer90','finalThirdRecoveriesPer90','midfieldRecoveriesPer90','foulsPer90'];
  const percentages=['shotsOnTargetPct','longBallAccuracy','dribbleSuccess','savepct'];
  const fields=[...counts,...publishedRates,...percentages,'prevented','xgot'];
  const labels={lineBreakingPasses:'Pases rompelíneas',clearances:'Despejes',blocks:'Bloqueos',highClaims:'Balones aéreos atrapados',sweeperActions:'Acciones de líbero',chancesCreated:'Ocasiones creadas',bigChancesCreated:'Grandes ocasiones creadas',bigChancesMissed:'Grandes ocasiones falladas',yellowCards:'Amarillas',redCards:'Rojas',penaltiesSaved:'Penaltis parados',penaltiesFaced:'Penaltis afrontados',shotsOnTargetPer90:'Tiros a puerta /90',shotsOnTargetPct:'Tiros a puerta %',longBallsPer90:'Pases largos precisos /90',longBallAccuracy:'Pases largos %',dribblesPer90:'Regates logrados /90',dribbleSuccess:'Regates %',finalThirdRecoveriesPer90:'Recup. tercio final /90',midfieldRecoveriesPer90:'Recup. zona media /90',foulsPer90:'Faltas /90',xgot:'xGOT de los tiros'};
  const descriptions={
    lineBreakingPasses:'Pases que rompen una línea rival según FotMob. Se mantiene esta definición separada de los pases progresivos de StatsBomb.',
    clearances:'Despejes defensivos publicados por FotMob.',blocks:'Bloqueos defensivos publicados por FotMob.',
    highClaims:'Balones aéreos atrapados por el portero según FotMob.',sweeperActions:'Acciones del portero como líbero según FotMob.',
    chancesCreated:'Ocasiones creadas según FotMob. Se conservan separadas de los pases clave de Understat.',
    bigChancesCreated:'Grandes ocasiones creadas, según la clasificación del proveedor FotMob.',bigChancesMissed:'Grandes ocasiones falladas según FotMob. Un mayor volumen no implica mayor rendimiento.',
    yellowCards:'Tarjetas amarillas publicadas por FotMob.',redCards:'Tarjetas rojas publicadas por FotMob.',
    penaltiesSaved:'Penaltis detenidos por el portero según FotMob.',penaltiesFaced:'Penaltis afrontados por el portero, de la misma tabla FotMob que sus penaltis detenidos.',
    shotsOnTargetPer90:'Tiros entre los tres palos por 90 minutos: tasa publicada por FotMob; el total no se deduce de una cifra redondeada.',
    shotsOnTargetPct:'Porcentaje de tiros a puerta publicado por FotMob. No se combina con los tiros totales de otro proveedor para reconstruir un recuento.',
    longBallsPer90:'Pases largos completados por 90 minutos, tasa publicada por FotMob.',longBallAccuracy:'Porcentaje de acierto en pases largos publicado por FotMob.',
    dribblesPer90:'Regates completados por 90 minutos, tasa publicada por FotMob.',dribbleSuccess:'Porcentaje de éxito en regates publicado por FotMob.',
    finalThirdRecoveriesPer90:'Recuperaciones de posesión en el tercio ofensivo por 90 minutos, tasa publicada por FotMob.',midfieldRecoveriesPer90:'Recuperaciones de posesión en la zona media por 90 minutos, tasa publicada por FotMob.',
    foulsPer90:'Faltas cometidas por 90 minutos, tasa publicada por FotMob. Un mayor valor no implica mejor rendimiento.',
    xgot:'Goles esperados de los tiros a puerta realizados (xGOT), considerando su colocación. Es una métrica ofensiva de FotMob; no representa el xG recibido por el portero.'
  };
  function validate(data) {
    const m=data?.metadata,numeric=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0,league=leagues.resolve(m);
    if(m?.source!=='FotMob'||m.season_id!==league.fotmobSeason||m.league_id!==league.fotmobId||!Number.isFinite(Date.parse(m.imported_at))||
       !Array.isArray(data.teams)||data.teams.length!==league.teams||!Array.isArray(data.players)||!data.players.length||data.players.length>1500)throw new Error('Captura FotMob inválida.');
    const teams=new Set(data.teams.map(t=>String(t.id)));
    if(teams.size!==league.teams||new Set(data.players.map(p=>String(p.id))).size!==data.players.length)throw new Error('Identidades FotMob duplicadas.');
    if(data.teams.some(t=>!/^\d+$/.test(t.id)||typeof t.name!=='string'||!t.name.trim()||t.name.length>250))throw new Error('Equipo FotMob inválido.');
    for(const t of data.teams){
      for(const k of ['matches','minutes','goals','conceded','xg','xga','clean','bigChances','shotsOnTargetPerMatch'])if(t[k]!==undefined&&t[k]!==null&&!numeric(t[k]))throw new Error('Métrica de equipo FotMob inválida.');
      if(t.points!==undefined&&t.points!==null&&(!Number.isInteger(t.points)))throw new Error('Puntos de equipo inválidos.');
      if(t.possession!==undefined&&t.possession!==null&&(!numeric(t.possession)||t.possession>100))throw new Error('Posesión inválida.');
    }
    for(const p of data.players){
      if(!/^\d+$/.test(p.id)||!teams.has(String(p.team_id))||typeof p.name!=='string'||!p.name.trim()||p.name.length>250||!numeric(p.minutes)||!Number.isInteger(p.matches)||p.matches<0)throw new Error('Registro FotMob inválido.');
      for(const k of ['tackles','interceptions','recoveries'])if(p[k]!==null&&(!Number.isInteger(p[k])||p[k]<0))throw new Error('Conteo FotMob inválido.');
      if(p.passes!==null||p.completed!==null)throw new Error('No se infieren totales de pases a partir de tasas.');
      if(p.accuracy!==null&&(!numeric(p.accuracy)||p.accuracy>100))throw new Error('Porcentaje FotMob inválido.');
      for(const k of fields){
        const value=p[k];if(value===null)continue;
        if(typeof value!=='number'||!Number.isFinite(value)||(k!=='prevented'&&value<0)||(counts.includes(k)&&!Number.isInteger(value))||(percentages.includes(k)&&value>100))throw new Error('Métrica FotMob inválida: '+k);
      }
      for(const c of Object.values(p.metricContexts||{}))if(c.source!=='FotMob'||!Number.isFinite(Date.parse(c.captured_at))||!numeric(c.minutes)||!Number.isInteger(c.matches)||c.matches<0||('reportedPer90'in c&&!numeric(c.reportedPer90)))throw new Error('Contexto FotMob inválido.');
      if(m.profile==='full'){
        for(const k of ['goals','assists','shots','xg','xa','shotsPer90','conversion'])if(p[k]!==null&&(!numeric(p[k])||(['goals','assists','shots'].includes(k)&&!Number.isInteger(p[k]))))throw new Error('Métrica principal FotMob inválida.');
        if(p.xga!==null||p.psxg!==null||p.conversion>100)throw new Error('Modelo FotMob inválido.');
      }
    }
    if(league.primary==='FotMob'&&(m.profile!=='full'||!data.teams.every(t=>numeric(t.xg)&&numeric(t.xga)&&Number.isInteger(t.matches)&&t.matches<=2*(league.teams-1)&&t.minutes===t.matches*90)))throw new Error('Faltan métricas principales de esta liga.');
    if(m.profile==='full'){
      const played=data.teams.reduce((s,t)=>s+t.matches,0)/2;
      if(!Number.isInteger(played)||played<0||played>league.matches||m.imported_matches!==played||m.available_matches!==league.matches||data.teams.reduce((s,t)=>s+t.goals,0)!==data.teams.reduce((s,t)=>s+t.conceded,0))throw new Error('Cobertura FotMob incoherente.');
    }
    return data;
  }
  const api={validate,fields,counts,publishedRates,percentages,labels,descriptions};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.GradaFotmob=api;
})(typeof window==='object'?window:globalThis);
