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
