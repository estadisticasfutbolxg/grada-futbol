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
 const api={sources,names,validate,refresh,captureStore};if(node)module.exports=api;else root.GradaRefresh=api;
})(typeof window==='object'?window:globalThis);
