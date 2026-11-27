'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),ideal=require('../dist/ideal'),formations=require('../dist/formations'),competitions=require('../dist/competitions');
const at='2026-11-26T10:00:00Z';
function row(id,pos,codes,score=0.5,minutes=300,league='laliga',profile=null,club=101){
 const raw={id:String(id),team_id:String(club),pos,tacticalPositions:codes,tacticalContext:{source:'FotMob',identityVerified:true,player_id:String(id),team_id:String(club),league_key:league,season:'2026/27',captured_at:at}};
 const player={id:'combined:'+id,name:'Isolated player '+id,team_id:'combined:'+club,team:'Club '+club,league_key:league,pos,minutes,sourceRecords:{FotMob:raw}};
 return{player,score,profile};
}
function eleven(league='laliga',offset=0,score=0.5){return[row(offset+1,'POR',['GK'],score-0.1,900,league),row(offset+2,'DEF',['LB'],score,300,league),row(offset+3,'DEF',['CB'],score,300,league),row(offset+4,'DEF',['CB'],score,300,league),row(offset+5,'DEF',['RB'],score,300,league),row(offset+6,'MED',['CDM'],score,300,league,'MED_DEF'),row(offset+7,'MED',['CM','CAM'],score,300,league,'MED_ATT'),row(offset+8,'MED',['CM'],score,300,league,'MED_DEF'),row(offset+9,'DEL',['LW'],score,300,league),row(offset+10,'DEL',['RW'],score,300,league),row(offset+11,'DEL',['ST'],score+0.4,200,league)];}
function fixture(){
 const rows=eleven(),dataset={metadata:{league_key:'laliga'},players:rows.map(r=>r.player),teams:[{id:'combined:101',name:'Club 101',sourceRecords:{FotMob:{id:'101'}}}]};
 const canonical=rows.map(r=>({...r.player,id:'laliga:'+r.player.id,team_id:'laliga:'+r.player.team_id}));
 const model={data:{metadata:{scope:'leagues'},players:canonical,teams:dataset.teams},players:new Map(canonical.map((p,i)=>[p,{score:rows[i].score,profileLabel:rows[i].profile||p.pos}])),roles:new Map(canonical.map((p,i)=>[p,rows[i].profile]))};
 return{rows,dataset,datasets:[dataset],canonical,model};
}
test('domestic and global XI use identical canonical scores, equal player weights and seven coherent formations without nationality',()=>{
 const f=fixture(),before=JSON.stringify([f.model.data,f.datasets]),result=ideal.build(f.model,{datasets:f.datasets}),global=result.groups[0],league=result.groups.find(g=>g.id==='laliga');
 assert.equal(result.groups.length,16);assert.equal(global.id,'leagues');assert.equal(result.coverage.availableLeagues,1);assert.equal(result.coverage.expectedLeagues,15);assert(global.complete);assert.equal(global.selected,11);assert.equal(global.formation,'4-3-3');assert.equal(global.alternatives.length,7);
 assert.equal(new Set(global.slots.map(s=>s.candidate.person)).size,11);assert(Math.abs(global.score-f.rows.reduce((n,r)=>n+r.score,0)/11)<1e-12);assert.equal(league.score,global.score);
 assert(Math.abs(global.score-f.rows.reduce((n,r)=>n+r.score*r.player.minutes,0)/f.rows.reduce((n,r)=>n+r.player.minutes,0))>0.01);
 for(const s of global.slots){assert(formations.evidence(s.candidate,s.role));const p=f.canonical.find(p=>p.id===s.candidate.player.id);assert.equal(s.candidate.score,f.model.players.get(p).score);}
 assert.equal(JSON.stringify([f.model.data,f.datasets]),before);assert(!f.rows.some(r=>r.player.nationality));
 for(const value of f.model.players.values())value.score=0;const zero=ideal.build(f.model,{datasets:f.datasets});assert(zero.groups[0].complete);assert.equal(zero.groups[0].score,0);assert(ideal.ranking(zero).includes('0,000'));
});
test('canonical season minutes and score include every competition while local minutes never reweight the XI',()=>{
 const f=fixture(),p=f.rows[10].player,canonical=f.canonical[10],profile=f.model.players.get(canonical);p.minutes=150;canonical.minutes=150;profile.scoreSample={minutes:250,competitions:[{competition:'laliga'},{competition:'champions-league'}]};profile.score=0.81234567;
 const first=ideal.build(f.model,{datasets:f.datasets}).groups[0];assert(first.complete);const striker=first.slots.find(s=>s.role==='ST').candidate;assert.equal(striker.score,0.81234567);assert.equal(striker.scoreMinutes,250);
 for(const r of f.rows)r.player.minutes=9999;assert.equal(ideal.build(f.model,{datasets:f.datasets}).groups[0].score,first.score);
 profile.scoreSample.minutes=199;const insufficient=ideal.build(f.model,{datasets:f.datasets}).groups[0];assert(!insufficient.complete);assert.equal(insufficient.score,null);
});
test('league membership comes from original datasets, and global IDs are unique even after a cross-league transfer',()=>{
 const f=fixture(),duplicate=row(1,'POR',['GK'],0.99,2000,'serie-a',null,202),second={metadata:{league_key:'serie-a'},players:[duplicate.player],teams:[{id:'combined:202',name:'Club 202',sourceRecords:{FotMob:{id:'202'}}}]};
 f.datasets.push(second);const result=ideal.build(f.model,{datasets:f.datasets}),global=result.groups[0],keeper=global.slots.find(s=>s.role==='GK').candidate,italy=result.groups.find(g=>g.id==='serie-a');
 assert.equal(keeper.player.league_key,'serie-a');assert.equal(keeper.player.team_id,'serie-a:combined:202');assert.equal(keeper.player.id,f.canonical[0].id);assert.equal(keeper.score,0.4);assert.equal(result.coverage.duplicateRecords,1);assert.equal(italy.players.length,1);assert.equal(italy.players[0].person,competitions.identity(f.canonical[0]));assert.equal(global.selected,11);
 assert(result.groups.find(g=>g.id==='laliga').slots.every(s=>s.candidate.player.league_key==='laliga'));
 assert(ideal.lineup(global,result).includes('/assets/clubs/202.png'));assert(ideal.lineup(global,result).includes('Club 202'));
});
test('only first-division candidate records enter pools; unavailable leagues and insufficient roles stay explicit',()=>{
 const f=fixture(),cup=eleven('champions-league',100,0.6),cupSet={metadata:{league_key:'champions-league'},players:cup.map(r=>r.player),teams:[]};f.datasets.push(cupSet);
 for(const r of cup){f.model.data.players.push(r.player);f.model.players.set(r.player,{score:r.score});}
 const unknown=row(999,'POR',['GK']);delete unknown.player.sourceRecords.FotMob.id;f.dataset.players.push(unknown.player);
 const result=ideal.build(f.model,{datasets:f.datasets});assert.equal(result.coverage.records,12);assert.equal(result.coverage.unknownIdentity,1);assert.equal(result.coverage.availableLeagues,1);assert(!result.groups.some(g=>g.id==='champions-league'));assert.equal(result.groups[0].selected,11);assert(result.groups[0].slots.every(s=>!s.candidate.person.endsWith('101')));
 const absent=result.groups.find(g=>g.id==='portugal');assert.equal(absent.available,false);assert.equal(absent.score,null);assert(ideal.lineup(absent,result).includes('todavía no se ha cargado'));assert(ideal.lineup(result.groups[0],result).includes('Ámbito parcial'));
 f.rows[1].player.sourceRecords.FotMob.tacticalPositions=['CB'];const incomplete=ideal.build(f.model,{datasets:f.datasets}).groups[0];assert(!incomplete.complete);assert.equal(incomplete.score,null);assert(incomplete.missing.includes('Lateral izquierdo'));assert(ideal.lineup(incomplete,ideal.build(f.model,{datasets:f.datasets})).includes('score de este once queda pendiente'));
});
test('ambiguous canonical identities and keeper-field conflicts are excluded rather than chosen for score',()=>{
 for(const change of [f=>f.model.players.get(f.canonical[0]).identityConflict=true,f=>f.model.data.players.push({...f.canonical[0],id:'ambiguous'}),f=>f.canonical[0].pos='DEF']){
  const f=fixture();change(f);const result=ideal.build(f.model,{datasets:f.datasets});assert.equal(result.coverage.conflicts,1);assert(!result.groups[0].complete);assert(!result.groups[0].players.some(p=>p.person==='player:1'));
 }
});
test('league ranking is score-first, renderer shows clubs and names safely and uses generic league explanations',()=>{
 const f=fixture(),result=ideal.build(f.model,{datasets:f.datasets}),html=ideal.lineup(result.groups[0],result),ranking=ideal.ranking(result,{selected:'laliga'});
 assert(ranking.match(/<th\b[^>]*>(.*?)<\/th>/)[1].includes('Score'));assert(ranking.includes('data-ideal="laliga"'));assert(ranking.includes('/assets/flags/es.svg'));assert(html.includes('data-national-player="laliga:combined:'));assert.equal((html.match(/class="nation-club"/g)||[]).length,11);assert(html.includes('todas las competiciones disponibles'));assert(!html.includes('No son estadísticas de partidos internacionales'));assert(html.includes('suma de los once scores / 11'));assert(ideal.options(result,'leagues').includes('value="leagues" selected'));assert.equal((html.match(/class="nation-club">[\s\S]*?src="\/assets\/clubs\/101.png"/g)||[]).length,11);
 result.groups[0].name='<img src=x onerror=alert(1)>';const safe=ideal.lineup(result.groups[0],result);assert(safe.includes('&lt;img'));assert(!safe.includes('<img src=x'));
 assert.throws(()=>ideal.build(f.model,{datasets:[f.dataset,f.dataset]}),/duplicada/);
});
