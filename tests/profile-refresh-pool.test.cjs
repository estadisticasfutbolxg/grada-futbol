'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),refresh=require('../dist/refresh'),league=require('../dist/leagues').get('laliga');
const data=n=>({players:Array.from({length:n},(_,i)=>({id:String(i+1)}))});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const response=ids=>new Response(JSON.stringify({profiles:ids.map(id=>({id,values:{goals:0}}))}));
test('profile batches overlap within two-request bound and return the original player order',async()=>{
 const rows=data(31),queries=[],progress=[];let active=0,max=0,releaseSlow;
 const slow=new Promise(resolve=>{releaseSlow=resolve;});
 const result=await refresh.loadProfiles(rows,league,{fetchImpl:async url=>{
  const ids=new URL(url,'https://fixture.test').searchParams.get('players').split(',');queries.push(ids);active++;max=Math.max(max,active);
  if(ids[0]==='7')await slow;
  else if(ids[0]==='13'){await tick();releaseSlow();}
  else await tick();
  active--;return response([...ids].reverse());
 },onProgress:(done,total)=>progress.push([done,total])});
 assert.equal(max,2);assert.equal(queries.length,6);assert(queries.every(ids=>ids.length<=6));
 assert.deepEqual(result.map(p=>p.id),rows.players.map(p=>p.id));assert(result.every(p=>p.values.goals===0));
 assert.deepEqual(progress[0],[6,31]);assert.deepEqual(progress.at(-1),[31,31]);
 assert(progress.every((p,i)=>p[1]===31&&(!i||p[0]>progress[i-1][0])));
});
test('network and server failures retain individual coverage with one shared three-request pool',async()=>{
 const rows=data(25),seen=[],progress=[];let active=0,max=0,batches=0;
 const result=await refresh.loadProfiles(rows,league,{fetchImpl:async url=>{
  const u=new URL(url,'https://fixture.test');
  if(u.pathname==='/api/players/fotmob'){batches++;if(batches===1)throw Error('isolated network failure');return new Response('',{status:503});}
  const id=u.searchParams.get('player');seen.push(id);active++;max=Math.max(max,active);await tick();active--;
  return new Response(JSON.stringify({id:id==='5'?'999':id,values:{goals:0}}));
 },onProgress:(done,total)=>progress.push([done,total])});
 assert.equal(batches,5);assert.equal(max,3);assert.equal(new Set(seen).size,25);assert.equal(seen.length,25);
 assert.equal(result.length,24);assert(!result.some(p=>p.id==='999'||p.id==='5'));
 assert.deepEqual(result.map(p=>p.id),rows.players.filter(p=>p.id!=='5').map(p=>p.id));assert.deepEqual(progress.at(-1),[25,25]);
});
test('denied or rate-limited probe stops queued requests without fan-out',async()=>{
 for(const status of [401,403,429]){
  let calls=0;const progress=[];
  const result=await refresh.loadProfiles(data(31),league,{fetchImpl:async()=>{calls++;return new Response('',{status});},onProgress:(done,total)=>progress.push([done,total])});
  assert.equal(calls,1);assert.deepEqual(result,[]);assert.deepEqual(progress.at(-1),[31,31]);
 }
});
test('a denied fallback stops queued individual requests after at most three in flight',async()=>{
 let singles=0;
 const result=await refresh.loadProfiles(data(25),league,{fetchImpl:async url=>{
  const u=new URL(url,'https://fixture.test');if(u.pathname==='/api/players/fotmob')return new Response('',{status:404});
  singles++;return new Response('',{status:403});
 }});
 assert(singles<=3);assert.deepEqual(result,[]);
});
