'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{gzipSync}=require('node:zlib'),app=require('../worker/app.cjs'),providers=require('../worker/providers.cjs'),leagues=require('../dist/leagues.js');
const {access}=require('./helpers/owner.cjs');
function cache(){const map=new Map();return {map,async match(k){return map.get(k)?.clone();},async put(k,r){map.set(k,r.clone());}};}
test('refresh routes constrain method, origin, provider, league and roster before any upstream request',async()=>{
 const {env,headers}=await access();
 let calls=0;const options={env,cache:cache(),fetcher:async()=>{calls++;throw new Error();}},base='https://grada.test';
 for(const [path,status,extra] of [['/api/source/fotmob?league=all',400],['/api/source/fotmob?league=laliga&url=https://example.com',400],['/api/source/understat?league=serie-a',400],['/api/source/fotmob?league=laliga',405,{method:'POST'}],['/api/source/fotmob?league=laliga',403,{headers:{Origin:'https://other.test'}}],['/api/player/fotmob?league=laliga&player=999',400]])assert.equal((await app.handle(new Request(base+path,{...extra,headers:{...headers,...extra?.headers}}),{},options)).status,status);
 assert.equal(calls,0);
});
test('simultaneous refreshes are deduplicated, failures are bounded, and last valid data stays available',async()=>{
 const store=cache(),origin='https://grada.test',key=app.apiKey(origin,'understat','laliga'),now=Date.parse('2026-11-08T12:00:00Z');let calls=0;
 const {env,headers}=await access(undefined,()=>now);
 await store.put(key,new Response('{"source":"last valid"}',{headers:{'X-Grada-Checked-At':'2026-11-08T11:00:00Z'}}));
 const options={env,cache:store,now:()=>now,fetcher:async()=>{calls++;return new Response('',{status:503});}},url=origin+'/api/source/understat?league=laliga';
 const responses=await Promise.all(Array.from({length:5},()=>app.handle(new Request(url,{headers}),{},options)));assert(responses.every(r=>r.status===503));assert(responses.every(r=>r.headers.get('Cache-Control')==='private, no-store'));assert.equal(calls,2);
 await app.handle(new Request(url,{headers}),{},options);assert.equal(calls,2);
 const response=await app.handle(new Request(origin+'/downloads/understat-laliga-2026-27.json'),{'/downloads/understat-laliga-2026-27.json':{sha:'fixture'}},options);assert.equal((await response.json()).source,'last valid');
});
test('static Worker assets support GET, HEAD and conditional requests without exposing arbitrary paths',async()=>{
 const asset={type:'text/html; charset=utf-8',sha:'isolated',gzip:gzipSync('isolated test page').toString('base64')},assets={'/index.html':asset},options={cache:cache()};
 assert.equal(await (await app.handle(new Request('https://grada.test/'),assets,options)).text(),'isolated test page');
 assert.equal(await (await app.handle(new Request('https://grada.test/',{method:'HEAD'}),assets,options)).text(),'');
 assert.equal((await app.handle(new Request('https://grada.test/',{headers:{'If-None-Match':'"isolated"'}}),assets,options)).status,304);
 assert.equal((await app.handle(new Request('https://grada.test/unknown'),assets,options)).status,404);
});
test('provider parsing rejects the wrong season and redirects outside the selected source',async()=>{
 const league=leagues.get('laliga'),d={props:{pageProps:{data:{currentSeasonId:2025,currentStatName:'accurate_pass',leagueDetails:{id:87},type:'players'}}}};
 assert.throws(()=>providers.parseFotmob('<script id="__NEXT_DATA__">'+JSON.stringify(d)+'</script>','accurate_pass',league));let calls=0;
 await assert.rejects(providers.textResponse('https://www.fotmob.com/players/10/player',{fetcher:async()=>{calls++;return new Response('',{status:302,headers:{Location:'https://other.test/private'}});}}));assert.equal(calls,1);
});
test('server Understat parser preserves mixed positions and real zero values',()=>{
 const teams=Object.fromEntries(Array.from({length:20},(_,i)=>[String(i+1),{id:i+1,title:'Club '+(i+1),history:Array.from({length:2},()=>({scored:1,missed:1,xG:1,xGA:1}))}]));
 const dates=Array.from({length:380},(_,i)=>i<20?{id:i+1,isResult:true,datetime:'2026-08-21 19:00:00',h:{id:i%10*2+1,title:'Club '+(i%10*2+1)},a:{id:i%10*2+2,title:'Club '+(i%10*2+2)},goals:{h:1,a:1},xG:{h:1,a:1}}:{isResult:false});
 const players=[{id:1,player_name:'Isolated fixture',team_title:'Club 1',position:'M F',games:2,time:180,goals:0,xG:0,shots:0,assists:0,xA:0,key_passes:0}];
 const result=providers.adaptUnderstat({teams,dates,players},'2026-11-10T12:00:00Z').players[0];
 assert.equal(result.pos,'MED');assert.deepEqual(result.positions,['MED','DEL']);assert.equal(result.goals,0);assert.equal(result.xg,0);assert.equal(result.conversion,null);
});
test('hosting cache denial cannot hide any league or break a source response',async()=>{
 const {env,headers}=await access();
 const previous=globalThis.caches;let defaultReads=0;
 globalThis.caches={get default(){defaultReads++;throw new Error('Default cache not permitted');},async open(){throw new Error('Cache not permitted');}};
 try{
  for(const league of leagues.list()){
   const path='/downloads/fotmob-'+league.id+'-2026-27.json',body=JSON.stringify({league:league.id}),assets={[path]:{type:'application/json',sha:'fixture',gzip:gzipSync(body).toString('base64')}};
   const response=await app.handle(new Request('https://cache-denial.test'+path),assets);assert.equal(response.status,200);assert.equal((await response.json()).league,league.id);
  }
  const failed=await app.handle(new Request('https://cache-denial.test/api/source/understat?league=laliga',{headers}),{},{env,fetcher:async()=>new Response('',{status:503})});assert.equal(failed.status,503);assert.equal(defaultReads,0);
 }finally{if(previous===undefined)delete globalThis.caches;else globalThis.caches=previous;}
});
