'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),radar=require('../dist/radar.js'),scores=require('../dist/scores.js'),metrics=require('../dist/metrics.js'),scopes=require('../dist/scopes.js');
function fixture(league='a',offset=0){
 const players=['POR','DEF','MED','DEL'].flatMap((pos,group)=>Array.from({length:8},(_,i)=>({id:pos+i,name:pos+i,team_id:i<4?'1':'2',team:'Team',pos,minutes:600+i*50,matches:10,goals:i+1+offset,xg:i+2,xa:i+1,shots:10+i,conversion:10+i,shotsOnTargetPer90:1+i/10,dribblesPer90:i+1,completedPer90:40+i,accuracy:70+i,recoveries:30+i,tackles:10+i,interceptions:5+i,clearances:10+i,blocks:3+i,savepct:60+i,saves:20+i,conceded:10-i,prevented:i,highClaims:3+i,sweeperActions:4+i,lineBreakingPasses:10+i,chancesCreated:3+i,bigChancesCreated:2+i})));
 return {metadata:{kind:'combined',league_key:league,competition:league,imported_at:'2026-11-09T00:00:00Z',imported_matches:10,available_matches:380,combination:{matched_players:0},sources:{}},players,teams:[{id:'1',name:'One',matches:10},{id:'2',name:'Two',matches:10}],matches:[]};
}
test('a player has one position score regardless of requested midfield ranking or league filter',()=>{
 const a=fixture('a'),b=fixture('b',5),reference=scopes.aggregate([a,b]),all=scores.build(reference),local=scores.build(a,{referencePlayers:reference.players});
 for(const p of a.players){
  const joined=reference.players.find(q=>q.id==='a:'+p.id);
  assert.equal(local.players.get(p).score,all.players.get(joined).score);
  for(const profileKey of ['MED_ATT','MED_DEF','DEF'])assert.equal(radar.profiles(a.players,{referencePlayers:reference.players,profileKey}).get(p).score,local.players.get(p).score);
 }
 const before=JSON.stringify(a),output=scores.withScores(a,{referencePlayers:reference.players});
 assert.equal(JSON.stringify(a),before);assert(output.players.every((p,i)=>p.playerScore===local.players.get(a.players[i]).score));
});
test('team and positional scores use the exact player scores, weights and membership, with no independent defense index',()=>{
 const data=fixture(),model=scores.build(data),definition=radar.definition('TEAM_DEFENSE');
 assert.equal(definition.aggregateProfile,'DEF');
 for(const [key,summary] of [...model.units,['OVERALL',model.overall]])for(const [id,team] of summary.teams){
  const included=team.players.filter(p=>p.included);
  if(!included.length){assert.equal(team.area,null);continue;}
  assert(Math.abs(team.area-included.reduce((sum,p)=>sum+p.area*p.minutes,0)/included.reduce((sum,p)=>sum+p.minutes,0))<1e-12);
  assert(team.area>=Math.min(...included.map(p=>p.area))-1e-12);assert(team.area<=Math.max(...included.map(p=>p.area))+1e-12);
  for(const member of included){const p=data.players.find(p=>String(p.id)===member.id);assert.equal(member.area,model.players.get(p).score);if(key==='DEF')assert.equal(p.pos,'DEF');}
 }
 for(const team of data.teams){const profile=model.teams.get(team);assert.equal(profile.score,model.overall.teams.get(team.id).area);assert.equal(profile.axes.find(a=>a.key==='DEF').value,model.units.get('DEF').teams.get(team.id).area);assert.equal(scores.value(model,team,definition),model.units.get('DEF').teams.get(team.id).area);}
});
test('incomplete axes or insufficient own/provider minutes leave the same score pending in teams and player rankings',()=>{
 const data=fixture(),p=data.players.find(p=>p.pos==='DEF');p.blocks=null;
 let model=scores.build(data);assert.equal(model.players.get(p).score,null);assert(Number.isFinite(model.players.get(p).area));assert.equal(model.units.get('DEF').teams.get('1').players.find(m=>m.id===p.id).included,false);
 p.blocks=3;p.minutes=100;model=scores.build(data);assert.equal(model.players.get(p).score,null);assert(!scores.eligible(model,p,radar.definition('DEF'),0));
 p.minutes=600;p.metricContexts={tackles:{source:'Verified test only',minutes:100,matches:2}};model=scores.build(data);assert.equal(model.players.get(p).score,null);
});
test('midfield profiles select candidates without replacing their MED score, and unknown roles stay unknown',()=>{
 const data=fixture(),model=scores.build(data);
 for(const p of data.players.filter(p=>p.pos==='MED'))for(const key of ['MED_ATT','MED_DEF']){
  assert.equal(scores.value(model,p,radar.definition(key)),model.players.get(p).score);
  const belongs=model.roles.get(p)===key||model.roles.get(p)==='MED_BALANCED';assert.equal(scores.eligible(model,p,radar.definition(key)),belongs);
 }
 const p=data.players.find(p=>p.pos==='MED');p.bigChancesCreated=null;const unknown=scores.build(data);assert.equal(unknown.roles.get(p),null);assert(!scores.eligible(unknown,p,radar.definition('MED_ATT')));
});
test('totals keep known values and real zero with explicit partial coverage, without inventing absent numbers',()=>{
 assert.deepEqual(metrics.total([{saves:3},{saves:0},{saves:null},{saves:'4'}],'saves'),{value:3,known:2,total:4,complete:false});
 assert.deepEqual(metrics.total([{assists:0}],'assists'),{value:0,known:1,total:1,complete:true});assert.equal(metrics.total([{assists:null}],'assists').value,null);assert.equal(metrics.total([],'saves').value,null);
});
test('keeper appearance fallback is consistent in score and ranking, while missing minutes never become team weights',()=>{
 const data=fixture();for(const p of data.players)if(p.pos==='POR')p.minutes=null;
 const model=scores.build(data),p=data.players.find(p=>p.pos==='POR');assert.notEqual(model.players.get(p).score,null);assert(scores.eligible(model,p,radar.definition('POR')));assert(!scores.eligible(model,p,radar.definition('POR'),900));assert.equal(model.units.get('POR').teams.get('1').area,null);
});
