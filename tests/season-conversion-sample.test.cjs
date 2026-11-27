'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../dist/competitions'),M=require('../dist/metrics'),S=require('../dist/scores');
function sample(league,{minutes=300,ownMinutes=minutes,source='FotMob',conversion=17}={}){
 const players=Array.from({length:8},(_,i)=>{
  const values={minutes,matches:3,goals:i+1,shots:10+i,xg:1+i,xa:1+i,conversion:conversion+i,shotsOnTargetPer90:1+i,dribblesPer90:1+i};
  const metricContexts=Object.fromEntries(Object.keys(values).map(key=>[key,{source:'FotMob',minutes,matches:3,league_key:league,captured_at:'2026-11-27T09:00:00Z'}]));
  for(const key of ['goals','shots','conversion'])metricContexts[key]={...metricContexts[key],source,minutes:ownMinutes};
  return {id:league+':p'+i,name:'Isolated '+i,team_id:league+':t1',team:'Isolated club',league_key:league,pos:'DEL',...values,metricContexts,sourceRecords:{FotMob:{id:String(1000+i),team_id:'1',pos:'DEL'}}};
 });
 return {metadata:{league_key:league},players,teams:[{id:league+':t1',name:'Isolated club',league_key:league,sourceRecords:{FotMob:{id:'1'}}}]};
}
function merge(a,b){return C.merge({metadata:{leagues:[{id:a.metadata.league_key},{id:b.metadata.league_key}],notes:'Isolated tests only'},players:[...a.players,...b.players],teams:[...a.teams,...b.teams]});}
test('an unknown-minute cup ratio cannot erase the valid partial league percentage or its score',()=>{
 const a=sample('laliga'),b=sample('champions-league',{minutes:100,ownMinutes:null,source:'ESPN',conversion:20}),before=JSON.stringify([a,b]),all=merge(a,b),p=all.players[0],context=M.context(p,'conversion');
 assert.equal(p.conversion,17);assert.equal(p.goals,2);assert.equal(p.shots,20);assert.equal(context.aggregation,'minutes_weighted_percentage');assert.equal(context.minutes,300);assert.equal(context.coverage.known,1);assert.equal(context.coverage.total,2);assert.equal(context.source,'FotMob');assert.equal(context.contributions[0].competition,'laliga');assert.equal(context.contributions[0].minutes,300);assert(Number.isFinite(S.build(all).players.get(p).score));assert.equal(JSON.stringify([a,b]),before);
});
test('an exact ratio with known own minutes keeps priority over weighted published percentages',()=>{
 const all=merge(sample('laliga'),sample('champions-league',{minutes:100,ownMinutes:100,source:'ESPN',conversion:20})),p=all.players[0],context=M.context(p,'conversion');
 assert.equal(p.conversion,10);assert.equal(context.derived,'same_source_ratio');assert.equal(context.minutes,400);assert.equal(context.coverage.known,2);assert.equal(context.coverage.total,2);assert(Number.isFinite(S.build(all).players.get(p).score));
});
test('zero-minute count contexts cannot replace an independently timed percentage',()=>{
 const a=sample('laliga'),b=sample('champions-league',{minutes:100,ownMinutes:0,source:'ESPN'});
 for(const data of [a,b])for(const player of data.players)for(const key of ['goals','shots'])player.metricContexts[key].minutes=0;
 const all=merge(a,b),p=all.players[0];assert.equal(p.conversion,17);assert.equal(M.context(p,'conversion').minutes,300);assert.equal(M.context(p,'goals').minutes,0);assert(Number.isFinite(S.build(all).players.get(p).score));
});
test('without any verified-minute percentage the exact ratio remains informational and does not manufacture score eligibility',()=>{
 const all=merge(sample('laliga',{ownMinutes:null,source:'ESPN'}),sample('champions-league',{minutes:100,ownMinutes:null,source:'ESPN'})),p=all.players[0];
 assert.equal(p.conversion,10);assert.equal(M.context(p,'conversion').minutes,null);const peers=sample('serie-a').players.map((p,i)=>({...p,sourceRecords:{FotMob:{...p.sourceRecords.FotMob,id:String(2000+i)}}})),profile=S.build(all,{referencePlayers:[...all.players,...peers]}).players.get(p);assert.equal(profile.score,null);assert(profile.insufficientSamples.some(s=>s.key==='conversion'));
});
test('partial sample minimum is checked by the score and explicit percentage zeros remain valid',()=>{
 const small=merge(sample('laliga',{ownMinutes:90}),sample('champions-league',{minutes:100,ownMinutes:null,source:'ESPN'})),p=small.players[0];assert.equal(p.conversion,17);assert.equal(M.context(p,'conversion').minutes,90);assert.equal(S.build(small).players.get(p).score,null);
 const zero=sample('laliga',{conversion:0}),cup=sample('champions-league',{minutes:100,ownMinutes:null,source:'ESPN'});zero.players[0].goals=0;cup.players[0].goals=0;const all=merge(zero,cup),q=all.players[0];assert.equal(q.conversion,0);assert.equal(M.context(q,'conversion').minutes,300);assert(Number.isFinite(S.build(all).players.get(q).score));
});
