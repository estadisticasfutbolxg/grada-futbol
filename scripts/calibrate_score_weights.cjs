'use strict';
// Only the approved four-metric policy is applied; fitting never writes weights.
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const keys=['goals','assists','xg','xa'],profiles=['DEF','DEF_FB','MED','MED_DEF','MED_ATT','DEL'];
function calibrate(report,body){
 if(report?.metadata?.competition!=='LaLiga'||report.metadata.season!=='2026/27'||report.metadata.method!=='ridge_correlated_group_cv_v2'||!Number.isFinite(Date.parse(report.metadata.generated_at)))throw Error('Verified LaLiga grouped-regression report required');
 const byProfile={};
 for(const key of profiles){
  const matches=report.models.filter(m=>m.key===key),m=matches[0];
  if(matches.length!==1||m.status!=='fitted'||!Number.isInteger(m.n)||m.n<20||!m.coefficients?.length)throw Error('Fitted profile required: '+key);
  if(m.coefficients.some(c=>!Number.isFinite(c.ridge_standardized))||new Set(m.coefficients.map(c=>c.key)).size!==m.coefficients.length||m.coefficients.filter(c=>c.key==='minutesExposure'&&c.control).length!==1)throw Error('Invalid coefficients: '+key);
  const denominator=m.coefficients.reduce((s,c)=>s+Math.abs(c.ridge_standardized),0);
  if(!(denominator>0))throw Error('Nonzero denominator required: '+key);
  const weights={},directions={};
  for(const metric of keys){const c=m.coefficients.find(c=>c.key===metric);if(!c||c.control||c.kind!=='axis')throw Error('Missing attack coefficient: '+key+'/'+metric);weights[metric]=Math.abs(c.ridge_standardized)/denominator;directions[metric]=Math.sign(c.ridge_standardized);}
  if(Object.values(weights).reduce((s,v)=>s+v,0)>1+1e-12)throw Error('Weights exceed one');
  byProfile[key]={n:m.n,weights,directions};
 }
 return {method:'fantasy_absolute_standardized_all_predictors_v1',competition:report.metadata.competition,season:report.metadata.season,modelMethod:report.metadata.method,modelGeneratedAt:report.metadata.generated_at,reportSha256:crypto.createHash('sha256').update(body).digest('hex'),scope:'All loaded competitions; calibration from LaLiga only',policy:'Absolute distributed standardized coefficient / sum of absolute coefficients including minutes and extras. Four attack metrics only; remaining weight retains original non-attack radar. No causal interpretation or automatic refitting.',byProfile};
}
function sourceBlock(calibration){
 return '  // BEGIN APPROVED FANTASY WEIGHTS\n  const weightCalibration = '+JSON.stringify(calibration,null,2).split('\n').join('\n  ')+';\n  for(const profile of Object.values(weightCalibration.byProfile)){Object.freeze(profile.weights);Object.freeze(profile.directions);Object.freeze(profile);}\n  Object.freeze(weightCalibration.byProfile);Object.freeze(weightCalibration);\n  // END APPROVED FANTASY WEIGHTS';
}
if(require.main===module){
 const i=process.argv.indexOf('--report');if(i<0||!process.argv[i+1])throw Error('--report required');
 const body=fs.readFileSync(process.argv[i+1]),calibration=calibrate(JSON.parse(body),body);
 if(process.argv.includes('--apply')){
  const file=path.join(__dirname,'../dist/radar.js'),source=fs.readFileSync(file,'utf8'),marker=/ {2}\/\/ BEGIN APPROVED FANTASY WEIGHTS[\s\S]*? {2}\/\/ END APPROVED FANTASY WEIGHTS/g;
  if([...source.matchAll(marker)].length!==1)throw Error('Exactly one calibration block required');
  const next=source.replace(marker,()=>sourceBlock(calibration));fs.writeFileSync(file+'.tmp',next);fs.renameSync(file+'.tmp',file);
 }
 process.stdout.write(JSON.stringify(calibration)+'\n');
}
module.exports={calibrate,sourceBlock};
