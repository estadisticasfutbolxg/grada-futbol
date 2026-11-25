'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),refresh=require('../dist/refresh.js');
function legacyStorage(entries){const values=new Map(entries);return {get length(){return values.size;},key:i=>[...values.keys()][i]??null,removeItem:key=>values.delete(key),values};}
function indexedStore(entries){
 const values=new Map(entries),db={objectStoreNames:{contains:()=>true},close(){},transaction(name,mode){
  assert.equal(name,'sources');const tx={abort(){tx.onabort?.();},objectStore:()=>({
   openCursor(){assert.equal(mode,'readwrite');const request={},keys=[...values.keys()];let offset=0;
    const next=()=>queueMicrotask(()=>{const key=keys[offset++];request.result=offset>keys.length?null:{key,delete:()=>values.delete(key),continue:next};request.onsuccess?.();if(!request.result)queueMicrotask(()=>tx.oncomplete?.());});next();return request;
   },
   get(key){const request={};queueMicrotask(()=>{request.result=values.get(key);request.onsuccess?.();queueMicrotask(()=>tx.oncomplete?.());});return request;},
   put(value,key){assert.equal(mode,'readwrite');const request={};queueMicrotask(()=>{values.set(key,value);request.onsuccess?.();queueMicrotask(()=>tx.oncomplete?.());});return request;}
  })};return tx;
 }};
 return {values,open(name,version){assert.equal(name,'grada-captures');assert.equal(version,1);const request={result:db};queueMicrotask(()=>request.onsuccess?.());return request;}};
}
test('browser cleanup deletes retired captures and legacy ESPN data without touching retained records or other settings',async()=>{
 const previous=globalThis.indexedDB,active={metadata:{imported_at:'2026-11-24T12:00:00Z'},players:[{id:'1',goals:0}]},indexed=indexedStore([['laliga|fotmob',active],['laliga|understat',{archived:true}],['laliga-2|fotmob',{retired:true}],['league-one|espn',{retired:true}],[123,{invalid:true}]]),storage=legacyStorage([['grada:espn:laliga:2026-27:v1','keep'],['grada:espn:laliga-2:2026-27:v1','remove'],['grada:espn:league-two:2026-27:v1','remove'],['grada:settings','keep']]);
 globalThis.indexedDB=indexed;
 try{const store=refresh.captureStore();assert(await store.prune(['laliga'],storage));assert.deepEqual([...indexed.values.keys()],['laliga|fotmob','laliga|understat']);assert.strictEqual(await store.get('laliga','fotmob'),active);assert.deepEqual([...storage.values.keys()],['grada:espn:laliga:2026-27:v1','grada:settings']);assert(await store.set('laliga','espn',{fresh:true}));assert(await store.prune(['laliga'],storage));assert.deepEqual(await store.get('laliga','espn'),{fresh:true});}
 finally{if(previous===undefined)delete globalThis.indexedDB;else globalThis.indexedDB=previous;}
});
test('cleanup reports inaccessible browser storage and still removes accessible retired records',async()=>{
 const previous=globalThis.indexedDB;
 try{
  globalThis.indexedDB=indexedStore([['laliga-2|espn',{}],['laliga|espn',{}]]);assert.equal(await refresh.captureStore().prune(['laliga'],{key(){},get length(){throw Error('Storage denied');}}),false);assert.deepEqual([...globalThis.indexedDB.values.keys()],['laliga|espn']);
  globalThis.indexedDB={open(){const request={};queueMicrotask(()=>request.onblocked?.());return request;}};assert.equal(await refresh.captureStore().prune(['laliga']),false);
  delete globalThis.indexedDB;assert.equal(await refresh.captureStore().prune(['laliga']),true);
 }finally{if(previous===undefined)delete globalThis.indexedDB;else globalThis.indexedDB=previous;}
});
