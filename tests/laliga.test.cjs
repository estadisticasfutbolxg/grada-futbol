'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const {adapt,validate,fetchSeason,STANDINGS,rosterURL} = require('../dist/laliga.js');
// Minimal isolated responses for validation tests. They are never served by the site.
const stat=(name,value)=>({name,value});
function fixture() {
 const season={year:2026,displayName:'2026-27 Spanish LALIGA'};
 const rows=Array.from({length:20},(_,i)=>({team:{id:String(i+1),displayName:'Equipo '+(i+1)},stats:[stat('gamesPlayed',2),stat('pointsFor',3),stat('pointsAgainst',3)]}));
 const rosters=rows.map(r=>({season,team:r.team,athletes:[
  {id:'1',displayName:'Portero',position:{abbreviation:'G'},statistics:{splits:{categories:[{stats:[stat('appearances',2),stat('saves',6),stat('goalsConceded',2),stat('totalGoals',0),stat('goalAssists',0),stat('totalShots',0)]}]}}},
  {id:'2',displayName:'Delantero',position:{abbreviation:'F'},statistics:{splits:{categories:[{stats:[stat('appearances',2),stat('totalGoals',3),stat('totalShots',10),stat('goalAssists',1),stat('goalsConceded',2)]}]}}}
 ]}));
 return {standings:{season,children:[{standings:{entries:rows}}]},rosters};
}
test('keeps known zeros, separate team-player identities, and unavailable xG/minutes',()=>{
 const f=fixture(),d=adapt(f.standings,f.rosters,'2026-11-01T00:00:00Z');
 assert.equal(d.teams.length,20);assert.equal(d.players.length,40);assert.equal(d.metadata.imported_matches,20);
 assert.equal(d.players[0].goals,0);assert.equal(d.players[0].savepct,75);
 assert.equal(d.players[1].conversion,30);assert.equal(d.players[1].conceded,null);
 for(const p of d.players) {assert.equal(p.xg,null);assert.equal(p.xga,null);assert.equal(p.minutes,null);}
 assert.equal(new Set(d.players.map(p=>p.id)).size,40);
});
test('rejects a wrong season, missing roster, duplicate identity and fabricated xG',()=>{
 const f=fixture();
 const wrong=structuredClone(f.standings);wrong.season.year=2025;
 assert.throws(()=>adapt(wrong,f.rosters),/temporada/);
 assert.throws(()=>adapt(f.standings,f.rosters.slice(1)),/Faltan/);
 const d=adapt(f.standings,f.rosters);d.players.push(d.players[0]);assert.throws(()=>validate(d),/inválida/);
 d.players.pop();d.players[0].xg=0;assert.throws(()=>validate(d),/respaldo/);
});
test('does not turn an absent statistic into zero and rejects inconsistent standings',()=>{
 const f=fixture();f.rosters[0].athletes[0].statistics.splits.categories[0].stats=[];
 const d=adapt(f.standings,f.rosters);assert.equal(d.players[0].goals,null);assert.equal(d.players[0].saves,null);
 f.standings.children[0].standings.entries[0].stats.find(s=>s.name==='pointsFor').value=4;
 assert.throws(()=>adapt(f.standings,f.rosters),/incoherente/);
});
test('refresh requests the correct season with bounded concurrency and completes all teams',async()=>{
 const f=fixture();let active=0,max=0,calls=0,progress=0;
 const fetchImpl=async(url,options)=>{
  calls++;assert.equal(options.cache,'no-store');assert(options.signal);
  if(url===STANDINGS)return {ok:true,json:async()=>f.standings};
  const index=f.rosters.findIndex(r=>rosterURL(r.team.id)===url);assert(index>=0);
  active++;max=Math.max(max,active);await new Promise(r=>setTimeout(r,2));active--;
  return {ok:true,json:async()=>f.rosters[index]};
 };
 const d=await fetchSeason({fetchImpl,onProgress:done=>progress=done});
 assert.equal(calls,21);assert.equal(progress,20);assert(max<=3);assert.equal(d.players.length,40);
});
test('HTTP errors and cancellation fail without returning a partial payload',async()=>{
 await assert.rejects(fetchSeason({fetchImpl:async()=>({ok:false,status:503})}),/HTTP 503/);
 const c=new AbortController();c.abort();
 await assert.rejects(fetchSeason({signal:c.signal,fetchImpl:async(_url,options)=>{if(options.signal.aborted)throw new DOMException('Aborted','AbortError');}}),{name:'AbortError'});
});
