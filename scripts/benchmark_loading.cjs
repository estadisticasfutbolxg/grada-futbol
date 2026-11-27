'use strict';
// Offline scheduling benchmark: deterministic latency and isolated fixtures.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),{htmlFor}=require('../tests/helpers/fotmob-pages.cjs'),leagues=require('../dist/leagues');
function previous(file,ref){const m=new Module(path.join(root,file),module);m.filename=path.join(root,file);m.paths=module.paths;m._compile(fs.readFileSync(path.join(ref,file),'utf8'),m.filename);return m.exports;}
const delay=()=>new Promise(resolve=>setTimeout(resolve,12));
async function measure(provider,refresh){
 let activePages=0,maxPages=0,pageCount=0;const begin=performance.now();
 const season=await provider.fetchFotmob('laliga',{now:()=> '2026-11-27T10:00:00Z',fetcher:async url=>{activePages++;maxPages=Math.max(maxPages,activePages);pageCount++;await delay();activePages--;return new Response(htmlFor(url));}});
 const pageMs=performance.now()-begin;let activeBatches=0,maxBatches=0,batchCount=0;const start=performance.now();
 const profiles=await refresh.loadProfiles({players:Array.from({length:96},(_,i)=>({id:String(i+1)}))},leagues.get('laliga'),{fetchImpl:async url=>{activeBatches++;maxBatches=Math.max(maxBatches,activeBatches);batchCount++;await delay();activeBatches--;return new Response(JSON.stringify({profiles:new URL(url,'https://fixture.test').searchParams.get('players').split(',').map(id=>({id,values:{goals:0}})),failed:[]}));}});
 return{pageMs,profileMs:performance.now()-start,maxPages,maxBatches,pageCount,batchCount,season,profiles};
}
async function cachedLoads(ref){
 const {harness}=require('../tests/helpers/app-harness.cjs'),ids=['laliga','premier-league','serie-a','bundesliga','ligue-1'];
 const captures=new Map(ids.map(id=>{const l=leagues.get(id);return[id,{espn:JSON.parse(fs.readFileSync(path.join(root,'dist/downloads',l.espnFile))),fotmob:JSON.parse(fs.readFileSync(path.join(root,'dist/downloads','fotmob-'+id+'-2026-27.json')))}];}));
 const h=harness(),old=ref?fs.readFileSync(path.join(ref,'dist/app.js'),'utf8'):null;
 if(old)h.run(old.slice(old.indexOf('async function loadLeague(l)'),old.indexOf('async function start()')));
 h.run('readCapture=fixtureRead;captureStore.get=savedRead',{fixtureRead:async file=>{for(const [id,d]of captures){const l=leagues.get(id);if(file===l.espnFile)return structuredClone(d.espn);if(file==='fotmob-'+id+'-2026-27.json')return structuredClone(d.fotmob);}throw Error('Unexpected fixture');},savedRead:async(id,key)=>structuredClone(captures.get(id)[key])});
 const begin=performance.now(),states=[];for(const id of ids){const value=await h.run('loadLeague(GradaLeagues.get(targetLeague))',{targetLeague:id});states.push(JSON.parse(JSON.stringify(value?.state||h.run('datasets.get(targetLeague)'))));}
 return{ms:performance.now()-begin,states};
}
async function main(){
 const option=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];},ref=option('--baseline-root',null),output=option('--output',null);
 if(!ref)throw Error('--baseline-root required');
 const old=[previous('worker/providers.cjs',ref),previous('dist/refresh.js',ref)],current=[require('../worker/providers.cjs'),require('../dist/refresh.js')],runs=[];
 for(let i=0;i<4;i++){const before=await measure(...old),after=await measure(...current),cachedBefore=await cachedLoads(ref),cachedAfter=await cachedLoads(null);assert.deepEqual(cachedAfter.states,cachedBefore.states);before.cachedLoadMs=cachedBefore.ms;after.cachedLoadMs=cachedAfter.ms;assert.deepEqual(after.season,before.season);assert.deepEqual(after.profiles,before.profiles);runs.push({before,after});}
 const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)],summarize=key=>Object.fromEntries(['pageMs','profileMs','cachedLoadMs','maxPages','maxBatches','pageCount','batchCount'].map(metric=>[metric,median(runs.slice(1).map(r=>r[key][metric]))]));
 const result={baseline:ref,synthetic:true,latencyPerRequestMs:12,profiles:96,cachedLeagues:5,rounds:4,before:summarize('before'),after:summarize('after'),equivalent:true,scope:'Offline scheduler latency, fixed fixture and timestamp. Cached league comparison uses the same five real captures and saved copies. Does not measure live providers, browser layout or total user wait.'};if(output)fs.writeFileSync(output,JSON.stringify(result,null,2));process.stdout.write(JSON.stringify(result)+'\n');
}
if(require.main===module)main().catch(error=>{process.stderr.write(error.stack+'\n');process.exitCode=1;});
