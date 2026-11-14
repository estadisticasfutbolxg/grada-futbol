'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),clubs=require('../dist/clubs.js'),metrics=require('../dist/metrics.js');
test('club options use the real catalogue, never a transferred player aggregate',()=>{
 const teams=[{id:'1',name:'Atlético Madrid'},{id:'2',name:'Deportivo La Coruna'}],p={id:'p',team_id:null,team:'Atletico Madrid,Deportivo La Coruna'};
 const data={metadata:{},teams,players:[p]},options=clubs.options(data);assert.deepEqual(options.slice(0,2).map(c=>c.id),['1','2']);assert(options.every(c=>!c.label.includes(',')));
 assert.equal(clubs.info(p,teams).kind,'multiple');assert(!clubs.matches(p,'1',teams));assert(clubs.matches(p,clubs.multiKey,teams));assert.equal(p.team_id,null);
 const valid={...p,team_id:'1'};assert.equal(clubs.info(valid,teams).kind,'single');assert(clubs.matches(valid,'1',teams));
});
test('unknown or ambiguous club names never create a team and all-league IDs stay distinct',()=>{
 const teams=[{id:'a:1',name:'Club',league_key:'a'},{id:'b:1',name:'Club',league_key:'b'},{id:'a:2',name:'Other',league_key:'a'}];
 const p={team_id:null,league_key:'a',team:'Club,Other'};assert.deepEqual(clubs.info(p,teams).clubs.map(t=>t.id),['a:1','a:2']);
 p.team='Club,Missing';assert.equal(clubs.info(p,teams).kind,'unassigned');p.team='Club';assert.equal(clubs.info(p,teams).kind,'unassigned');
});
test('derived metrics keep real zeros, avoid double normalization, and require the same provider sample',()=>{
 const ctx={source:'Source',minutes:180,matches:2,captured_at:'2026-11-10T00:00:00Z'};
 const p={goals:0,assists:2,xg:1.2,xa:0.8,shots:6,minutes:180,matches:2,metricContexts:Object.fromEntries(['goals','assists','xg','xa','shots'].map(k=>[k,{...ctx}]))};
 assert.equal(metrics.metric(p,'goalInvolvementsPer90'),1);assert.equal(metrics.metric(p,'xgXaPer90'),1);assert(Math.abs(metrics.metric(p,'xgPerShot')-0.2)<1e-12);assert.equal(metrics.metric(p,'xgPerShot','90'),metrics.metric(p,'xgPerShot'));
 p.metricContexts.goals.reportedPer90=0;assert.equal(metrics.metric(p,'goalInvolvementsPer90'),1);
 p.metricContexts.assists.captured_at='2026-11-11T00:00:00Z';assert.equal(metrics.metric(p,'goalInvolvementsPer90'),1);assert.equal(metrics.context(p,'goalInvolvementsPer90').componentCaptures.assists,'2026-11-11T00:00:00Z');p.metricContexts.assists.matches=3;assert.equal(metrics.metric(p,'goalInvolvementsPer90'),null);p.metricContexts.assists={...ctx,source:'Other'};assert.equal(metrics.metric(p,'goalInvolvements'),null);
 p.metricContexts.xg={...ctx,minutes:90};assert.equal(metrics.metric(p,'xgPerShot'),null);assert.equal(metrics.metric(p,'xgXaPer90'),null);
 p.metricContexts.xg={...ctx};p.xg=0;assert.equal(metrics.metric(p,'xgPerShot'),0);p.shots=0;assert.equal(metrics.metric(p,'xgPerShot'),null);
});
