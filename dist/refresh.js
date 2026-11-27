(function(root){
 'use strict';
 const node=typeof module==='object'&&module.exports,leagues=node?require('./leagues.js'):root.GradaLeagues;
 const profiles=node?require('./profiles.js'):root.GradaProfiles;
 const espn=node?require('./laliga.js'):root.GradaLaLiga;
 const roles=node?require('./roles.js'):root.GradaRoles;
 const fotmob=node?require('./fotmob.js'):root.GradaFotmob;
 const validators=node?{espn:require('./laliga.js').validate,fotmob:require('./fotmob.js').validate,understat:require('./understat.js').validate}:{espn:root.GradaLaLiga.validate,fotmob:root.GradaFotmob.validate,understat:root.GradaUnderstat.validate};
 const names={espn:'ESPN',fotmob:'FotMob',understat:'Understat'};
 function sources(league){return ['espn','fotmob',...(league.primary==='Understat'?['understat']:[])];}
 function refreshSources(league){return sources(league).filter(key=>key!=='understat'||league.understatRefresh!==false);}
 function validate(value,key,league,{now=Date.now()}={}){
  const next=validators[key](value),meta=next.metadata;
  if(meta.source!==names[key]||leagues.resolve(meta).id!==league.id||Date.parse(meta.imported_at)>now+300000)throw new Error('Fuente, liga o fecha incorrecta.');return next;
 }
 function selectCapture(current,candidate,key,league){
  const next=validate(candidate,key,league),newer=Date.parse(next.metadata.imported_at)>Date.parse(current.metadata.imported_at);
  const selected=newer?next:current,backup=newer?current:next;
  return key==='fotmob'?validate(fotmob.restorePenalties(fotmob.restoreTeams(profiles.restore(selected,backup),backup),backup),key,league):key==='espn'?validate(espn.restoreIdentities(selected,backup),key,league):selected;
 }
 async function refresh(state,league,{fetchers,combine,onProgress=()=>{}}){
  const keys=refreshSources(league),results=await Promise.allSettled(keys.map(async key=>{onProgress(key);return validate(await fetchers[key](league),key,league);}));
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
 function sameValues(a,b){
  if(a===b)return true;
  if(!a||!b||typeof a!=='object'||typeof b!=='object')return JSON.stringify(a)===JSON.stringify(b);
  const present=value=>value!==undefined&&typeof value!=='function'&&typeof value!=='symbol';
  if(Array.isArray(a)||Array.isArray(b))return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&Array.from(a).every((value,i)=>sameValues(present(value)?value:null,present(b[i])?b[i]:null));
  const keys=value=>Object.keys(value).filter(key=>!captureKeys.has(key)&&present(value[key])),ak=keys(a),bk=keys(b);
  return ak.length===bk.length&&ak.every(key=>Object.hasOwn(b,key)&&present(b[key])&&sameValues(a[key],b[key]));
 }
 function playerValues(player){
  return {...Object.fromEntries(Object.entries(player).filter(([key,value])=>value===null||typeof value!=='object'||['metricContexts','fieldSources','nationality'].includes(key))),tacticalPositions:[...roles.info(player).codes].sort()};
 }
 function changes(before,after,project=value=>value){
  const old=new Map(before.map(row=>[String(row.id),row])),added=[],modified=[];
  for(const row of after){const prior=old.get(String(row.id));if(!prior)added.push(row);else if(!sameValues(project(prior),project(row)))modified.push(row);old.delete(String(row.id));}
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
 async function loadProfiles(data,league,{fetchImpl=fetch,onProgress=()=>{}}={}){
  const found=new Array(data.players.length),size=profiles.batchSize,fallback=[];
  const rows=data.players.map((row,index)=>({id:String(row.id),index})),batches=[];
  for(let offset=0;offset<rows.length;offset+=size)batches.push(rows.slice(offset,offset+size));
  let done=0,batchSupported=true,blocked=false;
  const denied=status=>status===401||status===403||status===429;
  const complete=rows=>{done+=rows.length;onProgress(done,data.players.length);};
  const valid=(item,id)=>item&&typeof item==='object'&&!Array.isArray(item)&&String(item.id)===id;
  async function batch(rows){
   if(blocked){complete(rows);return;}
   if(!batchSupported){fallback.push(...rows);return;}
   const ids=rows.map(row=>row.id);
   try{
    const r=await fetchImpl('/api/players/fotmob?league='+encodeURIComponent(league.id)+'&players='+ids.map(encodeURIComponent).join(','),{signal:AbortSignal.timeout(60000),cache:'no-store'});
    if(denied(r.status)){blocked=true;complete(rows);return;}
    if(!r.ok){if(r.status===404||r.status===405)batchSupported=false;throw new Error('Ficha agrupada no disponible.');}
    const items=(await r.json()).profiles;
    if(!Array.isArray(items)||items.length>rows.length||new Set(items.map(p=>String(p?.id))).size!==items.length||items.some(p=>!ids.some(id=>valid(p,id))))throw new Error('Respuesta de fichas inválida.');
    const byId=new Map(items.map(item=>[String(item.id),item]));
    for(const row of rows)if(byId.has(row.id))found[row.index]=byId.get(row.id);
    complete(rows);
   }catch(_){fallback.push(...rows);}
  }
  // Probe compatibility/auth once before opening two requests concurrently.
  // A failed batch still gets the same individual coverage as the old path.
  if(batches.length)await batch(batches[0]);
  let cursor=1;
  async function worker(){while(cursor<batches.length)await batch(batches[cursor++]);}
  await Promise.all(Array.from({length:Math.min(2,Math.max(0,batches.length-1))},worker));
  // One shared pool bounds fallback requests even when both batches failed.
  cursor=0;
  async function single(){while(cursor<fallback.length){const row=fallback[cursor++];
   if(!blocked)try{
    const r=await fetchImpl('/api/player/fotmob?league='+encodeURIComponent(league.id)+'&player='+encodeURIComponent(row.id),{signal:AbortSignal.timeout(30000),cache:'no-store'});
    if(denied(r.status))blocked=true;
    else if(r.ok){const item=await r.json();if(valid(item,row.id))found[row.index]=item;}
   }catch(_){/* A failed profile keeps the previous verified fields. */}
   complete([row]);
  }}
  await Promise.all(Array.from({length:Math.min(3,fallback.length)},single));
  return found.filter(Boolean);
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
  async function prune(leagueIds,storage=null){
   const allowed=new Set(leagueIds);let legacyComplete=true;
   try{if(typeof storage?.key==='function')for(let i=storage.length-1;i>=0;i--){const key=storage.key(i),match=key?.match(/^grada:espn:([a-z0-9-]+):\d{4}-\d{2}:v1$/);if(match&&!allowed.has(match[1]))storage.removeItem(key);}}catch(_){legacyComplete=false;}
   const db=await open();if(!db)return legacyComplete&&typeof indexedDB!=='object';
   return new Promise(resolve=>{
    let done=false,tx;const settle=value=>{if(done)return;done=true;clearTimeout(timer);resolve(value&&legacyComplete);},timer=setTimeout(()=>{try{tx?.abort();}catch(_){}settle(false);},2000);
    try{tx=db.transaction('sources','readwrite');const request=tx.objectStore('sources').openCursor();request.onsuccess=()=>{const cursor=request.result;if(!cursor)return;if(typeof cursor.key!=='string'||!allowed.has(cursor.key.split('|')[0]))cursor.delete();cursor.continue();};tx.oncomplete=()=>settle(true);tx.onerror=tx.onabort=()=>settle(false);}catch(_){settle(false);}
   });
  }
  return {get:(league,key)=>operation('readonly',league+'|'+key),set:(league,key,value)=>operation('readwrite',league+'|'+key,value),prune};
 }
 const api={sources,refreshSources,names,validate,selectCapture,refresh,report,captureStore,loadProfiles};if(node)module.exports=api;else root.GradaRefresh=api;
})(typeof window==='object'?window:globalThis);
