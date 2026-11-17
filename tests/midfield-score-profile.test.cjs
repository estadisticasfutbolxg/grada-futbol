'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const radar=require('../dist/radar.js'),scores=require('../dist/scores.js'),scopes=require('../dist/scopes.js'),metrics=require('../dist/metrics.js');
function fixture(league='a'){
 const players=Array.from({length:12},(_,i)=>{const attack=i+1,defense=12-i;return {id:String(i),name:'Isolated midfielder '+i,team_id:'1',team:'Isolated team',pos:'MED',minutes:900,matches:10,xa:attack,chancesCreated:attack,bigChancesCreated:attack,shotsOnTargetPer90:attack,dribblesPer90:attack,goals:attack,completed:defense*100,completedPer90:defense*10,accuracy:60+defense,recoveries:defense,tackles:defense,interceptions:defense,lineBreakingPasses:defense};});
 return {metadata:{kind:'combined',league_key:league,competition:league,source:'Isolated fixture only',imported_at:'2026-11-17T18:00:00Z',imported_matches:10,available_matches:380,combination:{matched_players:0},sources:{}},players,teams:[{id:'1',name:'Isolated team',matches:10}],matches:[]};
}
test('the declared midfield profile chooses the axes of its single score before ranking and team averaging',()=>{
 const data=fixture(),model=scores.build(data),attacker=data.players.at(-1),defender=data.players[0],balanced=data.players[5];
 assert.equal(model.roles.get(attacker),'MED_ATT');assert.equal(model.roles.get(defender),'MED_DEF');assert.equal(model.roles.get(balanced),'MED_BALANCED');
 const attack=model.players.get(attacker),defense=model.players.get(defender),balance=model.players.get(balanced);
 assert.deepEqual(attack.expectedAxes,['xa','chancesCreated','bigChancesCreated','shotsOnTargetPer90','dribblesPer90','goals']);
 assert.deepEqual(defense.expectedAxes,['completedPer90','accuracy','recoveries','tackles','interceptions','lineBreakingPasses']);
 assert.deepEqual(balance.expectedAxes,['completedPer90','xa','chancesCreated','recoveries','tackles','interceptions']);
 for(const p of data.players){
  const profile=model.players.get(p);assert.equal(profile.profileKey,model.roles.get(p));assert.equal(profile.score,radar.relativeArea(profile.axes.map(a=>a.percentile)));
  assert.equal(radar.profile(p,data.players).profileKey,profile.profileKey);assert.equal(radar.profile(p,data.players).score,profile.score);
  for(const key of ['MED_ATT','MED_DEF','MED_BALANCED'])assert.equal(scores.value(model,p,radar.definition(key)),profile.score);
  const member=model.overall.teams.get('1').players.find(m=>m.id===p.id);assert.equal(member.area,profile.score);assert.equal(member.scoreProfile,profile.profileKey);
 }
 const total=model.overall.teams.get('1');assert.equal(total.area,data.players.reduce((sum,p)=>sum+model.players.get(p).score*p.minutes,0)/total.minutes);
});
test('profile decisions, axis references and scores agree between a league, all leagues and reversed input order',()=>{
 const a=fixture('a'),b=fixture('b');b.players.forEach((p,i)=>{p.xa+=i/10;});
 const reference=scopes.aggregate([a,b]),all=scores.build(reference),local=scores.build(a,{referencePlayers:reference.players}),reversed=scores.build({...a,players:[...a.players].reverse()},{referencePlayers:reference.players});
 for(const p of a.players){
  const joined=reference.players.find(q=>q.id==='a:'+p.id);assert.equal(local.roles.get(p),all.roles.get(joined));assert.equal(local.players.get(p).profileKey,all.players.get(joined).profileKey);assert.deepEqual(local.players.get(p).expectedAxes,all.players.get(joined).expectedAxes);assert.equal(local.players.get(p).score,all.players.get(joined).score);assert.equal(local.players.get(p).score,reversed.players.get(p).score);
 }
 const def=radar.definition('MED_ATT'),keys=scores.rankingAxes(local,def);assert(keys.includes('bigChancesCreated'));assert(keys.includes('recoveries'),'balanced candidates retain their own radar');assert(!keys.includes('accuracy'),'the first midfielder must not select all table axes');assert.deepEqual(keys,scores.rankingAxes(reversed,def));
 const generated=scores.withScores(a,{referencePlayers:reference.players});assert.equal(generated.metadata.derived_metrics.playerScore.method,'role_radar_area_v3');assert(generated.players.every((p,i)=>p.scoreProfile===local.players.get(a.players[i]).profileKey&&p.playerScore===local.players.get(a.players[i]).score));
});
test('unknown profiles are explicit general scores and do not fabricate subgroup membership; zeros stay valid',()=>{
 const data=fixture(),p=data.players.at(-1);p.bigChancesCreated=null;let model=scores.build(data);
 assert.equal(model.roles.get(p),null);assert.equal(model.players.get(p).profileKey,'MED');assert.match(model.players.get(p).profileLabel,/sin clasificar/);assert(Number.isFinite(model.players.get(p).score));assert(!scores.eligible(model,p,radar.definition('MED_ATT')));assert(!scores.eligible(model,p,radar.definition('MED_DEF')));
 p.metricContexts={xa:{source:'Isolated fixture only',minutes:100,matches:2}};model=scores.build(data);assert.equal(model.players.get(p).score,null);assert(model.players.get(p).insufficientSamples.some(a=>a.key==='xa'));
 delete p.metricContexts;
 for(const key of ['xa','chancesCreated','bigChancesCreated','shotsOnTargetPer90','dribblesPer90','goals','completed','completedPer90','accuracy','recoveries','tackles','interceptions','lineBreakingPasses'])p[key]=0;
 const references=fixture().players.filter(q=>q.id!==p.id);model=scores.build(data,{referencePlayers:references});assert.equal(model.roles.get(p),'MED_BALANCED');assert.equal(model.players.get(p).score,0);assert(model.overall.teams.get('1').players.find(m=>m.id===p.id).included);
});
test('rendered radar shows the same declared offensive profile, offensive axes and single score',()=>{
 const data=fixture(),model=scores.build(data),p=data.players.at(-1),profile=model.players.get(p),root={GradaRadar:radar,GradaMetrics:metrics};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist/components.js'),'utf8'),{window:root});
 const html=root.GradaComponents.radar(p,data.players,data.metadata,profile);assert.match(html,/Centrocampista · perfil ofensivo/);assert.match(html,/Grandes ocasiones/);assert(!html.includes('Intercepciones'));assert(html.includes(new Intl.NumberFormat('es-ES',{minimumFractionDigits:3,maximumFractionDigits:3}).format(profile.score)));
});
test('all leagues discards stale score profile hints from generated snapshots without changing its sources',()=>{
 const data=fixture();data.players.at(-1).scoreProfile='MED_DEF';data.players.at(-1).scoreProfileLabel='Stale defensive hint';
 const all=scopes.aggregate([data]),p=all.players.at(-1);assert(!Object.hasOwn(p,'scoreProfile'));assert(!Object.hasOwn(p,'scoreProfileLabel'));assert.equal(scores.build(all).players.get(p).profileKey,'MED_ATT');assert.equal(data.players.at(-1).scoreProfile,'MED_DEF');
});
