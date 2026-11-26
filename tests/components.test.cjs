'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const radar=require('../dist/radar.js'),metrics=require('../dist/metrics.js');
const root={GradaRadar:radar,GradaMetrics:metrics};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist/components.js'),'utf8'),{window:root});
test('the player radar renders a valid zero score and preserves unknown metrics as pending',()=>{
 const peers=Array.from({length:6},(_,i)=>({id:String(i),pos:'DEL',minutes:600,matches:10,goals:i+1,xg:i+1,xa:i+1,shotsOnTargetPer90:i+1,dribblesPer90:i+1,conversion:i+1,shots:i+1}));
 const player={id:'zero',pos:'DEL',minutes:600,matches:10,goals:0,xg:0,xa:0,shotsOnTargetPer90:0,dribblesPer90:0,conversion:0,shots:0},metadata={source:'Isolated <source>',imported_at:'2026-11-10T12:00:00Z'};
 const profile=radar.profile(player,peers);assert.equal(profile.score,0);
 const html=root.GradaComponents.radar(player,peers,metadata,profile);assert.match(html,/<strong>0,000<\/strong>/);assert.match(html,/Los ceros publicados se incluyen/);assert(!html.includes('<source>'));
 assert.match(html,/Goles \/90/);assert.match(html,/xG \/90/);assert.match(html,/perfil completo/);assert.match(html,/contado una sola vez/);
 player.dribblesPer90=null;const pending=radar.profile(player,peers);assert.equal(pending.score,null);
 const missing=root.GradaComponents.radar(player,peers,metadata,pending);assert.match(missing,/<strong>—<\/strong>/);assert.match(missing,/Faltan métricas publicadas: Regates logrados/);
});

test('provenance explains newer goal selection and original same-source components without hiding their values',()=>{
 const c={source:'FotMob',captured_at:'2026-11-08T12:00:00Z',matches:12,minutes:930,profileVerified:true},raw={goals:8,xg:7.02,metricContexts:{goals:c,xg:c}},p={goals:8,xg:6.5,matches:10,metricContexts:{goals:{...c,selection:{method:'goal_sample_freshness_v1',preferred_source:'Understat'}},xg:{source:'Understat',matches:10,minutes:769,captured_at:'2026-11-01T12:00:00Z'}},sourceRecords:{FotMob:raw}},metadata={sources:{FotMob:{imported_at:c.captured_at}}};
 const goals=root.GradaComponents.provenance(p,'goals',metadata),ratio=root.GradaComponents.provenance(p,'goalsPerXg',metadata);assert(goals.text.includes('recuento posterior'));assert(goals.text.includes('Understat'));assert(ratio.text.includes('componentes originales de FotMob'));assert(ratio.text.includes('goles 8'));assert(ratio.text.includes('xG 7,02'));assert.equal(ratio.matches,12);
});

 test('weighted sector areas reproduce score including unequal attack weights and discipline',()=>{
 const p={kind:'player',score:0.22,axes:[{key:'tackles',label:'Entradas',percentile:20},{key:'recoveries',label:'Recuperaciones',percentile:50},{key:'interceptions',label:'Intercepciones',percentile:80}],attack:{usedWeight:0.2,entries:[{key:'goals',weight:0.2,percentile:50}]},fairPlay:{factor:0.8}};
 const base=(0.2*0.5+0.5*0.8+0.8*0.2)/3*0.8+0.2*0.5**2;p.score=base*0.8;
 const sectors=radar.scoreSectors(p);assert.equal(sectors.length,4);assert(Math.abs(sectors.reduce((s,a)=>s+a.weight,0)-1)<1e-12);assert(Math.abs(sectors.reduce((s,a)=>s+a.contribution,0)-p.score)<1e-12);assert.notEqual(sectors[0].weight,sectors[3].weight);
 assert.deepEqual(radar.scoreSectors({...p,score:null}),[]);assert.deepEqual(radar.scoreSectors({...p,kind:'team'}),[]);
 });
