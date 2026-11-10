'use strict';
const providers=require('./providers.cjs'),leagues=require('../dist/leagues.js');
const profiles=require('../dist/profiles.js');
const fotmob=require('../dist/fotmob.js');
const owner=require('./owner.cjs');
const running=new Map(),localCache=new Map();
const rosters=new Map();
const decodedAssets=new WeakMap();
function assetJSON(asset){
 if(!decodedAssets.has(asset)){
  const bytes=Uint8Array.from(atob(asset.gzip),c=>c.charCodeAt(0));
  const value=new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).json();
  decodedAssets.set(asset,value);value.catch(()=>decodedAssets.delete(asset));
 }
 return decodedAssets.get(asset);
}
let localBytes=0;
// Sites can deny the default Cache API. Caching must never gate source assets.
function sharedCache(){
 let remote,opened=false;
 async function named(){if(opened)return remote;opened=true;try{if(typeof caches==='object'&&typeof caches.open==='function')remote=await caches.open('grada-football-v1');}catch(_){remote=null;}return remote;}
 return {
  async match(input){
   const key=String(input),entry=localCache.get(key);
   if(entry&&entry.expires>Date.now()){localCache.delete(key);localCache.set(key,entry);return new Response(entry.body,{status:entry.status,headers:entry.headers});}
   if(entry){localBytes-=entry.bytes;localCache.delete(key);}
   try{return await (await named())?.match(key);}catch(_){return undefined;}
  },
  async put(input,response){
   const key=String(input),body=await response.clone().text(),bytes=new TextEncoder().encode(body).length,maxBytes=16*1024*1024,old=localCache.get(key);
   if(old){localBytes-=old.bytes;localCache.delete(key);}
   if(bytes<=maxBytes){
    while(localCache.size&&(localBytes+bytes>maxBytes||localCache.size>=256)){const first=localCache.keys().next().value;localBytes-=localCache.get(first).bytes;localCache.delete(first);}
    const seconds=Number(response.headers.get('Cache-Control')?.match(/max-age=(\d+)/)?.[1]||300);
    localCache.set(key,{body,bytes,status:response.status,headers:Object.fromEntries(response.headers),expires:Date.now()+seconds*1000});localBytes+=bytes;
   }
   try{const cache=await named();if(cache)await cache.put(key,response.clone());}catch(_){}
  }
 };
}
function json(body,status=200,headers={}){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'no-store',...headers}});}
function apiKey(origin,source,league){return origin+'/api/source/'+source+'?league='+league;}
function validSource(source,league){return Number.isInteger(league.fotmobId)&&['espn','fotmob','understat'].includes(source)&&(source!=='understat'||league.primary==='Understat');}
async function rosterPlayer(origin,league,playerId,assets,cache){
 const response=await cache.match(apiKey(origin,'fotmob',league.id)),asset=assets['/downloads/fotmob-'+league.id+'-2026-27.json'],tag=response?.ok?response.headers.get('X-Grada-Checked-At'):asset?.sha,key=league.id+'|'+tag;
 if(!rosters.has(key)){
  let data;if(response?.ok)data=await response.json();else if(asset){const bytes=Uint8Array.from(atob(asset.gzip),c=>c.charCodeAt(0));data=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).json();}else return null;
  for(const existing of rosters.keys())if(existing.startsWith(league.id+'|'))rosters.delete(existing);
  rosters.set(key,new Map(data.players.map(p=>[String(p.id),{id:String(p.id),team_id:String(p.team_id),name:p.name}])));
 }
 return rosters.get(key).get(playerId)||null;
}
async function playerResponse(url,league,player,cache,fetcher,now){
 const key=url.origin+'/api/player/fotmob?league='+league.id+'&player='+player.id,cached=await cache.match(key),checked=cached&&Date.parse(cached.headers.get('X-Grada-Checked-At'));
 if(cached&&Number.isFinite(checked)&&now()-checked<(cached.ok?3600000:120000))return cached;
 if(running.has(key))return (await running.get(key)).clone();
 const job=(async()=>{let result;try{const html=await providers.textResponse('https://www.fotmob.com/players/'+player.id+'/player',{fetcher}),data=profiles.parse(html,player,league.id,new Date(now()).toISOString());result=json(data,200,{'Cache-Control':'public, max-age=3600','X-Grada-Checked-At':new Date(now()).toISOString()});}catch(_){result=json({error:'Ficha no disponible para este jugador y competición.'},503,{'Cache-Control':'public, max-age=120','Retry-After':'120','X-Grada-Checked-At':new Date(now()).toISOString()});}await cache.put(key,result.clone());return result;})();running.set(key,job);
 try{return (await job).clone();}finally{running.delete(key);}
}
async function refresh(key,source,league,{cache,fetcher,now}){
 const existing=await cache.match(key),checked=existing&&Date.parse(existing.headers.get('X-Grada-Checked-At'));
 if(existing&&Number.isFinite(checked)&&now()-checked<(existing.ok?300000:120000))return existing;
 const failed=await cache.match(key+'&failure=1'),failedAt=failed&&Date.parse(failed.headers.get('X-Grada-Checked-At'));
 if(failed&&Number.isFinite(failedAt)&&now()-failedAt<120000)return failed;
 if(running.has(key))return (await running.get(key)).clone();
 const job=(async()=>{
  const checkedAt=new Date(now()).toISOString();let result;
  try{
   const payload=await ({fotmob:providers.fetchFotmob,understat:providers.fetchUnderstat,espn:providers.fetchEspn}[source])(league.id,{fetcher,now:()=>new Date(now()).toISOString()});
   result=json(payload,200,{'Cache-Control':'public, max-age=86400','X-Grada-Checked-At':checkedAt});
  }catch(_){result=json({error:'No se pudo validar una captura nueva de '+({fotmob:'FotMob',understat:'Understat',espn:'ESPN'}[source])+'. Se conserva la captura anterior.'},503,{'Cache-Control':'public, max-age=120','Retry-After':'120','X-Grada-Checked-At':checkedAt});}
  // Cache only validated payloads or bounded failure responses. No client data is written.
  await cache.put(result.ok?key:key+'&failure=1',result.clone());return result;
 })();running.set(key,job);
 try{return (await job).clone();}finally{running.delete(key);}
}
function snapshot(path){
 const espn=leagues.list().find(league=>path==='/downloads/'+league.espnFile);if(espn)return {source:'espn',league:espn};
 const m=path.match(/^\/downloads\/(fotmob|understat)-([a-z-]+)-2026-27\.json$/);if(!m)return null;
 try{const league=leagues.get(m[2]);return validSource(m[1],league)?{source:m[1],league}:null;}catch(_){return null;}
}
async function handle(request,assets,{cache=sharedCache(),fetcher=fetch,now=Date.now,env={}}={}){
 const url=new URL(request.url);
 if(url.pathname.startsWith('/api/owner/'))return owner.handle(request,env,now);
 if(url.pathname.startsWith('/api/')){
  if(request.method!=='GET')return json({error:'Método no permitido.'},405,{Allow:'GET'});
  const origin=request.headers.get('Origin'),site=request.headers.get('Sec-Fetch-Site');
  if(origin&&origin!==url.origin||site==='cross-site')return json({error:'Origen no permitido.'},403);
  if(url.pathname==='/api/player/fotmob'){
   const params=[...url.searchParams];if(params.length!==2||url.searchParams.getAll('league').length!==1||url.searchParams.getAll('player').length!==1||!/^\d{1,12}$/.test(url.searchParams.get('player')||''))return json({error:'Consulta no permitida.'},400);
   let league;try{league=leagues.get(url.searchParams.get('league'));if(!validSource('fotmob',league))throw new Error();}catch(_){return json({error:'Liga no admitida.'},400);}
   const denied=await owner.requireOwner(request,env,now);if(denied)return denied;
   try{const player=await rosterPlayer(url.origin,league,url.searchParams.get('player'),assets,cache);if(!player)return json({error:'Jugador fuera de la plantilla verificada.'},400);return privateResponse(await playerResponse(url,league,player,cache,fetcher,now));}catch(_){return json({error:'No se pudo verificar la ficha.'},503);}
  }
  const route=url.pathname.match(/^\/api\/source\/(espn|fotmob|understat)$/),params=[...url.searchParams];
  if(!route||params.length!==1||params[0][0]!=='league')return json({error:'Consulta no permitida.'},400);
  let league;try{league=leagues.get(params[0][1]);}catch(_){return json({error:'Liga no admitida.'},400);}
  if(!validSource(route[1],league))return json({error:'Fuente no usada en esta liga.'},400);
  const denied=await owner.requireOwner(request,env,now);if(denied)return denied;
  try{return privateResponse(await refresh(apiKey(url.origin,route[1],league.id),route[1],league,{cache,fetcher,now}));}catch(_){return json({error:'No se pudo completar la consulta. Se conserva la captura anterior.'},503,{'Retry-After':'120'});}
 }
 if(!['GET','HEAD'].includes(request.method))return new Response('Método no permitido.',{status:405,headers:{Allow:'GET, HEAD'}});
 const path=url.pathname==='/'?'/index.html':url.pathname,asset=assets[path];
 if(!asset)return new Response('No encontrado.',{status:404});
 const source=snapshot(path);
 if(source&&url.searchParams.get('capture')!=='published'){
  const cached=await cache.match(apiKey(url.origin,source.source,source.league.id));
  if(cached?.ok){
   if(source.source!=='fotmob')return request.method==='HEAD'?new Response(null,{headers:cached.headers}):cached;
   try{
    const current=fotmob.validate(await cached.json()),published=fotmob.validate(await assetJSON(asset));
    const newer=Date.parse(current.metadata.imported_at)>Date.parse(published.metadata.imported_at);
    const restored=fotmob.validate(profiles.restore(newer?current:published,newer?published:current));
    return request.method==='HEAD'?new Response(null,{headers:json(null).headers}):json(restored);
   }catch(_){/* Invalid cached data must not hide the verified published capture. */}
  }
 }
 const headers={'Content-Type':asset.type,'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':asset.type.startsWith('text/html')?'no-store':'public, max-age=300',ETag:'"'+asset.sha+'"'};
 if(request.headers.get('If-None-Match')===headers.ETag)return new Response(null,{status:304,headers});
 if(request.method==='HEAD')return new Response(null,{headers});
 const bytes=Uint8Array.from(atob(asset.gzip),c=>c.charCodeAt(0)),body=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
 return new Response(body,{headers});
}
function privateResponse(response){const result=new Response(response.body,response);result.headers.set('Cache-Control','private, no-store');result.headers.set('Vary','Cookie, oai-authenticated-user-id');return result;}
module.exports={handle,apiKey};
