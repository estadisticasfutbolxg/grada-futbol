'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),profiles=require('../dist/profiles.js'),metrics=require('../dist/metrics.js'),radar=require('../dist/radar.js');
function keeperHTML(){
 const stat=(key,value,format='number')=>({localizedTitleId:key,statValue:String(value),statFormat:format});
 const shots=Array.from({length:3},(_,i)=>({id:i+1,teamId:2,homeTeamId:1,awayTeamId:2,isOwnGoal:false,isOnTarget:true,period:'FirstHalf',matchDate:'2026-08-21T19:00:00Z',expectedGoals:[0.2,0.3,0.1][i],expectedGoalsOnTarget:[0.5,0.7,0.8][i]}));
 const d={id:10,primaryTeam:{teamId:1},positionDescription:{primaryPosition:{key:'keeper_long'}},mainLeague:{leagueId:87,season:'2026/2027',stats:[{localizedTitleId:'minutes_played',value:90},{localizedTitleId:'matches_uppercase',value:1}]},statSeasons:[{seasonName:'2026/2027',tournaments:[{tournamentId:87}]}],firstSeasonStats:{statsSection:{items:[{items:[stat('saves',2),stat('goals_conceded',1),stat('successful_passes',20),stat('successful_passes_accuracy',80,'percent')]}]},keeperShotmap:shots}};
 return {data:d,html:()=>'<script id="__NEXT_DATA__">'+JSON.stringify({props:{pageProps:{data:d}}})+'</script>'};
}
test('verified keeper profiles provide published passes and received xGOT with complete shot coverage',()=>{
 const fixture=keeperHTML(),p={id:'10',team_id:'1'},r=profiles.parse(fixture.html(),p,'laliga','2026-11-08T12:00:00Z');
 assert.equal(r.values.completed,20);assert(!Object.hasOwn(r.values,'passes'));assert.equal(r.values.psxg,2);assert(Math.abs(r.values.xgaOnTarget-0.6)<1e-12);assert.equal(r.contexts.psxg.pairedConceded,1);assert.equal(r.contexts.psxg.matches,1);
 fixture.data.firstSeasonStats.keeperShotmap.pop();const incomplete=profiles.parse(fixture.html(),p,'laliga','2026-11-08T12:00:00Z');assert(!Object.hasOwn(incomplete.values,'psxg'));assert.equal(incomplete.values.completed,20);
 fixture.data.mainLeague.leagueId=42;const identityOnly=profiles.parse(fixture.html(),p,'laliga','2026-11-08T12:00:00Z');assert.deepEqual(identityOnly.values,{});assert.equal(identityOnly.scope,'position_only');
});
test('xGOT efficiency uses its paired goals and own coverage, preserving negative performance and unknown denominators',()=>{
 const record={psxg:10,conceded:99,metricContexts:{psxg:{source:'FotMob',minutes:900,matches:10,pairedConceded:5}}};
 assert.equal(metrics.metric(record,'psxgEfficiency'),50);assert.equal(metrics.metric(record,'psxgPerMatch'),1);assert.equal(metrics.metric(record,'psxg90'),1);
 record.metricContexts.psxg.pairedConceded=15;assert.equal(metrics.metric(record,'psxgEfficiency'),-50);record.psxg=0;assert.equal(metrics.metric(record,'psxgEfficiency'),null);
 const ratio={goals:3,xg:2,metricContexts:{goals:{source:'FotMob',minutes:900,matches:10},xg:{source:'FotMob',minutes:990,matches:11}}};assert.equal(metrics.metric(ratio,'goalsPerXg'),null);
});
test('keeper score incorporates xGOT effectiveness and avoids counting the same goals-prevented axis twice',()=>{
 const players=Array.from({length:6},(_,i)=>({id:String(i),pos:'POR',minutes:900,matches:10,savepct:75,saves:30,conceded:10,prevented:2,highClaims:8,sweeperActions:9,psxg:20,metricContexts:{psxg:{source:'FotMob',minutes:900,matches:10,pairedConceded:i*4}}}));
 const scores=radar.profiles(players);assert(scores.get(players[0]).axes.some(a=>a.key==='psxgEfficiency'));assert(!scores.get(players[0]).axes.some(a=>a.key==='prevented'));assert(scores.get(players[0]).comparableArea>scores.get(players[5]).comparableArea);
});
test('xGOT aggregate excludes verified own goals and survives an incomplete save map without inventing missing shots',()=>{
 const fixture=keeperHTML(),stats=fixture.data.firstSeasonStats.statsSection.items[0].items;
 stats.find(s=>s.localizedTitleId==='goals_conceded').statValue='2';stats.push({localizedTitleId:'goals_prevented',statValue:'0.7',statFormat:'fraction'});
 const shots=fixture.data.firstSeasonStats.keeperShotmap;shots.forEach((s,i)=>s.eventType=i===0?'Goal':'AttemptSaved');shots.push({...shots[0],id:99,isOwnGoal:true,isOnTarget:false,teamId:1,expectedGoals:null,expectedGoalsOnTarget:null});shots.splice(1,1);
 const result=profiles.parse(fixture.html(),{id:'10',team_id:'1'},'laliga','2026-11-08T12:00:00Z');assert.equal(result.values.psxg,1.7);assert.equal(result.contexts.psxg.pairedConceded,1);assert.equal(result.contexts.psxg.ownGoalsExcluded,1);assert(!Object.hasOwn(result.values,'xgaOnTarget'));
 shots.pop();const missingGoal=profiles.parse(fixture.html(),{id:'10',team_id:'1'},'laliga','2026-11-08T12:00:00Z');assert(!Object.hasOwn(missingGoal.values,'psxg'));
});
test('failed detail requests retain verified missing fields only for the same player and club',()=>{
 const context={source:'FotMob',profileVerified:true,reportedValue:true,captured_at:'2026-11-07T00:00:00Z',minutes:90,matches:1};
 const d={metadata:{source:'FotMob',imported_at:'2026-11-08T00:00:00Z'},players:[{id:'1',team_id:'2',pos:'—',completed:null,metricContexts:{}}]},old={players:[{id:'1',team_id:'2',pos:'DEF',completed:20,metricContexts:{completed:context}}]},before=JSON.stringify(old);
 const result=profiles.apply(d,[],old);assert.equal(result.players[0].completed,20);assert.equal(result.players[0].metricContexts.completed.captured_at,context.captured_at);assert.equal(result.players[0].pos,'DEF');assert.equal(JSON.stringify(old),before);
 const unknown=profiles.apply(d,[{id:'1',team_id:'2',pos:'—',nameAliases:['Published full name'],values:{},contexts:{}}],old);
 assert.equal(unknown.players[0].pos,'DEF');assert(unknown.players[0].nameAliases.includes('Published full name'));
 old.players[0].team_id='3';assert.equal(profiles.apply(d,[],old).players[0].completed,null);
});
test('explicit zero profile counts and rates survive parsing and keep their verified position evidence',()=>{
 const fixture=keeperHTML(),items=fixture.data.firstSeasonStats.statsSection.items[0].items;
 fixture.data.positionDescription.primaryPosition={key:'left_wing_back',label:'Defender'};
 items.push({localizedTitleId:'blocked_shots',statValue:'0',statFormat:'number',per90:0},{localizedTitleId:'interceptions',statValue:'0',statFormat:'number',per90:0},{localizedTitleId:'dribbles_succeeded',statValue:'0',statFormat:'number',per90:0});
 const result=profiles.parse(fixture.html(),{id:'10',team_id:'1'},'laliga','2026-11-10T12:00:00Z');
 assert.equal(result.values.blocks,0);assert.equal(result.values.interceptions,0);assert.equal(result.values.dribblesPer90,0);assert.equal(result.contexts.blocks.reportedPer90,0);
 assert.equal(result.pos,'DEF');assert.equal(result.positionContext.key,'left_wing_back');assert(result.positionContext.identityVerified);
 const data={metadata:{source:'FotMob',imported_at:'2026-11-09T00:00:00Z'},players:[{id:'10',team_id:'1',pos:'—',blocks:null,metricContexts:{}}]};
 const applied=profiles.apply(data,[result]).players[0];assert.equal(applied.blocks,0);assert.equal(applied.pos,'DEF');assert.equal(applied.positionContext.captured_at,'2026-11-10T12:00:00Z');
});
