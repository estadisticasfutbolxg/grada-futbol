'use strict';
// Reuse GRADA's canonical position/profile and conservative identity resolver.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const L=require('../dist/leagues'),C=require('../dist/combined'),A=require('../dist/scopes'),S=require('../dist/scores'),R=require('../dist/radar'),M=require('../dist/metrics'),I=require('../dist/identity');
const teamAliases={deportivoalaves:'alaves',deportivoacoruna:'deportivolacoruna'};
const club=value=>{const key=I.normalize(value);return teamAliases[key]||key;};
function cross(laliga,fantasy,referencePlayers,analysis=laliga){
 if(laliga.metadata.league_key!=='laliga'||fantasy.metadata.season!=='2026/27'||fantasy.metadata.source!=='Analítica Fantasy')throw new Error('LaLiga/Fantasy season not verified');
 const rows=fantasy.players.map(p=>({...p,name:p.playerName,nameAliases:[p.nickname].filter(Boolean),pos:({1:'POR',2:'DEF',3:'MED',4:'DEL'})[p.positionId]||'—'}));
 if(new Set(rows.map(p=>p.playerId)).size!==rows.length)throw new Error('Duplicate Fantasy identity');
 const primary=laliga.players.map(p=>({...p,nameAliases:[...new Set([p.name,...Object.values(p.sourceRecords||{}).map(r=>r.name)].filter(Boolean))]}));
 const joined=I.link(primary,rows,{primaryClub:p=>club(p.team),secondaryClub:p=>club(p.teamName)});
 const model=S.build(laliga,{referencePlayers}),profiles=new Map(laliga.players.map(p=>[p.id,model.players.get(p)]));
 const analysisRows=new Map(analysis.players.map(p=>[p.sourceRecords?.FotMob?.id,p]));
 const records=[],unmatched=[];
 for(const p of primary){
  const match=joined.matches.get(p);if(!match){unmatched.push({id:p.id,name:p.name,team:p.team,...joined.states.get(p)});continue;}
  const f=match.record,profile=profiles.get(p.id),keys=[...new Set([...profile.expectedAxes,...(profile.attack?R.attackKeys:[])])];
  const observed=analysisRows.get(p.sourceRecords?.FotMob?.id),compatible=observed&&String(observed.sourceRecords.FotMob.team_id)===String(p.sourceRecords.FotMob.team_id),sample=compatible?observed:null;
  const metrics={},contexts={};
  for(const key of keys){const unit=R.axis(key).unit;metrics[key]=sample?M.metric(sample,key,unit):null;contexts[key]={...(sample?M.context(sample,key,unit):null),unit,label:R.axis(key).label};}
  records.push({id:p.id,fotmob_id:p.sourceRecords?.FotMob?.id,fantasy_id:f.playerId,name:p.name,fantasy_name:f.playerName,team:p.team,profile:profile.profileKey,profile_label:profile.profileLabel,pos:p.pos,
   match_method:match.method,match_names:match.names,grada_minutes_original:p.minutes,grada_matches_original:p.matches,minutes:sample?.minutes??null,matches:sample?.matches??null,fantasy_minutes:f.minsPlayed,fantasy_matches:f.matchesPlayed,points:f.totalPoints,
   // Counts, never the *Pts scoring components. Their own denominator is Fantasy minutes.
   fantasy_counts:{yellowCards:f.yellowCard??null,redCards:Number.isFinite(f.redCard)&&Number.isFinite(f.secondYellowCard)?f.redCard+f.secondYellowCard:null,penaltiesWon:f.penaltyWon??null},metrics,contexts,
   fantasy_captured_at:fantasy.metadata.captured_at,fantasy_url:fantasy.metadata.url});
 }
 return {metadata:{competition:'LaLiga',season:'2026/27',source:'GRADA + Analítica Fantasy',fantasy:fantasy.metadata,grada:laliga.metadata.sources,analysis:analysis.metadata.sources,grada_players:primary.length,fantasy_players:rows.length,matched:records.length,unmatched:unmatched.length,unmatched_fantasy:rows.length-records.length,
  note:'LaLiga feature values only. Canonical season profile matches the application; no cup statistics enter regressions. Cards and penalties won are published Fantasy counts, not assigned fantasy points.'},records,unmatched};
}
if(require.main===module){
 const arg=(key,fallback)=>{const i=process.argv.indexOf(key);return i<0?fallback:process.argv[i+1];};
 const folder=arg('--data-dir',path.join(__dirname,'../dist/downloads')),fantasyFile=arg('--fantasy',null),output=arg('--output',null);if(!fantasyFile||!output)throw new Error('--fantasy and --output required');
 const read=f=>JSON.parse(fs.readFileSync(f)),sets=L.list().map(l=>C.combine(read(path.join(folder,'fotmob-'+l.id+'-2026-27.json')),read(path.join(folder,l.espnFile)))),reference=A.aggregate(sets),laliga=sets.find(d=>d.metadata.league_key==='laliga');
 const aligned=require('../dist/competitions').alignPositions(laliga,reference.players),fresh=arg('--analysis-fotmob',null),analysis=fresh?C.combine(read(fresh),read(path.join(folder,L.get('laliga').espnFile))):aligned,result=cross(aligned,read(fantasyFile),reference.players,analysis);
 result.metadata.analysis_snapshot=fresh?{path:path.basename(fresh),sha256:crypto.createHash('sha256').update(fs.readFileSync(fresh)).digest('hex'),independent:true}:null;
 result.metadata.inputs={fantasy_sha256:crypto.createHash('sha256').update(fs.readFileSync(fantasyFile)).digest('hex'),fotmob_sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(folder,'fotmob-laliga-2026-27.json'))).digest('hex')};
 fs.writeFileSync(output,JSON.stringify(result));process.stdout.write(JSON.stringify({...result.metadata,fantasy:undefined,grada:undefined})+'\n');
}
module.exports={cross,club};
