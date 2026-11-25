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
 for(const [pos,weight] of [['DEF',0.05],['DEL',0.35]]){
  const peers=fieldPlayers(pos);
  const other=fieldPlayers(pos==='DEF'?'DEL':'DEF').map(p=>({...p,goals:99,assists:99,xg:99,xa:99}));
  const baseline=peers[0],initial=radar.profile(baseline,peers);
  assert.equal(initial.attack.maxWeight,weight);
  for(const key of ['goals','assists','xg','xa']){
   const player={...baseline,[key]:10},alone=radar.profile(player,peers),mixed=radar.profile(player,[...peers,...other]);
   assert.equal(mixed.score,alone.score);
   assert.equal(mixed.area,initial.area);
   const result=mixed.attack.entries.find(entry=>entry.key===key);
   assert.deepEqual(result,{key,value:1,percentile:100,referenceCount:6,weight:weight/4});
   assert(Math.abs(mixed.score-initial.score-weight/4*(1-(1/12)**2))<1e-12);
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
 assert.equal(profile.attack.usedWeight,0.025);
 const expected=profile.area*0.975+0.0125*(1+(assists.percentile/100)**2);
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
