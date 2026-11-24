'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const leagues=require('../dist/leagues.js'),fotmob=require('../dist/fotmob.js'),combined=require('../dist/combined.js'),refresh=require('../dist/refresh.js'),worker=require('../worker/app.cjs');
function fixture(){
 const l=leagues.get('laliga'),date='2026-11-08T12:00:00Z',teams=Array.from({length:20},(_,i)=>({id:String(10+i),name:'Isolated club '+i,matches:2,minutes:180,goals:2,conceded:2,xg:null,xga:null}));
 const players=teams.map((t,i)=>({...Object.fromEntries(fotmob.fields.map(k=>[k,null])),id:String(100+i),name:'Isolated player '+i,team_id:t.id,team:t.name,pos:'DEL',minutes:180,matches:2,passes:null,completed:null,accuracy:null,tackles:null,interceptions:null,recoveries:null,goals:0,shots:0,xg:null,xa:null,assists:0,metricContexts:{goals:{source:'FotMob',captured_at:date,matches:2,minutes:180,profileVerified:true,reportedValue:true},shots:{source:'FotMob',captured_at:date,matches:2,minutes:180,profileVerified:true,reportedValue:true}}}));
 const f={metadata:{source:'FotMob',competition:l.name,league_key:l.id,season:l.season,season_id:l.fotmobSeason,league_id:l.fotmobId,imported_at:date,imported_matches:20,available_matches:380,notes:'Isolated test response; never served'},teams,players,matches:[]};
 const e={metadata:{source:'ESPN',competition:l.name,league_key:l.id,season:l.season,season_id:2026,imported_at:date,imported_matches:20,available_matches:380,notes:'Isolated test response; never served'},teams:teams.map((t,i)=>({...t,id:String(1000+i),minutes:null})),players:players.map((p,i)=>({...p,id:'espn:'+i,team_id:String(1000+i),minutes:null,xg:null,xa:null,xga:null,psxg:null,metricContexts:undefined})),matches:[]};
 return {f,e};
}
test('active LaLiga uses FotMob catalog and ESPN, with no archived fields or source attribution',()=>{
 const {f,e}=fixture(),before=JSON.stringify({f,e}),d=combined.combine(f,e);
 assert.equal(leagues.get('laliga').primary,'FotMob');assert.deepEqual(refresh.sources(leagues.get('laliga')),['espn','fotmob']);assert.equal(d.players.length,20);
 assert.deepEqual(Object.keys(d.metadata.sources),['FotMob','ESPN']);assert(!/understat/i.test(d.metadata.notes));
 for(const p of d.players){assert.equal(p.id,'combined:'+p.sourceRecords.FotMob.id);assert.deepEqual(Object.keys(p.sourceRecords),['FotMob','ESPN']);assert(!Object.values(p.fieldSources).includes('Understat'));assert.equal(p.xg,0);assert.equal(p.metricContexts.xg.derived,'zero_shot_xg');}
 assert.equal(JSON.stringify({f,e}),before);assert.equal(leagues.get('laliga').archivedPrimary,'Understat');
});
test('partial LaLiga keeps absent team xG unknown and only permits the two declared coverage gaps',()=>{
 const {f,e}=fixture();fotmob.validate(f);const d=combined.combine(f,e),coverage=combined.coverage(d);
 assert(coverage.missing.includes('equipos: xg'));assert(coverage.missing.includes('equipos: xga'));assert(!coverage.requiredMissing.includes('equipos: xg'));assert(coverage.requiredMissing.includes('completedPer90'));assert(!coverage.complete);assert(coverage.partial);assert(d.teams.every(t=>t.xg===null&&t.xga===null));
 const other=leagues.get('premier-league'),foreign={...f,metadata:{...f.metadata,competition:other.name,league_key:other.id,season_id:other.fotmobSeason,league_id:other.fotmobId}};assert.throws(()=>fotmob.validate(foreign),/principales/);
});
test('archived Understat route stays disabled and absent captures are not served or fetched',async()=>{
 let calls=0;const options={fetcher:async()=>{calls++;throw Error('No network expected');},cache:{match:async()=>undefined,put:async()=>{}}};
 for(const path of ['/api/source/understat?league=laliga','/downloads/understat-laliga-2026-27.json']){
  const response=await worker.handle(new Request('https://active-source.test'+path),{},options);assert.equal(response.status,path.startsWith('/api/')?400:404);
 }
 assert.equal(calls,0);
});
