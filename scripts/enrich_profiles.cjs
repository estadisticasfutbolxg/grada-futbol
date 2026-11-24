'use strict';
// Consume real cached HTML only; never reconstruct counts from rounded rates.
const fs=require('node:fs'),path=require('node:path'),leagues=require('../dist/leagues.js'),profiles=require('../dist/profiles.js'),fotmob=require('../dist/fotmob.js');
const options=JSON.parse(fs.readFileSync(0,'utf8')),league=leagues.get(options.league),data=fotmob.validate(JSON.parse(fs.readFileSync(options.source))),accepted=[],failures=[];
if(options.minimumMinutes!==undefined&&options.minimumMinutes!==null&&(!Number.isInteger(options.minimumMinutes)||options.minimumMinutes<0))throw Error('Muestra mínima inválida.');
const selected=data.players.filter(p=>(!options.keepersOnly||p.pos==='POR')&&(options.minimumMinutes===undefined||options.minimumMinutes===null||p.minutes>=options.minimumMinutes||p.pos==='POR'));
for(const player of selected){
 const file=path.join(options.folder,String(player.id)+'.html');
 try{const stat=fs.statSync(file);if(stat.size>8*1024*1024)throw new Error('oversized');accepted.push(profiles.parse(fs.readFileSync(file,'utf8'),player,league.id,stat.mtime.toISOString()));}
 catch(_){failures.push(String(player.id));}
}
const previous=options.previous&&fs.existsSync(options.previous)?fotmob.validate(JSON.parse(fs.readFileSync(options.previous))):null;
const result=fotmob.validate(profiles.apply(data,accepted,previous));
result.metadata.profile_enrichment.failed_player_ids=failures;
result.metadata.profile_enrichment.requested=selected.length;
result.metadata.profile_enrichment.skipped_players=data.players.length-selected.length;
fs.writeFileSync(options.output,JSON.stringify(result));
process.stdout.write(JSON.stringify({league:league.id,players:data.players.length,requested:selected.length,accepted:accepted.length,failed:failures.length,skipped:data.players.length-selected.length}));
