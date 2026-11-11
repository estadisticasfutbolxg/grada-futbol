'use strict';
// Reuse verified roster JSON for identity only; never replace season statistics.
const fs=require('node:fs'),path=require('node:path'),espn=require('../dist/laliga.js');
const options=JSON.parse(fs.readFileSync(0,'utf8')),source=espn.validate(JSON.parse(fs.readFileSync(options.source))),files=fs.readdirSync(options.folder).filter(f=>/^roster-\d+\.json$/.test(f));
if(!files.length)throw new Error('No hay plantillas originales.');
const captures=files.map(file=>{const name=path.join(options.folder,file),stat=fs.statSync(name);if(stat.size>8*1024*1024)throw new Error('Plantilla demasiado grande.');const data=JSON.parse(fs.readFileSync(name,'utf8'));if(file!=='roster-'+data.team?.id+'.json')throw new Error('Archivo de otro equipo.');return {data,capturedAt:stat.mtime.toISOString()};});
let result=source,matched=0,modified=0;for(const capture of captures){result=espn.enrichIdentities(result,[capture.data],capture.capturedAt);matched+=result.metadata.identity_enrichment.matched_players;modified+=result.metadata.identity_enrichment.modified_aliases;}
const dates=captures.map(c=>c.capturedAt).sort();result.metadata.identity_enrichment={...result.metadata.identity_enrichment,matched_players:matched,modified_aliases:modified,captured_at:dates[0],latest_captured_at:dates.at(-1)};
const output=path.resolve(options.output),temporary=output+'.tmp';
try{fs.writeFileSync(temporary,JSON.stringify(result));fs.renameSync(temporary,output);}finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
process.stdout.write(JSON.stringify({output,players:result.players.length,identity:result.metadata.identity_enrichment,statisticsImportedAt:result.metadata.imported_at})+'\n');
