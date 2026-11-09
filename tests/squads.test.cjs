'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const squads=require('../dist/squads.js'),filters=require('../dist/filters.js'),scopes=require('../dist/scopes.js');
test('weighted team score uses minutes of eligible players and keeps missing data out of the denominator',()=>{
 const players=[{id:'a',team_id:'1',name:'A',pos:'DEL',minutes:90},{id:'b',team_id:'1',name:'B',pos:'POR',minutes:270},{id:'c',team_id:'1',name:'C',pos:'MED',minutes:0},{id:'d',team_id:'1',name:'D',pos:'DEF',minutes:900},{id:'e',team_id:'2',name:'E',pos:'DEL',minutes:45},{id:'f',team_id:null,name:'Transfer',minutes:100},{id:'g',team_id:'1',name:'No minutes',minutes:null}];
 const data={metadata:{competition:'Isolated fixture',imported_at:'2026-11-07T00:00:00Z'},players,teams:[{id:1},{id:2},{id:3}]},before=JSON.stringify(data);
 const profiles=new Map(players.map((p,i)=>[p,{comparableArea:[1,0,1,null,0.25,0.9,1][i]}])),s=squads.summarize(data,profiles),first=s.teams.get('1');
 assert.equal(first.area,0.25);assert.equal(first.minutes,360);assert.equal(first.validPlayers,2);assert.equal(first.totalPlayers,5);assert.equal(first.missingPlayers,3);
 assert.equal(first.players[0].weight,0.25);assert.equal(first.players[0].contribution,0.25);assert.equal(first.players[1].contribution,0);assert.equal(first.players[2].included,false);assert.equal(first.players[3].weight,null);
 assert.equal(s.teams.get('2').area,0.25);assert.equal(s.teams.get('3').area,null);assert.deepEqual(s.unassignedPlayerIds,['f']);
 const output=squads.withTeamAreas(data,s);assert.equal(output.teams[0].teamArea,0.25);assert.equal(output.teams[0].teamAreaMinutes,360);assert.equal(output.metadata.derived_metrics.teamArea.method,'minutes_weighted_mean');assert.equal(output.metadata.imported_at,data.metadata.imported_at);assert.equal(JSON.stringify(data),before);
});
test('missing and duplicate identities cannot manufacture team scores',()=>{
 const player={id:'a',team_id:'1',name:'Unknown',minutes:90},data={players:[player],teams:[{id:'1'}]};const s=squads.summarize(data,new Map());assert.equal(s.teams.get('1').area,null);assert.equal(s.teams.get('1').missingPlayers,1);
 assert.throws(()=>squads.summarize({...data,players:[player,player]}));assert.throws(()=>squads.summarize({...data,teams:[{id:'1'},{id:1}]}));
});
test('all-leagues scope discards local derived scores and preserves unassigned transfers',()=>{
 const d={metadata:{kind:'combined',league_key:'a',competition:'A',imported_at:'2026-11-07T00:00:00Z',imported_matches:1,available_matches:380,combination:{matched_players:0},sources:{}},players:[{id:'p',team_id:null,pos:'—'}],teams:[{id:'1',teamArea:0.8,teamAreaMinutes:900,attackArea:{area:0.5},midfieldAreas:{MED_ATT:{area:0.4}}}]};
 const all=scopes.aggregate([d]);assert.equal(all.players[0].team_id,null);for(const key of ['teamArea','teamAreaMinutes','attackArea','midfieldAreas'])assert(!Object.hasOwn(all.teams[0],key));assert.equal(squads.summarize(all).teams.get('a:1').area,null);assert.equal(d.teams[0].teamArea,0.8);
});
test('Racing alias and accent folding change search, without fuzzy identities',()=>{
 assert(filters.textMatches({name:'Racing Santander'},'RACING DE SANTANDER'));assert(filters.textMatches({name:'Álvaro Mantilla'},'alvaro'));assert(!filters.textMatches({name:'Racing Santander'},'Racing Ferrol'));
});
test('unit profiles include only their position, keep distinct coverage, and do not reward a larger roster',()=>{
 const player=(id,team,pos)=>({id,team_id:team,name:'Isolated '+id,pos,minutes:540,matches:6,xa:1,chancesCreated:6,bigChancesCreated:3,shotsOnTargetPer90:1,dribblesPer90:1,goals:1,xg:1,conversion:10,completedPer90:40,accuracy:80,recoveries:12,tackles:6,interceptions:3,lineBreakingPasses:12});
 const players=[...Array.from({length:7},(_,i)=>player('m'+i,i<2?'a':'b','MED')),...Array.from({length:6},(_,i)=>player('s'+i,i<5?'a':'b','DEL'))];players[0].xa=null;players.push({...player('defender','a','DEF'),xa:1000,recoveries:1000},player('unassigned',null,'DEL'));
 const d={metadata:{competition:'Isolated test only'},players,teams:[{id:'a'},{id:'b'},{id:'empty'}]},before=JSON.stringify(d),u=squads.unitSummaries(d);
 assert.equal(u.get('MED_ATT').teams.get('a').validPlayers,1);assert.equal(u.get('MED_DEF').teams.get('a').validPlayers,1);assert.equal(u.get('MED_ATT').teams.get('a').area,0.25);
 assert.equal(u.get('DEL').teams.get('a').area,0.25);assert.equal(u.get('DEL').teams.get('b').area,0.25);assert.equal(u.get('DEL').teams.get('a').validPlayers,5);assert.equal(u.get('DEL').teams.get('b').validPlayers,1);assert.equal(u.get('DEL').teams.get('empty').area,null);
 assert.deepEqual(u.get('DEL').unassignedPlayerIds,['unassigned']);assert(u.get('DEL').teams.get('a').players.every(p=>p.pos==='DEL'));
 const output=squads.withTeamAreas(d);assert.equal(output.teams[0].strikerArea,0.25);assert.equal(output.teams[0].unitScores.DEL.minutes,2700);assert.equal(JSON.stringify(d),before);
});
