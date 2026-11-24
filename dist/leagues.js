(function(root){
  'use strict';
  const node=typeof module==='object'&&module.exports;
  let catalog=[];
  function configure(rows){
    if(!Array.isArray(rows)||!rows.length||rows.length>32||new Set(rows.map(r=>r.id)).size!==rows.length)throw new Error('Catálogo de ligas inválido.');
    for(const r of rows)if(!/^[a-z0-9-]+$/.test(r.id)||typeof r.name!=='string'||r.name.length>80||r.year!==2026||r.season!=='2026/27'||!Number.isInteger(r.teams)||r.teams<4||r.teams>32||!Number.isInteger(teamMatchLimit(r))||teamMatchLimit(r)<1||teamMatchLimit(r)>60||!Number.isInteger(r.matches)||r.matches!==r.teams*teamMatchLimit(r)/2||!/^\w{3}\.[1-4]$/.test(r.espn)||!Number.isInteger(r.fotmobId)||!Number.isInteger(r.fotmobSeason)||!['Understat','FotMob'].includes(r.primary)||!/^[a-z0-9-]+\.json$/.test(r.espnFile)||r.calendarPhase!==undefined&&!['regular'].includes(r.calendarPhase))throw new Error('Configuración de liga inválida.');
    for(const r of rows){
      if(r.teamAliases!==undefined&&(!r.teamAliases||Array.isArray(r.teamAliases)||typeof r.teamAliases!=='object'||Object.keys(r.teamAliases).length>32||Object.entries(r.teamAliases).some(([a,b])=>!/^[a-z0-9]{1,100}$/.test(a)||typeof b!=='string'||!/^[a-z0-9]{1,100}$/.test(b))))throw new Error('Alias de clubes inválidos.');
      if(r.metricPriority!==undefined&&(!Array.isArray(r.metricPriority)||!r.metricPriority.length||r.metricPriority.length>3||new Set(r.metricPriority).size!==r.metricPriority.length||r.metricPriority.some(s=>!['FotMob','Understat','ESPN'].includes(s))||r.primary==='FotMob'&&r.metricPriority.includes('Understat')))throw new Error('Prioridad de métricas inválida.');
      if(r.archivedPrimary!==undefined&&(r.id!=='laliga'||r.archivedPrimary!=='Understat'||!Array.isArray(r.archivedMetricPriority)||r.archivedMetricPriority.length!==3||new Set(r.archivedMetricPriority).size!==3||r.archivedMetricPriority.some(s=>!['FotMob','Understat','ESPN'].includes(s))))throw new Error('Configuración de archivo inválida.');
      if(r.optionalMetrics!==undefined&&(r.id!=='laliga'||!Array.isArray(r.optionalMetrics)||r.optionalMetrics.length>2||new Set(r.optionalMetrics).size!==r.optionalMetrics.length||r.optionalMetrics.some(k=>!['equipos: xg','equipos: xga'].includes(k))))throw new Error('Cobertura opcional inválida.');
      if(r.understatRefresh!==undefined&&(typeof r.understatRefresh!=='boolean'||r.primary!=='Understat'&&r.archivedPrimary!=='Understat'))throw new Error('Configuración de actualización inválida.');
    }
    catalog=rows.map(r=>Object.freeze({...r,...(r.teamAliases?{teamAliases:Object.freeze({...r.teamAliases})}:{}),...Object.fromEntries(['metricPriority','archivedMetricPriority','optionalMetrics'].filter(k=>r[k]).map(k=>[k,Object.freeze([...r[k]])]))}));return catalog;
  }
  function get(id='laliga'){
    if(id==='all')return {id:'all',name:'Todas las ligas',year:2026,season:'2026/27',teams:catalog.reduce((s,l)=>s+l.teams,0),matches:catalog.reduce((s,l)=>s+l.matches,0),primary:'Mixta'};
    const result=catalog.find(r=>r.id===id);if(!result)throw new Error('Liga no admitida.');return result;
  }
  function resolve(meta){
    const league=catalog.find(r=>meta?.league_key?r.id===meta.league_key:r.name===meta?.competition);
    if(!league||league.name!==meta.competition||meta.season!==league.season)throw new Error('Competición o temporada no admitida.');
    return league;
  }
  function list(){return [...catalog];}
  function teamMatchLimit(league){return league.maxTeamMatches??2*(league.teams-1);}
  const api={configure,get,resolve,list,teamMatchLimit,ready:null};
  if(node){configure(require('./leagues.json'));api.ready=Promise.resolve();module.exports=api;}
  else{root.GradaLeagues=api;api.ready=fetch('leagues.json',{signal:AbortSignal.timeout(10000)}).then(r=>{if(!r.ok)throw new Error('No se pudo cargar el catálogo de ligas.');return r.json();}).then(configure);api.ready.catch(()=>{});}
})(typeof window==='object'?window:globalThis);
