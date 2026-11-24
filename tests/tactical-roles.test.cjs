'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),roles=require('../dist/roles.js'),radar=require('../dist/radar.js'),scores=require('../dist/scores.js'),refresh=require('../dist/refresh.js');
const date='2026-11-11T12:00:00Z',meta={source:'FotMob',competition:'LaLiga',league_key:'laliga',season:'2026/27',season_id:38843,league_id:87,imported_at:'2026-11-06T00:00:00Z'};
function squadFixture(){
 const d={details:{id:1,primaryLeagueId:87,latestSeason:'2026/2027'},seostr:'isolated-club',squad:{squad:[{title:'coach',members:[{id:99}]},{title:'defenders',members:[{id:10,name:'Isolated player',goals:99,dateOfBirth:'2000-01-01',positionIdsDesc:'CB,RB'}]}]}};
 return {d,html:()=>'<script id="__NEXT_DATA__">'+JSON.stringify({props:{pageProps:{fallback:{'team-1':d}}}})+'</script>'};
}
test('published squad roles verify team, league and season, preserve multiple positions, and never import statistics/personal fields',()=>{
 const f=squadFixture(),s=roles.parseSquad(f.html(),{id:'1'},'laliga',date),p=s.players[0];assert.deepEqual(p.tacticalPositions,['CB','RB']);assert.equal(p.goals,undefined);assert.equal(p.name,undefined);assert.equal(p.dateOfBirth,undefined);assert(roles.valid(p));
 for(const [key,value]of [['id',2],['primaryLeagueId',47],['latestSeason','2025/2026']]){const old=f.d.details[key];f.d.details[key]=value;assert.throws(()=>roles.parseSquad(f.html(),{id:'1'},'laliga',date));f.d.details[key]=old;}
 f.d.squad.squad[1].members.push({...f.d.squad.squad[1].members[0]});assert.throws(()=>roles.parseSquad(f.html(),{id:'1'},'laliga',date));
});
test('enrichment matches ID and club, preserves canonical position/counts and cannot borrow from another club or season',()=>{
 const f=squadFixture(),s=roles.parseSquad(f.html(),{id:'1'},'laliga',date),data={metadata:meta,teams:[{id:'1'}],players:[{id:'10',team_id:'1',pos:'DEF',minutes:600,goals:0}]},before=JSON.stringify(data),enriched=roles.enrich(data,[s]),p=enriched.players[0];
 assert.equal(JSON.stringify(data),before);assert.equal(p.pos,'DEF');assert.equal(p.goals,0);assert.equal(p.minutes,600);assert.equal(enriched.metadata.imported_at,meta.imported_at);assert(roles.matches(p,'CB'));assert(roles.matches(p,'FB'));assert(roles.info(p).versatile);
 data.players[0].team_id='2';assert.equal(roles.enrich(data,[s]).players[0].tacticalPositions,undefined);s.season='2025/26';assert.throws(()=>roles.enrich(data,[s]));
});
test('cache recovery retains verified roles only for the same identity and a fresh primary profile can supersede the squad list',()=>{
 const s=roles.parseSquad(squadFixture().html(),{id:'1'},'laliga',date),data={metadata:meta,teams:[{id:'1'}],players:[{id:'10',team_id:'1',pos:'DEF'}]},previous=roles.enrich(data,[s]);
 let restored=roles.restore(data,previous);assert.deepEqual(restored.players[0].tacticalPositions,['CB','RB']);
 restored.players[0].positionContext={source:'FotMob',identityVerified:true,key:'left_back',captured_at:'2026-11-12T00:00:00Z'};assert.deepEqual(roles.info(restored.players[0]).codes,['LB']);
 data.players[0].team_id='2';assert.equal(roles.restore(data,previous).players[0].tacticalPositions,undefined);
 previous.metadata={...meta,season:'2025/26'};assert.equal(roles.restore(data,previous),data);
});
test('ranking-only players gain a position only from an unambiguous verified squad family',()=>{
 const f=squadFixture(),data={metadata:meta,teams:[{id:'1'}],players:[{id:'10',team_id:'1',pos:'—',minutes:600,goals:0}]};
 let squad=roles.parseSquad(f.html(),{id:'1'},'laliga',date),p=roles.enrich(data,[squad]).players[0];
 assert.equal(p.pos,'DEF');assert.equal(p.positionContext.kind,'squad_position');assert.equal(p.goals,0);assert.equal(p.minutes,600);assert.equal(data.players[0].pos,'—');
 f.d.squad.squad[1].members[0].positionIdsDesc='CB,CM';squad=roles.parseSquad(f.html(),{id:'1'},'laliga',date);p=roles.enrich(data,[squad]).players[0];assert.equal(p.pos,'—');assert.equal(p.positionContext,undefined);assert.deepEqual(p.tacticalPositions,['CB','CM']);
});
test('central and fullback rankings filter published positions while keeping one DEF score',()=>{
 const s=roles.parseSquad(squadFixture().html(),{id:'1'},'laliga',date),p={...s.players[0],pos:'DEF',minutes:600},profile={score:0.4,comparableArea:0.4,axes:[]},model={players:new Map([[p,profile]])};
 for(const key of ['DEF','DEF_CB','DEF_FB']){assert(scores.eligible(model,p,radar.definition(key)));assert.equal(scores.value(model,p,radar.definition(key)),0.4);}
 delete p.tacticalPositions;assert(!scores.eligible(model,p,radar.definition('DEF_CB')));assert(roles.matches(p,'UNKNOWN'));
});
test('midfield styles compare percentile ranks, keep a balanced band, and leave missing references unclassified',()=>{
 const p={pos:'MED'},indices=(a,b)=>new Map([['MED_ATT',new Map([[p,{score:0.1,rolePercentile:a}]])],['MED_DEF',new Map([[p,{score:0.9,rolePercentile:b}]])]]);
 assert.equal(radar.midfieldRole(p,indices(70,60)),'MED_BALANCED');assert.equal(radar.midfieldRole(p,indices(70.1,60)),'MED_ATT');assert.equal(radar.midfieldRole(p,indices(10,90)),'MED_DEF');assert.equal(radar.midfieldRole(p,indices(null,80)),null);
});
test('refresh reports a changed role but does not call a fresh role capture date a player update',()=>{
 const s=roles.parseSquad(squadFixture().html(),{id:'1'},'laliga',date),row={...s.players[0],pos:'DEF'},before={combined:{players:[row]},fotmob:{players:[row],metadata:{imported_matches:1}}},after=structuredClone(before);
 after.combined.players[0].tacticalContext.captured_at='2026-11-12T12:00:00Z';let r=refresh.report(before,{state:after,checked:['fotmob']});assert.equal(r.players.modified.length,0);
 after.combined.players[0].tacticalPositions=['LB'];r=refresh.report(before,{state:after,checked:['fotmob']});assert.equal(r.players.modified.length,1);
});
