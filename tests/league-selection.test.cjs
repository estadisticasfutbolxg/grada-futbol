'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),leagues=require('../dist/leagues.js'),scopes=require('../dist/scopes.js'),scores=require('../dist/scores.js'),dates=require('../dist/dates.js'),security=require('../dist/security.js'),branding=require('../dist/branding.js'),{harness}=require('./helpers/app-harness.cjs'),{fixture}=require('./helpers/explore.cjs');
function snapshot(id){const d=fixture(),l=leagues.get(id);Object.assign(d.metadata,{league_key:id,competition:l.name,primary_source:'FotMob',source:'FotMob + ESPN',sources:{FotMob:{imported_at:d.metadata.imported_at},ESPN:{imported_at:d.metadata.imported_at}}});return d;}
function loaded(){const h=harness(),sets=leagues.list().map(l=>[l.id,{combined:snapshot(l.id)}]);h.run("for(const [id,state]of sets)datasets.set(id,state);initialLoadsComplete=true;activateLeague('laliga');navigate('players',false)",{sets});return h;}
test('registry allows only first divisions and seven European members, rejecting retired or arbitrary groups',()=>{
 assert.equal(leagues.list().length,15);assert(leagues.list().every(l=>l.division===1&&/\.1$/.test(l.espn)));
 assert.deepEqual(leagues.group('europe-top7').leagueIds,['laliga','premier-league','serie-a','bundesliga','ligue-1','portugal','eredivisie']);
 for(const id of ['championship','bundesliga-2','ligue-2','serie-b','laliga-2','league-one','league-two'])assert.throws(()=>leagues.get(id));
 assert.throws(()=>leagues.group('custom',['championship']));assert.throws(()=>leagues.group('custom',['laliga','laliga']));assert.throws(()=>leagues.group('custom',['<script>']));
 const config=leagues.list();try{assert.throws(()=>leagues.configure(config.map(l=>l.id==='laliga'?{...l,division:2}:l)));assert.throws(()=>leagues.configure(config.map(l=>l.id==='laliga'?{...l,espn:'esp.2'}:l)));}finally{leagues.configure(config);}
});
test('top seven and custom aggregates retain identity, original dates and canonical scores against the full reference',()=>{
 const inputs=leagues.list().map(l=>snapshot(l.id)),before=JSON.stringify(inputs),all=scopes.aggregate(inputs),canonical=scores.build(all),top=leagues.group('europe-top7'),data=scopes.aggregate(inputs.filter(d=>top.leagueIds.includes(d.metadata.league_key)),{scope:top.id}),model=scores.build(data,{referencePlayers:all.players}),byId=new Map(all.players.map(p=>[p.id,p]));
 assert.equal(data.metadata.expected_leagues,7);assert.equal(data.metadata.leagues.length,7);assert.equal(data.players.length,7*32);assert(data.players.every(p=>top.leagueIds.includes(p.league_key)));
 for(const p of data.players)assert.equal(model.players.get(p).score,canonical.players.get(byId.get(p.id)).score);
 assert.equal(dates.snapshot(data).length,14);assert.equal(security.sourceURL('FotMob',top.id),'https://www.fotmob.com/');assert.match(branding.countryLabel(top.id),/7 países/);
 const custom=scopes.aggregate(inputs.filter(d=>['laliga','belgium'].includes(d.metadata.league_key)),{scope:'custom',leagueIds:['belgium','laliga']});assert.equal(custom.players.length,64);assert.deepEqual(custom.metadata.requested_league_ids,['laliga','belgium']);assert.equal(JSON.stringify(inputs),before);
 assert.throws(()=>scopes.aggregate([inputs.at(-1)],{scope:top.id}));assert.throws(()=>scopes.aggregate([data]));assert.throws(()=>scopes.aggregate(inputs,{scope:'custom',leagueIds:['laliga']}));
 const partial=scopes.aggregate([inputs[0]],{scope:top.id});assert.equal(partial.metadata.leagues.length,1);assert.equal(partial.metadata.expected_leagues,7);const empty=scopes.aggregate([],{scope:top.id});assert.equal(empty.players.length,0);assert.equal(empty.metadata.imported_at,null);assert.equal(dates.snapshot(empty).length,0);
});
test('league checkbox events combine several leagues, keep the picker open and search without narrowing the score reference',()=>{
 const h=loaded();h.node('#league').open=true;
 const choose=(id,checked)=>{const input=h.node('#league-options').labels.find(l=>l.input.value===id).input;input.checked=checked;h.node('#league-options').onchange({target:input});};
 choose('portugal',true);assert.equal(h.run('currentLeague'),'custom');assert.equal(h.run('players().length'),64);assert.equal(h.node('#league-summary').textContent,'2 ligas seleccionadas');assert.equal(h.node('#league').open,true);assert.equal(h.run('scoreContext().reference.players.length'),15*32);assert.match(h.node('#thead').innerHTML,/data-sort="league"/);
 h.run("selectedClubs=new Set(['laliga:1']);teamCompareChoices=['laliga:1','portugal:1'];");choose('belgium',true);assert.equal(h.run('selectedClubs.size'),0);assert.equal(h.run('teamCompareChoices.length'),0);assert.equal(h.run('players().length'),96);
 h.node('#league-search').value='PAÍSES BAJOS';h.node('#league-search').oninput();assert.equal(h.node('#league-options').labels.filter(l=>!l.hidden).length,1);
 h.node('#league-top7').onclick();assert.equal(h.run('currentLeague'),'europe-top7');assert.equal(h.run('players().length'),224);assert.equal(h.node('#league-options').labels.filter(l=>l.input.checked).length,7);
 h.node('#league-all').onclick();assert.equal(h.run('players().length'),480);h.node('#league-clear').onclick();assert.equal(h.run('players().length'),0);assert.equal(h.node('#refresh').disabled,true);assert.match(h.node('#data-status').textContent,/Selecciona una o más/);choose('a-league',true);assert.equal(h.run('currentLeague'),'a-league');assert.equal(h.run('players().length'),32);
});
test('national navigation includes all available leagues, including non-European leagues',()=>{
 const h=loaded();h.run("selectLeagues(['scotland','a-league']);navigate('nations',false)");assert.equal(h.run('currentLeague'),'all');assert.equal(h.run('data.metadata.leagues.length'),15);assert.match(h.node('#nation-coverage').textContent,/15\/15 disponibles/);
 h.run("for(const id of GradaLeagues.group('europe-top7').leagueIds)datasets.delete(id);activateLeague('a-league');navigate('nations',false)");assert.equal(h.run('currentLeague'),'all');assert.equal(h.run('data.players.length'),8*32);assert.match(h.node('#nation-coverage').textContent,/8\/15 disponibles/);assert.equal(h.node('#nation-select').disabled,true);
});
test('multi-league refresh consults only the chosen real leagues and preserves that selection',async()=>{
 const h=loaded(),calls=[];h.context.GradaRefresh={...h.context.GradaRefresh,refresh:async(state,l)=>{calls.push(l.id);return {state,checked:[],updated:[],failed:[]};},report:()=>({})};h.run("selectLeagues(['laliga','belgium']);showRefreshReport=()=>''");await h.run('refreshData()');assert.deepEqual(calls.sort(),['belgium','laliga']);assert.equal(h.run('currentLeague'),'custom');assert.equal(h.run('activeLeagueIds().join()'),'laliga,belgium');
});
