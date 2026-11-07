'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const squads=require('../dist/squads.js'),filters=require('../dist/filters.js'),scopes=require('../dist/scopes.js');
test('team area sums all valid player areas, includes true zero and retains missing coverage',()=>{
 const players=[{id:'a',team_id:'1',name:'A',pos:'DEL',minutes:1},{id:'b',team_id:'1',name:'B',pos:'POR',minutes:900},{id:'c',team_id:'1',name:'C',pos:'MED'},{id:'d',team_id:'1',name:'D',pos:'DEF'},{id:'e',team_id:'2',name:'A',pos:'DEL'},{id:'f',team_id:null,name:'Transfer'}];
 const data={metadata:{competition:'Isolated fixture',imported_at:'2026-11-07T00:00:00Z'},players,teams:[{id:1,name:'First'},{id:2,name:'Second'},{id:3,name:'Empty'}]},before=JSON.stringify(data);
 const profiles=new Map(players.map((p,i)=>[p,{comparableArea:[1,0.75,0,null,0.25,0.9][i]}]));const s=squads.summarize(data,profiles);
 assert.equal(s.teams.get('1').area,1.75);assert.equal(s.teams.get('1').validPlayers,3);assert.equal(s.teams.get('1').totalPlayers,4);assert.equal(s.teams.get('1').missingPlayers,1);
 assert.equal(s.teams.get('2').area,0.25);assert.equal(s.teams.get('3').area,null);assert.deepEqual(s.unassignedPlayerIds,['f']);
 const exported=squads.withTeamAreas(data,s);assert.equal(exported.teams[0].teamArea,1.75);assert.deepEqual(exported.teams[0].teamAreaCoverage,{valid:3,total:4,missing:1});assert.equal(exported.teams[0].teamAreaContributions[3].area,null);
 assert.equal(exported.metadata.imported_at,data.metadata.imported_at);assert.equal(JSON.stringify(data),before);
});
test('empty/unknown areas stay unknown and duplicate identities cannot inflate the sum',()=>{
 const player={id:'a',team_id:'1',name:'Unknown'},data={players:[player],teams:[{id:'1'}]};const s=squads.summarize(data,new Map());assert.equal(s.teams.get('1').area,null);assert.equal(s.teams.get('1').missingPlayers,1);
 assert.throws(()=>squads.summarize({...data,players:[player,player]}));assert.throws(()=>squads.summarize({...data,teams:[{id:'1'},{id:1}]}));
});
test('all-leagues aggregation drops local derived sums before recomputing the new reference',()=>{
 const data={metadata:{kind:'combined',league_key:'a',competition:'A',imported_at:'2026-11-07T00:00:00Z',imported_matches:1,available_matches:380,combination:{matched_players:0},sources:{}},players:[{id:'p',name:'Unknown',team_id:null,pos:'—'}],teams:[{id:'1',name:'Club',teamArea:8,teamAreaCoverage:{valid:10},teamAreaContributions:[]}]};
 const all=scopes.aggregate([data]);assert.equal(all.players[0].team_id,null);assert(!Object.hasOwn(all.teams[0],'teamArea'));assert.equal(squads.summarize(all).teams.get('a:1').area,null);assert.equal(data.teams[0].teamArea,8);
});
test('Racing de Santander searches its published name and accents are searchable',()=>{
 assert(filters.textMatches({name:'Racing Santander',league:'LaLiga'},'  RACING DE   SANTANDER '));assert(filters.textMatches({name:'Sergio Canales',team:'Racing Santander'},'Racing de Santander'));
 assert(filters.textMatches({name:'Álvaro Mantilla'},'alvaro'));assert(!filters.textMatches({name:'Racing Santander'},'Racing Ferrol'));
});
