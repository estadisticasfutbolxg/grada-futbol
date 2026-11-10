'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),identity=require('../dist/identity.js'),positions=require('../dist/positions.js');
const player=(id,name,club='one',pos='MED')=>({id,name,club,pos});
const link=(a,b)=>identity.link(a,b,{primaryClub:p=>p.club,secondaryClub:p=>p.club});
test('generic names support accents, transliteration, reordered names, middle names, initials and contractions',()=>{
 const pairs=[
  ['Ørjan Håskjold Nyland','Orjan Nyland','name_extended_team'],
  ['Lee Kang-In','Kang-In Lee','name_tokens_team'],
  ['Pape Alassane Gueye','Pape Gueye','name_extended_team'],
  ['F. Valverde','Federico Valverde','name_initials_team'],
  ['Dani Carvajal','Daniel Carvajal','name_contracted_team'],
  ['Fer Niño','Fernando Niño','name_contracted_team'],
  ['Mat Ryan','Mathew Ryan','name_contracted_team'],
  ['Álex Grimaldo','Alejandro Grimaldo','name_given_variant_team'],
  ['Antonio Martínez','Toni Martínez','name_given_variant_team'],
  ['Odisseas Vlachodimos','Odysseas Vlachodimos','name_given_variant_team'],
  ['Yuri','Yuri Berchiche','name_mononym_team'],
  ['Cristian Cásseres','Cristian Casseres Jr.','name_extended_team']
 ];
 for(const[a,b,method]of pairs){const first=player('a',a),second=player('b',b),result=link([first],[second]);assert.equal(result.matches.get(first)?.record,second,a);assert.equal(result.matches.get(first).method,method,a);}
 const p=player('1','Álvaro García'),other=player('2','Alvaro Garcia');assert.equal(link([p],[other]).matches.get(p).method,'name_team');
});
test('published full-name aliases bridge surname selections but still require a unique club identity',()=>{
 const p=player('1','Andrés Castrín'),q={...player('2','Andrés López'),nameAliases:['Andrés Castrín López']};
 const result=link([p],[q]);assert.equal(result.matches.get(p).record,q);assert.equal(result.matches.get(p).method,'provider_alias_team');
 assert.equal(link([p],[q,{...q,id:'duplicate'}]).matches.size,0);
 assert.equal(link([p],[{...q,club:'two'}]).matches.size,0);
});
test('full given-name conflicts, typos, clubs and keeper conflicts never become name variants',()=>{
 const first=player('a','Álvaro García');
 for(const other of [player('b','Alfonso García'),player('b','Álvaro Garsia'),player('b','Álvaro García','two'),player('b','Álvaro García','one','POR')])assert.equal(link([first],[other]).matches.size,0);
 assert.equal(link([player('x','Álvaro García',null)],[player('y','Álvaro García')]).matches.size,0);
});
test('mononyms and duplicated names stay unresolved and a source record cannot be reused',()=>{
 const p=player('a','Gabriel'),others=[player('b','Gabriel Magalhães'),player('c','Gabriel Martinelli')];
 assert.equal(link([p],others).matches.size,0);assert(link([p],others).states.get(p).ambiguous);
 const a=player('1','Yuri'),b=player('2','Yuri Berchiche'),r=player('3','Yuri Berchiche');
 for(const primary of [[a,b],[b,a]]){const matches=link(primary,[r]).matches;assert.equal(matches.size,1);assert.equal(matches.get(b).record,r);assert(!matches.has(a));}
 const duplicated=[player('1','José García'),player('2','José García')];assert.equal(link(duplicated,[player('3','José García')]).matches.size,0);
 assert.equal(link([player('1','José García')],[player('2','José García'),player('3','José García')]).matches.size,0);
});
test('unique matching is independent of roster order and retains reviewed identity barriers',()=>{
 const primary=[player('1','Pape Alassane Gueye'),player('2','Dani Carvajal')],secondary=[player('3','Daniel Carvajal'),player('4','Pape Gueye')];
 const ids=(a,b)=>[...link(a,b).matches].map(([p,m])=>p.id+':'+m.record.id).sort();assert.deepEqual(ids(primary,secondary),ids([...primary].reverse(),[...secondary].reverse()));
 const p=player('1','Kylian Mbappe-Lottin'),q=player('2','Kylian Mbappé');
 let result=identity.link([p],[q],{primaryClub:p=>p.club,secondaryClub:p=>p.club,primaryKey:()=> 'one|@reviewed',secondaryKey:()=> 'one|@reviewed'});assert.equal(result.matches.get(p).method,'verified_identity');
 result=identity.link([p],[q],{primaryClub:p=>p.club,secondaryClub:p=>p.club,primaryKey:()=> 'one|@reviewed',secondaryKey:()=> 'one|kylianmbappe'});assert.equal(result.matches.size,0);
});
test('position consensus fixes the same player without using his metrics or changing source records',()=>{
 const sources={Understat:{pos:'MED'},ESPN:{pos:'DEL'},FotMob:{pos:'DEL'}},before=JSON.stringify(sources),result=positions.resolve(sources,'Understat');
 assert.equal(result.position,'DEL');assert.equal(result.method,'source_consensus');assert.equal(result.source,'FotMob');assert.equal(result.uncertain,false);assert.deepEqual(result.alternatives,{Understat:'MED',ESPN:'DEL',FotMob:'DEL'});assert.equal(JSON.stringify(sources),before);
 assert(positions.describe({positionResolution:result}).includes('ESPN y FotMob'));
 sources.Understat.pos='DEF';sources.ESPN.pos='MED';sources.FotMob.pos='DEL';
 const conflict=positions.resolve(sources,'Understat');assert.equal(conflict.position,'DEL');assert.equal(conflict.method,'profile_position');assert.equal(conflict.uncertain,true);
 assert.equal(positions.resolve({Understat:{pos:'MED'},ESPN:{pos:'DEL'}},'Understat').position,'MED');
 assert.equal(positions.resolve({FotMob:{pos:'—'},ESPN:{pos:'DEF'}},'FotMob').position,'DEF');
});
test('position keys preserve multi-position source evidence and recognize winger, wingback and keeper aliases',()=>{
 assert.deepEqual(positions.fromUnderstat('M F M S'),['MED','DEL']);
 for(const[key,pos]of [['keeper_long','POR'],['left_wing_back','DEF'],['right-back','DEF'],['central_midfielder','MED'],['leftwinger','DEL']])assert.equal(positions.fromFotmob({key}),pos);
 assert.equal(positions.fromFotmob({key:'unknown'}),'—');assert.equal(positions.fromFotmob({label:'Attacker'}),'DEL');
});
