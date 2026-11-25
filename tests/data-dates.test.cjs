'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const dates=require('../dist/dates.js'),{harness}=require('./helpers/app-harness.cjs');
const base='2026-11-01T12:00:00Z',profile='2026-11-08T18:25:00Z',identity='2026-11-14T21:00:00Z';
function sample(){return {metadata:{league_key:'laliga',competition:'LaLiga',season:'2026/27',primary_source:'Understat',sources:{Understat:{imported_at:base},FotMob:{imported_at:base}}},players:[{id:'isolated',goals:0,metricContexts:{goals:{source:'FotMob',captured_at:profile}},sourceRecords:{FotMob:{goals:0,metricContexts:{goals:{source:'FotMob',captured_at:profile}}}},tacticalContext:{source:'FotMob',captured_at:identity},nationality:{context:{source:'FotMob',captured_at:identity}}}],teams:[]};}
test('capture dates include zero-valued statistics while newer identity and absent metrics stay separate',()=>{
 const data=sample();data.players[0].metricContexts.shots={source:'FotMob',captured_at:identity};
 const rows=dates.snapshot(data),fotmob=rows.find(row=>row.source==='FotMob');
 assert.deepEqual(fotmob.statistics,{first:Date.parse(base),last:Date.parse(profile)});assert.deepEqual(fotmob.identity,{first:Date.parse(identity),last:Date.parse(identity)});
 assert.strictEqual(dates.snapshot(data),rows,'reuse the immutable snapshot on navigation');
 const changed=structuredClone(data);changed.players[0].metricContexts.goals.captured_at=identity;assert.equal(dates.snapshot(changed)[1].statistics.last,Date.parse(identity));
});
test('all leagues uses each league source metadata and record details only show sources in that record',()=>{
 const one=sample(),two=sample();two.metadata.league_key='bundesliga';two.metadata.competition='Bundesliga';two.metadata.sources={FotMob:{imported_at:identity}};
 const all={metadata:{scope:'all',sources:one.metadata.sources,leagues:[one,two].map(d=>({id:d.metadata.league_key,name:d.metadata.competition,sources:d.metadata.sources}))},players:[...one.players.map(p=>({...p,league_key:'laliga'})),...two.players.map(p=>({...p,league_key:'bundesliga',metricContexts:{},sourceRecords:{}}))],teams:[]};
 const rows=dates.snapshot(all);assert.equal(rows.length,3);assert.equal(rows.find(r=>r.league==='bundesliga').base.first,Date.parse(identity));
 const record=all.players[0],detail=dates.snapshot(all,record);assert.equal(detail.length,1);assert.equal(detail[0].source,'FotMob');assert.equal(detail[0].league,'laliga');assert(!dates.recordHTML(all,record).includes('Understat'));
});
test('original source fields and reported per90 dates remain visible when combined fields choose another provider',()=>{
 const data=sample(),player=data.players[0];player.goals=2;player.metricContexts.goals={source:'Understat',captured_at:base};player.sourceRecords.FotMob={completed:null,metricContexts:{completed:{source:'FotMob',reportedPer90:0,captured_at:profile,minutes_captured_at:'2026-11-09T12:00:00Z',componentCaptures:{a:'2026-11-07T12:00:00Z',b:base}}}};
 assert.equal(dates.snapshot(data)[1].statistics.last,Date.parse('2026-11-09T12:00:00Z'));
});
test('unknown dates are explicit, dynamic labels are escaped and Madrid formatting handles winter and summer',()=>{
 const data=sample();data.metadata.competition='<img src=x onerror=alert(1)>';data.metadata.sources.Understat.imported_at='unknown';
 const html=dates.panel(dates.snapshot(data));assert(html.includes('&lt;img'));assert(!html.includes('<img'));assert(html.includes('Sin fecha'));assert.equal(dates.format(null),'Sin fecha');
 assert.match(dates.format({first:Date.parse('2026-11-23T12:00:00Z'),last:Date.parse('2026-11-23T12:00:00Z')},true),/13:00/);
 assert.match(dates.format({first:Date.parse('2026-07-23T12:00:00Z'),last:Date.parse('2026-07-23T12:00:00Z')},true),/14:00/);
});
function storage(initial){let value=initial;return {getItem:()=>value,setItem:(_,next)=>{value=next;},value:()=>value};}
test('accepted, cached and failed queries persist separately without changing source capture dates',()=>{
 const store=storage(),history=dates.history(store,['laliga']),data=sample(),before=JSON.stringify(data);
 assert(history.record('laliga','FotMob','accepted','2026-11-22T10:00:00Z'));
 assert(history.record('laliga','Understat','retained','2026-11-23T10:00:00Z'));
 const reloaded=dates.history(store,['laliga']),html=dates.panel(dates.snapshot(data),reloaded);
 assert.equal(reloaded.get('laliga','FotMob').status,'accepted');assert.equal(reloaded.get('laliga','Understat').status,'retained');assert(html.includes('Consulta válida'));assert(html.includes('Se conservan datos'));assert(html.includes('caché'));assert.equal(JSON.stringify(data),before);
});
test('invalid and oversized browser history is bounded; denied storage falls back to session memory',()=>{
 for(const value of ['{','null','{}',JSON.stringify([['other','FotMob',identity,'accepted'],['laliga','FotMob','bad','accepted'],['laliga','ESPN',identity,'fake']])])assert.equal(dates.history(storage(value),['laliga']).get('laliga','FotMob'),null);
 const store=storage(JSON.stringify(Array.from({length:500},()=>['other','FotMob',identity,'accepted']))),h=dates.history(store,['laliga']);
 assert(!h.record('other','FotMob','accepted',identity));assert(!h.record('laliga','unknown','accepted',identity));assert(!h.record('laliga','FotMob','accepted','bad'));
 for(let i=0;i<50;i++)for(const source of ['Understat','ESPN','FotMob'])assert(h.record('laliga',source,'accepted',identity));assert.equal(JSON.parse(store.value()).length,3);
 const denied=dates.history({getItem(){throw Error('Blocked');},setItem(){throw Error('Blocked');}},['laliga']);assert(denied.record('laliga','ESPN','retained',identity));assert.equal(denied.get('laliga','ESPN').status,'retained');
});
test('opening query history physically drops retired league records while retaining active dates',()=>{
 const store=storage(JSON.stringify([['laliga-2','FotMob',identity,'accepted'],['laliga','FotMob',profile,'retained'],['league-one','ESPN',base,'accepted']])),h=dates.history(store,['laliga']);
 assert.equal(h.get('laliga-2','FotMob'),null);assert.equal(h.get('laliga','FotMob').status,'retained');assert.deepEqual(JSON.parse(store.value()),[['laliga','FotMob',new Date(profile).toISOString(),'retained']]);
});
test('every page renders the shared panel, including nations, and keeps its expansion state',()=>{
 const h=harness(),data=sample();Object.assign(data.metadata,{kind:'combined',imported_at:base,imported_matches:0,available_matches:380,combination:{matched_players:0}});h.run("data=fixture;loaded=true;datasets.set('laliga',{combined:fixture});renderNations=()=>{};dashboard=()=>{};renderLeaders=()=>{};syncPositions=()=>{};renderClubOptions=()=>{};renderTable=()=>{};renderCompare=()=>{};renderTeamComparison=()=>{};renderTerms=()=>{};updateRadarProfiles=()=>{};",{fixture:data});
 h.node('#data-dates').open=true;
 for(const view of ['overview','players','teams','rankings','compare','nations','glossary']){h.run('navigate(target,false)',{target:view});assert(!h.node('#data-dates').hidden,view);assert(h.node('#data-dates').innerHTML.includes('Datos cargados'),view);assert(h.node('#data-dates').open);}
 h.run('loaded=false;renderDataDates()');assert(h.node('#data-dates').hidden);
});
test('refresh controller shows accepted capture dates and retained failures, even when every next request fails',async()=>{
 const h=harness(),before=sample(),after=structuredClone(before);after.metadata.sources.FotMob.imported_at=profile;
 h.context.GradaRefresh={...h.context.GradaRefresh,refresh:async()=>({state:{combined:after,fotmob:after},checked:['fotmob'],updated:['fotmob'],failed:['understat','espn']}),report:()=>({})};
 h.run("data=fixture;loaded=true;datasets.set('laliga',{combined:fixture});captureStore.set=async()=>true;activateLeague=()=>{data=datasets.get('laliga').combined;};showRefreshReport=()=>'';updateRefreshButton=()=>{};",{fixture:before});
 await h.run('refreshData()');
 assert.equal(h.run("GradaDates.snapshot(data).find(r=>r.source==='FotMob').base.first"),Date.parse(profile));
 assert.equal(h.run("dataDateHistory().get('laliga','FotMob').status"),'accepted');assert.equal(h.run("dataDateHistory().get('laliga','Understat').status"),'retained');assert(h.node('#data-dates').innerHTML.includes('Consulta válida'));assert(!h.node('#data-dates').innerHTML.includes('Actualizando…'));
 const saved=h.run('JSON.stringify(data)');h.context.GradaRefresh.refresh=async()=>{throw Error('Unavailable');};
 await h.run('refreshData()');assert.equal(h.run('JSON.stringify(data)'),saved);assert.equal(h.run("dataDateHistory().get('laliga','FotMob').status"),'retained');assert(h.node('#data-dates').innerHTML.includes('Se conservan datos'));assert(!h.node('#data-dates').innerHTML.includes('Consulta válida'));
});
