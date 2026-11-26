'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const fairplay=require('../dist/fairplay.js'),radar=require('../dist/radar.js'),scores=require('../dist/scores.js'),metrics=require('../dist/metrics.js'),scopes=require('../dist/scopes.js');
const date='2026-11-18T08:00:00Z',context=(minutes=900)=>({source:'FotMob',minutes,matches:10,captured_at:date});
function cardRecord(yellow=0,red=0){return {pos:'DEF',minutes:9000,yellowCards:yellow,redCards:red,metricContexts:{yellowCards:context(),redCards:context()}};}
function fixture(league='laliga'){
 const players=Array.from({length:12},(_,i)=>{
  const raw={id:String(i+1),team_id:'1',pos:'DEF',tacticalPositions:['LB'],tacticalContext:{source:'FotMob',identityVerified:true,player_id:String(i+1),team_id:'1',captured_at:date}},v=i+1;
  return {...cardRecord(),id:'combined:'+i,name:'Isolated fullback '+i,team_id:'t',team:'Isolated team',pos:'DEF',minutes:900,matches:10,tackles:v,interceptions:13-v,recoveries:2*v,goals:v,xg:v/2,xa:v/3,clearances:v,blocks:v,completed:300+v,sourceRecords:{FotMob:raw}};
 });
 return {metadata:{kind:'combined',league_key:league,source:'Isolated fixture only',competition:league,imported_at:date,imported_matches:10,available_matches:380,combination:{matched_players:0},sources:{}},players,teams:[{id:'t',name:'Isolated team',matches:10}],matches:[]};
}
test('linear discipline uses paired own minutes, weights a red as ten yellows and cannot improve the base score',()=>{
 const base={score:0.8,comparableArea:0.8,minimumMinutes:450},record=cardRecord(2,1),applied=fairplay.apply(record,base);
 assert(Math.abs(applied.fairPlay.weightedCardsPer90-1.2)<1e-12);assert(Math.abs(applied.score-0.704)<1e-12);assert.equal(applied.baseScore,0.8);
 assert.equal(fairplay.evaluate(cardRecord(10,0)).factor,fairplay.evaluate(cardRecord(0,1)).factor);
 assert(fairplay.evaluate(cardRecord(1,0)).factor>fairplay.evaluate(cardRecord(0,1)).factor);
 let previous=1;
 for(const count of [0,1,2,5,10,100,10000]){const info=fairplay.evaluate(cardRecord(count,count));assert(info.factor<=previous);assert(info.factor>=0&&info.factor<=1);previous=info.factor;}
 const doubled=cardRecord(4,2);for(const c of Object.values(doubled.metricContexts))c.minutes=1800;assert.equal(fairplay.evaluate(doubled).factor,applied.fairPlay.factor);
 assert.equal(fairplay.apply(cardRecord(),base).score,0.8);assert.equal(fairplay.apply(record,{...base,score:0}).score,0);assert.equal(fairplay.apply(record,{...base,score:null}).score,null);
});
test('each extra yellow or red has a constant marginal penalty until zero, with no 10 percent ceiling',()=>{
 const base={score:0.8,minimumMinutes:450},of=(y,r)=>fairplay.apply(cardRecord(y,r),base);
 assert(Math.abs(of(5,1).score-0.68)<1e-12);assert.equal(of(5,1).fairPlay.method,'linear_cards_v2');
 assert(Math.abs(of(5,1).fairPlay.penaltyFraction-0.15)<1e-12);
 assert(Math.abs(of(5,1).fairPlay.yellowPenaltyFraction-0.05)<1e-12);
 assert(Math.abs(of(5,1).fairPlay.redPenaltyFraction-0.10)<1e-12);
 for(const count of [0,1,5,10,20]){
  const yellowDelta=of(count,0).score-of(count+1,0).score;
  assert(Math.abs(yellowDelta-0.008)<1e-12,'Accumulating yellow cards must not weaken their marginal penalty');
  const redDelta=of(count,0).score-of(count,1).score;assert(Math.abs(redDelta-0.08)<1e-12);
 }
 assert.equal(of(0,10).score,0);assert.equal(of(100,100).score,0);assert.equal(of(100,100).fairPlay.factor,0);
 assert(of(100,100).fairPlay.rawPenaltyFraction>1);assert.equal(of(100,100).fairPlay.penaltyFraction,1);
 const tiny=cardRecord(1,0);for(const c of Object.values(tiny.metricContexts))c.minutes=Number.MIN_VALUE;
 assert.equal(fairplay.evaluate(tiny,0).status,'invalid_rate');assert.equal(fairplay.evaluate(cardRecord(),NaN).status,'insufficient_sample');
});
test('unknown counts, incompatible samples and insufficient card minutes never become verified clean play',()=>{
 for(const change of [p=>p.redCards=null,p=>p.yellowCards='0',p=>p.redCards=-1,p=>p.yellowCards=0.5,p=>p.redCards=Number.MAX_SAFE_INTEGER+1,p=>p.metricContexts.redCards.source='Other',p=>p.metricContexts.redCards.minutes=901,p=>p.metricContexts.redCards.matches=11,p=>{p.metricContexts.yellowCards.sample_id='a';p.metricContexts.redCards.sample_id='b';},p=>{for(const c of Object.values(p.metricContexts))c.minutes=100;},p=>{for(const c of Object.values(p.metricContexts))c.minutes=null;}]){
  const p=cardRecord();change(p);const result=fairplay.apply(p,{score:0.8,minimumMinutes:450});assert.notEqual(result.fairPlay.status,'verified');assert.equal(result.fairPlay.factor,null);assert.equal(result.fairPlay.scoreDeduction,null);assert.equal(result.score,0.8);
 }
 const p=cardRecord();p.metricContexts.redCards.captured_at='2026-11-18T09:00:00Z';assert.equal(fairplay.evaluate(p).status,'verified','query time alone does not change the declared sample');
});
test('a fullback has one mixed radar, its own peer group and measurable offensive contribution',()=>{
 const data=fixture(),p=data.players[0];p.goals=0;const before=scores.build(data),first=before.players.get(p);
 assert.equal(first.profileKey,'DEF_FB');assert.deepEqual(first.expectedAxes,['tackles','interceptions','recoveries']);assert(first.axes.every(a=>a.referenceCount===12));
 p.goals=20;const next=scores.build(data),profile=next.players.get(p);assert(profile.score>first.score);assert.equal(profile.area,radar.relativeArea(profile.axes.map(a=>a.percentile)));assert.equal(profile.baseScore,profile.attack.score);
 const central={...data.players.at(-1),id:'central',sourceRecords:{FotMob:{...data.players.at(-1).sourceRecords.FotMob,tacticalPositions:['CB']}},goals:10000,xg:10000,xa:10000};
 const withCentral=scores.build({...data,players:[...data.players,central]});assert.equal(withCentral.players.get(p).score,profile.score);assert.equal(withCentral.players.get(central).profileKey,'DEF');
 p.sourceRecords.FotMob.tacticalPositions=['CB','RB'];const mixed=scores.build(data);for(const key of ['DEF','DEF_CB','DEF_FB']){assert(scores.eligible(mixed,p,radar.definition(key)));assert.equal(scores.value(mixed,p,radar.definition(key)),mixed.players.get(p).score);}
});
test('discipline does not change midfield classification, and all scopes/teams use the same adjusted score',()=>{
 const a=fixture('laliga'),b=fixture('premier-league'),p=a.players[0];p.yellowCards=2;p.redCards=1;
 const reference=scopes.aggregate([a,b]),all=scores.build(reference),local=scores.build(a,{referencePlayers:reference.players}),joined=reference.players.find(q=>q.id==='laliga:'+p.id),profile=local.players.get(p);
 assert.equal(profile.score,all.players.get(joined).score);assert(profile.score<profile.baseScore);assert.equal(radar.profile(p,reference.players).score,profile.score);
 const member=local.overall.teams.get('t').players.find(m=>m.id===p.id);assert.equal(member.area,profile.score);assert.equal(member.baseScore,profile.baseScore);assert.equal(member.fairPlayStatus,'verified');
 const before=JSON.stringify(a),generated=scores.withScores(a,{referencePlayers:reference.players});assert.equal(JSON.stringify(a),before);assert.equal(generated.players[0].playerBaseScore,profile.baseScore);assert.equal(generated.players[0].playerScore,profile.score);assert.equal(generated.players[0].fairPlay.factor,profile.fairPlay.factor);assert.equal(generated.metadata.derived_metrics.playerScore.method,'role_fairplay_radar_v10');
 const repeated=scores.withScores(generated,{referencePlayers:reference.players});assert.equal(repeated.players[0].playerScore,profile.score,'Reopening a generated capture must not apply discipline twice');
 const cleaned=scopes.aggregate([generated]);assert(!Object.hasOwn(cleaned.players[0],'fairPlay'));assert(!Object.hasOwn(cleaned.players[0],'playerBaseScore'));
 const mids=fixture();for(const q of mids.players){q.pos='MED';q.chancesCreated=q.goals;q.bigChancesCreated=q.goals;q.shotsOnTargetPer90=q.goals;q.dribblesPer90=q.goals;q.accuracy=80;q.lineBreakingPasses=q.recoveries;}
 const baseline=scores.build(mids);mids.players[0].redCards=5;const adjusted=scores.build(mids);assert.equal(adjusted.roles.get(mids.players[0]),baseline.roles.get(mids.players[0]));assert.equal(adjusted.players.get(mids.players[0]).baseScore,baseline.players.get(mids.players[0]).baseScore);
});
test('rendered radar distinguishes polygon base, fair play adjustment and unknown discipline',()=>{
 const data=fixture(),p=data.players[0];p.yellowCards=2;p.redCards=1;const profile=scores.build(data).players.get(p),root={GradaRadar:radar,GradaMetrics:metrics};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist/components.js'),'utf8'),{window:root});
 const html=root.GradaComponents.radar(p,data.players,data.metadata,profile);assert(html.includes('Lateral / carrilero · ataque y defensa'));assert(html.includes('Base del score'));assert(html.includes('Aporte ofensivo'));assert(html.includes('Asistencias /90 · sin dato'));assert(html.includes('2 amarillas y 1 roja'));assert(html.includes('× factor'));assert(html.includes('10 amarillas'));assert(html.includes('penalización lineal'));assert(html.includes('Descuento por amarillas: 2 %; por rojas: 10 %'));assert(html.includes('No estima sanciones cumplidas ni minutos en inferioridad'));assert(!html.includes('ajuste limitado al 10'));
 p.redCards=null;const unknown=scores.build(data).players.get(p),note=root.GradaComponents.fairPlayNote(p,data.metadata,unknown);assert(note.includes('sin ajuste'));assert(note.includes('faltan tarjetas verificadas'));assert(!note.includes('0 rojas'));
});
test('old cached derived scores are rebuilt with v10 and never used as another penalty base',()=>{
 const data=fixture(),p=data.players[0];p.yellowCards=5;p.redCards=1;
 const fresh=scores.withScores(data),stale=structuredClone(data);
 stale.metadata.derived_metrics={playerScore:{method:'role_fairplay_radar_v4'}};
 for(const q of stale.players){q.playerScore=0.99;q.playerBaseScore=0.99;q.fairPlay={method:'old',factor:0.99};}
 const rebuilt=scores.withScores(stale);assert.equal(rebuilt.metadata.derived_metrics.playerScore.method,'role_fairplay_radar_v10');
 for(let i=0;i<data.players.length;i++){assert.equal(rebuilt.players[i].playerScore,fresh.players[i].playerScore);assert.equal(rebuilt.players[i].playerBaseScore,fresh.players[i].playerBaseScore);}
});
