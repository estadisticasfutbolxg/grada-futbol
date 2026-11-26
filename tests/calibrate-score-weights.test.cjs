'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{calibrate,sourceBlock}=require('../scripts/calibrate_score_weights.cjs');
function fixture(){return{metadata:{competition:'LaLiga',season:'2026/27',method:'ridge_correlated_group_cv_v2',generated_at:'2026-11-26T12:15:24Z'},models:['DEF','DEF_FB','MED','MED_DEF','MED_ATT','DEL'].map(key=>({key,n:30,status:'fitted',coefficients:[['goals',6],['assists',-3],['xg',2],['xa',-1],['minutesExposure',8]].map(([key,v])=>({key,ridge_standardized:v,control:key==='minutesExposure',kind:key==='minutesExposure'?'control':'axis'}))}))};}
test('calibration uses all absolute standardized coefficients including minutes, retaining signs only as provenance',()=>{
 const data=fixture(),first=calibrate(data,Buffer.from('isolated fixture'));
 assert.deepEqual(first.byProfile.DEF.weights,{goals:0.3,assists:0.15,xg:0.1,xa:0.05});assert.equal(first.byProfile.DEF.directions.assists,-1);
 assert.equal(first.reportSha256.length,64);assert.deepEqual(calibrate(data,Buffer.from('isolated fixture')),first);assert(sourceBlock(first).includes('Object.freeze'));
 data.models[0].coefficients.push({key:'yellowCards',kind:'extra',control:false,ridge_standardized:-10});
 assert.equal(calibrate(data,Buffer.from('isolated changed fixture')).byProfile.DEF.weights.goals,0.2);
});
test('partial or invalid regressions cannot replace a complete approved calibration',()=>{
 for(const mutate of [d=>d.models.pop(),d=>d.models.push(d.models[0]),d=>d.models[0].coefficients.pop(),d=>d.models[0].coefficients[0].ridge_standardized=NaN,d=>d.models[0].coefficients.shift(),d=>d.models[0].status='insufficient_sample']){const d=fixture();mutate(d);assert.throws(()=>calibrate(d,Buffer.from('isolated fixture')));}
});
