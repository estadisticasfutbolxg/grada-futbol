'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{gzipSync}=require('node:zlib');
const profiles=require('../dist/profiles.js'),refresh=require('../dist/refresh.js'),fotmob=require('../dist/fotmob.js'),positions=require('../dist/positions.js'),leagues=require('../dist/leagues.js'),worker=require('../worker/app.cjs');
const league=leagues.get('laliga'),older='2026-11-06T12:00:00Z',newer='2026-11-09T12:00:00Z';
const context=(date=older)=>({source:'FotMob',profileVerified:true,reportedValue:true,captured_at:date,minutes:540,matches:6});
function capture(date=older,pos='DEL'){
 return {metadata:{source:'FotMob',competition:league.name,league_key:league.id,season:league.season,season_id:league.fotmobSeason,league_id:league.fotmobId,imported_at:date,notes:'Isolated regression fixture, never served'},
  teams:Array.from({length:20},(_,i)=>({id:String(i+1),name:'Isolated club '+i})),
  players:[{...Object.fromEntries(fotmob.fields.map(k=>[k,null])),id:'10',team_id:'1',name:'Isolated player',pos,minutes:540,matches:6,passes:null,completed:null,accuracy:null,tackles:null,interceptions:null,recoveries:null,metricContexts:{}}]};
}
test('a newer aggregate cannot remove a known position and verified missing fields, with original dates and samples',()=>{
 const published=capture(),aggregate=capture(newer,'—');Object.assign(published.players[0],{completed:20,nameAliases:['Published full name'],metricContexts:{completed:context()}});
 const before=JSON.stringify({published,aggregate}),selected=refresh.selectCapture(published,aggregate,'fotmob',league),p=selected.players[0];
 assert.equal(selected.metadata.imported_at,newer);assert.equal(p.pos,'DEL');assert.equal(p.completed,20);assert.deepEqual(p.metricContexts.completed,context());assert.equal(p.positionContext.retained_from,older);assert(p.nameAliases.includes('Published full name'));
 const r=positions.resolve({Understat:{pos:'MED'},ESPN:{pos:'DEL'},FotMob:p},'Understat');assert.equal(r.position,'DEL');assert.equal(r.method,'source_consensus');assert.equal(JSON.stringify({published,aggregate}),before);
});
test('real fresh zeros and known positions win; an older container may carry a newer verified profile',()=>{
 const a=capture(),b=capture(newer,'MED');a.players[0].interceptions=5;a.players[0].metricContexts.interceptions=context();b.players[0].interceptions=0;b.players[0].metricContexts.interceptions=context(newer);
 let selected=refresh.selectCapture(a,b,'fotmob',league);assert.equal(selected.players[0].interceptions,0);assert.equal(selected.players[0].pos,'MED');
 a.players[0].interceptions=0;a.players[0].metricContexts.interceptions=context('2026-11-10T12:00:00Z');a.players[0].positionContext={identityVerified:true,captured_at:'2026-11-10T12:00:00Z'};
 selected=refresh.selectCapture(b,a,'fotmob',league);assert.equal(selected.metadata.imported_at,newer);assert.equal(selected.players[0].interceptions,0);assert.equal(selected.players[0].metricContexts.interceptions.captured_at,'2026-11-10T12:00:00Z');assert.equal(selected.players[0].pos,'DEL');
});
test('recovery never borrows another identity, club, league, season, keeper role or unverified numeric value',()=>{
 const base=capture(),fresh=capture(newer,'—');base.players[0].interceptions=5;
 assert.equal(profiles.restore(fresh,base).players[0].interceptions,null);
 for(const mutate of [d=>d.players[0].id='11',d=>d.players[0].team_id='2',d=>d.metadata.season='2025/26',d=>d.metadata.league_key='serie-a',d=>d.metadata.season_id=2025,d=>d.metadata.source='ESPN']){const backup=structuredClone(base);mutate(backup);assert.equal(profiles.restore(fresh,backup).players[0].pos,'—');}
 fresh.players[0].pos='POR';assert.equal(profiles.restore(fresh,base).players[0].pos,'POR');
 const bad=structuredClone(base);bad.metadata.imported_at='2999-01-01T00:00:00Z';assert.throws(()=>refresh.selectCapture(base,bad,'fotmob',league));
});
test('derived counts cannot retain a previous conversion after restoring a different profile sample',()=>{
 const a=capture(),b=capture(newer);Object.assign(a.players[0],{goals:2,shots:10,metricContexts:{goals:context('2026-11-10T12:00:00Z'),shots:context('2026-11-10T12:00:00Z')}});
 Object.assign(b.players[0],{goals:1,shots:8,conversion:12.5,metricContexts:{goals:context(newer),shots:context(newer)}});
 let p=profiles.restore(b,a).players[0];assert.equal(p.conversion,20);assert.equal(p.metricContexts.conversion.reportedValue,false);
 a.players[0].metricContexts.shots.captured_at=older;p=profiles.restore(b,a).players[0];assert.equal(p.conversion,null);assert.equal(p.metricContexts.conversion,undefined);
});
test('an update cannot regress a newer saved profile, including its known position, aliases and real zero',()=>{
 const previous=capture(),aggregate=capture(newer,'—'),saved='2026-11-08T12:00:00Z';
 Object.assign(previous.players[0],{interceptions:0,positionContext:{source:'FotMob',identityVerified:true,captured_at:saved},nameAliases:['Published alias'],metricContexts:{interceptions:context(saved)}});
 const stale={id:'10',team_id:'1',pos:'MED',positionContext:{source:'FotMob',identityVerified:true,captured_at:older},captured_at:older,values:{interceptions:3},contexts:{interceptions:context(older)}};
 let p=profiles.apply(aggregate,[stale],previous).players[0];assert.equal(p.pos,'DEL');assert.equal(p.interceptions,0);assert.equal(p.metricContexts.interceptions.captured_at,saved);assert(p.nameAliases.includes('Published alias'));
 const current={...stale,captured_at:'2026-11-10T12:00:00Z',positionContext:{...stale.positionContext,captured_at:'2026-11-10T12:00:00Z'},values:{interceptions:2},contexts:{interceptions:context('2026-11-10T12:00:00Z')}};
 p=profiles.apply(aggregate,[current],previous).players[0];assert.equal(p.pos,'MED');assert.equal(p.interceptions,2);
 previous.metadata.season='2025/26';p=profiles.apply(aggregate,[],previous).players[0];assert.equal(p.pos,'—');assert.equal(p.interceptions,null);
});
test('fresh profiles do not derive conversion from different samples even with an equal capture timestamp',()=>{
 const date='2026-11-10T12:00:00Z',data=capture(),profile={id:'10',team_id:'1',pos:'DEL',captured_at:date,values:{goals:1,shots:10},contexts:{goals:context(date),shots:{...context(date),minutes:450,matches:5}}};
 const p=profiles.apply(data,[profile]).players[0];assert.equal(p.goals,1);assert.equal(p.shots,10);assert.equal(p.conversion,null);assert.equal(p.metricContexts.conversion,undefined);
});
test('public cached aggregates retain published profiles without upstream calls; published mode bypasses caches',async()=>{
 const published=capture(),aggregate=capture(newer,'—');published.players[0].completed=20;published.players[0].metricContexts.completed=context();
 const path='/downloads/fotmob-laliga-2026-27.json',assets={[path]:{type:'application/json',sha:'fixture',gzip:gzipSync(JSON.stringify(published)).toString('base64')}};let fetches=0,reads=0;
 const options={cache:{async match(){reads++;return new Response(JSON.stringify(aggregate));}},fetcher:async()=>{fetches++;throw new Error('Unexpected upstream');}};
 let r=await worker.handle(new Request('https://grada.test'+path),assets,options),data=await r.json();assert.equal(data.players[0].pos,'DEL');assert.equal(data.players[0].completed,20);assert.equal(data.metadata.imported_at,newer);assert.equal(r.headers.get('Cache-Control'),'no-store');
 r=await worker.handle(new Request('https://grada.test'+path,{method:'HEAD'}),assets,options);assert.equal(await r.text(),'');
 reads=0;r=await worker.handle(new Request('https://grada.test'+path+'?capture=published'),assets,options);assert.deepEqual(await r.json(),published);assert.equal(reads,0);assert.equal(fetches,0);
 aggregate.metadata.season='2025/26';r=await worker.handle(new Request('https://grada.test'+path),assets,options);assert.deepEqual(await r.json(),published);
});
