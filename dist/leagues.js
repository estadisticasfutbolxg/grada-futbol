(function(root){
  'use strict';
  const node=typeof module==='object'&&module.exports;
  let catalog=[];
  function configure(rows){
    if(!Array.isArray(rows)||!rows.length||rows.length>10||new Set(rows.map(r=>r.id)).size!==rows.length)throw new Error('Catálogo de ligas inválido.');
    for(const r of rows)if(!/^[a-z0-9-]+$/.test(r.id)||typeof r.name!=='string'||r.name.length>80||r.year!==2026||r.season!=='2026/27'||![18,20].includes(r.teams)||r.matches!==r.teams*(r.teams-1)||!/^\w{3}\.1$/.test(r.espn)||!Number.isInteger(r.fotmobId)||!Number.isInteger(r.fotmobSeason)||!['Understat','FotMob'].includes(r.primary)||!/^[a-z0-9-]+\.json$/.test(r.espnFile))throw new Error('Configuración de liga inválida.');
    catalog=rows.map(r=>Object.freeze({...r}));return catalog;
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
  const api={configure,get,resolve,list,ready:null};
  if(node){configure(require('./leagues.json'));api.ready=Promise.resolve();module.exports=api;}
  else{root.GradaLeagues=api;api.ready=fetch('leagues.json',{signal:AbortSignal.timeout(10000)}).then(r=>{if(!r.ok)throw new Error('No se pudo cargar el catálogo de ligas.');return r.json();}).then(configure);api.ready.catch(()=>{});}
})(typeof window==='object'?window:globalThis);
