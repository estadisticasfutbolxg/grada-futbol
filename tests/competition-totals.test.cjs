'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../dist/competitions'),M=require('../dist/metrics'),S=require('../dist/scores'),F=require('../dist/fairplay'),{fixture}=require('./helpers/explore.cjs');
function data(league,minutes){
 const d=fixture();d.metadata.league_key=league;
 d.players=d.players.map((p,i)=>{const metrics=Object.fromEntries(Object.entries(p).filter(([,v])=>typeof v==='number').map(([key])=>[key,{source:'FotMob',minutes,matches:3,captured_at:'2026-11-25T08:00:00Z',league_key:league}]));return {...p,id:league+':'+p.id,league_key:league,minutes,matches:3,team_id:league+':'+p.team_id,metricContexts:metrics,sourceRecords:{FotMob:{id:String(i+1),team_id:p.team_id,pos:p.pos}}};});
 d.teams=d.teams.map(t=>({...t,id:league+':'+t.id,league_key:league,sourceRecords:{FotMob:{id:t.id}},metricContexts:{}}));return d;
}
function aggregate(a,b){return C.merge({metadata:{leagues:[{id:a.metadata.league_key},{id:b.metadata.league_key}],notes:'Isolated test only'},players:[...a.players,...b.players],teams:[...a.teams,...b.teams]});}
test('season totals join provider IDs, sum counts and weight rates with each sample, without mutation or name matching',()=>{
 const a=data('laliga',600),b=data('champions-league',300),p=a.players[24],q=b.players[24];p.goals=2;q.goals=3;p.assists=1;q.assists=1;p.metricContexts.assists={...p.metricContexts.goals};q.metricContexts.assists={...q.metricContexts.goals};p.completedPer90=40;q.completedPer90=70;p.accuracy=60;q.accuracy=90;p.metricContexts.completed={source:'FotMob',minutes:600,matches:3,reportedPer90:40};q.metricContexts.completed={source:'FotMob',minutes:300,matches:3,reportedPer90:70};
 const before=JSON.stringify([a,b]),all=aggregate(a,b),row=all.players.find(r=>C.identity(r)===C.identity(p));assert.equal(all.players.length,32);assert.equal(all.teams.length,2);assert.equal(row.goals,5);assert.equal(row.minutes,900);assert.equal(M.metric(row,'goalsPer90'),0.5);assert.equal(M.metric(row,'completedPer90'),50);assert.equal(row.accuracy,70);assert.equal(row.competitionBreakdown.length,2);assert.equal(M.metric(row,'delta','90'),0.1);assert.equal(M.metric(row,'goalInvolvementsPer90'),0.7);assert.equal(JSON.stringify([a,b]),before);
 q.sourceRecords.FotMob.id='999';q.name=p.name;assert.equal(aggregate(a,b).players.length,33);
});
test('missing metrics, denominators and mismatched components cannot turn into zero or a cross-sample ratio',()=>{
 const a=data('laliga',600),b=data('champions-league',300),p=a.players[24],q=b.players[24];p.goals=0;q.goals=0;p.xg=0;q.xg=null;
 let row=aggregate(a,b).players.find(r=>C.identity(r)===C.identity(p));assert.equal(row.goals,0);assert.equal(row.xg,0);assert.equal(row.metricContexts.xg.coverage.known,1);assert.equal(M.total([row],'xg').complete,false);assert.equal(M.metric(row,'goalsPerXg'),null);
 q.goals=2;q.metricContexts.goals={source:'ESPN',matches:3,minutes:null};row=aggregate(a,b).players.find(r=>C.identity(r)===C.identity(p));assert.equal(row.goals,2);assert.equal(row.metricContexts.goals.minutes,null);assert.equal(M.metric(row,'goalsPer90'),0);assert.equal(M.context(row,'goalsPer90').minutes,600);assert.equal(M.context(row,'goalsPer90').coverage.known,1);assert.equal(M.metric(row,'goals','90'),0);assert.equal(M.metric(row,'goalsPerXg'),null);
});
test('known paired discipline survives another competition with unpaired cards without inventing red-card zeros',()=>{
 const a=data('laliga',600),b=data('champions-league',300);for(const p of a.players){p.yellowCards=2;p.redCards=0;for(const key of ['yellowCards','redCards'])p.metricContexts[key]={source:'FotMob',minutes:600,matches:3};}for(const p of b.players){p.yellowCards=1;p.redCards=null;p.metricContexts.yellowCards={source:'FotMob',minutes:300,matches:3};}
 const row=aggregate(a,b).players[0],fair=F.evaluate(row);assert.equal(row.yellowCards,3);assert.equal(row.redCards,0);assert.equal(fair.yellowCards,2);assert.equal(fair.minutes,600);assert.equal(fair.status,'verified');assert.equal(fair.contexts.yellowCards.coverage.known,1);assert.equal(fair.contexts.yellowCards.coverage.total,2);
});
test('canonical season scores and published positions agree in league, cup and aggregate views',()=>{
 const a=data('laliga',600),b=data('champions-league',300);b.players[24].pos='MED';const all=aggregate(a,b),canonical=S.build(all);
 for(const d of [a,b]){const aligned=C.alignPositions(d,all.players),model=S.build(aligned,{referencePlayers:all.players});for(const p of aligned.players){const match=all.players.find(q=>C.identity(q)===C.identity(p));assert.equal(p.pos,match.pos);assert.equal(model.players.get(p).score,canonical.players.get(match).score);assert.equal(model.players.get(p).profileKey,canonical.players.get(match).profileKey);}}
});
test('duplicate competition samples are rejected, goalkeeper conflicts stay separate and transfers are unassigned',()=>{
 const a=data('laliga',600),b=data('champions-league',300);assert.throws(()=>aggregate(a,{...b,metadata:{...b.metadata,league_key:'laliga'},players:b.players.map(p=>({...p,league_key:'laliga'}))}));
 b.players[0].pos='DEL';const conflict=aggregate(a,b);assert.equal(conflict.players.length,33);assert(conflict.players.filter(p=>C.identity(p)===C.identity(a.players[0])).every(p=>p.identityConflict));const model=S.build(conflict);assert(conflict.players.filter(p=>p.identityConflict).every(p=>model.players.get(p).score===null));
 b.players[24].sourceRecords.FotMob.team_id='99';const row=aggregate(a,b).players.find(p=>C.identity(p)===C.identity(a.players[24]));assert.equal(row.team_id,null);
});
test('aggregate dates retain the actual league and provider of every contribution',()=>{
 const a=data('laliga',600),b=data('champions-league',300);for(const p of b.players)p.metricContexts.goals.captured_at='2026-11-25T08:01:00Z';
 const all=aggregate(a,b);all.metadata.leagues=all.metadata.leagues.map(l=>({...l,name:l.id,sources:{FotMob:{imported_at:'2026-11-01T00:00:00Z'}}}));
 const rows=require('../dist/dates').snapshot(all);assert.equal(rows.find(r=>r.league==='champions-league').statistics.last,Date.parse('2026-11-25T08:01:00Z'));assert.equal(rows.find(r=>r.league==='laliga').statistics.last,Date.parse('2026-11-25T08:00:00Z'));
});
test('regenerated snapshots keep the same position evidence and canonical scores on subsequent aggregation',()=>{
 const a=data('laliga',600),b=data('champions-league',300);a.players[24].pos='—';const scopes=require('../dist/scopes'),reference=scopes.aggregate([a,b]),before=S.build(reference),generated=[a,b].map(d=>S.withScores(d,{referencePlayers:reference.players})),again=scopes.aggregate(generated),after=S.build(again);
 assert.equal(generated[0].players[24].seasonPosition.original_position,'—');for(const p of again.players){const original=reference.players.find(q=>C.identity(q)===C.identity(p));assert.equal(p.pos,original.pos);assert.equal(after.players.get(p).profileKey,before.players.get(original).profileKey);assert.equal(after.players.get(p).score,before.players.get(original).score);}
});
