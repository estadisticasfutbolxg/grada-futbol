'use strict';
// Uses existing captures only. No provider requests and no generated data in Git.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{performance}=require('node:perf_hooks');
const root=path.resolve(__dirname,'..'),arg=(key,fallback)=>{const i=process.argv.indexOf(key);return i<0?fallback:process.argv[i+1];};
const baseline=arg('--baseline-root',null),folder=path.resolve(arg('--data-dir',path.join(root,'dist/downloads'))),rounds=Number(arg('--rounds',4));
if(!Number.isInteger(rounds)||rounds<2||rounds>20)throw Error('Use entre 2 y 20 rondas.');
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
const files=new Map(),read=name=>{const body=fs.readFileSync(path.join(folder,name));files.set(name,digest(body));return JSON.parse(body);};
const catalog=require('../dist/leagues.js').list(),raw=catalog.map(league=>({league,espn:read(league.espnFile),fotmob:read('fotmob-'+league.id+'-2026-27.json'),understat:league.primary==='Understat'?read('understat-'+league.id+'-2026-27.json'):null}));
function api(where){return Object.fromEntries(['combined','scopes','scores','refresh'].map(name=>[name,require(path.resolve(where,'dist',name+'.js'))]));}
function sets(modules,input){return input.map(s=>({...s,combined:s.understat?modules.combined.combine(s.understat,s.espn,s.fotmob):modules.combined.combine(s.fotmob,s.espn)}));}
const median=values=>{const sorted=[...values].sort((a,b)=>a-b),i=Math.floor(sorted.length/2);return sorted.length%2?sorted[i]:(sorted[i-1]+sorted[i])/2;};
function measure(modules){
 // Separate objects model unchanged football data from a newly fetched response.
 const previous=sets(modules,structuredClone(raw)),samples=[];let latest,reference,model,reports;
 for(let i=0;i<rounds;i++){
  const begin=performance.now();latest=sets(modules,raw);const combined=performance.now();
  reference=modules.scopes.aggregate(latest.map(s=>s.combined));const aggregated=performance.now();
  model=modules.scores.build(reference);const scored=performance.now();
  reports=latest.map((s,n)=>modules.refresh.report(previous[n],{state:s,checked:['espn','fotmob',...(s.understat?['understat']:[])]}));const reported=performance.now();
  samples.push({combine:combined-begin,aggregate:aggregated-combined,scores:scored-aggregated,reports:reported-scored,total:reported-begin});
 }
 const medians=Object.fromEntries(Object.keys(samples[0]).map(key=>[key,median(samples.slice(1).map(row=>row[key]))]));
 // Full generated output includes IDs, positions, samples, nulls, fair play,
 // scores, reference axes and all weighted team contributions.
 const outputs=latest.map(s=>digest(JSON.stringify(modules.scores.withScores(s.combined,{referencePlayers:reference.players,referenceLabel:'5 ligas cargadas'}))));
 return {samples,medians,outputs,reports:digest(JSON.stringify(reports)),players:reference.players.length,teams:reference.teams.length,validScores:[...model.players.values()].filter(p=>p.score!==null).length};
}
const before=baseline?measure(api(baseline)):null,after=measure(api(root));
if(before){assert.deepEqual(after.outputs,before.outputs,'Generated football data must be identical');assert.equal(after.reports,before.reports,'Refresh reports must be identical');}
for(const [name,hash]of files)assert.equal(digest(fs.readFileSync(path.join(folder,name))),hash,'Source capture changed: '+name);
const result={before,after,sourceCapturesUnchanged:files.size,fullOutputsEqual:before?true:null,localCpuReductionPercent:before?(1-after.medians.total/before.medians.total)*100:null,scope:'Local Node CPU; excludes browser layout and provider/network latency. Medians exclude the first warm-up round.'};
const output=arg('--output',null);if(output)fs.writeFileSync(output,JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
