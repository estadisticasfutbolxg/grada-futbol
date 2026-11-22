'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),nationality=require('../dist/nationality.js'),profiles=require('../dist/profiles.js'),refresh=require('../dist/refresh.js');
const date='2026-11-14T12:00:00Z',meta={source:'FotMob',competition:'LaLiga',league_key:'laliga',season:'2026/27',season_id:38843,league_id:87,imported_at:date};
function page(members=[{id:10,ccode:'ESP',cname:'Spain',nationalTeamId:6720}]){const data={details:{id:1,primaryLeagueId:87,latestSeason:'2026/2027'},seostr:'isolated-club',squad:{squad:[{title:'players',members}]}};return {data,html:()=>'<script id="__NEXT_DATA__">'+JSON.stringify({props:{pageProps:{fallback:{'team-1':data}}}})+'</script>'};}
function record(){const p=page(),country=nationality.parseSquad(p.html(),{id:'1'},'laliga',date).players[0];return {...country,name:'Isolated player',pos:'DEL',minutes:200,matches:3,metricContexts:{}};}
test('nationality uses explicit country and national team metadata, including players without tactical positions',()=>{
 const r=record();assert(nationality.valid(r));assert.equal(r.nationality.code,'ESP');assert.equal(nationality.label(r.nationality),'España');assert.equal(r.nationality.context.captured_at,date);assert(nationality.flag(r.nationality).path.endsWith('/es.svg'));
 const p=page([{id:10,ccode:'ENG',cname:'England',nationalTeamId:8491},{id:11,ccode:'SCO',cname:'Scotland',nationalTeamId:9}]),parsed=nationality.parseSquad(p.html(),{id:'1'},'laliga',date);assert.equal(nationality.label(parsed.players[0].nationality),'Inglaterra');assert.equal(nationality.label(parsed.players[1].nationality),'Escocia');assert(!nationality.flag(parsed.players[0].nationality).path.includes('/gb.svg'));
 const missing=page([{id:1,name:'Spanish sounding name',birthCountry:'Spain'}]);assert.equal(nationality.parseSquad(missing.html(),{id:'1'},'laliga',date).players.length,0);
});
test('source identity, club, league, season, date and paths are verified; malformed countries never become inferred values',()=>{
 const r=record();for(const change of [p=>p.id='11',p=>p.team_id='2',p=>p.nationality.context.league_key='other',p=>p.nationality.context.season='2025/26',p=>p.nationality.context.captured_at='2999-01-01',p=>p.nationality.context.url='https://evil.test',p=>p.nationality.context.identityVerified=false,p=>p.nationality.name='<img>',p=>p.nationality.code='spain',p=>p.nationality.nationalTeamId='0']){const altered=structuredClone(r);change(altered);assert(!nationality.valid(altered));}
 const p=page();p.data.details.id=2;assert.throws(()=>nationality.parseSquad(p.html(),{id:'1'},'laliga',date));p.data.details.id=1;p.data.details.latestSeason='2025/2026';assert.throws(()=>nationality.parseSquad(p.html(),{id:'1'},'laliga',date));
 const duplicate=page([{id:10},{id:10}]);assert.throws(()=>nationality.parseSquad(duplicate.html(),{id:'1'},'laliga',date));
 const joined={...r,id:'laliga:combined:10',team_id:'laliga:combined:1',league_key:'laliga',sourceRecords:{FotMob:r}};assert.equal(nationality.info(joined).code,'ESP');joined.league_key='serie-a';assert.equal(nationality.info(joined),null);
});
test('profile parsing, applying and recovery retain country evidence without changing football statistics or inventing missing countries',()=>{
 const base=record(),data={metadata:meta,teams:[{id:'1'}],players:[base]},d={id:10,primaryTeam:{teamId:1},positionDescription:{primaryPosition:{key:'striker'}},playerInformation:[{translationKey:'country_sentencecase',countryCode:'ARG',nationalTeamId:6706,value:{fallback:'Argentina'}}],mainLeague:{leagueId:87,season:'2026/2027',stats:[{localizedTitleId:'minutes_played',value:200},{localizedTitleId:'matches_uppercase',value:3}]},statSeasons:[{seasonName:'2026/2027',tournaments:[{tournamentId:87}]}]};
 const html='<script id="__NEXT_DATA__">'+JSON.stringify({props:{pageProps:{data:d}}})+'</script>',profile=profiles.parse(html,base,'laliga','2026-11-15T12:00:00Z'),result=profiles.apply(data,[profile]);assert.equal(result.players[0].nationality.code,'ARG');assert.equal(base.nationality.code,'ESP');
 const fresh=structuredClone(data);delete fresh.players[0].nationality;fresh.metadata.imported_at='2026-11-16T12:00:00Z';assert.equal(profiles.restore(fresh,result).players[0].nationality.code,'ARG');
 fresh.players[0].team_id='2';assert.equal(profiles.restore(fresh,result).players[0].nationality,undefined);
 const noCountry={...d,playerInformation:[]};assert.equal(nationality.fromProfile(noCountry,base,'laliga',date),null);
});
test('refresh reports detect changed countries but ignore a new retrieval date alone',()=>{
 const a=record(),b=structuredClone(a),source=players=>({players,matches:[],metadata:{imported_matches:1}}),before={combined:source([a]),fotmob:source([a])};b.nationality.context.captured_at='2026-11-15T12:00:00Z';
 let result={state:{combined:source([b]),fotmob:source([b])},checked:['fotmob']};assert.equal(refresh.report(before,result).players.modified.length,0);b.nationality.code='FRA';b.nationality.name='France';b.nationality.nationalTeamId='6723';assert.equal(refresh.report(before,result).players.modified.length,1);
});
