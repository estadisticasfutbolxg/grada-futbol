'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{harness}=require('./helpers/app-harness.cjs'),{fixture}=require('./helpers/explore.cjs');
function loaded(){const h=harness(),input=fixture();h.run("data=input;loaded=true;view='players';datasets.set('laliga',{combined:input});updateRadarProfiles();renderClubOptions();renderTable();",{input});return h;}
test('large tables page the globally sorted and filtered results without changing scores or losing players',()=>{
 const h=loaded(),input=fixture(),sample=input.players.find(p=>p.pos==='DEL');input.players=Array.from({length:245},(_,i)=>({...sample,id:'page-'+i,name:'Player '+String(i).padStart(3,'0'),goals:i}));
 h.run("data=input;datasets.set('laliga',{combined:input});sort='goals';direction=-1;updateRadarProfiles();renderTable();",{input});
 const visible=()=>[...h.node('#tbody').innerHTML.matchAll(/data-detail="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(h.run('rows().length'),245);assert.equal(visible().length,100);assert.equal(visible()[0],'page-244');assert.equal(h.node('#table-page-status').textContent,'1–100 de 245');assert.equal(h.node('#table-previous').disabled,true);
 const before=h.run('scoreModel.players.get(data.players[0]).score');h.node('#table-next').onclick();assert.equal(visible()[0],'page-144');assert.equal(h.node('#table-page-status').textContent,'101–200 de 245');assert.match(h.node('#tbody').innerHTML,/rank-column">101<\/td>/);assert.equal(h.run('scoreModel.players.get(data.players[0]).score'),before);
 h.node('#table-next').onclick();assert.equal(visible().length,45);assert.equal(visible().at(-1),'page-0');assert.equal(h.node('#table-next').disabled,true);h.node('#table-previous').onclick();assert.equal(visible()[0],'page-144');
 h.node('#search').value='Player 244';h.run('renderTable()');assert.deepEqual(visible(),['page-244']);assert.equal(h.node('#table-pagination').hidden,true);assert.equal(h.run('tablePage'),0);
 h.node('#search').value='';h.run("sort='name';direction=1;renderTable()");assert.equal(visible()[0],'page-0');assert.equal(h.run('rows().length'),245);assert.match(h.node('#thead').innerHTML.match(/<th\b[\s\S]*?<\/th>/)[0],/radarArea/);
});
test('real table HTML puts score before rank and name; KPI sorting still works and dismisses help',()=>{
 const h=loaded(),headers=h.node('#thead').innerHTML.match(/<th\b[\s\S]*?<\/th>/g);assert.match(headers[0],/data-sort="radarArea"/);assert.match(headers[1],/data-help="rank"/);assert.match(headers[2],/data-sort="name"/);
 const scoreCell=h.node('#tbody').innerHTML.match(/<td\b[\s\S]*?<\/td>/)[0];assert.match(scoreCell,/score-main/);assert.match(scoreCell,/<strong>/);
 const goals=h.queryAll('[data-sort]').find(b=>b.dataset.sort==='goals');assert.equal(goals.dataset.help,undefined);
 const info=h.queryAll('[data-help]').find(b=>b.dataset.help==='radarArea');info.onpointerenter();info.onfocus();info.onclick();assert.equal(h.node('#column-tooltip').hidden,false);assert(h.node('#column-tooltip').textContent.length<=170);
 goals.onclick();assert.equal(h.run('sort'),'goals');assert.equal(h.node('#column-tooltip').hidden,true);assert.match(h.node('#thead').innerHTML.match(/<th\b[\s\S]*?<\/th>/g)[0],/radarArea/);
 assert(h.run('rows()').every((p,i,rows)=>i===0||p.goals<=rows[i-1].goals));
 h.run("view='rankings';rankingProfile='TEAM_DEFENSE';sort=rankingSort();updateRadarProfiles();renderTable();");assert.match(h.node('#thead').innerHTML.match(/<th\b[\s\S]*?<\/th>/)[0],/data-sort="defenseArea"/);
});
test('checkbox events union club filters, preserve the open picker, support search and clear selection',()=>{
 const h=loaded();h.node('#teamfilter').open=true;
 const select=id=>{const input=h.node('#club-options').labels.find(l=>l.input.value===id).input;input.checked=true;h.node('#club-options').onchange({target:input});};
 select('1');assert.equal(h.run('rows().length'),16);select('2');assert.equal(h.run('rows().length'),32);assert.equal(h.node('#club-filter-summary').textContent,'2 equipos');assert.equal(h.node('#compare-picked').disabled,false);assert.equal(h.node('#teamfilter').open,true);
 h.node('#club-filter-search').value='TWO';h.node('#club-filter-search').oninput();assert.equal(h.node('#club-options').labels.filter(l=>!l.hidden).length,1);
 h.node('#clear-clubs').onclick();assert.equal(h.run('rows().length'),32);assert.equal(h.node('#club-filter-summary').textContent,'Todos los equipos');assert(h.node('#club-options').labels.every(l=>!l.hidden&&!l.input.checked));
});
test('team selectors stay distinct, show the same unit scores and use two checked club IDs',()=>{
 const h=loaded();h.run("view='teams';renderClubOptions();renderTeamComparison();");assert.equal(h.node('#team-comparison').hidden,false);
 assert.notEqual(h.run('teamCompareChoices[0]'),h.run('teamCompareChoices[1]'));assert.match(h.node('#team-comparison-body').innerHTML,/Goles \/90 de equipo/);
 h.run("selectedClubs=new Set(['1','2']);updateClubSummary();");h.node('#compare-picked').onclick();assert.equal(h.run('teamCompareChoices.join()'),'1,2');assert(h.node('#team-comparison').scrolled);
 h.node('#compare-team-left').value='2';h.node('#compare-team-left').onchange();assert.equal(h.run('teamCompareChoices.join()'),'2,1');
 h.run("view='players';renderTeamComparison();");assert.equal(h.node('#team-comparison').hidden,true);
});
test('glossary keeps the full score formula and all column definitions beyond the compact help',()=>{
 const h=loaded();h.run("view='glossary';renderTerms();");const html=h.node('#terms').innerHTML;assert.match(html,/Definiciones completas de las columnas/);assert.match(html,/media de r\[i\] × r\[i\+1\]/);assert.match(html,/Columnas de equipos y líneas/);assert.match(html,/Pases rompelíneas/);
});
test('a league switch clears stale club filters and pair while a same-league update retains valid IDs',()=>{
 const h=loaded();h.run("selectedClubs=new Set(['1']);teamCompareChoices=['2','1'];");h.node('#club-filter-search').value='Two';h.node('#teamfilter').open=true;
 h.run('applyData(input);');assert.equal(h.run('[...selectedClubs].join()'),'1');assert.equal(h.run('teamCompareChoices.join()'),'2,1');
 const next=fixture();next.metadata.league_key='other';h.run('applyData(next);',{next});assert.equal(h.run('selectedClubs.size'),0);assert.equal(h.run('teamCompareChoices.length'),0);assert.equal(h.node('#club-filter-search').value,'');assert.equal(h.node('#teamfilter').open,false);
});
test('crests appear in player/team tables and multi-select without moving the first score column',()=>{
 const h=loaded();h.run("data.teams[0].sourceRecords={FotMob:{id:'8634'}};data.teams[1].sourceRecords={FotMob:{id:'9825'}};renderClubOptions();renderTable();");
 assert.match(h.node('#tbody').innerHTML,/assets\/clubs\/8634.png/);assert.match(h.node('#club-options').innerHTML,/assets\/clubs\/9825.png/);
 h.run("view='teams';renderTable();renderTeamComparison();");assert.match(h.node('#thead').innerHTML.match(/<th\b[\s\S]*?<\/th>/)[0],/teamArea/);assert.match(h.node('#team-comparison-body').innerHTML,/assets\/clubs\/8634.png/);assert((h.node('#team-comparison-body').innerHTML.match(/assets\/clubs\/8634.png/g)||[]).length>3);
 h.run("currentLeague='premier-league';datasets.set('premier-league',{combined:data});initialLoadsComplete=true;updateLeagueOptions();");assert.match(h.node('#league-country').innerHTML,/gb-eng.svg/);assert.match(h.node('#league-options').innerHTML,/Inglaterra/);
});
