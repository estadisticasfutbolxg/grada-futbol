'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),refresh=require('../dist/refresh.js');
const row=(id,goals=1)=>({id,name:'Jugador '+id,team:'Equipo',goals,metricContexts:{goals:{source:'FotMob',minutes:90,captured_at:'2026-11-08T00:00:00Z'}}});
const source=(players,matches,imported_matches=10)=>({players,matches,metadata:{imported_matches}});
function result(state,checked=['espn','fotmob']){return {state,checked,failed:[]};}
test('report counts actual player changes once across providers, including new players and real zero values',()=>{
 const before={combined:{players:[row('1'),row('2'),row('3',null)]},espn:source([],[]),fotmob:source([],[])};
 const after={combined:{players:[row('1',2),row('2'),row('3',0),row('4')]},espn:source([row('1'),row('4')],[]),fotmob:source([row('1'),row('4')],[])};
 const original=JSON.stringify(before),report=refresh.report(before,result(after));
 assert.deepEqual(report.players.added.map(p=>p.id),['4']);assert.deepEqual(report.players.modified.map(p=>p.id),['1','3']);assert.equal(report.players.removed.length,0);assert.equal(report.sources.length,2);assert(report.sources.every(s=>s.matchesChanged===null));assert.equal(JSON.stringify(before),original);
});
test('a fresh capture or JSON key order alone is not a player update; a changed metric denominator is',()=>{
 const a=row('1'),b=structuredClone(a);b.metricContexts.goals.captured_at='2026-11-09T00:00:00Z';b.metricContexts.goals.url='https://example.test/new-capture';b.sourceRecords={FotMob:{imported_at:'2026-11-09T00:00:00Z'}};
 const before={combined:{players:[a]},fotmob:source([],[])};let after={combined:{players:[Object.fromEntries(Object.entries(b).reverse())]},fotmob:source([],[])};
 assert.equal(refresh.report(before,result(after,['fotmob'])).players.modified.length,0);
 b.metricContexts.goals.minutes=180;after.combined.players=[b];assert.equal(refresh.report(before,result(after,['fotmob'])).players.modified.length,1);
});
test('match changes use individual IDs while aggregate coverage stays separate by source and never invents a match list',()=>{
 const m={id:'10',home:'Local',away:'Visitante',home_goals:1,away_goals:0,date:'2026-11-01'};
 const before={combined:{players:[]},understat:source([],[m],1),espn:source([],[],1)};
 const after={combined:{players:[]},understat:source([],[{...m,home_goals:2},{...m,id:'11'}],2),espn:source([],[],2)};
 const r=refresh.report(before,result(after,['espn','understat']));assert.equal(r.sources[0].matchesChanged,null);assert.equal(r.sources[0].coverageDelta,1);assert.equal(r.sources[1].matchesChanged.modified[0].id,'10');assert.equal(r.sources[1].matchesChanged.added[0].id,'11');assert.equal(r.sources[1].matches,2);
});
test('failed sources do not count retained players or matches as refreshed, and unknown coverage is not zero',()=>{
 const before={combined:{players:[row('1')]},espn:{players:[row('1')],metadata:{}}};
 let r=refresh.report(before,result(before,[]));assert.equal(r.players.modified.length,0);assert.equal(r.players.added.length,0);assert.equal(r.sources.length,0);
 r=refresh.report(before,result(before,['espn']));assert.equal(r.sources[0].matches,null);assert.equal(r.sources[0].coverageDelta,null);
 const after={combined:{players:[]},espn:before.espn};assert.equal(refresh.report(before,result(after,['espn'])).players.removed.length,1);
});
