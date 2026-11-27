'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{harness}=require('./helpers/app-harness.cjs'),leagues=require('../dist/leagues'),{snapshots}=require('./helpers/league-snapshots.cjs');
function setup(){const h=harness();h.context.AbortSignal=AbortSignal;h.context.setTimeout=fn=>setTimeout(fn,0);return h;}
test('transient capture failures retry once while invalid payloads are not retried',async()=>{
 const h=setup();let calls=0,validations=0;
 h.context.fetch=async()=>++calls===1?new Response('',{status:503}):new Response('{"value":1}');
 const value=await h.run("readCapture('isolated.json',check)",{check:v=>{validations++;return v;}});
 assert.equal(value.value,1);assert.equal(calls,2);assert.equal(validations,1);
 calls=0;h.context.fetch=async()=>{calls++;return new Response('{"invalid":true}');};
 await assert.rejects(h.run("readCapture('isolated.json',()=>{throw new TypeError('Invalid schema');})"),/Invalid schema/);assert.equal(calls,1);
});
test('failed published source can use a validated saved capture but published-only mode refuses that fallback',async()=>{
 const {f,e}=snapshots('laliga'),h=setup();let combinations=0;
 h.context.fetch=async url=>url.includes('fotmob-')?new Response('',{status:404}):new Response(JSON.stringify(e));
 h.run("captureStore.get=async(id,key)=>key==='fotmob'?backup:null;joinSources=state=>combine(state)",{backup:f,combine:state=>{combinations++;return {metadata:{source:'isolated'},players:state.fotmob.players,teams:state.fotmob.teams};}});
 const result=await h.run("loadLeague(GradaLeagues.get('laliga'))");assert.equal(result.state.fotmob.metadata.imported_at,f.metadata.imported_at);assert.equal(result.fallbacks.join(','),'FotMob');assert.equal(combinations,1);assert.equal(h.run('datasets.size'),0,'one league does not publish half of a batch');
 const wrong=structuredClone(f);wrong.metadata.league_key='premier-league';h.run('captureStore.get=async()=>backup',{backup:wrong});await assert.rejects(h.run("loadLeague(GradaLeagues.get('laliga'))"),/No hay captura válida/);
 let savedReads=0;
 const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'../dist/app.js'),'utf8');
 const sandbox={GradaRefresh:h.context.GradaRefresh,GradaLeagues:leagues,AbortSignal,fetch:async()=>new Response('',{status:404}),captureStore:{get:async()=>{savedReads++;return f;}},setTimeout,paintLoadingProgress:async()=>{},Error,
  joinSources:()=>{throw Error('Should not reach combined');},localStorage:{getItem:()=>null},cacheKey:()=>''};
 require('node:vm').runInNewContext('const publishedCapture=true;'+source.slice(source.indexOf('async function readCapture('),source.indexOf('async function loadLeagues('))+';this.load=loadLeague;',sandbox);
 await assert.rejects(sandbox.load(leagues.get('laliga')),/No hay captura válida/);assert.equal(savedReads,0);

});
test('league loads are bounded, partial failures remain retryable, and retry restores the full catalog',async()=>{
 const h=setup(),ids=leagues.list().map(l=>l.id),target=ids[3];let active=0,maxActive=0,fail=true,calls=0;
 h.run("loadLeague=load;activateLeague=id=>{currentLeague=id;loaded=true;};currentLeague='all';",{load:async l=>{calls++;active++;maxActive=Math.max(maxActive,active);await new Promise(resolve=>setTimeout(resolve,2));active--;if(fail&&l.id===target)throw Error('Temporary isolated failure');return {state:{combined:{metadata:{league_key:l.id},players:[],teams:[]}},fallbacks:[]};}});
 await h.run('loadLeagues(ids)',{ids});assert.equal(h.run('datasets.size'),17);assert.equal(h.run('loadIssues.size'),1);assert.equal(maxActive,3);assert.equal(h.node('#load-progress-bar').value,18);assert.equal(h.node('#load-progress-count').textContent,'18 / 18 · 100 %');
 h.run("finishLoadingProgress('Done',loadingSummary())");assert.equal(h.node('#load-retry').hidden,false);assert(h.node('#load-progress-detail').textContent.includes(leagues.get(target).name));assert.equal(h.node('#league-options').labels.length,18);
 fail=false;await h.run('retryLeagueLoads()');assert.equal(h.run('datasets.size'),18);assert.equal(h.run('loadIssues.size'),0);assert.equal(calls,19);assert.equal(h.node('#load-retry').hidden,true);assert.equal(h.run('currentLeague'),'all');assert.equal(h.node('#league-options').labels.filter(l=>l.input.disabled).length,0);
});
test('loading and retry cannot start another refresh or duplicate their own work',async()=>{
 const h=setup();let calls=0,release;const gate=new Promise(resolve=>release=resolve);
 h.run("loaded=true;loadIssues.set('laliga',{backup:false,text:'isolated'});loadLeague=load;readProvider=()=>{throw Error('Refresh must stay idle');};",{load:async()=>{calls++;await gate;return {state:{combined:{metadata:{league_key:'laliga'},players:[],teams:[]}},fallbacks:[]};}});
 const running=h.run("loadLeagues(['laliga'])");await new Promise(resolve=>setTimeout(resolve,3));await h.run('retryLeagueLoads()');await h.run('refreshData()');assert.equal(calls,1);release();await running;assert.equal(h.run('loadingCaptures'),false);
});
test('the initial HTML exposes an indeterminate progress indicator before JavaScript loads',()=>{
 const html=require('node:fs').readFileSync(require('node:path').join(__dirname,'../dist/index.html'),'utf8'),panel=html.match(/<section id="load-progress"[^>]*>/)?.[0],bar=html.match(/<progress id="load-progress-bar"[^>]*>/)?.[0];
 assert(panel);assert(!/\bhidden\b/.test(panel));assert(panel.includes('aria-busy="true"'));assert(bar);assert(!/\bvalue=/.test(bar));assert(bar.includes('aria-describedby="load-progress-detail"'));assert(html.includes('Iniciando GRADA…'));
});

test('background tabs do not block loading while animation frames are suspended',async()=>{
 const h=setup();h.context.requestAnimationFrame=()=>{};await h.run('paintLoadingProgress()');
});
test('source progress and a complete refresh clear a resolved backup notice',async()=>{
 const {f,e}=snapshots('laliga'),h=setup();
 h.run("loaded=true;initialLoadsComplete=true;currentLeague='laliga';datasets.set('laliga',{espn:e,fotmob:f,understat:null,combined:GradaCombined.combine(f,e)});loadIssues.set('laliga',{backup:true,text:'FotMob'});readProvider=read;joinSources=state=>GradaCombined.combine(state.fotmob,state.espn);captureStore.set=async()=>true;activateLeague=()=>{};",{e,f,read:async key=>key==='espn'?e:f});
 await h.run('refreshData()');assert.equal(h.run('loadIssues.size'),0);assert.equal(h.node('#load-progress-bar').value,2);assert.equal(h.node('#load-progress-bar').max,2);assert.equal(h.node('#load-retry').hidden,true);assert.equal(h.node('#load-progress').hidden,true);assert(h.node('#refresh-status').textContent.includes('Fuentes consultadas: 2/2'));
});

test('a missing published source and an incompatible newer saved peer still recover a valid source combination',async()=>{
 const {f,e}=snapshots('laliga'),h=setup(),newer=structuredClone(f);newer.metadata.imported_at='2026-11-27T10:00:00Z';newer.fixtureIncomplete=true;
 h.context.fetch=async url=>url.includes('fotmob-')?new Response(JSON.stringify(f)):new Response('',{status:404});
 h.run("captureStore.get=async(id,key)=>key==='fotmob'?newer:e;joinSources=state=>{if(state.fotmob.fixtureIncomplete)throw Error('Missing combined metric family');return{metadata:{league_key:'laliga'},players:state.fotmob.players,teams:state.fotmob.teams};}",{newer,e});
 const result=await h.run("loadLeague(GradaLeagues.get('laliga'))");assert.equal(result.state.fotmob.metadata.imported_at,f.metadata.imported_at);assert.equal(result.state.espn.metadata.imported_at,e.metadata.imported_at);assert.equal(result.fallbacks.join(','),'ESPN');
});
