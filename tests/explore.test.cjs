'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),explore=require('../dist/explore.js'),clubs=require('../dist/clubs.js'),scores=require('../dist/scores.js'),scopes=require('../dist/scopes.js');
const {fixture}=require('./helpers/explore.cjs');
test('score is physically before rank and names, including an active team unit; inputs stay intact',()=>{
 const keys=['name','team','goals','radarArea','goals'];assert.deepEqual(explore.scoreFirst(keys),['radarArea','rank','name','team','goals']);assert.equal(keys[0],'name');
 assert.deepEqual(explore.scoreFirst(['name','teamArea','defenseArea','areaPlayers'],'defenseArea'),['defenseArea','rank','name','teamArea','areaPlayers']);
});
test('brief help stays compact while retaining the measure and rate meaning',()=>{
 const full='Una definición con mucho contexto '.repeat(50);assert(explore.shortHelp('tackles',full).length<=170);
 assert(explore.shortHelp('xg',full,{per90:true}).startsWith('Por 90 minutos.'));assert.match(explore.shortHelp('radarArea',full),/0 y 1/);
 assert.match(explore.shortHelp('radarArea',full,{team:true}),/ponderada por minutos/);assert.match(explore.shortHelp('savepct','Paradas divididas entre tiros a puerta. Más contexto.'),/tiros a puerta\.$/);
});
test('multi-club filter uses OR over canonical IDs, preserves all on empty and never attributes transfers to one club',()=>{
 const data=fixture(),one=data.players[0],two=data.players[7],multi={id:'x',team_id:null,team:'One, Two'};
 assert(explore.matchesTeams(one,new Set(['1','2']),data.teams));assert(explore.matchesTeams(two,new Set(['1','2']),data.teams));assert(!explore.matchesTeams(two,new Set(['1']),data.teams));
 assert(explore.matchesTeams(two,new Set(),data.teams));assert(!explore.matchesTeams(multi,new Set(['1','2']),data.teams));assert(explore.matchesTeams(multi,new Set([clubs.multiKey]),data.teams));
 assert(explore.matchesTeams(data.teams[1],new Set(['2']),data.teams,{team:true}));assert(!explore.matchesTeams(data.teams[0],new Set(['2']),data.teams,{team:true}));
 assert(explore.matchesTeams(data.teams[0],new Set([clubs.multiKey]),data.teams,{team:true}));
 assert.deepEqual([...explore.selection(clubs.options(data),new Set(['1','stale']))],['1']);
 const all=scopes.aggregate([data,{...data,metadata:{...data.metadata,league_key:'premier-league'}}]);
 assert(!explore.matchesTeams(all.players.find(p=>p.id==='premier-league:POR0'),new Set(['laliga:1']),all.teams));
});
test('comparison resolves distinct valid teams without mutating choices, including empty/single-team states',()=>{
 const data=fixture(),choices=['stale','1','1'];assert.deepEqual(explore.pair(data.teams,choices),['1','2']);assert.deepEqual(choices,['stale','1','1']);
 assert.equal(explore.compareTeams(null,[]),null);assert.equal(explore.compareTeams(scores.build({...data,teams:data.teams.slice(0,1)}),['1','1']),null);
 assert.match(explore.renderTeamComparison(null),/dos equipos distintos/);
});
test('comparison uses exactly the existing overall and every line summary, without recomputing reference or scores',()=>{
 const data=fixture(),model=scores.build(data),before=JSON.stringify(data),playerScores=[...model.players.values()].map(p=>p.score),comparison=explore.compareTeams(model,['1','2']);
 for(const row of comparison.rows)for(const [side,id]of [['left','1'],['right','2']]){
  const source=(row.key==='ALL'?model.overall:model.units.get(row.key)).teams.get(id);
  assert.equal(row[side].value,source.area);assert.equal(row[side].known,source.validPlayers);assert.equal(row[side].total,source.totalPlayers);assert.equal(row[side].minutes,source.minutes);
 }
 assert.equal(JSON.stringify(data),before);assert.deepEqual([...model.players.values()].map(p=>p.score),playerScores);
});
test('goals/90 uses the goals provider minutes and retains a real zero; missing KPIs stay absent',()=>{
 const comparison=explore.compareTeams(scores.build(fixture()),['1','2']),goals=comparison.kpis.find(k=>k.key==='goalsPer90');
 assert.equal(goals.left.value,2);assert.equal(goals.left.matches,2);assert.equal(goals.left.source,'Understat');assert.equal(goals.right.value,0);assert.equal(goals.right.matches,4);
 assert(!comparison.kpis.some(k=>k.key==='xg90'));assert(!comparison.kpis.some(k=>k.key==='yellowCards'));
 const data=fixture();data.teams[0].metricContexts.goals.minutes=null;assert.equal(explore.compareTeams(scores.build(data),['1','2']).kpis.find(k=>k.key==='goalsPer90').left.value,null);
});
test('cards are known assigned-player sums with explicit partial coverage and no foreign source or transfer inflation',()=>{
 const data=fixture(),p=data.players[0],q=data.players[1];
 p.yellowCards=0;p.redCards=1;p.metricContexts={yellowCards:{source:'FotMob'},redCards:{source:'FotMob'}};
 q.yellowCards=8;q.metricContexts={yellowCards:{source:'ESPN'}};
 data.players.push({id:'transfer',team_id:null,team:'One, Two',yellowCards:90,metricContexts:{yellowCards:{source:'FotMob'}}});
 const c=explore.compareTeams(scores.build(data),['1','2']),yellow=c.kpis.find(k=>k.key==='yellowCards'),red=c.kpis.find(k=>k.key==='redCards');
 assert.equal(yellow.left.value,0);assert.equal(yellow.left.known,1);assert.equal(yellow.left.total,16);assert.equal(yellow.left.partial,true);assert.equal(yellow.right.value,null);assert.equal(red.left.value,1);assert.equal(yellow.advantage,null);
 const html=explore.renderTeamComparison(c);assert.match(html,/FotMob · 1\/16 jugadores con dato · parcial/);assert.match(html,/no representan un total oficial/);
});
test('unit comparisons never call an unknown value a win; visible three-decimal ties agree with the label',()=>{
 assert.equal(explore.advantage(null,.4),null);assert.equal(explore.advantage(0,.4),'right');assert.equal(explore.advantage(.4,.5,true),'left');assert.equal(explore.advantage(.43211,.43241),'tie');
 const data=fixture();for(const p of data.players.filter(p=>p.pos==='DEF'&&p.team_id==='1'))p.minutes=0;
 const row=explore.compareTeams(scores.build(data),['1','2']).rows.find(r=>r.key==='DEF');assert.equal(row.left.value,null);assert.equal(row.advantage,null);
});
test('rendered comparison escapes provider text, keeps score first and uses CSP-compatible numeric bars',()=>{
 const data=fixture();data.teams[0].name='<img src=x onerror=alert(1)>';data.teams[0].id='1" onfocus="alert(2)';for(const p of data.players.filter(p=>p.team_id==='1'))p.team_id=data.teams[0].id;
 const html=explore.renderTeamComparison(explore.compareTeams(scores.build(data),[data.teams[0].id,'2']));
 assert.match(html,/<tr><th>Score general<\/th><th>Equipo/);assert.match(html,/&lt;img/);assert(!html.includes('<img'));assert(!html.includes('style='));assert.match(html,/<rect width="[\d.]+" height="4"/);assert.match(html,/con score/);
});
