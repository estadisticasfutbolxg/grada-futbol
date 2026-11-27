'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),S=require('../dist/scores'),{fixture}=require('./helpers/explore.cjs'),{harness}=require('./helpers/app-harness.cjs');
test('coverage counts a zero score and assigns each pending player one explicit reason',()=>{
 const cases=[
  {score:0,minutes:200,pos:'DEL'},
  {score:0.4,minutes:400,pos:'DEF'},
  {score:null,minutes:199,pos:'DEL',missingAxes:['conversion']},
  {score:null,minutes:null,pos:'DEL'},
  {score:null,minutes:400,pos:'—'},
  {score:null,minutes:400,pos:'DEF',identityConflict:true},
  {score:null,minutes:400,pos:'DEL',missingAxes:['conversion']},
  {score:null,minutes:400,pos:'DEL',insufficientSamples:[{key:'conversion',minutes:90}]},
  {score:null,minutes:400,pos:'DEL',missingAxes:['dribblesPer90'],insufficientSamples:[{key:'conversion',minutes:90}]},
  {score:null,minutes:400,pos:'MED'}
 ];
 const players=cases.map((p,i)=>({id:String(i),minutes:p.minutes,pos:p.pos})),model={data:{players},players:new Map(players.map((p,i)=>[p,cases[i]]))},report=S.coverage(model);
 assert.equal(report.total,10);assert.equal(report.valid,2);assert.equal(report.pending,8);assert.equal(report.reasons.reduce((n,r)=>n+r.count,0),8);assert(report.reasons.every(r=>r.count===1));
 assert.deepEqual(report.missingMetrics,[{key:'conversion',count:1},{key:'dribblesPer90',count:1}]);
 assert.deepEqual(S.coverage({data:{players:[]},players:new Map()}),{total:0,valid:0,pending:0,minimumMinutes:200,reasons:[],missingMetrics:[]});
});
test('coverage uses season minutes and position instead of the selected competition appearance',()=>{
 const player={id:'one',pos:'—',minutes:10},profile={score:null,scoreRecord:{pos:'DEL',minutes:300},scoreSample:{minutes:300},missingAxes:['conversion']},model={data:{players:[player]},players:new Map([[player,profile]])};
 assert.deepEqual(S.coverage(model).reasons,[{key:'metrics',label:'Métricas necesarias ausentes',count:1}]);
 profile.score=0;assert.equal(S.coverage(model).valid,1);
});
test('home coverage follows selection and a refreshed model, safely renders labels, and never hides a real zero',()=>{
 const h=harness(),d=fixture();d.players.find(p=>p.pos==='DEL').minutes=199;d.players.find(p=>p.id==='DEL1').conversion=null;
 h.run("datasets.set('laliga',{combined:incoming});initialLoadsComplete=true;activateLeague('laliga');navigate('overview',false)",{incoming:d});
 const report=h.run('GradaScores.coverage(scoreModel)');assert.equal(report.total,32);assert.equal(report.valid+report.pending,32);assert.equal(report.reasons.reduce((n,r)=>n+r.count,0),report.pending);
 const html=h.node('#score-coverage').innerHTML;assert.equal(h.node('#score-coverage').hidden,false);assert.match(html,/Con score/);assert.match(html,/Sin score/);assert.match(html,/Menos de 200 minutos/);assert.match(html,/Métricas necesarias ausentes/);assert.match(html,/Conversión|Conv/);assert(!/NaN|undefined/.test(html));
 const next=structuredClone(d);next.players.find(p=>p.id==='DEL0').minutes=200;next.players.find(p=>p.id==='DEL1').conversion=0;
 h.run("datasets.set('laliga',{combined:incoming});activateLeague('laliga')",{incoming:next});assert(h.run('GradaScores.coverage(scoreModel).valid')>report.valid);assert.notEqual(h.node('#score-coverage').innerHTML,html);
 h.run("data={metadata:{},players:[],teams:[]};loaded=true;scoreModel=GradaScores.build(data);renderScoreCoverage()");assert.match(h.node('#score-coverage').innerHTML,/No hay jugadores/);assert.match(h.node('#score-coverage').innerHTML,/max="1" value="0"/);
 h.run('loaded=false;renderScoreCoverage()');assert.equal(h.node('#score-coverage').hidden,true);
 const markup=fs.readFileSync(require.resolve('../dist/index.html'),'utf8');assert(markup.includes('aria-labelledby="score-coverage-title"'));assert(markup.indexOf('id="score-coverage"')>markup.indexOf('id="overview"'));assert(markup.indexOf('id="score-coverage"')<markup.indexOf('id="leaders"'));
});
