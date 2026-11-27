'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),profiles=require('../dist/profiles'),refresh=require('../dist/refresh'),leagues=require('../dist/leagues'),{snapshots}=require('./helpers/league-snapshots.cjs');
const oldAt='2026-11-08T18:26:45Z',newAt='2026-11-26T06:58:31Z',league=leagues.get('laliga');
const context=(at,minutes,matches,extra={})=>({source:'FotMob',captured_at:at,minutes,matches,...extra});
function fixture(){
 const previous=snapshots('laliga').f,current=structuredClone(previous),old=previous.players[0],next=current.players[0];previous.metadata.imported_at=oldAt;current.metadata.imported_at=newAt;
 Object.assign(old,{pos:'DEL',minutes:771,matches:12,goals:7,shots:26,xg:3.35,conversion:7/26*100,delta:3.65,metricContexts:{goals:context(oldAt,771,12,{profileVerified:true,reportedValue:true}),shots:context(oldAt,771,12,{profileVerified:true,reportedValue:true}),xg:context(oldAt,771,12,{profileVerified:true,reportedValue:true}),conversion:context(oldAt,771,12,{profileVerified:true,reportedValue:false,derived:'profile_counts'}),delta:context(oldAt,771,12,{profileVerified:true,reportedValue:false,derived:'profile_counts'})}});
 Object.assign(next,{pos:'—',minutes:861,matches:13,goals:7,shots:null,xg:3.9,conversion:26.9,delta:3.1,metricContexts:{goals:context(newAt,861,13,{reportedValue:true}),xg:context(newAt,861,13,{reportedValue:true}),conversion:context(newAt,861,13,{reportedValue:true,url:'https://www.fotmob.com/leagues/87/stats/season/38843/players/total_scoring_att/laliga'}),delta:context(newAt,861,13,{reportedValue:true})}});
 return{previous,current,old,next};
}
test('restoring older verified shots preserves independently published conversion with its own sample and exact context',()=>{
 const {previous,current,next}=fixture(),before=JSON.stringify({previous,current}),own=structuredClone(next.metricContexts.conversion),result=profiles.restore(current,previous).players[0];
 assert.equal(result.shots,26);assert.equal(result.metricContexts.shots.minutes,771);assert.equal(result.goals,7);assert.equal(result.metricContexts.goals.minutes,861);assert.equal(result.conversion,26.9);assert.deepEqual(result.metricContexts.conversion,own);assert.notEqual(result.conversion,result.goals/result.shots*100);assert.equal(result.pos,'DEL');assert.equal(JSON.stringify({previous,current}),before);
 const selected=refresh.selectCapture(previous,current,'fotmob',league).players[0];assert.equal(selected.conversion,26.9);assert.deepEqual(selected.metricContexts.conversion,own);
});
test('applying a verified count from a different sample also preserves direct conversion and signed published difference',()=>{
 const {current,next}=fixture();next.xg=null;next.delta=-0.4;const conversion=structuredClone(next.metricContexts.conversion),delta=structuredClone(next.metricContexts.delta),profile={id:next.id,team_id:next.team_id,pos:'—',captured_at:oldAt,values:{shots:26,xg:3.35},contexts:{shots:context(oldAt,771,12,{profileVerified:true,reportedValue:true}),xg:context(oldAt,771,12,{profileVerified:true,reportedValue:true})}};
 const result=profiles.apply(current,[profile]).players[0];assert.equal(result.shots,26);assert.equal(result.xg,3.35);assert.equal(result.conversion,26.9);assert.deepEqual(result.metricContexts.conversion,conversion);assert.equal(result.delta,-0.4);assert.deepEqual(result.metricContexts.delta,delta);assert.notEqual(result.delta,result.goals-result.xg);
});
test('a direct published zero is valid and its own small sample is retained for score eligibility to decide later',()=>{
 const {previous,current,next}=fixture();next.conversion=0;next.metricContexts.conversion.minutes=90;next.metricContexts.conversion.matches=1;
 const own=structuredClone(next.metricContexts.conversion),result=profiles.restore(current,previous).players[0];assert.equal(result.conversion,0);assert.deepEqual(result.metricContexts.conversion,own);assert.equal(result.metricContexts.conversion.minutes,90);
});
test('stale derived ratios and incomplete or incompatible reported provenance are still invalidated on changed components',()=>{
 const mutations=[c=>c.reportedValue=false,c=>{c.derived='profile_counts';},c=>delete c.reportedValue,c=>c.source='ESPN',c=>c.minutes=null,c=>c.matches=null,c=>c.matches=1.5,c=>c.captured_at='invalid'];
 for(const mutate of mutations){const {previous,current,next}=fixture();mutate(next.metricContexts.conversion);const result=profiles.restore(current,previous).players[0];assert.equal(result.conversion,null);assert.equal(result.metricContexts.conversion,undefined);}
 for(const value of [-1,101,NaN]){const {previous,current,next}=fixture();next.conversion=value;const result=profiles.restore(current,previous).players[0];assert.equal(result.conversion,null);assert.equal(result.metricContexts.conversion,undefined);}
});
test('compatible changed components still derive a fresh value and preserve the established priority behavior',()=>{
 const {current,next}=fixture(),at='2026-11-27T10:00:00Z',profile={id:next.id,team_id:next.team_id,pos:'DEL',captured_at:at,values:{goals:8,shots:32},contexts:{goals:context(at,861,13,{profileVerified:true,reportedValue:true}),shots:context(at,861,13,{profileVerified:true,reportedValue:true})}};
 const result=profiles.apply(current,[profile]).players[0];assert.equal(result.conversion,25);assert.equal(result.metricContexts.conversion.reportedValue,false);assert.equal(result.metricContexts.conversion.derived,'profile_counts');assert.equal(result.metricContexts.conversion.minutes,861);assert.equal(result.metricContexts.conversion.captured_at,at);
});

test('paired zero counts never turn an explicit published zero into unknown or invent zero from 0/0',()=>{
 for(const reported of [true,false]){
  const {current,next}=fixture(),at='2026-11-27T10:00:00Z';next.conversion=reported?0:null;next.metricContexts.conversion=reported?context(newAt,861,13,{reportedValue:true}):undefined;
  const profile={id:next.id,team_id:next.team_id,pos:'DEL',captured_at:at,values:{goals:0,shots:0},contexts:{goals:context(at,861,13,{profileVerified:true,reportedValue:true}),shots:context(at,861,13,{profileVerified:true,reportedValue:true})}};
  const result=profiles.apply(current,[profile]).players[0];assert.equal(result.conversion,reported?0:null);
  if(reported)assert.deepEqual(result.metricContexts.conversion,next.metricContexts.conversion);else assert.equal(result.metricContexts.conversion,undefined);
 }
});

test('a compatible older restored pair cannot overwrite a newer independently published percentage',()=>{
 const {previous,current,next}=fixture();next.goals=null;delete next.metricContexts.goals;next.conversion=25;const own=structuredClone(next.metricContexts.conversion);
 const restored=profiles.restore(current,previous).players[0];assert.equal(restored.goals,7);assert.equal(restored.shots,26);assert.equal(restored.conversion,25);assert.deepEqual(restored.metricContexts.conversion,own);
 const profile={id:next.id,team_id:next.team_id,pos:'DEL',captured_at:oldAt,values:{goals:7,shots:26},contexts:{goals:context(oldAt,771,12,{profileVerified:true,reportedValue:true}),shots:context(oldAt,771,12,{profileVerified:true,reportedValue:true})}};
 const applied=profiles.apply(current,[profile]).players[0];assert.equal(applied.conversion,25);assert.deepEqual(applied.metricContexts.conversion,own);
 profile.captured_at=newAt;profile.contexts.goals=context(newAt,861,13,{profileVerified:true,reportedValue:true});profile.contexts.shots=context(newAt,861,13,{profileVerified:true,reportedValue:true});const sameDate=profiles.apply(current,[profile]).players[0];assert.equal(sameDate.conversion,7/26*100);assert.equal(sameDate.metricContexts.conversion.reportedValue,false);
});
