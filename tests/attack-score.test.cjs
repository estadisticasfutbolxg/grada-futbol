'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const radar=require('../dist/radar.js'),scores=require('../dist/scores.js');

function fieldPlayers(pos){
 return Array.from({length:6},(_,i)=>({
  id:pos+i,pos,team_id:'1',minutes:900,matches:10,
  goals:i,assists:i,xg:i,xa:i,tackles:i,interceptions:i,clearances:i,blocks:i,recoveries:i,
  completedPer90:i,shotsOnTargetPer90:i,dribblesPer90:i,conversion:i,shots:i,
 }));
}

test('each attack metric affects the score in its own position and respects the defensive weight cap',()=>{
 for(const pos of ['DEF','DEL']){
  const peers=fieldPlayers(pos);
  const other=fieldPlayers(pos==='DEF'?'DEL':'DEF').map(p=>({...p,goals:99,assists:99,xg:99,xa:99}));
  const baseline=peers[0],initial=radar.profile(baseline,peers);
  assert.equal(initial.attack.maxWeight,radar.attackWeights[pos]);
  for(const key of ['goals','assists','xg','xa']){
   const player={...baseline,[key]:10},alone=radar.profile(player,peers),mixed=radar.profile(player,[...peers,...other]);
   assert.equal(mixed.score,alone.score);
   assert.equal(mixed.area,initial.area);
   const weight=radar.weightCalibration.byProfile[pos].weights[key];
   const result=mixed.attack.entries.find(entry=>entry.key===key);
   assert.deepEqual(result,{key,value:1,percentile:100,referenceCount:6,weight});
   assert(Math.abs(mixed.score-initial.score-weight*(1-(1/12)**2))<1e-12);
  }
 }
});

test('verified sample minutes govern offensive ranks, retain real zeros and return missing weight to the radar',()=>{
 const peers=fieldPlayers('DEF'),player={...peers[2],goals:4,assists:0,xg:null,xa:8,
  metricContexts:{goals:{minutes:200},assists:{minutes:900},xa:{minutes:199}}};
 const profile=radar.profile(player,peers);
 const [goals,assists,xg,xa]=profile.attack.entries;
 assert.equal(goals.value,1.8);assert.equal(goals.percentile,100);
 assert.equal(assists.value,0);assert(assists.percentile>0);
 assert.equal(xg.percentile,null);assert.equal(xa.percentile,null);
 const w=radar.weightCalibration.byProfile.DEF.weights;assert.equal(profile.attack.usedWeight,w.goals+w.assists);
 const expected=profile.area*(1-w.goals-w.assists)+w.goals+w.assists*(assists.percentile/100)**2;
 assert(Math.abs(profile.baseScore-expected)<1e-12);
 const noAttack=radar.profile(player,peers.map((p,i)=>i<2?{...p,minutes:199}:p));
 assert.equal(noAttack.attack.usedWeight,0);
 const keepers=peers.map(p=>({...p,pos:'POR',savepct:90,saves:30,conceded:10}));
 const keeper=radar.profile(keepers[0],keepers);
 assert.equal(keeper.attack,null);assert.equal(keeper.score,keeper.area);
 assert.equal(radar.profile({...keepers[0],goals:999,assists:999,xg:999,xa:999},keepers).score,keeper.score);
 const data={players:peers,teams:[{id:'1',matches:10}]};
 const model=scores.build(data);
 assert(['goals','assists','xg','xa'].every(key=>scores.rankingAxes(model,radar.definition('DEF')).includes(key)));
});

test('the original attacking axes remain visible without promoting fallback shots to a requirement',()=>{
 const peers=fieldPlayers('DEL'),player={...peers[2],shots:null};
 const profile=radar.profile(player,peers);
 assert(Number.isFinite(profile.score));
 assert.deepEqual(profile.expectedAxes,['shotsOnTargetPer90','dribblesPer90','conversion']);
 assert.deepEqual(profile.displayAxes.map(a=>a.key),['goals','xg','shotsOnTargetPer90','xa','dribblesPer90','conversion','assists']);
 assert(!profile.missingAxes.includes('shots'));
 const changed=radar.profile({...player,goals:10},peers);
 assert.equal(changed.area,profile.area,'attack cannot enter the non-attack area');
 const goal=changed.attack.entries.find(a=>a.key==='goals'),oldGoal=profile.attack.entries.find(a=>a.key==='goals');
 assert(Math.abs(changed.score-profile.score-goal.weight*((goal.percentile/100)**2-(oldGoal.percentile/100)**2))<1e-12);
 assert.notEqual(changed.displayArea,profile.displayArea,'the restored visible axis still changes shape');
});

test('fullbacks retain defensive and attacking vision, optional attack does not invalidate their score',()=>{
 const peers=fieldPlayers('DEF').map(p=>({...p,sourceRecords:{FotMob:{id:p.id,team_id:p.team_id,pos:'DEF',tacticalPositions:['LB'],tacticalContext:{source:'FotMob',identityVerified:true,player_id:p.id,team_id:p.team_id,captured_at:'2026-11-25T10:00:00Z'}}}}));
 const player=peers[2],profile=radar.profile(player,peers);
 assert.deepEqual(profile.displayAxes.map(a=>a.key),['tackles','interceptions','recoveries','goals','xg','xa','assists']);
 assert.equal(profile.attack.maxWeight,radar.attackWeights.DEF_FB);
 const missing=radar.profile({...player,assists:null,xg:null},peers);
 assert(Number.isFinite(missing.score));assert.deepEqual(missing.displayMissingAxes,['xg','assists']);
 const w=radar.weightCalibration.byProfile.DEF_FB.weights;assert.equal(missing.attack.usedWeight,w.goals+w.xa);
 assert(!missing.displayAxes.some(a=>['xg','assists'].includes(a.key)));
 const zeros=radar.profile({...player,goals:0,assists:0,xg:0,xa:0},peers);
 assert.equal(zeros.displayAxes.filter(a=>radar.attackKeys.includes(a.key)&&a.value===0).length,4);
});

test('every outfield profile shows goals and assists while goalkeepers retain their original axes',()=>{
 for(const key of ['DEF','MED','MED_DEF','MED_ATT','DEL']){
  const pos=key.startsWith('MED')?'MED':key;
  const peers=fieldPlayers(pos).map((p,i)=>({...p,accuracy:80+i,lineBreakingPasses:i,chancesCreated:i,bigChancesCreated:i}));
  const roles=new Map(peers.map(p=>[p,key])),profiles=radar.profiles(peers,{midfieldRoles:roles});
  for(const profile of profiles.values()){
   assert(Number.isFinite(profile.score),key);
   assert(profile.displayAxes.some(a=>a.key==='goals'),key+' goals');
   assert(profile.displayAxes.some(a=>a.key==='assists'),key+' assists');
   assert(!profile.axes.some(a=>radar.attackKeys.includes(a.key)),key+' attack counted twice');
  }
 }
 const keepers=fieldPlayers('POR').map(p=>({...p,savepct:80,saves:20,conceded:5}));
 const keeper=radar.profile(keepers[0],keepers);
 assert.deepEqual(keeper.displayAxes,keeper.axes);
 assert(!keeper.displayAxes.some(a=>radar.attackKeys.includes(a.key)));
});

test('approved Fantasy weights preserve distinct positive magnitudes for each metric and position',()=>{
 const w=radar.weightCalibration.byProfile;
 assert(Math.abs(w.DEF.weights.goals-0.17368364711912673)<1e-12);
 assert(Math.abs(w.DEF.weights.assists-0.05048474909765729)<1e-12);
 assert.equal(w.DEF.directions.assists,-1);assert(w.DEF.weights.assists>0);
 assert.notEqual(w.DEF.weights.goals,w.DEL.weights.goals);
 assert(Object.isFrozen(w.DEF.weights));
 for(const p of Object.values(w)){assert(Object.values(p.weights).every(v=>v>=0));assert(Object.values(p.weights).reduce((s,v)=>s+v,0)<1);}
});
