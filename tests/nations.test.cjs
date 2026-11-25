'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),nations=require('../dist/nations.js'),nationality=require('../dist/nationality.js');
const at='2026-11-14T12:00:00Z';
function player(id,pos,codes,score=0.5,minutes=300,league='laliga',profile=null){
 const raw={id:String(id),team_id:'1',pos,tacticalPositions:codes,tacticalContext:{source:'FotMob',identityVerified:true,player_id:String(id),team_id:'1',league_key:league,season:'2026/27',captured_at:at},nationality:{code:'ESP',name:'Spain',nationalTeamId:'6720',context:{source:'FotMob',identityVerified:true,player_id:String(id),team_id:'1',league_key:league,season:'2026/27',captured_at:at,url:'https://www.fotmob.com/teams/1/squad/isolated',kind:'squad_country'}}};
 return {person:String(id),score,midfieldProfile:profile,player:{id:league+':'+id,name:'Isolated player '+id,team_id:'1',team:'Isolated club',league_key:league,pos,minutes,sourceRecords:{FotMob:raw}}};
}
function fixture(){
 const rows=[player(1,'POR',['GK'],0.4,900),player(2,'DEF',['LB']),player(3,'DEF',['CB']),player(4,'DEF',['CB']),player(5,'DEF',['RB']),player(6,'MED',['CDM'],0.5,300,'laliga','MED_DEF'),player(7,'MED',['CM','CAM'],0.5,300,'laliga','MED_ATT'),player(8,'MED',['CM'],0.5,300,'laliga','MED_BALANCED'),player(9,'DEL',['LW']),player(10,'DEL',['RW']),player(11,'DEL',['ST'],0.9,200)];
 return {rows,model:{data:{players:rows.map(r=>r.player),teams:[{id:'1',name:'Isolated club',sourceRecords:{FotMob:{id:'101'}}}]},players:new Map(rows.map(r=>[r.player,{score:r.score,profileLabel:r.midfieldProfile||r.player.pos}])),roles:new Map(rows.map(r=>[r.player,r.midfieldProfile]))}};
}
test('complete coherent XI preserves player scores, data and the exact arithmetic mean, including zero',()=>{
 const {rows,model}=fixture(),before=JSON.stringify(model.data),country=nations.build(model).countries[0];assert(country.complete);assert.equal(country.selected,11);assert.equal(new Set(country.slots.map(s=>s.candidate.person)).size,11);assert.equal(country.formation,'4-3-3');
 const expected=rows.reduce((s,r)=>s+r.score,0)/11;assert(Math.abs(country.score-expected)<1e-12);assert.equal(JSON.stringify(model.data),before);
 const weighted=rows.reduce((s,r)=>s+r.score*r.player.minutes,0)/rows.reduce((s,r)=>s+r.player.minutes,0);assert(Math.abs(country.score-weighted)>0.01);assert(Math.abs(country.units.DEL.score-1.9/3)<1e-12);
 const identities=country.slots.map(s=>s.candidate.person);for(let i=0;i<rows.length;i++)rows[i].player.minutes=200+i*1700;const updated=nations.build(model).countries[0];assert.equal(updated.score,country.score);assert.deepEqual(updated.units,country.units);assert.equal(updated.formation,country.formation);assert.deepEqual(updated.slots.map(s=>s.candidate.person),identities);
 for(const row of rows)model.players.get(row.player).score=0;const zero=nations.build(model).countries[0];assert(zero.complete);assert.equal(zero.score,0);assert(nations.ranking(nations.build(model)).includes('0,000'));
});
test('missing roles, missing scores, insufficient minutes and unknown country cannot manufacture a complete XI',()=>{
 for(const change of [f=>f.rows[1].player.sourceRecords.FotMob.tacticalPositions=['CB'],f=>f.model.players.get(f.rows[5].player).score=null,f=>f.rows[10].player.minutes=199,f=>delete f.rows[0].player.sourceRecords.FotMob.nationality]){
  const f=fixture();change(f);const result=nations.build(f.model),country=result.countries[0];assert(!country.complete);assert.equal(country.score,null);assert(country.missing.length>0);assert(nations.lineup(country,result).includes('Once incompleto'));
 }
 const f=fixture();f.rows[10].player.minutes=200;assert(nations.build(f.model).countries[0].complete);
});
test('one provider ID appears once across leagues; most minutes wins rather than best score, conflicting countries excluded',()=>{
 const f=fixture(),duplicate=player(1,'POR',['GK'],0.1,1000,'serie-a');f.model.data.players.push(duplicate.player);f.model.players.set(duplicate.player,{score:duplicate.score});
 const result=nations.build(f.model),keeper=result.countries[0].slots.find(s=>s.pos==='POR').candidate;assert.equal(keeper.score,0.1);assert.equal(keeper.player.league_key,'serie-a');assert.equal(result.coverage.duplicateRecords,1);assert.equal(result.countries[0].selected,11);
 duplicate.player.sourceRecords.FotMob.nationality.code='ARG';duplicate.player.sourceRecords.FotMob.nationality.name='Argentina';duplicate.player.sourceRecords.FotMob.nationality.nationalTeamId='6706';const conflict=nations.build(f.model);assert.equal(conflict.coverage.conflicts,1);assert.equal(conflict.countries[0].score,null);
});
test('all loaded leagues supply national candidates while duplicate country conflicts stay excluded',()=>{
 const f=fixture(),outside=player(12,'POR',['GK'],0.99,9000,'belgium');f.model.data.players.push(outside.player);f.model.players.set(outside.player,{score:outside.score});
 const result=nations.build(f.model);assert(result.countries[0].complete);assert.equal(result.countries[0].slots.find(s=>s.pos==='POR').candidate.score,0.99);assert.equal(result.coverage.records,12);assert.equal(result.coverage.excludedRecords,0);assert.equal(result.scope,'leagues');
});
test('dynamic field and score-first tables show real club IDs, evidence, score profiles and seven alternatives safely',()=>{
 const {model}=fixture(),result=nations.build(model),country=result.countries[0],ranking=nations.ranking(result),html=nations.lineup(country,result);
 assert(ranking.match(/<th\b[^>]*>(.*?)<\/th>/)[1].includes('Score'));assert(html.includes('4-3-3'));assert(html.includes('suma de los once scores / 11'));assert(!html.includes('Σ(score × minutos'));assert(!html.includes('style='));assert(!html.includes('onclick='));assert(html.includes('data-national-player='));assert(nations.options(result,'ESP').includes('selected'));
 assert.equal((html.match(/class="nation-club"/g)||[]).length,11);assert.equal((html.match(/class="nation-club">[\s\S]*?src="\/assets\/clubs\/101.png"/g)||[]).length,11);assert(html.includes('Perfil del score'));assert(html.includes('Encaje'));assert(html.includes('Los siete sistemas'));assert.equal(country.alternatives.length,7);
 model.data.players[0].name='<img src=x onerror=alert(1)>';assert(nations.lineup(nations.build(model).countries[0],nations.build(model)).includes('&lt;img'));assert.equal(nationality.label({code:'ESP',name:'Spain'}),'España');
 model.data.teams[0].sourceRecords.FotMob.id='../../fake';const fallback=nations.lineup(country,result);assert(!fallback.includes('/assets/clubs/'));assert(fallback.includes('club-monogram'));
});
test('national eligibility uses the verified canonical season minutes when league and cup have been combined',()=>{
 const f=fixture(),p=f.rows[10].player;p.minutes=150;f.model.players.get(p).scoreSample={minutes:250};assert(nations.build(f.model).countries[0].complete);f.model.players.get(p).scoreSample.minutes=199;assert(!nations.build(f.model).countries[0].complete);
});
