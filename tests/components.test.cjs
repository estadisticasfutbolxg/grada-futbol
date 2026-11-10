'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const radar=require('../dist/radar.js'),metrics=require('../dist/metrics.js');
const root={GradaRadar:radar,GradaMetrics:metrics};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist/components.js'),'utf8'),{window:root});
test('the player radar renders a valid zero score and preserves unknown metrics as pending',()=>{
 const peers=Array.from({length:6},(_,i)=>({id:String(i),pos:'DEL',minutes:600,matches:10,goals:i+1,xg:i+1,xa:i+1,shotsOnTargetPer90:i+1,dribblesPer90:i+1,conversion:i+1}));
 const player={id:'zero',pos:'DEL',minutes:600,matches:10,goals:0,xg:0,xa:0,shotsOnTargetPer90:0,dribblesPer90:0,conversion:0},metadata={source:'Isolated <source>',imported_at:'2026-11-10T12:00:00Z'};
 const profile=radar.profile(player,peers);assert.equal(profile.score,0);
 const html=root.GradaComponents.radar(player,peers,metadata,profile);assert.match(html,/<strong>0,000<\/strong>/);assert.match(html,/Los ceros publicados se incluyen/);assert(!html.includes('<source>'));
 player.dribblesPer90=null;const pending=radar.profile(player,peers);assert.equal(pending.score,null);
 const missing=root.GradaComponents.radar(player,peers,metadata,pending);assert.match(missing,/<strong>—<\/strong>/);assert.match(missing,/Faltan métricas publicadas: Regates logrados/);
});
