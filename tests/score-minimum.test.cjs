'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const radar=require('../dist/radar.js'),scores=require('../dist/scores.js'),fairplay=require('../dist/fairplay.js');
function fixture(){
 const players=['POR','DEF','MED','DEL'].flatMap(pos=>Array.from({length:8},(_,i)=>({id:pos+i,pos,team_id:'t',minutes:900,matches:10,goals:i,xg:i,xa:i,shots:i+1,conversion:i,shotsOnTargetPer90:i,dribblesPer90:i,completedPer90:i,accuracy:i,recoveries:i,tackles:i,interceptions:i,clearances:i,blocks:i,savepct:i,saves:i,conceded:i,prevented:i,highClaims:i,sweeperActions:i,lineBreakingPasses:i,chancesCreated:i,bigChancesCreated:i})));
 return {metadata:{},players,teams:[{id:'t',matches:10}],matches:[]};
}
test('200 is inclusive for every position, with zero metrics and weighted team membership',()=>{
 for(const position of ['POR','DEF','MED','DEL'])for(const minutes of [199,200,201]){
  const data=fixture(),p=data.players.find(p=>p.pos===position);p.minutes=minutes;
  const model=scores.build(data),profile=model.players.get(p),eligible=minutes>=200;
  assert.equal(Number.isFinite(profile.score),eligible,position+' at '+minutes);
  assert.equal(profile.minimumMinutes,200);assert.equal(profile.baseSampleEnough,eligible);
  assert.equal(scores.eligible(model,p,radar.definition(position)),eligible);
  assert.equal(scores.eligible(model,p,radar.definition(position),0),eligible,'lower filter cannot bypass the scoring threshold');
  assert.equal(model.units.get(position).teams.get('t').players.find(q=>q.id===p.id).included,eligible);
  if(eligible){assert.equal(profile.missingAxes.length,0);assert(profile.axes.some(a=>a.value===0),'published zero is valid');}
 }
});
test('own metric coverage and reference membership also change exactly at 200 minutes',()=>{
 const data=fixture(),p=data.players.find(p=>p.pos==='DEL');
 const sample=minutes=>({source:'Isolated test',minutes,matches:3});
 p.metricContexts={dribblesPer90:sample(199)};
 let model=scores.build(data);assert.equal(model.players.get(p).score,null);assert.equal(model.players.get(p).axes.find(a=>a.key==='dribblesPer90').referenceCount,7);
 p.metricContexts.dribblesPer90=sample(200);model=scores.build(data);
 assert(Number.isFinite(model.players.get(p).score));assert.equal(model.players.get(p).axes.find(a=>a.key==='dribblesPer90').referenceCount,8);
 assert(!scores.eligible(model,p,radar.definition('DEL'),201),'a stricter user filter still respects own metric minutes');
 p.dribblesPer90=null;assert.equal(scores.build(data).players.get(p).score,null,'missing is not zero');
});
test('fullbacks and paired discipline use the same 200 minute rule without changing the penalty formula',()=>{
 for(const minutes of [199,200,201]){
  const data=fixture();for(const p of data.players.filter(p=>p.pos==='DEF'))p.sourceRecords={FotMob:{id:p.id,team_id:'t',pos:'DEF',tacticalPositions:['LB'],tacticalContext:{source:'FotMob',identityVerified:true,player_id:p.id,team_id:'t',captured_at:'2026-11-20T12:00:00Z'}}};
  const p=data.players.find(p=>p.pos==='DEF');p.minutes=minutes;
  const profile=scores.build(data).players.get(p);assert.equal(profile.profileKey,'DEF_FB');assert.equal(Number.isFinite(profile.score),minutes>=200);
  for(const pos of ['POR','DEF','MED','DEL']){
   const ctx={source:'Isolated test',minutes,matches:3},record={pos,minutes:900,yellowCards:1,redCards:1,metricContexts:{yellowCards:ctx,redCards:ctx}};
   const result=fairplay.evaluate(record);assert.equal(result.status,minutes>=200?'verified':'insufficient_sample');
   if(minutes>=200)assert(Math.abs(result.factor-(1-0.1*11*90/minutes))<1e-12);
  }
 }
});
test('keeper axis appearances never replace the verified 200 player minutes',()=>{
 const data=fixture(),keepers=data.players.filter(p=>p.pos==='POR');
 for(const p of keepers)p.metricContexts=Object.fromEntries(['saves','conceded','savepct','prevented','highClaims','sweeperActions'].map(key=>[key,{source:'Isolated test',minutes:null,matches:2}]));
 const p=keepers[0];p.minutes=200;let model=scores.build(data);assert(Number.isFinite(model.players.get(p).score));assert(scores.eligible(model,p,radar.definition('POR')));assert(!scores.eligible(model,p,radar.definition('POR'),201));
 for(const minutes of [199,null]){p.minutes=minutes;model=scores.build(data);assert.equal(model.players.get(p).score,null);assert(!scores.eligible(model,p,radar.definition('POR')));assert(!radar.explain(model.players.get(p)).includes('o 2 PJ de su fuente'));}
});
test('browser modules share the rule; ranking defaults, exported metadata and KPI defaults stay coherent',()=>{
 const root={GradaMetrics:require('../dist/metrics.js'),GradaRoles:require('../dist/roles.js')};
 for(const name of ['sampling','fairplay','radar'])vm.runInNewContext(fs.readFileSync(__dirname+'/../dist/'+name+'.js','utf8'),{window:root});
 assert.equal(root.GradaRadar.minimumScoreMinutes,200);assert(root.GradaRadar.rankingDefinitions.filter(d=>d.kind==='player').every(d=>d.minimum===200));assert.equal(root.GradaRadar.definition('MED').minimum,200);
 const metadata=scores.withScores(fixture()).metadata.derived_metrics.playerScore;assert.equal(metadata.method,'role_fairplay_radar_v10');assert.deepEqual(metadata.minimum_minutes,{POR:200,DEF:200,MED:200,DEL:200});
 const html=fs.readFileSync(__dirname+'/../dist/index.html','utf8');assert(html.indexOf('src="sampling.js"')<html.indexOf('src="fairplay.js"'));assert.match(html,/id="ranking-min"[^>]*value="200"/);assert(!/mínimo (450|180) min/.test(html));assert.match(html,/id="leader-field-min"[^>]*value="450"/);assert.match(html,/id="leader-saves-min"[^>]*value="180"/);
});
