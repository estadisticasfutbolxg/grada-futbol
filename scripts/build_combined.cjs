'use strict';
// Reproduce the browser's combined JSON from two actual generated snapshots.
const fs=require('node:fs'),path=require('node:path');
const {combine}=require('../dist/combined.js');
const {withTeamAreas}=require('../dist/squads.js');
const root=path.resolve(__dirname,'..'),leagues=require('../dist/leagues.js');
const flag=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:process.argv[i+1];};
const league=leagues.get(flag('--league','laliga')),folder=path.resolve(flag('--data-dir',path.join(root,'dist/downloads')));
const read=name=>JSON.parse(fs.readFileSync(path.join(folder,name),'utf8'));
const filename='fotmob-'+league.id+'-2026-27.json',extra=fs.existsSync(path.join(folder,filename))?read(filename):null;
const data=league.primary==='Understat'?combine(read('understat-'+league.id+'-2026-27.json'),read(league.espnFile),extra):combine(read(filename),read(league.espnFile));
const output=path.join(folder,'combined-'+league.id+'-2026-27.json'),temporary=output+'.tmp';
try { fs.writeFileSync(temporary,JSON.stringify(withTeamAreas(data)));fs.renameSync(temporary,output); }
finally {if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
process.stdout.write(JSON.stringify({output,...data.metadata.combination})+'\n');
