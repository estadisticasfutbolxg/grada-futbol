'use strict';
// Validate rendered measures against real local snapshots, without network/writes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),L=require('../dist/leagues.js'),C=require('../dist/combined.js'),A=require('../dist/scopes.js'),M=require('../dist/metrics.js'),F=require('../dist/fotmob.js'),R=require('../dist/roles.js');
function audit(directory){
 const read=file=>JSON.parse(fs.readFileSync(path.join(directory,file),'utf8'));
 const sets=L.list().map(l=>{const f=read('fotmob-'+l.id+'-2026-27.json'),e=read(l.espnFile);return l.primary==='Understat'?C.combine(read('understat-'+l.id+'-2026-27.json'),e,f):C.combine(f,e);}),all=A.aggregate(sets);
 const base=['matches','minutes','goals','assists','xg','xa','shots','shotsOnTarget','shotsPer90','passes','completed','accuracy','conversion','delta','saves','savepct','conceded','xga','xgaOnTarget','clean','tackles','interceptions','recoveries','keypasses','progressive','psxg','prevented','points','bigChances','shotsOnTargetPerMatch','possession'];
 const keys=[...new Set([...base,...F.fields,...Object.keys(M.fixedRates),...Object.keys(M.ratios),...Object.keys(M.sums),...Object.keys(M.perMatch),...Object.keys(M.differences),'psxgEfficiency'])];
 const coverage={},percentages=new Set(['accuracy','conversion','possession',...F.percentages]),published=new Set(['shotsPer90',...F.publishedRates]);let checks=0,originalPairs=0;
 for(const kind of ['players','teams']){
  coverage[kind]={};
  for(const key of keys){const counts={known:0,zero:0,unknown:0,incompatibleComponents:0,total:all[kind].length};
   for(const row of all[kind]){
    const total=M.metric(row,key),rate=M.metric(row,key,'90');assert(total===null||Number.isFinite(total),key+' invalid total');assert(rate===null||Number.isFinite(rate),key+' invalid rate');checks+=2;
    if(total===null)counts.unknown++;else{counts.known++;if(total===0)counts.zero++;}
    if(percentages.has(key)&&total!==null){assert(total>=0&&total<=100,key+' invalid percentage');assert.equal(rate,total,key+' percentage changed in /90');}
    if(published.has(key))assert.equal(rate,total,key+' published rate normalized twice');
    const context=M.context(row,key);
    if(context?.fromSourceRecord){
     const raw=row.sourceRecords?.[context.source],[a,b]=context.components;assert(raw,key+' missing source record');assert.equal(context.componentValues[a],raw[a],key+' first component differs from original');assert.equal(context.componentValues[b],raw[b],key+' second component differs from original');assert.equal(raw.goals,row.goals,key+' original goals differ from selected total');
     if(raw.metricContexts?.[a]&&raw.metricContexts?.[b]){assert(M.sameSample(raw.metricContexts[a],raw.metricContexts[b]),key+' incompatible original samples');assert(M.sameSample(raw.metricContexts[a],context),key+' wrong original denominator');}
     else{assert.equal(raw.matches,context.matches,key+' wrong aggregate matches');if(context.minutes_derived==='team_nominal_90'){assert(!Object.hasOwn(raw,'team_id'),key+' player borrowed nominal minutes');assert.equal(context.minutes,raw.matches*90,key+' wrong nominal team minutes');}else assert.equal(raw.minutes??null,context.minutes,key+' wrong aggregate minutes');}
     if(M.ratios[key])assert.equal(total,raw[b]>0?raw[a]/raw[b]:null,key+' ratio differs from original components');
     if(M.sums[key])assert.equal(total,raw[a]+raw[b],key+' sum differs from original components');
     if(M.differences[key])assert.equal(total,context.matches>0?(raw[a]-raw[b])/context.matches:null,key+' difference differs from original components');
     if(key==='delta')assert.equal(total,raw[a]-raw[b],key+' delta differs from original components');
     if(key==='conversion')assert.equal(total,raw[b]>0?raw[a]/raw[b]*100:null,key+' conversion differs from original components');originalPairs++;
    }
    if(M.ratios[key]){const [a,b]=M.ratios[key];if(!context?.fromSourceRecord&&row.metricContexts&&Number.isFinite(row[a])&&Number.isFinite(row[b])&&!M.sameSample(row.metricContexts[a],row.metricContexts[b])){assert.equal(total,null,key+' mixed sample');counts.incompatibleComponents++;}assert.equal(rate,total,key+' ratio changed in /90');}
    if(M.rates.has(key)&&rate!==null){const context=M.context(row,key,'90');assert(Number.isFinite(context?.reportedPer90)||Number.isFinite(context?.minutes??row.minutes)&&(context?.minutes??row.minutes)>0,key+' rate lacks own minutes');}
   }
   coverage[kind][key]=counts;
  }
 }
 return {players:all.players.length,teams:all.teams.length,measures:keys.length,checks,originalPairs,tacticalCoverage:R.coverage(all.players),coverage};
}
if(require.main===module){
 try{const value=(flag,fallback)=>{const i=process.argv.indexOf(flag);if(i>=0&&(!process.argv[i+1]||process.argv[i+1].startsWith('--')))throw new Error('Missing value for '+flag);return i<0?fallback:process.argv[i+1];},output=value('--output',null),report=audit(path.resolve(value('--data-dir',path.join(__dirname,'../dist/downloads'))));if(output)fs.writeFileSync(output,JSON.stringify(report,null,2));process.stdout.write(JSON.stringify({players:report.players,teams:report.teams,measures:report.measures,checks:report.checks,originalPairs:report.originalPairs,tacticalCoverage:report.tacticalCoverage,output})+'\n');}
 catch(error){process.stderr.write(error.message+'\n');process.exitCode=1;}
}
module.exports={audit};
