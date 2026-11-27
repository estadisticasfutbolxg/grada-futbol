'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const leagues=require('../dist/leagues'),{harness}=require('./helpers/app-harness.cjs'),{fixture}=require('./helpers/explore.cjs');
function snapshot(id){const d=fixture(),l=leagues.get(id);Object.assign(d.metadata,{league_key:id,competition:l.name,primary_source:'FotMob',source:'FotMob + ESPN',sources:{FotMob:{imported_at:d.metadata.imported_at},ESPN:{imported_at:d.metadata.imported_at}}});return d;}
function setup(ids=leagues.list().map(l=>l.id)){
 const h=harness(),calls=[],seen=[];
 h.context.GradaIdeal={
  build(model,{datasets}){
   calls.push({model,datasets});
   const domestic=leagues.members('leagues'),available=new Set(datasets.map(d=>d.metadata.league_key));
   return {groups:[{id:'leagues',name:'Todas las ligas',complete:true},...domestic.map(l=>({id:l.id,name:l.name,complete:available.has(l.id),available:available.has(l.id)}))],coverage:{availableLeagues:domestic.filter(l=>available.has(l.id)).length,expectedLeagues:15,eligible:11,complete:domestic.filter(l=>available.has(l.id)).length+1,duplicateRecords:0,conflicts:0},data:model.data};
  },
  options:(model,selected)=>model.groups.map(g=>'<option value="'+g.id+'"'+(g.id===selected?' selected':'')+'>'+g.name+'</option>').join(''),
  ranking:model=>model.groups.map(g=>'<button data-ideal="'+g.id+'">'+g.name+'</button>').join(''),
  lineup:(group,model)=>{seen.push(group.id);return '<h2>'+group.name+'</h2><button data-national-player="'+model.data.players[0].id+'">Player</button>';}
 };
 h.run("for(const [id,state]of sets)datasets.set(id,state);initialLoadsComplete=true;activateLeague('laliga');navigate('players',false)",{sets:ids.map(id=>[id,{combined:snapshot(id)}])});
 return {h,calls,seen};
}
test('ideal navigation uses all domestic leagues, preserves the full score reference, and caches selector changes',()=>{
 const {h,calls,seen}=setup();h.run("navigate('ideal',false)");
 assert.equal(h.run('currentLeague'),'leagues');assert.equal(h.run('view'),'ideal');assert.equal(h.run('data.metadata.leagues.length'),15);assert.equal(h.run('scoreContext().reference.metadata.leagues.length'),18);
 assert.equal(calls.length,1);assert.equal(calls[0].datasets.length,18);assert.equal(calls[0].model.data.metadata.scope,'leagues');assert.equal(seen.at(-1),'leagues');
 assert.equal(h.node('#ideal-select').options.length,16);assert.match(h.node('#ideal-coverage').textContent,/15\/15 ligas disponibles/);assert.match(h.node('#ideal-coverage').textContent,/sin ponderar minutos/);assert.match(h.node('#ideal-coverage').textContent,/liga y todos los torneos cargados/);
 h.node('#ideal-select').value='laliga';h.node('#ideal-select').onchange();assert.equal(h.run('selectedIdeal'),'laliga');assert.equal(seen.at(-1),'laliga');assert.equal(calls.length,1);
 const choice=h.node('#ideal-ranking').buttons.find(b=>b.dataset.ideal==='portugal');choice.onclick();assert.equal(h.run('selectedIdeal'),'portugal');assert.equal(h.node('#ideal-lineup').scrolled,true);assert.equal(calls.length,1);
 let chosen;h.run('detail=selected=>{chosenPlayer=selected}',{chosenPlayer:null});h.node('#ideal-lineup').buttons[0].onclick();chosen=h.run('chosenPlayer');assert.equal(chosen,calls[0].model.data.players[0].id);
});
test('ideal view exposes partial league coverage and refreshes its cache after source data changes',()=>{
 const {h,calls}=setup(['laliga','portugal','champions-league']);h.run("navigate('ideal',false)");assert.equal(calls.length,1);assert.match(h.node('#ideal-coverage').textContent,/2\/15 ligas disponibles/);assert.match(h.node('#ideal-coverage').textContent,/Cobertura parcial/);assert.equal(h.node('#ideal-select').options.length,16);
 h.run("selectedIdeal='portugal';datasets.set('laliga',{combined:next});activateLeague('leagues')",{next:snapshot('laliga')});
 assert.equal(calls.length,2);assert.equal(h.run('selectedIdeal'),'portugal');assert.equal(h.run('view'),'ideal');
 h.run("selectedIdeal='unregistered';renderIdeal()");assert.equal(h.run('selectedIdeal'),'leagues');assert.equal(calls.length,2);
});
test('ideal entrypoint has its own selector and loads after the shared formation renderer',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8');
 for(const value of ['data-view="ideal"','id="ideal"','id="ideal-select"','id="ideal-ranking"','id="ideal-lineup"','id="ideal-coverage"'])assert(html.includes(value));
 assert(html.indexOf('<script src="nations.js">')<html.indexOf('<script src="ideal.js">'));assert(html.indexOf('<script src="ideal.js">')<html.indexOf('<script src="app.js">'));
 const app=fs.readFileSync(path.join(__dirname,'../dist/app.js'),'utf8');assert(app.includes("initialQuery.get('vista')==='ideal'"));assert(app.includes("initialQuery.get('once')||'leagues'"));
});
