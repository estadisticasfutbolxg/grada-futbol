'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),nations=require('../dist/nations.js'),nationality=require('../dist/nationality.js');
const at='2026-11-14T12:00:00Z';
function player(id,pos,codes,score=0.5,minutes=300,league='laliga'){
 const raw={id:String(id),team_id:'1',pos,tacticalPositions:codes,tacticalContext:{source:'FotMob',identityVerified:true,player_id:String(id),team_id:'1',league_key:league,season:'2026/27',captured_at:at},nationality:{code:'ESP',name:'Spain',nationalTeamId:'6720',context:{source:'FotMob',identityVerified:true,player_id:String(id),team_id:'1',league_key:league,season:'2026/27',captured_at:at,url:'https://www.fotmob.com/teams/1/squad/isolated',kind:'squad_country'}}};
 return {person:String(id),score,player:{id:league+':'+id,name:'Isolated player '+id,team_id:'1',team:'Isolated club',league_key:league,pos,minutes,sourceRecords:{FotMob:raw}}};
}
function fixture(){const rows=[player(1,'POR',['GK'],0.4,900),player(2,'DEF',['LB']),player(3,'DEF',['CB']),player(4,'DEF',['CB']),player(5,'DEF',['RB']),...Array.from({length:4},(_,i)=>player(6+i,'MED',['CM'])),player(10,'DEL',['ST']),player(11,'DEL',['ST'],0.9,200)];return {rows,model:{data:{players:rows.map(r=>r.player),teams:[{id:'1',name:'Isolated club'}]},players:new Map(rows.map(r=>[r.player,{score:r.score}]))}};}
test('complete 4-4-2 uses unchanged scores and the exact minutes-weighted mean, including valid zero',()=>{
 const {rows,model}=fixture(),before=JSON.stringify(model.data),country=nations.build(model).countries[0];assert(country.complete);assert.equal(country.selected,11);assert.equal(new Set(country.slots.map(s=>s.candidate.person)).size,11);
 const expected=rows.reduce((s,r)=>s+r.score*r.player.minutes,0)/rows.reduce((s,r)=>s+r.player.minutes,0);assert(Math.abs(country.score-expected)<1e-12);assert(country.score>=0.4&&country.score<=0.9);assert.equal(JSON.stringify(model.data),before);
 for(const[pos,count]of Object.entries({POR:1,DEF:4,MED:4,DEL:2}))assert.equal(country.slots.filter(s=>s.pos===pos&&s.candidate).length,count);
 for(const row of rows)model.players.get(row.player).score=0;const zero=nations.build(model).countries[0];assert(zero.complete);assert.equal(zero.score,0);assert(nations.ranking(nations.build(model)).includes('0,000'));
});
test('defender matching fills all published roles without reusing a versatile player or choosing a greedy dead end',()=>{
 const rows=[player(1,'DEF',['LB','CB'],0.9),player(2,'DEF',['LB'],0.8),player(3,'DEF',['CB'],0.7),player(4,'DEF',['RB'],0.6)];
 const slots=nations.defense(rows);assert(slots.every(s=>s.candidate));assert.equal(slots.find(s=>s.key==='LI').candidate.person,'2');assert.equal(new Set(slots.map(s=>s.candidate.person)).size,4);
});
test('incomplete positions, missing scores or insufficient minutes keep the national score unknown',()=>{
 for(const change of [f=>f.rows[1].player.sourceRecords.FotMob.tacticalPositions=['CB'],f=>f.model.players.get(f.rows[5].player).score=null,f=>f.rows[10].player.minutes=199,f=>delete f.rows[0].player.sourceRecords.FotMob.nationality]){
  const f=fixture();change(f);const country=nations.build(f.model).countries[0];assert(!country.complete);assert.equal(country.score,null);assert(country.missing.length>0);assert(nations.lineup(country,nations.build(f.model)).includes('Once incompleto'));
 }
});
test('one verified provider ID appears once across leagues; the record with more minutes wins, not the largest score',()=>{
 const f=fixture(),duplicate=player(1,'POR',['GK'],0.1,1000,'serie-a');f.model.data.players.push(duplicate.player);f.model.players.set(duplicate.player,{score:duplicate.score});
 const result=nations.build(f.model),keeper=result.countries[0].slots.find(s=>s.pos==='POR').candidate;assert.equal(keeper.score,0.1);assert.equal(keeper.player.league_key,'serie-a');assert.equal(result.coverage.duplicateRecords,1);assert.equal(result.countries[0].selected,11);
 duplicate.player.sourceRecords.FotMob.nationality.code='ARG';duplicate.player.sourceRecords.FotMob.nationality.name='Argentina';duplicate.player.sourceRecords.FotMob.nationality.nationalTeamId='6706';const conflict=nations.build(f.model);assert.equal(conflict.coverage.conflicts,1);assert.equal(conflict.countries[0].score,null);
});
test('rendering keeps score as first column and labels simulated/incomplete teams without claiming official selection',()=>{
 const {model}=fixture(),result=nations.build(model),country=result.countries[0],ranking=nations.ranking(result),html=nations.lineup(country,result);
 assert(ranking.match(/<th\b[^>]*>(.*?)<\/th>/)[1].includes('Score'));assert(html.includes('4-4-2'));assert(html.includes('minutos de club'));assert(!html.includes('style='));assert(!html.includes('onclick='));assert(html.includes('data-national-player='));assert(nations.options(result,'ESP').includes('selected'));
 model.data.players[0].name='<img src=x onerror=alert(1)>';assert(nations.lineup(nations.build(model).countries[0],nations.build(model)).includes('&lt;img'));assert.equal(nationality.label({code:'ESP',name:'Spain'}),'España');
});
