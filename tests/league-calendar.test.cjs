'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),leagues=require('../dist/leagues.js'),espn=require('../dist/laliga.js'),fotmob=require('../dist/fotmob.js'),combined=require('../dist/combined.js'),profiles=require('../dist/profiles.js');
const date='2026-11-24T13:00:00Z';
const {snapshots}=require('./helpers/league-snapshots.cjs');
test('empty penalty-save rankings keep unknown values and still reject empty required rankings or foreign seasons',()=>{
 const l=leagues.get('a-league'),d={currentSeasonId:l.fotmobSeason,currentStatName:'penalty_save',type:'players',leagueDetails:{id:l.fotmobId},seasons:[{id:l.fotmobSeason,name:'2026/2027'}],statsData:[]},html=()=>'<script id="__NEXT_DATA__">'+JSON.stringify({props:{pageProps:{data:d}}})+'</script>',parser=require('../worker/providers.cjs');
 assert.deepEqual(parser.parseFotmob(html(),'penalty_save',l).statsData,[]);d.currentStatName='saves';assert.throws(()=>parser.parseFotmob(html(),'saves',l));d.currentStatName='penalty_save';d.currentSeasonId=2025;assert.throws(()=>parser.parseFotmob(html(),'penalty_save',l));
 const {f,e}=snapshots('a-league');assert.equal(combined.coverage(combined.combine(f,e)).counts.penaltiesSaved,0);f.players[0].penaltiesSaved=0;f.players[0].metricContexts.penaltiesSaved={source:'FotMob',minutes:540,matches:6,captured_at:date,profileVerified:true,reportedValue:true};assert.equal(combined.coverage(combined.combine(f,e)).counts.penaltiesSaved,1);
});
test('three-round and 24-club calendars validate their actual limits rather than a 20-club double round robin',()=>{
 for(const id of ['scotland','championship','laliga-2','denmark']){
  const l=leagues.get(id),limit=leagues.teamMatchLimit(l),{f,e}=snapshots(id,limit);assert.equal(f.metadata.imported_matches,l.matches);fotmob.validate(f);espn.validate(e);
  f.teams[0].matches++;assert.throws(()=>fotmob.validate(f));e.teams[0].matches++;assert.throws(()=>espn.validate(e));
 }
 const catalog=leagues.list();try{assert.throws(()=>leagues.configure(catalog.map(l=>l.id==='scotland'?{...l,matches:132}:l)));assert.throws(()=>leagues.configure(catalog.map(l=>({...l,espn:'esp.1?url=bad'}))));}finally{leagues.configure(catalog);}
});
test('reviewed club aliases apply only within their competition and do not merge two distinct clubs',()=>{
 const {f,e}=snapshots('portugal');f.teams[0].name='Nacional';f.players[0].team='Nacional';e.teams[0].name='C.D. Nacional';e.players[0].team='C.D. Nacional';e.players[0].shots=5;
 assert.equal(combined.combine(f,e).players[0].shots,5);
 const other=snapshots('eredivisie');Object.assign(other.f.teams[0],{name:'Nacional'});Object.assign(other.e.teams[0],{name:'C.D. Nacional'});other.e.players[0].shots=5;assert.equal(combined.combine(other.f,other.e).players[0].shots,null);
 e.teams[1].name='C.D. Nacional';e.players[1].team='C.D. Nacional';assert.equal(combined.combine(f,e).players[0].shots,null);
});
test('profile samples use the configured calendar and still verify player, club, competition and season',()=>{
 const l=leagues.get('championship'),p={id:'1',team_id:'2',name:'Isolated'},d={id:1,primaryTeam:{teamId:2},positionDescription:{primaryPosition:{key:'keeper'}},mainLeague:{leagueId:l.fotmobId,season:'2026/2027',stats:[{localizedTitleId:'minutes_played',value:46*90},{localizedTitleId:'matches_uppercase',value:46}]},statSeasons:[{seasonName:'2026/2027',tournaments:[{tournamentId:l.fotmobId}]}]};
 const html=()=>'<script id="__NEXT_DATA__">'+JSON.stringify({props:{pageProps:{data:d}}})+'</script>';
 assert.equal(profiles.parse(html(),p,l.id,date).values.matches,46);d.mainLeague.stats[1].value=47;assert.throws(()=>profiles.parse(html(),p,l.id,date));d.mainLeague.stats[1].value=46;d.primaryTeam.teamId=3;assert.throws(()=>profiles.parse(html(),p,l.id,date));
});
