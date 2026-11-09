'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {combine}=require('../dist/combined.js'),{metric}=require('../dist/metrics.js');
function fixture(){
 const meta=source=>({source,competition:'LaLiga',season:'2026/27',season_id:2026,imported_at:'2026-11-01T12:00:00Z',imported_matches:20,available_matches:380,complete:false,notes:'Isolated test response, never served'});
 const teams=Array.from({length:20},(_,i)=>({id:String(i+1),name:'Club '+i,matches:2,minutes:180,goals:2,conceded:2,xg:2,xga:2}));
 const players=teams.map((t,i)=>({id:String(i+1),name:'Jugador '+i,team_id:t.id,team:t.name,pos:'POR',matches:2,minutes:180,goals:1,assists:1,xg:2,xa:1,shots:2,saves:null,conceded:null,xga:null,psxg:null}));
 const matches=Array.from({length:20},(_,i)=>({id:String(i+1),home_id:String((i%10)*2+1),away_id:String((i%10)*2+2),home_goals:1,away_goals:1,home_xg:1,away_xg:1}));
 const u={metadata:meta('Understat'),players,teams,matches};
 const e={metadata:meta('ESPN'),matches:[],teams:teams.map((t,i)=>({...t,id:String(101+i),minutes:null,xg:null,xga:null})),players:players.map((p,i)=>({...p,id:'espn:'+i,team_id:String(101+i),minutes:null,xg:null,xa:null,xga:null,psxg:null,goals:9,assists:9,saves:12,conceded:3}))};
 return {u,e};
}
test('keeps Understat values and fills known ESPN values with their own denominators',()=>{
 const {u,e}=fixture(),before=JSON.stringify({u,e});e.players[0].matches=3;const original=JSON.stringify({u,e});
 const d=combine(u,e),p=d.players[0];
 assert.equal(d.players.length,u.players.length);assert.equal(p.goals,1);assert.equal(p.assists,1);assert.equal(p.saves,12);assert.equal(p.fieldSources.saves,'ESPN');
 assert.equal(p.matches,2);assert.equal(metric(p,'savesPerMatch'),4);assert.equal(metric(p,'saves','90'),null);
 assert.equal(metric(p,'goalsPerXg'),0.5);assert.equal(p.savepct,80);
 assert.equal(JSON.stringify({u,e}),original);assert(before.length>0);
 assert.equal(d.metadata.sources.Understat.imported_at,u.metadata.imported_at);
 assert(d.matches.every(m=>d.teams.some(t=>t.id===m.home_id)));
});
test('zeros keep priority and mismatched source ratios are unavailable',()=>{
 const {u,e}=fixture();u.players[0].goals=0;assert.equal(combine(u,e).players[0].goals,0);
 u.players[0].goals=null;const p=combine(u,e).players[0];assert.equal(p.goals,9);assert.equal(metric(p,'goalsPerXg'),null);
});
test('normalizes accents, rejects fuzzy name guesses, homonyms and team or role conflicts',()=>{
 let f=fixture();f.u.players[0].name='Álvaro García';f.e.players[0].name='Alvaro Garcia';assert.equal(combine(f.u,f.e).players[0].saves,12);
 f.e.players[0].name='Alfonso García';assert.equal(combine(f.u,f.e).players[0].saves,null);
 f=fixture();f.e.players.push({...f.e.players[0],id:'duplicate'});assert.equal(combine(f.u,f.e).players[0].saves,null);
 f=fixture();f.e.players[0].team_id='102';assert.equal(combine(f.u,f.e).players[0].saves,null);
 f=fixture();f.e.players[0].pos='DEF';assert.equal(combine(f.u,f.e).players[0].saves,null);
 f=fixture();f.u.players[0].team_id=null;assert.equal(combine(f.u,f.e).players[0].saves,null);
});
test('requires the authorized season and retains the oldest source date as capture date',()=>{
 const {u,e}=fixture();e.metadata.imported_at='2026-11-05T12:00:00Z';assert.equal(combine(u,e).metadata.imported_at,'2026-11-01T12:00:00.000Z');
 e.metadata.season='2025/26';assert.throws(()=>combine(u,e));
});

function fotmobFixture(u){
 const api=require('../dist/fotmob.js');
 return {metadata:{source:'FotMob',competition:'LaLiga',season:'2026/27',season_id:38843,league_id:87,imported_at:'2026-11-06T12:00:00Z'},teams:u.teams.map(t=>({...t})),players:u.players.map(p=>({
   ...Object.fromEntries(api.fields.map(k=>[k,null])),id:p.id,name:p.name,team_id:p.team_id,team:p.team,pos:p.pos,matches:10,minutes:700,
   passes:null,completed:null,accuracy:94.4,tackles:20,interceptions:null,recoveries:null,saves:99,prevented:-3,shotsOnTargetPer90:2.7,
   metricContexts:Object.fromEntries(['completed','accuracy','tackles','prevented','saves','shotsOnTargetPer90'].map(k=>[k,{source:'FotMob',matches:10,minutes:700,captured_at:'2026-11-06T12:00:00Z',...(k==='completed'?{reportedPer90:105.9}:k==='tackles'?{reportedPer90:2.6}:k==='accuracy'?{reportedValue:true}:{})}]))
 }))};
}
test('third source preserves priority, published rates and negative goals prevented without fabricating totals',()=>{
 const {u,e}=fixture(),f=fotmobFixture(u),before=JSON.stringify(f),p=combine(u,e,f).players[0];
 assert.equal(p.saves,12);assert.equal(p.fieldSources.saves,'ESPN');assert.equal(p.minutes,180);
 assert.equal(p.completed,null);assert.equal(p.passes,null);assert.equal(metric(p,'completedPer90'),105.9);
 assert.equal(p.accuracy,94.4);assert.equal(p.tackles,20);assert.equal(metric(p,'tackles','90'),2.6);
 assert.equal(p.metricContexts.tackles.minutes,700);assert.equal(p.metricContexts.tackles.captured_at,f.metadata.imported_at);
 assert.equal(metric(p,'prevented'),-3);assert.equal(metric(p,'shotsOnTargetPer90','90'),2.7);
 assert.equal(JSON.stringify(f),before);assert.equal(combine(u,e,f).metadata.combination.fotmob_matched_players,20);
 u.players[0].tackles=0;assert.equal(combine(u,e,f).players[0].tackles,0);
});
test('FotMob rejects season mismatches, invented counts, and ambiguous matches',()=>{
 const {u,e}=fixture(),f=fotmobFixture(u);f.metadata.season_id=2025;assert.throws(()=>combine(u,e,f));f.metadata.season_id=38843;
 f.players[0].completed=823.66;assert.throws(()=>combine(u,e,f));f.players[0].completed=null;
 f.players[0].name='Otro nombre';assert.equal(combine(u,e,f).players[0].tackles,null);
 f.players[0].name=u.players[0].name;f.players.push({...f.players[0],id:'9999'});assert.equal(combine(u,e,f).players[0].tackles,null);
});

test('reviewed Mbappe identities bridge full-name variants and retain primary values and own coverage',()=>{
 const {u,e}=fixture();u.teams[0].name=e.teams[0].name='Real Madrid';
 Object.assign(u.players[0],{id:'3423',name:'Kylian Mbappe-Lottin',team:'Real Madrid',pos:'DEL'});
 Object.assign(e.players[0],{id:'86:231388',name:'Kylian Mbappé',team:'Real Madrid',pos:'DEL'});
 const f=fotmobFixture(u);Object.assign(f.players[0],{id:'701154',name:'Kylian Mbappé',pos:'—'});
 let p=combine(u,e,f).players[0];assert.equal(p.goals,1);assert.equal(p.tackles,20);assert.equal(p.sourceRecords.FotMob.id,'701154');assert.equal(p.metricContexts.tackles.minutes,700);
 assert.deepEqual(p.combination.match_methods,{ESPN:'verified_identity',FotMob:'verified_identity'});
 f.players[0].id='701155';assert.equal(combine(u,e,f).players[0].tackles,null);f.players[0].id='701154';
 f.players[0].name='Otro Mbappé';assert.equal(combine(u,e,f).players[0].tackles,null);f.players[0].name='Kylian Mbappé';
 f.players[0].team_id='2';assert.equal(combine(u,e,f).players[0].tackles,null);f.players[0].team_id='1';
 f.players[0].pos='POR';assert.equal(combine(u,e,f).players[0].tackles,null);
});
test('saves per 90 chooses a verified source cohort without mixing the ESPN total and another provider minutes',()=>{
 const {u,e}=fixture(),f=fotmobFixture(u);f.players[0].metricContexts.saves.minutes=600;
 let p=combine(u,e,f).players[0];assert.equal(p.saves,12);assert.equal(p.fieldSources.saves,'ESPN');assert(Math.abs(metric(p,'savesPer90')-99*90/600)<1e-12);assert.equal(p.metricContexts.savesPer90.source,'FotMob');assert.equal(p.metricContexts.savesPer90.minutes,600);assert.equal(p.metricContexts.savesPer90.captured_at,f.metadata.imported_at);
 f.players[0].metricContexts.saves.reportedPer90=14.9;p=combine(u,e,f).players[0];assert.equal(metric(p,'savesPer90'),14.9);assert.equal(metric(p,'savesPer90','90'),14.9);
 delete f.players[0].metricContexts.saves.reportedPer90;f.players[0].saves=0;p=combine(u,e,f).players[0];assert.equal(metric(p,'savesPer90'),0);assert.equal(p.saves,12);
 f.players[0].name='Unmatched test record';p=combine(u,e,f).players[0];assert.equal(metric(p,'savesPer90'),null);assert.equal(p.minutes,180);assert.equal(p.saves,12);
});
