'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),profiles=require('../dist/profiles');
const player={id:'123',team_id:'456'},at='2026-11-27T10:00:00Z';
function fixture(){
 const data={id:123,primaryTeam:{teamId:456},positionDescription:{primaryPosition:{key:'striker'}},mainLeague:{leagueId:87,season:'2026/2027',stats:[{localizedTitleId:'minutes_played',value:450},{localizedTitleId:'matches_uppercase',value:5}]},statSeasons:[{seasonName:'2026/2027',tournaments:[{tournamentId:87}]}],firstSeasonStats:{statsSection:{items:[{items:[]}]}}};
 return{data,items:data.firstSeasonStats.statsSection.items[0].items,html:()=>'<script id="__NEXT_DATA__">'+JSON.stringify({props:{pageProps:{data}}})+'</script>'};
}
test('verified big-chance and on-target aliases provide the same counts, rates and sample as canonical keys',()=>{
 for(const [bigChance,onTarget]of [['big_chances_created','shots_on_target'],['big_chance_created_team_title','ShotsOnTarget']]){
  const f=fixture();f.items.push({localizedTitleId:bigChance,statValue:'3',statFormat:'number',per90:0.6},{localizedTitleId:onTarget,statValue:'8',statFormat:'number',per90:1.6});
  const p=profiles.parse(f.html(),player,'laliga',at);assert.equal(p.values.bigChancesCreated,3);assert.equal(p.contexts.bigChancesCreated.reportedPer90,0.6);assert.equal(p.values.shotsOnTarget,8);assert.equal(p.values.shotsOnTargetPer90,1.6);
  for(const key of ['bigChancesCreated','shotsOnTarget','shotsOnTargetPer90']){assert.equal(p.contexts[key].minutes,450);assert.equal(p.contexts[key].matches,5);assert.equal(p.contexts[key].source,'FotMob');assert.equal(p.contexts[key].captured_at,at);assert.equal(p.contexts[key].profileVerified,true);assert.equal(p.contexts[key].reportedValue,true);}
 }
});
test('published zero counts and zero rates survive without inventing absent on-target rates or regates',()=>{
 const f=fixture();f.items.push({localizedTitleId:'ShotsOnTarget',statValue:'0',statFormat:'number',per90:0},{localizedTitleId:'big_chance_created_team_title',statValue:'0',statFormat:'number',per90:0},{localizedTitleId:'dribbled_past',statValue:'5',statFormat:'number',per90:1});
 let p=profiles.parse(f.html(),player,'laliga',at);assert.equal(p.values.shotsOnTarget,0);assert.equal(p.values.shotsOnTargetPer90,0);assert.equal(p.values.bigChancesCreated,0);assert.equal(p.contexts.shotsOnTargetPer90.reportedPer90,0);assert(!Object.hasOwn(p.values,'dribblesPer90'));
 delete f.items[0].per90;p=profiles.parse(f.html(),player,'laliga',at);assert.equal(p.values.shotsOnTarget,0);assert(!Object.hasOwn(p.values,'shotsOnTargetPer90'));
 f.items.splice(0,1);p=profiles.parse(f.html(),player,'laliga',at);assert(!Object.hasOwn(p.values,'shotsOnTarget'));assert(!Object.hasOwn(p.values,'shotsOnTargetPer90'));
});
test('on-target alias requires a numeric nonnegative rate and the published integer count format',()=>{
 const f=fixture();f.items.push({localizedTitleId:'ShotsOnTarget',statValue:'2',statFormat:'number',per90:-1});let p=profiles.parse(f.html(),player,'laliga',at);assert.equal(p.values.shotsOnTarget,2);assert(!Object.hasOwn(p.values,'shotsOnTargetPer90'));
 f.items[0].per90='0.4';p=profiles.parse(f.html(),player,'laliga',at);assert(!Object.hasOwn(p.values,'shotsOnTargetPer90'));
 f.items[0].statFormat='fraction';f.items[0].per90=0.4;p=profiles.parse(f.html(),player,'laliga',at);assert(!Object.hasOwn(p.values,'shotsOnTarget'));assert(!Object.hasOwn(p.values,'shotsOnTargetPer90'));
});
test('aliases do not bypass player, club, competition, season or first-tournament verification',()=>{
 const changes=[f=>f.data.mainLeague.leagueId=53,f=>f.data.mainLeague.season='2025/2026',f=>f.data.statSeasons[0].seasonName='2025/2026',f=>f.data.statSeasons[0].tournaments=[{tournamentId:53},{tournamentId:87}]];
 for(const mutate of changes){const f=fixture();f.items.push({localizedTitleId:'ShotsOnTarget',statValue:'8',statFormat:'number',per90:1.6},{localizedTitleId:'big_chance_created_team_title',statValue:'3',statFormat:'number',per90:0.6});mutate(f);const p=profiles.parse(f.html(),player,'laliga',at);assert.equal(p.scope,'position_only');assert.deepEqual(p.values,{});assert.deepEqual(p.contexts,{});}
 for(const mutate of [f=>f.data.id=999,f=>f.data.primaryTeam.teamId=999]){const f=fixture();mutate(f);assert.throws(()=>profiles.parse(f.html(),player,'laliga',at),/otro jugador o club/);}
});
