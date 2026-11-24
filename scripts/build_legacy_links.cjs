'use strict';
// Keep old player bookmarks working after a catalog migration. Only verified
// ID aliases are published; archived statistics never enter the active model.
const fs=require('node:fs'),path=require('node:path'),leagues=require('../dist/leagues.js'),combined=require('../dist/combined.js');
const folder=path.resolve(__dirname,'../dist/downloads'),links={};
for(const league of leagues.list()){
 if(league.archivedPrimary!=='Understat'||league.primary!=='FotMob')continue;
 const archived=path.join(folder,'understat-'+league.id+'-2026-27.json');if(!fs.existsSync(archived))continue;
 const read=name=>JSON.parse(fs.readFileSync(path.join(folder,name),'utf8'));
 const joined=combined.combine(read(path.basename(archived)),read(league.espnFile),read('fotmob-'+league.id+'-2026-27.json'));
 for(const p of joined.players){const target=p.sourceRecords.FotMob?.id;if(target&&/^\d{1,12}$/.test(target))links[league.id+'|'+p.id]='combined:'+target;}
}
process.stdout.write(JSON.stringify(links));
