'use strict';
// Metadata from already captured squad pages; never makes network requests.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),nations=require('../dist/nationality.js'),fotmob=require('../dist/fotmob.js'),leagues=require('../dist/leagues.js');
const option=(key,fallback)=>{const i=process.argv.indexOf(key);return i<0?fallback:process.argv[i+1];};
const folder=path.resolve(option('--input-root','')),target=path.resolve(option('--data-dir',path.join(__dirname,'../dist/downloads'))),manifest=JSON.parse(fs.readFileSync(path.join(folder,'results.json')));
if(!Array.isArray(manifest))throw Error('Falta el manifiesto de capturas originales.');
const prepared=[],report=[];
for(const league of leagues.list()){
 const filename='fotmob-'+league.id+'-2026-27.json',source=fotmob.validate(JSON.parse(fs.readFileSync(path.join(target,filename)))),squads=[],evidence=[];
 for(const team of source.teams){
  const matches=manifest.filter(item=>item.ok&&item.league===league.id&&String(item.team)===String(team.id));if(matches.length!==1)throw Error('Falta una captura inequívoca de '+league.id+'/'+team.id);
  const entry=matches[0],file=path.join(folder,league.id,String(team.id)+'.html'),bytes=fs.readFileSync(file);if(bytes.length!==entry.bytes||bytes.length>8*1024*1024)throw Error('Captura truncada o demasiado grande.');
  squads.push(nations.parseSquad(bytes.toString('utf8'),team,league.id,entry.captured_at));evidence.push({team_id:String(team.id),captured_at:entry.captured_at,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
 }
 const result=fotmob.validate(nations.enrich(source,squads));result.metadata.nationality_enrichment.captures=evidence;
 prepared.push({file:path.join(target,filename),body:JSON.stringify(result)});report.push({league:league.id,players:source.players.length,matched:result.metadata.nationality_enrichment.matched_players,teams:squads.length,captured_at:result.metadata.nationality_enrichment.captured_at});
}
// All five leagues validate before any promotion. Call in a staging directory
// and build/verify combined outputs there before publishing the full set.
for(const entry of prepared){const temporary=entry.file+'.tmp';try{fs.writeFileSync(temporary,entry.body);fs.renameSync(temporary,entry.file);}finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary);}}
process.stdout.write(JSON.stringify({leagues:report,totalMatched:report.reduce((n,r)=>n+r.matched,0),newProviderRequests:0})+'\n');
