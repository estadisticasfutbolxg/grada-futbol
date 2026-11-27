'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),P=require('../worker/providers.cjs'),L=require('../dist/leagues'),{htmlFor}=require('./helpers/fotmob-pages.cjs');
test('FotMob page pool validates every required page, preserves results and never exceeds four requests',async()=>{
 const league=L.get('laliga'),calls=[];let active=0,max=0;
 const now=()=> '2026-11-27T10:00:00Z',data=await P.fetchFotmob('laliga',{now,fetcher:async url=>{calls.push(url);active++;max=Math.max(max,active);await new Promise(r=>setImmediate(r));active--;return new Response(htmlFor(url));}});
 assert.equal(max,4);assert.equal(calls.length,Object.keys(P.specs(league)).length);assert.equal(new Set(calls).size,calls.length);assert.equal(data.players[0].minutes,200);assert.equal(data.players[0].goals,0);assert.equal(data.teams.length,20);assert.equal(Object.keys(data.metadata.pages).length,calls.length);
 const pages=Object.fromEntries(calls.map(url=>{const key=url.includes('/overview/')?'overview':url.split('/').at(-2);return[key,{url,captured_at:now(),data:P.parseFotmob(htmlFor(url),key,league)}];}));
 assert.deepEqual(data,P.buildFotmob(pages,league));
});
test('a failed provider page stops queued requests and never publishes a partial season',async()=>{
 let calls=0;
 await assert.rejects(P.fetchFotmob('laliga',{fetcher:async()=>{calls++;await new Promise(r=>setImmediate(r));return new Response('',{status:503});}}));
 assert.equal(calls,4);
});
