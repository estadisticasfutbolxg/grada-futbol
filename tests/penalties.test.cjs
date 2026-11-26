'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{gzipSync}=require('node:zlib');
const F=require('../dist/fotmob'),M=require('../dist/metrics'),R=require('../dist/refresh'),L=require('../dist/leagues'),P=require('../worker/providers.cjs'),{snapshots}=require('./helpers/league-snapshots.cjs');
function captures(){
 const {f}=snapshots('laliga'),old=structuredClone(f),fresh=structuredClone(f);
 old.metadata.imported_at='2026-11-25T10:00:00Z';fresh.metadata.imported_at='2026-11-10T10:00:00Z';
 fresh.metadata.pages={...fresh.metadata.pages,penalty_conceded:{captured_at:'2026-11-26T07:00:00Z',url:'https://www.fotmob.com/leagues/87/stats/season/38843/players/penalty_conceded/laliga'}};
 const p=fresh.players[0];p.penaltiesCommitted=0;p.metricContexts.penaltiesCommitted={source:'FotMob',minutes:null,matches:13,captured_at:'2026-11-26T07:00:00Z',url:fresh.metadata.pages.penalty_conceded.url};
 return {old,fresh};
}
test('penalty counts retain verified zero without borrowing older player minutes or changing other fields',()=>{
 const {old,fresh}=captures(),p=fresh.players[0];F.validate(fresh);
 assert.equal(M.metric(p,'penaltiesCommitted'),0);assert.equal(M.metric(p,'penaltiesCommitted','90'),null);
 const original=JSON.stringify(old),restored=R.selectCapture(old,fresh,'fotmob',L.get('laliga'));
 assert.equal(restored.players[0].penaltiesCommitted,0);assert.equal(restored.metadata.pages.penalty_conceded.captured_at,'2026-11-26T07:00:00Z');assert.equal(JSON.stringify(old),original);
 assert.equal(restored.players[0].minutes,old.players[0].minutes);
 const wrong=structuredClone(fresh);wrong.players[0].team_id='999';assert.equal(F.restorePenalties(old,wrong).players[0].penaltiesCommitted,old.players[0].penaltiesCommitted);
 for(const invalid of [-1,1.5]){const bad=structuredClone(fresh);bad.players[0].penaltiesCommitted=invalid;assert.throws(()=>F.validate(bad));}
 assert.deepEqual(M.total([{penaltiesCommitted:0},{penaltiesCommitted:null}],'penaltiesCommitted'),{value:0,known:1,total:2,complete:false});
});
test('penalty season overrides require explicit 2026/27 identity and permit verified empty rankings',()=>{
 const l=L.get('bundesliga'),season=l.fotmobStatSeasons.penalty_conceded;
 const d={currentSeasonId:season,currentStatName:'penalty_conceded',type:'players',leagueDetails:{id:l.fotmobId},seasons:[{id:season,name:'2026/2027'}],statsData:[]};
 const html=()=>'<script id="__NEXT_DATA__">'+JSON.stringify({props:{pageProps:{data:d}}})+'</script>';
 assert.deepEqual(P.parseFotmob(html(),'penalty_conceded',l),{statsData:[]});d.currentSeasonId=l.fotmobSeason;assert.throws(()=>P.parseFotmob(html(),'penalty_conceded',l));
});
test('Worker recovery preserves the independently newer penalty capture ahead of a cached source',async()=>{
 const {old,fresh}=captures(),worker=require('../worker/app.cjs'),origin='https://penalty-capture.test',path='/downloads/fotmob-laliga-2026-27.json';
 const key=worker.apiKey(origin,'fotmob','laliga'),cache={match:async input=>input===key?new Response(JSON.stringify(old)):undefined,put:async()=>{}};
 const assets={[path]:{type:'application/json',sha:'penalty-fixture',gzip:gzipSync(JSON.stringify(fresh)).toString('base64')}};
 const response=await worker.handle(new Request(origin+path),assets,{cache}),body=await response.json();assert.equal(response.status,200);assert.equal(body.players[0].penaltiesCommitted,0);assert.equal(body.players[0].metricContexts.penaltiesCommitted.minutes,null);
});
test('penalties add half a red-card weight using their own sample without making unknowns clean or scores pending',()=>{
 const FP=require('../dist/fairplay'),cards={source:'FotMob',minutes:900,matches:10,captured_at:'2026-11-26T07:00:00Z'},pen={...cards,minutes:1800,matches:20};
 const p={minutes:3000,yellowCards:5,redCards:1,penaltiesCommitted:1,metricContexts:{yellowCards:cards,redCards:cards,penaltiesCommitted:pen}},base={score:0.8,minimumMinutes:200};
 const result=FP.apply(p,base);assert(Math.abs(result.fairPlay.penaltiesPenaltyFraction-0.025)<1e-12);assert(Math.abs(result.score-0.8*(1-0.15-0.025))<1e-12);
 assert.equal(result.fairPlay.penaltyWeight,5);assert.equal(result.fairPlay.method,'linear_cards_penalties_v3');
 const noPenalty={...p,penaltiesCommitted:null};assert.equal(FP.apply(noPenalty,base).score,0.8*0.85);
 for(const minutes of [null,199]){const missing={...p,metricContexts:{...p.metricContexts,penaltiesCommitted:{...pen,minutes}}};assert.equal(FP.apply(missing,base).score,FP.apply(noPenalty,base).score);assert.equal(FP.evaluate(missing).penaltiesStatus,'insufficient_sample');}
 const onlyPenalty={...p,yellowCards:null};assert(Math.abs(FP.apply(onlyPenalty,base).score-0.8*0.975)<1e-12);assert.equal(FP.evaluate(onlyPenalty).cardsStatus,'unavailable');
 assert.equal(FP.apply(p,{...base,score:null}).score,null);assert.equal(FP.apply({...p,penaltiesCommitted:1000},base).score,0);
});
