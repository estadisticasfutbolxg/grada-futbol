'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {combine}=require('../dist/combined.js'),{metric}=require('../dist/metrics.js');
// Offline archive tests; active source behavior is covered in active-sources.test.cjs.
const archivedLeagues=require('../dist/leagues.js');archivedLeagues.configure(archivedLeagues.list().map(l=>l.id==='laliga'?{...l,primary:'Understat',metricPriority:[...l.archivedMetricPriority]}:l));
function fixture(){
 const meta=source=>({source,competition:'LaLiga',season:'2026/27',season_id:2026,imported_at:'2026-11-01T12:00:00Z',imported_matches:20,available_matches:380,complete:false,notes:'Isolated test response, never served'});
 const teams=Array.from({length:20},(_,i)=>({id:String(i+1),name:'Club '+i,matches:2,minutes:180,goals:2,conceded:2,xg:2,xga:2}));
 const players=teams.map((t,i)=>({id:String(i+1),name:'Jugador '+i,team_id:t.id,team:t.name,pos:'POR',matches:2,minutes:180,goals:1,assists:1,xg:2,xa:1,shots:2,saves:null,conceded:null,xga:null,psxg:null}));
 const matches=Array.from({length:20},(_,i)=>({id:String(i+1),home_id:String((i%10)*2+1),away_id:String((i%10)*2+2),home_goals:1,away_goals:1,home_xg:1,away_xg:1}));
 const u={metadata:meta('Understat'),players,teams,matches};
 const e={metadata:meta('ESPN'),matches:[],teams:teams.map((t,i)=>({...t,id:String(101+i),minutes:null,xg:null,xga:null})),players:players.map((p,i)=>({...p,id:'espn:'+i,team_id:String(101+i),minutes:null,xg:null,xa:null,xga:null,psxg:null,goals:9,assists:9,saves:12,conceded:3}))};
 return {u,e};
}
test('keeps preferred metrics, refreshes more complete goals and uses own source denominators',()=>{
 const {u,e}=fixture(),before=JSON.stringify({u,e});e.players[0].matches=3;const original=JSON.stringify({u,e});
 const d=combine(u,e),p=d.players[0];
 assert.equal(d.players.length,u.players.length);assert.equal(p.goals,9);assert.equal(p.assists,1);assert.equal(p.saves,12);assert.equal(p.fieldSources.saves,'ESPN');
 assert.equal(p.matches,2);assert.equal(metric(p,'savesPerMatch'),4);assert.equal(metric(p,'saves','90'),null);
 assert.equal(metric(p,'goalsPerXg'),null);assert.equal(p.savepct,80);
 assert.equal(JSON.stringify({u,e}),original);assert(before.length>0);
 assert.equal(d.metadata.sources.Understat.imported_at,u.metadata.imported_at);
 assert(d.matches.every(m=>d.teams.some(t=>t.id===m.home_id)));
});
test('zeros keep priority and mismatched source ratios are unavailable',()=>{
 const {u,e}=fixture();u.players[0].goals=0;assert.equal(combine(u,e).players[0].goals,0);
 u.players[0].goals=null;const p=combine(u,e).players[0];assert.equal(p.goals,9);assert.equal(metric(p,'goalsPerXg'),null);
});
test('normalizes accents, rejects fuzzy name guesses, homonyms and team or role conflicts',()=>{
 let f=fixture();f.u.players[0].name='Álvaro García';f.e.players[0].name='Alvaro Garcia';assert.equal(combine(f.u,f.e).players[0].saves,12);
 f.e.players[0].name='Alfonso García';assert.equal(combine(f.u,f.e).players[0].saves,null);
 f=fixture();f.e.players.push({...f.e.players[0],id:'duplicate'});assert.equal(combine(f.u,f.e).players[0].saves,null);
 f=fixture();f.e.players[0].team_id='102';assert.equal(combine(f.u,f.e).players[0].saves,null);
 f=fixture();f.e.players[0].pos='DEF';assert.equal(combine(f.u,f.e).players[0].saves,null);
 f=fixture();f.u.players[0].team_id=null;assert.equal(combine(f.u,f.e).players[0].saves,null);
});
test('requires the authorized season and retains the oldest source date as capture date',()=>{
 const {u,e}=fixture();e.metadata.imported_at='2026-11-05T12:00:00Z';assert.equal(combine(u,e).metadata.imported_at,'2026-11-01T12:00:00.000Z');
 e.metadata.season='2025/26';assert.throws(()=>combine(u,e));
});

function fotmobFixture(u){
 const api=require('../dist/fotmob.js');
 return {metadata:{source:'FotMob',competition:'LaLiga',season:'2026/27',season_id:38843,league_id:87,imported_at:'2026-11-06T12:00:00Z'},teams:u.teams.map(t=>({...t})),players:u.players.map(p=>({
   ...Object.fromEntries(api.fields.map(k=>[k,null])),id:p.id,name:p.name,team_id:p.team_id,team:p.team,pos:p.pos,matches:10,minutes:700,
   passes:null,completed:null,accuracy:94.4,tackles:20,interceptions:null,recoveries:null,saves:99,prevented:-3,shotsOnTargetPer90:2.7,
   metricContexts:Object.fromEntries(['completed','accuracy','tackles','prevented','saves','shotsOnTargetPer90'].map(k=>[k,{source:'FotMob',matches:10,minutes:700,captured_at:'2026-11-06T12:00:00Z',...(k==='completed'?{reportedPer90:105.9}:k==='tackles'?{reportedPer90:2.6}:k==='accuracy'?{reportedValue:true}:{})}]))
 }))};
}
test('a published first-plus-last alias bridges an exact nickname identity without a fuzzy surname guess',()=>{
 const {u,e}=fixture(),f=fotmobFixture(u),espn=require('../dist/laliga.js');
 u.players[0].name='Nickname';e.players[0].name='Nickname';f.players[0].name='Published Fullname';
 assert.equal(combine(u,e,f).players[0].sourceRecords.FotMob,undefined);
 e.players[0].nameAliases=espn.athleteNames({displayName:'Nickname',firstName:'Published',lastName:'Fullname'});
 const p=combine(u,e,f).players[0];assert.equal(p.sourceRecords.FotMob.id,f.players[0].id);assert.equal(p.goals,u.players[0].goals);
 f.players.push({...f.players[0],id:'99999'});assert.equal(combine(u,e,f).players[0].sourceRecords.FotMob,undefined);
});
test('FotMob leads LaLiga metrics, including published rates and negative goals prevented without fabricating totals',()=>{
 const {u,e}=fixture(),f=fotmobFixture(u),before=JSON.stringify(f),p=combine(u,e,f).players[0];
 assert.equal(p.saves,99);assert.equal(p.fieldSources.saves,'FotMob');assert.equal(p.minutes,700);
 assert.equal(p.completed,null);assert.equal(p.passes,null);assert.equal(metric(p,'completedPer90'),105.9);
 assert.equal(p.accuracy,94.4);assert.equal(p.tackles,20);assert.equal(metric(p,'tackles','90'),2.6);
 assert.equal(p.metricContexts.tackles.minutes,700);assert.equal(p.metricContexts.tackles.captured_at,f.metadata.imported_at);
 assert.equal(metric(p,'prevented'),-3);assert.equal(metric(p,'shotsOnTargetPer90','90'),2.7);
 assert.equal(JSON.stringify(f),before);assert.equal(combine(u,e,f).metadata.combination.fotmob_matched_players,20);
 u.players[0].tackles=0;assert.equal(combine(u,e,f).players[0].tackles,20);f.players[0].tackles=0;assert.equal(combine(u,e,f).players[0].tackles,0);
});
test('FotMob rejects season mismatches, invented counts, and ambiguous matches',()=>{
 const {u,e}=fixture(),f=fotmobFixture(u);f.metadata.season_id=2025;assert.throws(()=>combine(u,e,f));f.metadata.season_id=38843;
 f.players[0].completed=823.66;assert.throws(()=>combine(u,e,f));f.players[0].completed=null;
 f.players[0].name='Otro nombre';assert.equal(combine(u,e,f).players[0].tackles,null);
 f.players[0].name=u.players[0].name;f.players.push({...f.players[0],id:'9999'});assert.equal(combine(u,e,f).players[0].tackles,null);
});

test('reviewed Mbappe identities bridge full-name variants and retain primary values and own coverage',()=>{
 const {u,e}=fixture();u.teams[0].name=e.teams[0].name='Real Madrid';
 Object.assign(u.players[0],{id:'3423',name:'Kylian Mbappe-Lottin',team:'Real Madrid',pos:'DEL'});
 Object.assign(e.players[0],{id:'86:231388',name:'Kylian Mbappé',team:'Real Madrid',pos:'DEL'});
 const f=fotmobFixture(u);Object.assign(f.players[0],{id:'701154',name:'Kylian Mbappé',pos:'—'});
 let p=combine(u,e,f).players[0];assert.equal(p.goals,1);assert.equal(p.tackles,20);assert.equal(p.sourceRecords.FotMob.id,'701154');assert.equal(p.metricContexts.tackles.minutes,700);
 assert.deepEqual(p.combination.match_methods,{ESPN:'verified_identity',FotMob:'verified_identity'});
 f.players[0].id='701155';assert.equal(combine(u,e,f).players[0].tackles,null);f.players[0].id='701154';
 f.players[0].name='Otro Mbappé';assert.equal(combine(u,e,f).players[0].tackles,null);f.players[0].name='Kylian Mbappé';
 f.players[0].team_id='2';assert.equal(combine(u,e,f).players[0].tackles,null);f.players[0].team_id='1';
 f.players[0].pos='POR';assert.equal(combine(u,e,f).players[0].tackles,null);
});
test('saves per 90 chooses a verified source cohort without mixing the ESPN total and another provider minutes',()=>{
 const {u,e}=fixture(),f=fotmobFixture(u);f.players[0].metricContexts.saves.minutes=600;
 let p=combine(u,e,f).players[0];assert.equal(p.saves,99);assert.equal(p.fieldSources.saves,'FotMob');assert(Math.abs(metric(p,'savesPer90')-99*90/600)<1e-12);assert.equal(p.metricContexts.savesPer90.source,'FotMob');assert.equal(p.metricContexts.savesPer90.minutes,600);assert.equal(p.metricContexts.savesPer90.captured_at,f.metadata.imported_at);
 f.players[0].metricContexts.saves.reportedPer90=14.9;p=combine(u,e,f).players[0];assert.equal(metric(p,'savesPer90'),14.9);assert.equal(metric(p,'savesPer90','90'),14.9);
 delete f.players[0].metricContexts.saves.reportedPer90;f.players[0].saves=0;p=combine(u,e,f).players[0];assert.equal(metric(p,'savesPer90'),0);assert.equal(p.saves,0);
 f.players[0].name='Unmatched test record';p=combine(u,e,f).players[0];assert.equal(metric(p,'savesPer90'),null);assert.equal(p.minutes,180);assert.equal(p.saves,12);
});
test('a unique exact ESPN identity can bridge a published full name to FotMob, without propagating ambiguous aliases',()=>{
 const {u,e}=fixture();u.players[0].name='Andrés Castrín';e.players[0].name='Andrés Castrín';e.players[0].nameAliases=['Andrés Castrín López'];
 const f=fotmobFixture(u);f.players[0].name='Andrés López';
 const row=combine(u,e,f).players[0];assert.equal(row.sourceRecords.FotMob.id,f.players[0].id);assert.equal(row.combination.match_methods.FotMob,'provider_alias_team');assert.equal(row.combination.match_evidence.FotMob.alias_bridge_source,'ESPN');assert.deepEqual(row.combination.match_evidence.FotMob.names,['Andrés Castrín López','Andrés López']);
 e.players.push({...e.players[0],id:'duplicate'});assert(!combine(u,e,f).players[0].sourceRecords.FotMob);
});

function freshGoalFixture(){
 const {u,e}=fixture();Object.assign(u.players[0],{pos:'DEL',goals:7,shots:25,xg:6.5,matches:10,minutes:769});Object.assign(e.players[0],{pos:'DEL',goals:8,matches:11});e.metadata.imported_at='2026-11-07T12:00:00Z';
 const f=fotmobFixture(u);Object.assign(f.players[0],{goals:8,shots:32,xg:7.02,assists:2,matches:12,minutes:930});
 for(const k of ['goals','shots','xg','assists','minutes','matches'])f.players[0].metricContexts[k]={source:'FotMob',captured_at:'2026-11-08T12:00:00Z',matches:12,minutes:930,profileVerified:true,reportedValue:true,league_key:'laliga'};
 return {u,e,f};
}
test('newer goal counts with non-regressing coverage replace the stale preferred count, using the field date and its own denominator',()=>{
 const leagues=require('../dist/leagues.js'),catalog=leagues.list();leagues.configure(catalog.map(l=>l.id==='laliga'?{...l,metricPriority:['Understat','ESPN','FotMob']}:l));try{
 const {u,e,f}=freshGoalFixture(),before=JSON.stringify({u,e,f}),p=combine(u,e,f).players[0];assert.equal(p.goals,8);assert.equal(p.fieldSources.goals,'FotMob');assert.equal(p.matches,10);assert.equal(p.minutes,769);assert.equal(p.metricContexts.goals.matches,12);assert.equal(p.metricContexts.goals.minutes,930);assert.equal(p.metricContexts.goals.captured_at,'2026-11-08T12:00:00Z');assert.equal(p.metricContexts.goals.selection.preferred_source,'Understat');assert.equal(metric(p,'goalsPer90'),8*90/930);
 assert.equal(p.conversion,25);assert.equal(p.xg,6.5);assert.equal(p.shots,25);assert(Math.abs(p.delta-.98)<1e-12);assert.equal(metric(p,'goalsPerXg'),8/7.02);assert.equal(metric(p,'goalInvolvements'),10);assert(Math.abs(metric(p,'goalInvolvementsPer90')-10*90/930)<1e-12);
 const ctx=require('../dist/metrics.js').context(p,'goalsPerXg');assert.equal(ctx.source,'FotMob');assert.deepEqual(ctx.componentValues,{goals:8,xg:7.02});assert.equal(p.metricContexts.conversion.fromSourceRecord,true);assert.equal(JSON.stringify({u,e,f}),before);
 }finally{leagues.configure(catalog);}
});
test('equal counters preserve priority; valid later corrections including zero are not replaced by a maximum goal count',()=>{
 const {u,e}=fixture();u.players[0].goals=8;e.players[0].goals=8;e.metadata.imported_at='2026-11-08T12:00:00Z';e.players[0].matches=3;let p=combine(u,e).players[0];assert.equal(p.fieldSources.goals,'Understat');assert(!p.metricContexts.goals.selection);
 e.players[0].goals=7;p=combine(u,e).players[0];assert.equal(p.goals,7);assert.equal(p.fieldSources.goals,'ESPN');
 e.players[0].goals=0;p=combine(u,e).players[0];assert.equal(p.goals,0);assert.equal(metric(p,'goals','90'),null);assert.equal(p.metricContexts.goals.minutes,null);
});
test('equal or older same-size samples, shrinking or unknown samples, future dates and foreign scopes retain priority',()=>{
 for(const update of [e=>e.metadata.imported_at='2026-10-31T12:00:00Z',e=>e.metadata.imported_at='2026-11-01T12:00:00Z',e=>e.players[0].matches=1,e=>e.players[0].matches=null,e=>e.players[0].metricContexts={goals:{source:'ESPN',captured_at:'2099-11-01T12:00:00Z',matches:3,minutes:null}},e=>e.players[0].metricContexts={goals:{source:'ESPN',captured_at:'2026-11-08T12:00:00Z',matches:3,minutes:null,league_key:'serie-a'}}]){
  const {u,e}=fixture();e.metadata.imported_at='2026-11-08T12:00:00Z';e.players[0].matches=2;update(e);assert.equal(combine(u,e).players[0].goals,1);
 }
});
test('field timestamps outrank aggregate timestamps and ambiguous identities do not supply refreshed goals',()=>{
 const {u,e,f}=freshGoalFixture();f.metadata.imported_at='2026-11-20T12:00:00Z';f.players[0].metricContexts.goals.captured_at='2026-10-31T12:00:00Z';f.players[0].metricContexts.goals.matches=11;f.players[0].goals=15;let p=combine(u,e,f).players[0];assert.equal(p.goals,8);assert.equal(p.fieldSources.goals,'ESPN');assert.equal(metric(p,'goalsPer90'),null);
 e.players.push({...e.players[0],id:'duplicate-goals'});f.players.push({...f.players[0],id:'999999'});p=combine(u,e,f).players[0];assert.equal(p.goals,7);assert.equal(p.fieldSources.goals,'Understat');
});
test('refreshed goals never borrow an incompatible original xG, shot or assist sample',()=>{
 const {u,e,f}=freshGoalFixture();for(const k of ['xg','shots','assists'])f.players[0].metricContexts[k].minutes=900;const p=combine(u,e,f).players[0];assert.equal(p.goals,8);assert.equal(p.conversion,null);assert.equal(p.delta,null);assert.equal(metric(p,'goalsPerXg'),null);assert.equal(metric(p,'goalInvolvements'),null);assert.equal(metric(p,'goalsPer90'),8*90/930);
});
test('refresh and cache reload retain accepted newer goals when the preferred provider fails',async()=>{
 const {u,e,f}=freshGoalFixture(),refresh=require('../dist/refresh.js'),league=require('../dist/leagues.js').get('laliga'),oldE=structuredClone(e),oldF=structuredClone(f);oldE.metadata.imported_at=u.metadata.imported_at;oldE.players[0].goals=7;oldF.players[0].goals=7;oldF.players[0].metricContexts.goals.captured_at='2026-11-02T12:00:00Z';
 const before={understat:u,espn:oldE,fotmob:oldF,combined:combine(u,oldE,oldF)},result=await refresh.refresh(before,league,{fetchers:{understat:async()=>{throw Error('isolated unavailable source');},espn:async()=>e,fotmob:async()=>f},combine:s=>combine(s.understat,s.espn,s.fotmob)});
 assert(!result.failed.includes('understat'));assert(!result.checked.includes('understat'));assert.equal(result.state.combined.players[0].goals,8);const restored=refresh.selectCapture(result.state.fotmob,oldF,'fotmob',league);assert.equal(combine(u,e,restored).players[0].goals,8);assert.equal(refresh.report(before,result).players.modified.filter(p=>p.id===before.combined.players[0].id).length,1);
});

test('retrieving a shorter stale season today cannot regress a more complete known goal sample',()=>{
 const {u,e,f}=freshGoalFixture();u.metadata.imported_at='2026-11-22T12:00:00Z';const p=combine(u,e,f).players[0];assert.equal(p.goals,8);assert.equal(p.metricContexts.goals.source,'FotMob');assert.equal(p.metricContexts.goals.matches,12);assert(!p.metricContexts.goals.selection);assert.equal(p.metricContexts.goals.captured_at,'2026-11-08T12:00:00Z');
});

test('an inconsistent own shot count cannot create a conversion percentage above one hundred',()=>{
 const {u,e,f}=freshGoalFixture();f.players[0].shots=3;const p=combine(u,e,f).players[0];assert.equal(p.goals,8);assert.equal(p.conversion,null);
});

test('fresh team goals use nominal ninety-minute matches while player minutes remain unknown',()=>{
 const {u,e}=fixture();e.metadata.imported_at='2026-11-08T12:00:00Z';Object.assign(e.teams[0],{goals:4,matches:3,conceded:2,minutes:null});Object.assign(e.teams[1],{goals:2,matches:3,conceded:4,minutes:null});e.metadata.imported_matches=21;Object.assign(e.players[0],{goals:4,matches:3,minutes:null});const d=combine(u,e),t=d.teams[0],p=d.players[0];
 assert.equal(t.goals,4);assert.equal(t.minutes,180);assert.equal(t.metricContexts.goals.minutes,270);assert.equal(t.metricContexts.goals.minutes_derived,'team_nominal_90');assert(Math.abs(metric(t,'goalsPer90')-4/3)<1e-12);assert.equal(metric(t,'goalsPerMatch'),4/3);assert.equal(metric(t,'goalDifferencePerMatch'),2/3);assert.equal(t.sourceRecords.ESPN.minutes,null);assert.equal(p.metricContexts.goals.minutes,null);assert.equal(metric(p,'goalsPer90'),null);
});

test('FotMob priority preserves catalog identities, raw captures, fallback fields and independent samples',()=>{
 const {u,e,f}=freshGoalFixture(),original=JSON.stringify({u,e,f});
 f.players[0].xa=null;delete f.players[0].metricContexts.xa;u.players[0].keypasses=4;
 const before=JSON.stringify({u,e,f}),data=combine(u,e,f),p=data.players[0];
 assert.equal(p.id,'combined:'+u.players[0].id);assert.equal(p.minutes,930);assert.equal(p.matches,12);assert.equal(p.xg,7.02);assert.equal(p.fieldSources.xg,'FotMob');
 assert.equal(p.xa,u.players[0].xa);assert.equal(p.fieldSources.xa,'Understat');assert.equal(p.metricContexts.xa.minutes,769);assert.equal(p.keypasses,4);assert.equal(p.fieldSources.keypasses,'Understat');
 assert.equal(metric(p,'xg','90'),7.02*90/930);assert.equal(metric(p,'xa','90'),u.players[0].xa*90/769);
 assert.equal(data.metadata.catalog_source,'Understat');assert.equal(data.metadata.primary_source,'FotMob');assert.deepEqual(data.metadata.metric_priority,['FotMob','Understat','ESPN']);assert.equal(data.metadata.understat_refresh,false);
 assert.equal(JSON.stringify({u,e,f}),before);assert(original.length>0);
 f.players[0].xg=0;f.players[0].xa=0;const zero=combine(u,e,f).players[0];assert.equal(zero.xg,0);assert.equal(zero.xa,0);assert.equal(zero.fieldSources.xa,'FotMob');
 const without=combine(u,e);assert.equal(without.players[0].xg,u.players[0].xg);assert.equal(without.metadata.primary_source,'Understat');
 f.players[0].xg=null;f.players[0].metricContexts.xg.reportedPer90=0.7;
 const total=combine(u,e,f).players[0];assert.equal(total.xg,u.players[0].xg);assert.equal(total.fieldSources.xg,'Understat');assert(Math.abs(metric(total,'xg','90')-u.players[0].xg*90/u.players[0].minutes)<1e-12,'a rate-only provider cannot erase a known total or lend its minutes');
});

test('general refresh skips paused Understat while retaining it, and configuration can reactivate the same integration',async()=>{
 const {u,e,f}=freshGoalFixture(),refresh=require('../dist/refresh.js'),league=require('../dist/leagues.js').get('laliga');
 const state={understat:u,espn:e,fotmob:f,combined:combine(u,e,f)},calls=[];
 const options={fetchers:{understat:async()=>{calls.push('understat');return u;},espn:async()=>{calls.push('espn');return e;},fotmob:async()=>{calls.push('fotmob');return f;}},combine:s=>combine(s.understat,s.espn,s.fotmob)};
 const result=await refresh.refresh(state,league,options);assert.deepEqual(calls.sort(),['espn','fotmob']);assert.strictEqual(result.state.understat,u);assert.deepEqual(result.checked,['espn','fotmob']);assert.deepEqual(refresh.sources(league),['espn','fotmob','understat']);
 calls.length=0;await refresh.refresh(state,{...league,understatRefresh:true},options);assert(calls.includes('understat'));
});

test('a missing FotMob component retains the entire backup conversion cohort, while conflicting FotMob samples remain unknown',()=>{
 const {u,e,f}=freshGoalFixture();Object.assign(u.players[0],{goals:0,shots:2,minutes:212,matches:8});Object.assign(e.players[0],{goals:0,matches:8});Object.assign(f.players[0],{goals:0,shots:null,minutes:268,matches:9});
 delete f.players[0].metricContexts.shots;for(const key of ['goals','minutes','matches'])Object.assign(f.players[0].metricContexts[key],{minutes:268,matches:9});
 const p=combine(u,e,f).players[0];assert.equal(p.goals,0);assert.equal(p.fieldSources.goals,'FotMob');assert.equal(p.conversion,0);assert.equal(p.fieldSources.conversion,'Understat');assert.equal(p.metricContexts.conversion.minutes,212);assert.equal(p.metricContexts.conversion.matches,8);assert.deepEqual(p.metricContexts.conversion.componentValues,{goals:0,shots:2});
 const known=freshGoalFixture();known.f.players[0].metricContexts.shots.minutes=900;assert.equal(combine(known.u,known.e,known.f).players[0].conversion,null,'present components with conflicting samples must not be disguised by fallback');
});
