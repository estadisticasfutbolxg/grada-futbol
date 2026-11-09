(function(root){
 'use strict';
 const node=typeof module==='object'&&module.exports,leagues=node?require('./leagues.js'):root.GradaLeagues;
 const validators=node?{espn:require('./laliga.js').validate,fotmob:require('./fotmob.js').validate,understat:require('./understat.js').validate}:{espn:root.GradaLaLiga.validate,fotmob:root.GradaFotmob.validate,understat:root.GradaUnderstat.validate};
 const names={espn:'ESPN',fotmob:'FotMob',understat:'Understat'};
 function sources(league){return ['espn','fotmob',...(league.primary==='Understat'?['understat']:[])];}
 function validate(value,key,league,{now=Date.now()}={}){
  const next=validators[key](value),meta=next.metadata;
  if(meta.source!==names[key]||leagues.resolve(meta).id!==league.id||Date.parse(meta.imported_at)>now+300000)throw new Error('Fuente, liga o fecha incorrecta.');return next;
 }
 async function refresh(state,league,{fetchers,combine,onProgress=()=>{}}){
  const keys=sources(league),results=await Promise.allSettled(keys.map(async key=>{onProgress(key);return validate(await fetchers[key](league),key,league);}));
  let candidate={...state};const checked=[],failed=[],updated=[];
  for(let i=0;i<keys.length;i++){
   const key=keys[i],r=results[i];
   if(r.status==='rejected'){failed.push(key);continue;}
   if(state[key]&&Date.parse(r.value.metadata.imported_at)<Date.parse(state[key].metadata.imported_at)){failed.push(key);continue;}
   candidate[key]=r.value;checked.push(key);if(!state[key]||r.value.metadata.imported_at!==state[key].metadata.imported_at)updated.push(key);
  }
  try{candidate.combined=combine(candidate);}catch(_){
   // An individually valid response must also fit the full combined contract.
   candidate={...state};
   for(const key of [...checked]){try{const next={...candidate,[key]:results[keys.indexOf(key)].value};next.combined=combine(next);candidate=next;}catch(_){failed.push(key);checked.splice(checked.indexOf(key),1);const index=updated.indexOf(key);if(index>=0)updated.splice(index,1);}}
  }
  return {state:candidate,checked,updated,failed};
 }
 // Capture dates and retrieval URLs can change without any football data changing.
 const captureKeys=new Set(['captured_at','imported_at','minutes_captured_at','url']);
 function canonical(value){
  if(Array.isArray(value))return value.map(canonical);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).filter(k=>!captureKeys.has(k)).sort().map(k=>[k,canonical(value[k])]));
  return value;
 }
 function playerValues(player){
  return Object.fromEntries(Object.entries(player).filter(([key,value])=>value===null||typeof value!=='object'||['metricContexts','fieldSources'].includes(key)));
 }
 function changes(before,after,project=value=>value){
  const old=new Map(before.map(row=>[String(row.id),row])),added=[],modified=[];
  for(const row of after){const prior=old.get(String(row.id));if(!prior)added.push(row);else if(JSON.stringify(canonical(project(prior)))!==JSON.stringify(canonical(project(row))))modified.push(row);old.delete(String(row.id));}
  return {added,modified,removed:[...old.values()]};
 }
 function matchCount(data){const n=data?.metadata?.imported_matches;return Number.isInteger(n)&&n>=0?n:null;}
 function report(before,result){
  const after=result.state,accepted=result.checked.length>0;
  const players=changes(before.combined?.players||[],accepted?after.combined?.players||[]:before.combined?.players||[],playerValues);
  const sources=result.checked.map(key=>{
   const data=after[key],count=matchCount(data),previous=matchCount(before[key]);
   const detailed=Array.isArray(data.matches)&&(data.matches.length>0||key==='understat'&&count===0);
   return {key,players:data.players.length,matches:count,coverageDelta:count!==null&&previous!==null?count-previous:null,
    matchesChanged:detailed?changes(before[key]?.matches||[],data.matches):null,
    profiles:key==='fotmob'?data.metadata.profile_enrichment||null:null};
  });
  return {players,sources};
 }
 function captureStore(){
  let connection;
  function open(){
   if(connection)return connection;
   connection=new Promise(resolve=>{
    if(typeof indexedDB!=='object'){resolve(null);return;}
    let finished=false;const settle=db=>{if(finished){db?.close();return;}finished=true;clearTimeout(timer);resolve(db);},timer=setTimeout(()=>settle(null),2000);
    try{const r=indexedDB.open('grada-captures',1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('sources'))r.result.createObjectStore('sources');};r.onerror=r.onblocked=()=>settle(null);r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();settle(r.result);};}catch(_){settle(null);}
   });return connection;
  }
  async function operation(mode,key,value){
   const db=await open();if(!db)return mode==='readonly'?null:false;
   return new Promise(resolve=>{let done=false;const settle=v=>{if(done)return;done=true;clearTimeout(timer);resolve(v);},timer=setTimeout(()=>settle(mode==='readonly'?null:false),2000);
    try{const tx=db.transaction('sources',mode),r=mode==='readonly'?tx.objectStore('sources').get(key):tx.objectStore('sources').put(value,key);let result=null;r.onsuccess=()=>{result=r.result;};tx.oncomplete=()=>settle(mode==='readonly'?result??null:true);tx.onerror=tx.onabort=()=>settle(mode==='readonly'?null:false);}catch(_){settle(mode==='readonly'?null:false);}
   });
  }
  return {get:(league,key)=>operation('readonly',league+'|'+key),set:(league,key,value)=>operation('readwrite',league+'|'+key,value)};
 }
 const api={sources,names,validate,refresh,report,captureStore};if(node)module.exports=api;else root.GradaRefresh=api;
})(typeof window==='object'?window:globalThis);
