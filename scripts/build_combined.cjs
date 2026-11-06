'use strict';
// Reproduce the browser's combined JSON from two actual generated snapshots.
const fs=require('node:fs'),path=require('node:path');
const {combine}=require('../dist/combined.js');
const root=path.resolve(__dirname,'..'),folder=path.join(root,'dist/downloads');
const read=name=>JSON.parse(fs.readFileSync(path.join(folder,name),'utf8'));
const extra=fs.existsSync(path.join(folder,'fotmob-laliga-2026-27.json'))?read('fotmob-laliga-2026-27.json'):null;
const data=combine(read('understat-laliga-2026-27.json'),read('laliga-2026-27.json'),extra);
const output=path.join(folder,'combined-laliga-2026-27.json'),temporary=output+'.tmp';
try { fs.writeFileSync(temporary,JSON.stringify(data));fs.renameSync(temporary,output); }
finally {if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
process.stdout.write(JSON.stringify({output,...data.metadata.combination})+'\n');
