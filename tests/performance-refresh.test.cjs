'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{gzipSync,gunzipSync}=require('node:zlib');
const app=require('../worker/app.cjs'),refresh=require('../dist/refresh.js'),profiles=require('../dist/profiles.js'),leagues=require('../dist/leagues.js');
const {access}=require('./helpers/owner.cjs');
const league=leagues.get('laliga'),now=Date.parse('2026-11-20T12:00:00Z');
test('matching caches are discarded between passes when names, aliases or keeper roles change',()=>{
 const identity=require('../dist/identity.js'),a={name:'Álex Baena',pos:'MED'},b={name:'Alejandro Baena',pos:'MED'},options={primaryClub:()=> 'club',secondaryClub:()=> 'club'};
 const link=()=>identity.link([a],[b],options);assert.equal(link().matches.get(a).record,b);
 b.name='Pedro López';assert.equal(link().matches.size,0);
 b.nameAliases=['Alejandro Baena'];assert.equal(link().matches.get(a).method,'provider_alias_team');
 b.pos='POR';assert.equal(link().matches.size,0);assert(link().states.get(a).roleConflict);
});
test('optimized score percentiles preserve the linear contract for ties, zero and inverted axes',()=>{
 const radar=require('../dist/radar.js'),metrics=require('../dist/metrics.js');
 const players=['POR','DEF','MED','DEL'].flatMap(pos=>Array.from({length:8},(_,i)=>{const v=Math.floor(i/2);return {id:pos+i,pos,minutes:200,matches:3,goals:v,xg:v,xa:v,shots:v,conversion:v,shotsOnTargetPer90:v,dribblesPer90:v,completedPer90:v,accuracy:v,recoveries:v,tackles:v,interceptions:v,clearances:v,blocks:v,savepct:v,saves:v,conceded:v,prevented:v-2,highClaims:v,sweeperActions:v,lineBreakingPasses:v,chancesCreated:v,bigChancesCreated:v};}));
 for(const[p,profile]of radar.profiles(players)){assert(Number.isFinite(profile.score));for(const axis of profile.axes){const spec=radar.axis(axis.key),reference=players.filter(peer=>peer.pos===p.pos).map(peer=>metrics.metric(peer,axis.key,spec.unit)).filter(Number.isFinite);assert.equal(axis.percentile,radar.percentile(axis.value,reference,axis.lowerBetter));assert.equal(axis.referenceCount,8);}}
 const mutable=[0,0,1,1];assert.equal(radar.percentile(1,mutable),75);mutable.push(2,2);assert.equal(radar.percentile(1,mutable),50,'public mutable references remain fresh');
});
function store(){const map=new Map();return {async match(key){return map.get(key)?.clone();},async put(key,value){map.set(key,value.clone());}};}
function roster(ids,tag){return {'/downloads/fotmob-laliga-2026-27.json':{type:'application/json',sha:tag,gzip:gzipSync(JSON.stringify({players:ids.map(id=>({id:String(id),team_id:'1',name:'Isolated '+id}))})).toString('base64')}};}
function profileHTML(id){return '<script id="__NEXT_DATA__">'+JSON.stringify({props:{pageProps:{data:{id,primaryTeam:{teamId:1},positionDescription:{primaryPosition:{key:'centerback'}},mainLeague:{leagueId:87,season:'2026/2027',stats:[{localizedTitleId:'minutes_played',value:200},{localizedTitleId:'matches_uppercase',value:3}]},statSeasons:[{seasonName:'2026/2027',tournaments:[{tournamentId:87}]}]}}}})+'</script>';}
test('batch route enforces owner, same origin, exact parameters, roster membership and six-player limit before fetching',async()=>{
 const {env,headers}=await access(undefined,()=>now);let calls=0;
 const assets=roster([1,2],'guard-roster'),options={env,cache:store(),now:()=>now,fetcher:async()=>{calls++;throw Error('No fetch expected');}},base='https://batch-guard.test';
 for(const [query,status,extra]of [
  ['league=all&players=1',400],['league=laliga&players=1,1',400],['league=laliga&players=',400],['league=laliga&players=1,2,3,4,5,6,7',400],['league=laliga&players=1&url=x',400],['league=laliga&league=laliga&players=1',400],['league=laliga&players=1&players=2',400],['league=laliga&players=99',400],['league=laliga&players=1',403,{headers:{Origin:'https://foreign.test'}}],['league=laliga&players=1',405,{method:'POST'}]
 ])assert.equal((await app.handle(new Request(base+'/api/players/fotmob?'+query,{...extra,headers:{...headers,...extra?.headers}}),assets,options)).status,status,query);
 assert.equal((await app.handle(new Request(base+'/api/players/fotmob?league=laliga&players=1'),assets,options)).status,401);assert.equal(calls,0);
});
test('batch keeps successful cached profiles, reports failed IDs and runs at most three lookups at once',async()=>{
 const {env,headers}=await access(undefined,()=>now),cache=store(),base='https://batch-cache.test';
 for(let id=1;id<=6;id++)await cache.put(base+'/api/player/fotmob?league=laliga&player='+id,new Response(JSON.stringify(id===2?{error:'Unavailable'}:{id:String(id),team_id:'1',values:{goals:0}}),{status:id===2?503:200,headers:{'X-Grada-Checked-At':new Date(now).toISOString()}}));
 const match=cache.match.bind(cache);let active=0,maxActive=0;
 cache.match=async key=>{if(!key.includes('/api/player/fotmob?'))return match(key);active++;maxActive=Math.max(maxActive,active);await new Promise(resolve=>setImmediate(resolve));const value=await match(key);active--;return value;};
 const response=await app.handle(new Request(base+'/api/players/fotmob?league=laliga&players=1,2,3,4,5,6',{headers}),roster([1,2,3,4,5,6],'cached-roster'),{env,cache,now:()=>now,fetcher:()=>{throw Error('Cached requests must not fetch');}}),data=await response.json();
 assert.equal(response.status,200);assert.deepEqual(data.profiles.map(p=>p.id),['1','3','4','5','6']);assert.deepEqual(data.failed,['2']);assert.equal(maxActive,3);assert.equal(response.headers.get('Cache-Control'),'private, no-store');assert.match(response.headers.get('Vary'),/Cookie/);
});
test('concurrent batches share parsed roster and upstream profile jobs, preserving parser output and TTL',async()=>{
 const {env,headers}=await access(undefined,()=>now),cache=store(),base='https://batch-dedup.test',calls=[];
 const options={env,cache,now:()=>now,fetcher:async url=>{const id=Number(new URL(url).pathname.split('/')[2]);calls.push(id);await new Promise(resolve=>setImmediate(resolve));return new Response(profileHTML(id));}};
 const assets=roster([1,2,3],'dedup-roster'),request=()=>new Request(base+'/api/players/fotmob?league=laliga&players=1,2,3',{headers});
 const responses=await Promise.all([app.handle(request(),assets,options),app.handle(request(),assets,options)]),payloads=await Promise.all(responses.map(r=>r.json()));
 assert.deepEqual(calls.sort(),[1,2,3]);assert.deepEqual(payloads[0],payloads[1]);
 for(const p of payloads[0].profiles)assert.deepEqual(p,profiles.parse(profileHTML(Number(p.id)),{id:p.id,team_id:'1',name:'Isolated '+p.id},'laliga',new Date(now).toISOString()));
 await app.handle(request(),assets,options);assert.equal(calls.length,3);
});
test('client loads every player in bounded batches, preserving zeros, partial success and progress counts',async()=>{
 const data={players:Array.from({length:13},(_,i)=>({id:String(i+1)}))},queries=[],progress=[];
 const found=await refresh.loadProfiles(data,league,{fetchImpl:async url=>{const u=new URL(url,'https://client.test');queries.push(u);const ids=u.searchParams.get('players').split(',');return new Response(JSON.stringify({profiles:ids.filter(id=>id!=='2').map(id=>({id,values:{goals:0}})),failed:ids.filter(id=>id==='2')}));},onProgress:(done,total)=>progress.push([done,total])});
 assert.equal(queries.length,3);assert(queries.every(u=>u.pathname==='/api/players/fotmob'&&u.searchParams.get('players').split(',').length<=6));assert.equal(found.length,12);assert(found.every(p=>p.values.goals===0));assert.deepEqual(progress,[[6,13],[12,13],[13,13]]);
});
test('client falls back to the existing route without dropping players, and never retries denied access',async()=>{
 const data={players:Array.from({length:13},(_,i)=>({id:String(i+1)}))};let batches=0,singles=0,active=0,maxActive=0;
 const found=await refresh.loadProfiles(data,league,{fetchImpl:async url=>{const u=new URL(url,'https://fallback.test');if(u.pathname==='/api/players/fotmob'){batches++;return new Response('',{status:404});}singles++;active++;maxActive=Math.max(maxActive,active);await new Promise(resolve=>setImmediate(resolve));active--;return new Response(JSON.stringify({id:u.searchParams.get('player')}));}});
 assert.equal(batches,1);assert.equal(singles,13);assert.equal(found.length,13);assert.equal(maxActive,3);
 singles=0;const denied=await refresh.loadProfiles(data,league,{fetchImpl:async url=>{if(!url.startsWith('/api/players/'))singles++;return new Response('',{status:403});}});assert.equal(denied.length,0);assert.equal(singles,0);
});
test('unexpected IDs in a batch response cannot enter the data and trigger the verified individual route',async()=>{
 const calls=[],found=await refresh.loadProfiles({players:[{id:'1'}]},league,{fetchImpl:async url=>{calls.push(url);return new Response(JSON.stringify(url.startsWith('/api/players/')?{profiles:[{id:'999'}]}:{id:'1',values:{goals:0}}));}});
 assert.deepEqual(found,[{id:'1',values:{goals:0}}]);assert.equal(calls.length,2);
});
test('compressed static responses negotiate correctly, preserve exact bytes and isolate cache representations',async()=>{
 const text='Isolated payload '.repeat(100),bytes=gzipSync(text),sha='0123456789abcdef'.repeat(4),assets={'/sample.js':{type:'text/javascript',sha,gzip:bytes.toString('base64')}},cache=store();
 for(const encoding of ['gzip','br, gzip;q=0.5','*']){
  const request=new Request('https://compression.test/sample.js?v='+sha.slice(0,16),{headers:{'Accept-Encoding':encoding}}),response=await app.handle(request,assets,{cache});
  assert.equal(response.headers.get('Content-Encoding'),'gzip');const body=Buffer.from(await response.arrayBuffer());assert(body.equals(bytes));assert.equal(gunzipSync(body).toString(),text);assert.match(response.headers.get('Cache-Control'),/immutable/);assert.equal(response.headers.get('Vary'),'Accept-Encoding');
  const conditional=await app.handle(new Request(request,{headers:{'Accept-Encoding':encoding,'If-None-Match':response.headers.get('ETag')}}),assets,{cache});assert.equal(conditional.status,304);
  const head=await app.handle(new Request(request,{method:'HEAD'}),assets,{cache});assert.equal(head.headers.get('Content-Encoding'),'gzip');assert.equal((await head.arrayBuffer()).byteLength,0);
 }
 for(const encoding of ['identity','br','gzip;q=0','gzip;q=0, *;q=1']){const r=await app.handle(new Request('https://compression.test/sample.js',{headers:{'Accept-Encoding':encoding}}),assets,{cache});assert.equal(r.headers.get('Content-Encoding'),null);assert.equal(await r.text(),text);assert(!r.headers.get('Cache-Control').includes('immutable'));assert.equal(r.headers.get('ETag'),'"'+sha+'"');}
});
