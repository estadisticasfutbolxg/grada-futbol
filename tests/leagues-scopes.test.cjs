'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const leagues=require('../dist/leagues.js'),fotmob=require('../dist/fotmob.js'),espn=require('../dist/laliga.js'),combined=require('../dist/combined.js'),scopes=require('../dist/scopes.js'),radar=require('../dist/radar.js'),metrics=require('../dist/metrics.js');

function fixtures(id){
 const l=leagues.get(id),date='2026-11-07T08:00:00Z';
 const teams=Array.from({length:l.teams},(_,i)=>({id:String(500+i),name:'Isolated club '+i,matches:6,minutes:540,goals:6,conceded:6,xg:7,xga:6,points:12,clean:2,bigChances:12,shotsOnTargetPerMatch:4}));
 const players=teams.map((t,i)=>({...Object.fromEntries(fotmob.fields.map(k=>[k,null])),id:String(10000+i),name:'Isolated player '+i,team_id:t.id,team:t.name,pos:'MED',minutes:540,matches:6,passes:null,completed:null,accuracy:80,tackles:6,interceptions:3,recoveries:20,lineBreakingPasses:30,goals:1,assists:1,xg:2,xa:1,shots:null,shotsPer90:2,conversion:25,delta:-1,keypasses:null,progressive:null,xga:null,psxg:null,shotsOnTargetPer90:1,dribblesPer90:1,chancesCreated:10,bigChancesCreated:3,
  metricContexts:{completed:{source:'FotMob',reportedPer90:50,captured_at:date,minutes:540,matches:6},accuracy:{source:'FotMob',reportedValue:true,captured_at:date,minutes:540,matches:6},conversion:{source:'FotMob',reportedValue:true,captured_at:date,minutes:540,matches:6}}}));
 const f={metadata:{source:'FotMob',competition:l.name,league_key:l.id,season:l.season,season_id:l.fotmobSeason,league_id:l.fotmobId,profile:'full',imported_at:date,imported_matches:l.teams*3,available_matches:l.matches,notes:'Isolated test fixture, never served'},teams,players,matches:[]};
 const e={metadata:{source:'ESPN',competition:l.name,league_key:l.id,season:l.season,season_id:l.year,imported_at:date,imported_matches:l.teams*3,available_matches:l.matches,notes:'Isolated test fixture, never served'},teams:teams.map((t,i)=>({...t,id:String(1000+i),minutes:null,xg:null,xga:null})),players:players.map((p,i)=>({...p,id:'espn:'+i,team_id:String(1000+i),minutes:null,xg:null,xa:null,xga:null,psxg:null,shots:10,goals:9,assists:9,metricContexts:undefined})),matches:[]};
 return {f,e};
}

test('validates 18/20 teams, season identities, priority and source denominators',()=>{
 for(const id of ['premier-league','serie-a','bundesliga','ligue-1']){
  const {f,e}=fixtures(id);fotmob.validate(f);espn.validate(e);const d=combined.combine(f,e),p=d.players[0];
  assert.equal(d.teams.length,leagues.get(id).teams);assert.equal(p.goals,1);assert.equal(p.shots,10);assert.equal(p.metricContexts.shots.minutes,null);
  assert.equal(metrics.metric(p,'shots','90'),null);assert.equal(metrics.metric(p,'shotsPer90'),2);assert.equal(metrics.metric(p,'goalsPerXg'),0.5);assert.equal(p.conversion,25);
  f.players[0].goals=0;assert.equal(combined.combine(f,e).players[0].goals,0);
 }
 const a=fixtures('bundesliga'),b=fixtures('ligue-1');assert.throws(()=>combined.combine(a.f,b.e));a.f.metadata.season_id=2025;assert.throws(()=>combined.combine(a.f,a.e));
});

test('all leagues preserve IDs, source dates and immutable original snapshots',()=>{
 const a=fixtures('premier-league'),b=fixtures('serie-a');b.e.metadata.imported_at='2026-11-07T09:00:00Z';
 const input=[combined.combine(a.f,a.e),combined.combine(b.f,b.e)],before=JSON.stringify(input),d=scopes.aggregate(input);
 assert.equal(d.players.length,40);assert.equal(new Set(d.players.map(p=>p.id)).size,40);assert.equal(d.teams.length,40);
 assert(d.players.every(p=>d.teams.some(t=>t.id===p.team_id)));assert.equal(d.players[20].metricContexts.shots.captured_at,b.e.metadata.imported_at);
 assert.equal(d.metadata.scope,'all');assert.equal(JSON.stringify(input),before);assert.throws(()=>scopes.aggregate([input[0],input[0]]));assert.throws(()=>scopes.aggregate([d]));
});

test('midfield profiles use different axes, complete data and per-source sample limits',()=>{
 const {f,e}=fixtures('premier-league'),d=combined.combine(f,e),indices=radar.midfieldIndices(d.players),a=indices.get('MED_DEF'),b=indices.get('MED_ATT'),p=d.players[0];
 assert(a.get(p).axes.some(a=>a.key==='interceptions'));assert(!b.get(p).axes.some(a=>a.key==='interceptions'));assert(b.get(p).axes.some(a=>a.key==='xa'));
 assert(radar.rankingEligible(p,a.get(p),450));assert(radar.rankingEligible(p,b.get(p),450));
 p.interceptions=null;const partial=radar.midfieldIndices(d.players).get('MED_DEF').get(p);assert.equal(partial.comparableArea,null);
 p.interceptions=3;p.metricContexts.interceptions.minutes=100;const low=radar.midfieldIndices(d.players).get('MED_DEF').get(p);assert.equal(low.score,null);assert(!radar.rankingEligible(p,low,450));
});

test('team rankings aggregate player scores, while raw team differences retain signed values and source coverage',()=>{
 const {f,e}=fixtures('premier-league');Object.assign(f.teams[0],{conceded:0,xga:1,clean:4});Object.assign(f.teams[1],{conceded:12,xga:10,clean:1});
 const d=combined.combine(f,e);assert.throws(()=>radar.profiles(d.teams,{kind:'team',profileKey:'TEAM_DEFENSE'}));
 assert.equal(metrics.metric(d.teams[1],'goalDifferencePerMatch'),-6/6);assert.equal(metrics.metric(d.teams[1],'xgDifferencePerMatch'),-3/6);
 const team=d.teams[1];team.metricContexts.conceded.source='ESPN';assert.equal(metrics.metric(team,'goalDifferencePerMatch'),null);
 assert.equal(radar.rankingDefinitions.filter(d=>d.kind==='team'&&!d.aggregateProfile).length,1);assert.equal(radar.rankingDefinitions.filter(d=>d.aggregateProfile).length,5);assert.equal(radar.rankingDefinitions.filter(d=>d.kind==='player').length,5);
});
test('combined fields preserve their own minutes and matches after a later player profile changes the base sample',()=>{
 const {f,e}=fixtures('premier-league');f.players[0].metricContexts.tackles={source:'FotMob',minutes:100,matches:2,captured_at:f.metadata.imported_at};
 const p=combined.combine(f,e).players[0];assert.equal(p.minutes,540);assert.equal(p.metricContexts.tackles.minutes,100);assert.equal(p.metricContexts.tackles.matches,2);assert(Math.abs(metrics.metric(p,'tackles','90')-5.4)<1e-12);
});
