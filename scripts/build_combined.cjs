'use strict';
// Reproduce the browser's combined JSON and scores from real provider snapshots.
const fs=require('node:fs'),path=require('node:path');
const {combine}=require('../dist/combined.js');
const {withScores}=require('../dist/scores.js'),{aggregate}=require('../dist/scopes.js');
const root=path.resolve(__dirname,'..'),leagues=require('../dist/leagues.js');
const flag=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const league=leagues.get(flag('--league','laliga')),folder=path.resolve(flag('--data-dir',path.join(root,'dist/downloads')));
const referenceFolder=path.resolve(flag('--reference-dir',folder));
function load(l,where){
 const get=name=>JSON.parse(fs.readFileSync(path.join(where,name),'utf8')),fm=get('fotmob-'+l.id+'-2026-27.json'),espn=get(l.espnFile);
 return l.primary==='Understat'?combine(get('understat-'+l.id+'-2026-27.json'),espn,fm):combine(fm,espn);
}
const data=load(league,folder),snapshots=[];
for(const l of leagues.list()){
 if(l.id===league.id){snapshots.push(data);continue;}
 const files=[l.espnFile,'fotmob-'+l.id+'-2026-27.json',...(l.primary==='Understat'?['understat-'+l.id+'-2026-27.json']:[])];
 if(files.every(f=>fs.existsSync(path.join(referenceFolder,f))))snapshots.push(load(l,referenceFolder));
}
const reference=aggregate(snapshots);
const output=path.join(folder,'combined-'+league.id+'-2026-27.json'),temporary=output+'.tmp';
try { fs.writeFileSync(temporary,JSON.stringify(withScores(data,{referencePlayers:reference.players,referenceLabel:snapshots.length+' ligas cargadas'})));fs.renameSync(temporary,output); }
finally {if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
process.stdout.write(JSON.stringify({output,...data.metadata.combination})+'\n');
