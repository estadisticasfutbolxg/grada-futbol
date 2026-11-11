'use strict';
// Read real provider captures. Never write changes back to them.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const leagues=require('../dist/leagues.js'),combined=require('../dist/combined.js'),scopes=require('../dist/scopes.js'),scores=require('../dist/scores.js'),refresh=require('../dist/refresh.js'),profiles=require('../dist/profiles.js');
function audit(directory,{recovery=true,now=Date.now()}={}){
 const read=(file,key,league)=>refresh.validate(JSON.parse(fs.readFileSync(path.join(directory,file),'utf8')),key,league,{now});
 const sources=leagues.list().map(league=>({league,espn:read(league.espnFile,'espn',league),fotmob:read('fotmob-'+league.id+'-2026-27.json','fotmob',league),understat:league.primary==='Understat'?read('understat-'+league.id+'-2026-27.json','understat',league):null}));
 const join=(s,f=s.fotmob)=>s.understat?combined.combine(s.understat,s.espn,f):combined.combine(f,s.espn);
 const sets=sources.map(s=>({league:s.league,data:join(s)}));
 for(const {data}of sets)assert(combined.coverage(data).complete,'Missing league metric families');
 const all=scopes.aggregate(sets.map(s=>s.data)),model=scores.build(all),byId=new Map(all.players.map(p=>[p.id,p]));
 const records=all.players.map(p=>{
  const r=model.players.get(p);return {id:p.id,name:p.name,team:p.team,league:p.league,league_key:p.league_key,pos:p.pos,minutes:p.minutes,score:r.score,aboveMinimum:r.baseSampleEnough===true,missingAxes:r.missingAxes,insufficientSamples:r.insufficientSamples||[],position:p.positionResolution,sources:Object.fromEntries(Object.entries(p.sourceRecords||{}).map(([key,row])=>[key,{id:row.id,name:row.name,pos:row.pos,minutes:row.minutes,matches:row.matches}]))};
 });
 let scoreChecks=0,means=0,contributions=0;
 for(const {league,data}of sets){
  const local=scores.build(data,{referencePlayers:all.players});
  for(const p of data.players){assert.equal(local.players.get(p).score,model.players.get(byId.get(league.id+':'+p.id)).score,'Score differs between league and all leagues');scoreChecks++;}
  for(const summary of [local.overall,...local.units.values()])for(const team of summary.teams.values()){
   const included=team.players.filter(p=>p.included);
   if(!included.length){assert.equal(team.area,null);continue;}
   const mean=included.reduce((sum,p)=>sum+p.area*p.minutes,0)/included.reduce((sum,p)=>sum+p.minutes,0);
   assert(Math.abs(team.area-mean)<1e-12,'Team score is not the minute-weighted mean');
   assert(team.area>=Math.min(...included.map(p=>p.area))-1e-12&&team.area<=Math.max(...included.map(p=>p.area))+1e-12,'Team score outside player scores');means++;contributions+=included.length;
  }
 }
 const scenarios=[];
 if(recovery)for(const mode of ['missing_positions','load_recovery','refresh_recovery']){
  const datasets=sources.map(s=>{
   const data=structuredClone(s.fotmob);data.metadata.imported_at=new Date(Math.max(now,Date.parse(data.metadata.imported_at)+1)).toISOString();
   for(const p of data.players){if(p.pos!=='POR')p.pos='—';delete p.positionContext;}
   const restored=mode==='load_recovery'?refresh.selectCapture(s.fotmob,data,'fotmob',s.league):mode==='refresh_recovery'?profiles.apply(data,[],s.fotmob):data;
   return join(s,restored);
  });
  const simulated=scopes.aggregate(datasets),simModel=scores.build(simulated),lost=[],gained=[];let positionChanges=0,scoreChanges=0;
  for(const p of simulated.players){
   const before=byId.get(p.id),beforeScore=model.players.get(before).score,afterScore=simModel.players.get(p).score;
   if(before.pos!==p.pos)positionChanges++;
   if(beforeScore!==afterScore)scoreChanges++;
   const detail={id:p.id,name:p.name,league:p.league,from:before.pos,to:p.pos,missing:simModel.players.get(p).missingAxes};
   if(beforeScore!==null&&afterScore===null)lost.push(detail);
   if(beforeScore===null&&afterScore!==null)gained.push(detail);
  }
  if(mode!=='missing_positions'){assert.equal(positionChanges,0,'Recovery changed a known position');assert.equal(scoreChanges,0,'Recovery changed score or reference');}
  scenarios.push({mode,simulation:true,positionChanges,scoreChanges,lost,gained});
 }
 const pending=records.filter(p=>p.aboveMinimum&&p.score===null);
 return {captured_at:new Date(now).toISOString(),summary:{players:records.length,valid:records.filter(p=>p.score!==null).length,pendingAboveMinimum:pending.length,leagues:sets.map(({league,data})=>({id:league.id,name:league.name,players:data.players.length,pending:pending.filter(p=>p.league_key===league.id).length,matches:data.metadata.imported_matches})),invariants:{scoreChecks,means,contributions}},pending,positionConflicts:records.filter(p=>p.position?.uncertain),unlinkedAboveMinimum:records.filter(p=>p.aboveMinimum&&Object.keys(p.sources).length===1),scenarios};
}
if(require.main===module){
 try{
  let directory=path.resolve(__dirname,'../dist/downloads'),output=null,recovery=true;
  for(let i=2;i<process.argv.length;i++){
   const arg=process.argv[i];if(arg==='--skip-recovery')recovery=false;
   else if(['--data-dir','--output'].includes(arg)&&process.argv[i+1]&&!process.argv[i+1].startsWith('--')){const value=path.resolve(process.argv[++i]);if(arg==='--data-dir')directory=value;else output=value;}
   else throw new Error('Usage: node scripts/audit_scores.cjs [--data-dir <directory>] [--output <json>] [--skip-recovery]');
  }
  const report=audit(directory,{recovery});if(output)fs.writeFileSync(output,JSON.stringify(report,null,2));
  process.stdout.write(JSON.stringify({...report.summary,positionConflicts:report.positionConflicts.length,unlinkedAboveMinimum:report.unlinkedAboveMinimum.length,simulations:report.scenarios.map(s=>({mode:s.mode,lost:s.lost.length,gained:s.gained.length,positionChanges:s.positionChanges,scoreChanges:s.scoreChanges})),output})+'\n');
 }catch(error){process.stderr.write(error.message+'\n');process.exitCode=1;}
}
module.exports={audit};
