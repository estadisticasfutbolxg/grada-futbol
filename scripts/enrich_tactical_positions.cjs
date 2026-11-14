'use strict';
// Read real squad HTML and enrich positions only; season statistics stay intact.
const fs=require('node:fs'),path=require('node:path'),roles=require('../dist/roles.js'),fotmob=require('../dist/fotmob.js'),leagues=require('../dist/leagues.js');
const options=JSON.parse(fs.readFileSync(0,'utf8')),league=leagues.get(options.league),source=fotmob.validate(JSON.parse(fs.readFileSync(options.source))),squads=[],failed=[];
if(leagues.resolve(source.metadata).id!==league.id)throw new Error('Captura de otra liga.');
for(const team of source.teams){const file=path.join(options.folder,String(team.id)+'.html');try{const stat=fs.statSync(file);if(stat.size>8*1024*1024)throw new Error('Plantilla demasiado grande.');squads.push(roles.parseSquad(fs.readFileSync(file,'utf8'),team,league.id,stat.mtime.toISOString()));}catch(error){failed.push({team_id:team.id,reason:error.message});}}
if(!squads.length)throw new Error('Ninguna plantilla válida; se conserva la captura.');
const result=fotmob.validate(roles.enrich(source,squads));result.metadata.tactical_enrichment.failed_teams=failed;
const output=path.resolve(options.output),temporary=output+'.tmp';try{fs.writeFileSync(temporary,JSON.stringify(result));fs.renameSync(temporary,output);}finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
process.stdout.write(JSON.stringify({league:league.id,teams:squads.length,matched:result.metadata.tactical_enrichment.matched_players,failed})+'\n');
