'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fotmob=require('../dist/fotmob'),refresh=require('../dist/refresh'),leagues=require('../dist/leagues'),{harness}=require('./helpers/app-harness.cjs');
const {snapshots}=require('./helpers/league-snapshots.cjs');
function captures(){
 const {f}=snapshots('laliga'),old=structuredClone(f),fresh=structuredClone(f);old.metadata.imported_at='2026-11-24T12:00:00Z';fresh.metadata.imported_at='2026-11-10T12:00:00Z';
 for(const [data,date,value]of [[old,'2026-11-10T12:00:00Z',null],[fresh,'2026-11-25T08:00:00Z',3]])for(const t of data.teams){t.xg=value;t.xga=value;t.metricContexts={...t.metricContexts,matches:{source:'FotMob',captured_at:date,minutes:t.minutes,matches:t.matches},...(value===null?{}:{xg:{source:'FotMob',captured_at:date,minutes:t.minutes,matches:t.matches}})};}
 return {old,fresh};
}
test('newer player aggregates cannot erase independently newer team captures or their denominators',()=>{
 const {old,fresh}=captures();
 const before=JSON.stringify(old),next=refresh.selectCapture(fresh,old,'fotmob',leagues.get('laliga'));assert.equal(next.teams[0].xg,3);assert.equal(next.teams[0].metricContexts.xg.minutes,fresh.teams[0].minutes);assert.equal(JSON.stringify(old),before);assert.strictEqual(fotmob.restoreTeams(fresh,old),fresh);
 const wrong=structuredClone(fresh);wrong.teams[0].id='999999';assert.strictEqual(fotmob.restoreTeams(old,wrong),old);
});
test('navigation renders the visible table or comparator without rebuilding hidden views',()=>{
 const h=harness(),calls=[];h.run("data=fixture;loaded=true;updateRadarProfiles=()=>{};renderDataDates=()=>{};syncPositions=()=>{};renderClubOptions=()=>{};renderTeamComparison=()=>{};renderTerms=()=>calls.push('terms');renderTable=()=>calls.push('table');renderCompare=()=>calls.push('compare')",{calls,fixture:require('./helpers/explore.cjs').fixture()});
 h.run("navigate('glossary',false);navigate('players',false);navigate('compare',false)");assert.deepEqual(calls,['terms','table','compare']);
});
test('Worker cached captures recover the newer published team sample before serving JSON',async()=>{
 const {old,fresh}=captures(),worker=require('../worker/app.cjs'),{gzipSync}=require('node:zlib'),origin='https://team-capture.test',path='/downloads/fotmob-laliga-2026-27.json';
 const key=worker.apiKey(origin,'fotmob','laliga'),cache={match:async input=>input===key?new Response(JSON.stringify(old)):undefined,put:async()=>{}};
 const assets={[path]:{type:'application/json',sha:'team-capture-fixture',gzip:gzipSync(JSON.stringify(fresh)).toString('base64')}};
 const response=await worker.handle(new Request(origin+path),assets,{cache}),body=await response.json();assert.equal(response.status,200);assert.equal(body.teams[0].xg,3);assert.equal(body.teams[0].metricContexts.xg.captured_at,'2026-11-25T08:00:00Z');
});
