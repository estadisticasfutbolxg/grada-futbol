'use strict';
// Reuse validated squad HTML for both positions and sporting nationality.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),leagues=require('../dist/leagues.js'),fotmob=require('../dist/fotmob.js'),roles=require('../dist/roles.js'),nationality=require('../dist/nationality.js');
const options=JSON.parse(fs.readFileSync(0,'utf8')),league=leagues.get(options.league),source=fotmob.validate(JSON.parse(fs.readFileSync(options.source))),positions=[],countries=[],captures=[],failed=[];
if(leagues.resolve(source.metadata).id!==league.id)throw Error('Captura de otra liga.');
for(const team of source.teams){
 try{
  const file=path.join(options.folder,String(team.id)+'.html'),stat=fs.statSync(file);if(stat.size>8*1024*1024)throw Error('Plantilla demasiado grande.');
  const bytes=fs.readFileSync(file),html=bytes.toString('utf8'),captured=stat.mtime.toISOString();
  const position=roles.parseSquad(html,team,league.id,captured),country=nationality.parseSquad(html,team,league.id,captured);
  positions.push(position);countries.push(country);captures.push({team_id:String(team.id),captured_at:captured,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
 }catch(error){failed.push({team_id:String(team.id),reason:error.message});}
}
if(!positions.length)throw Error('Ninguna plantilla verificada; se conserva la captura.');
const result=fotmob.validate(nationality.enrich(roles.enrich(source,positions),countries));
for(const key of ['tactical_enrichment','nationality_enrichment'])Object.assign(result.metadata[key],{captures,failed_teams:failed});
fs.writeFileSync(options.output,JSON.stringify(result));
process.stdout.write(JSON.stringify({league:league.id,teams:positions.length,positions:result.metadata.tactical_enrichment.matched_players,countries:result.metadata.nationality_enrichment.matched_players,failed})+'\n');
