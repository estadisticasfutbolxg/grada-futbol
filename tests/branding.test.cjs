'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),branding=require('../dist/branding.js');
const team=(id,name='Club',league_key='laliga')=>({id,league_key,name,sourceRecords:{FotMob:{id:'8634'}}});
test('crest identity uses the verified provider team ID, never a combined ID, name or player record',()=>{
 assert.equal(branding.crestPath(team('148','Barcelona')),'/assets/clubs/8634.png');assert.equal(branding.crestPath(team('laliga:148')),'/assets/clubs/8634.png');
 assert.equal(branding.crestPath({id:'8634',name:'Barcelona'}),null);assert.equal(branding.crestPath({team_id:'1',sourceRecords:{FotMob:{id:'8634'}}}),null);assert.equal(branding.crestPath({sourceRecords:{FotMob:{id:'8634',team_id:'1'}}}),null);
 for(const id of ['../1','https://other.test/1','12" onerror="x','0','1e4','1234567890'])assert.equal(branding.crestPath({sourceRecords:{FotMob:{id}}}),null);
});
test('player crests respect canonical club IDs and league scope; multiple-club aggregates remain neutral',()=>{
 const a=team('a:1','One','a'),b={...team('b:1','One','b'),sourceRecords:{FotMob:{id:'9825'}}};
 const html=branding.playerClub({team_id:'b:1',league_key:'b',team:'One'},[a,b]);assert.match(html,/clubs\/9825.png/);assert(!html.includes('8634.png'));
 const multiple=branding.playerClub({team_id:null,league_key:'a',team:'One, Two'},[a,team('a:2','Two','a')]);assert.match(multiple,/Varios clubes/);assert(!multiple.includes('<img'));
 assert(!branding.playerClub({team_id:null,team:'Unknown'},[a]).includes('<img'));
});
test('countries are competition metadata, with England rather than a UK flag, and no invented nationality',()=>{
 assert.deepEqual(branding.country('premier-league'),{code:'gb-eng',name:'Inglaterra'});assert.equal(branding.country('unknown'),null);
 assert.match(branding.flag('premier-league'),/flags\/gb-eng.svg/);assert(!branding.flag('unknown'));assert.match(branding.countryLabel('all'),/15 países/);
 assert.equal((branding.countryLabel('all').match(/data-country-flag/g)||[]).length,5);
 const league=branding.leagueLabel('ligue-1','Ligue 1');assert.match(league,/País de la competición: Francia/);assert(!league.includes('Mónaco'));
 const copy=branding.country('laliga');copy.code='x';assert.equal(branding.country('laliga').code,'es');
});
test('artwork uses only local image paths and escaped identity text with no inline handlers or styles',()=>{
 const html=branding.teamLabel(team('1','<img src=x onerror="bad">'),{size:'"bad'});
 assert.match(html,/&lt;img/);const images=html.match(/<img\b[^>]*>/g);assert.equal(images.length,1);assert.match(images[0],/src="\/assets\/clubs\/8634.png"/);assert(!images[0].includes('onerror='));assert(!images[0].includes('style='));assert.match(html,/club-badge-sm/);assert.match(html,/aria-hidden="true"/);
 assert.match(branding.leagueLabel('laliga','<script>'),/&lt;script&gt;/);
});
test('load and failure handlers reveal the real crest or neutral fallback without breaking identity text',()=>{
 const listeners=new Map(),document={addEventListener:(type,fn)=>listeners.set(type,fn)};branding.init(document);const first=listeners.get('load');branding.init(document);assert.equal(listeners.get('load'),first);
 const classes=new Set(),parent={classList:{add:v=>classes.add(v),remove:v=>classes.delete(v)}},image={matches:s=>s==='img[data-club-crest]',closest:()=>parent,hidden:false};
 listeners.get('load')({target:image});assert(classes.has('is-ready'));listeners.get('error')({target:image});assert(!classes.has('is-ready'));assert.equal(image.hidden,true);
 const flag={matches:s=>s==='img[data-country-flag]',hidden:false};listeners.get('error')({target:flag});assert.equal(flag.hidden,true);
 assert.doesNotThrow(()=>listeners.get('error')({target:{}}));
});
