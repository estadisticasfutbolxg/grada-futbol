'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),owner=require('../worker/owner.cjs'),app=require('../worker/app.cjs');
const {fixture,user,request,access}=require('./helpers/owner.cjs');
test('only the verified bootstrap owner can set a password; the stored owner ID is authoritative afterwards',async()=>{
 const env=fixture(),password='Only the owner chooses this',viewer={'oai-authenticated-user-id':'viewer','oai-authenticated-user-email':'viewer@example.test'};
 for(const headers of [{},viewer]){const response=await owner.handle(request('setup',{headers,body:{password}}),env);assert([401,403].includes(response.status));}
 assert.equal(env.BUCKET.objects.size,0);
 assert.equal((await owner.handle(request('setup',{body:{password:'short'}}),env)).status,400);
 const setup=await owner.handle(request('setup',{body:{password}}),env);assert.equal(setup.status,200);assert.match(setup.headers.get('Set-Cookie'),/Secure; HttpOnly; SameSite=Strict/);assert.equal(setup.headers.get('Cache-Control'),'no-store');
 const stored=JSON.parse(env.BUCKET.objects.get('owner/config.json').value);assert.equal(stored.owner_user_id,user['oai-authenticated-user-id']);assert(!JSON.stringify(stored).includes(password));assert(stored.password_hash&&stored.password_salt);
 assert.equal((await owner.handle(request('setup',{body:{password}}),env)).status,409);
 const sameEmail={...user,'oai-authenticated-user-id':'different-site-id'};
 assert.equal((await owner.handle(request('login',{headers:sameEmail,body:{password}}),env)).status,403);
 const status=await (await owner.handle(request('status'),env)).json();assert.deepEqual(status,{authenticated:true,owner:true,can_setup:false,unlocked:false});assert(!JSON.stringify(status).includes('password_hash'));
 const login=await owner.handle(request('login',{body:{password}}),env);assert.equal(login.status,200);
});
test('all upstream refreshes require both the owner identity and a valid short-lived unlock cookie',async()=>{
 let time=Date.parse('2026-11-09T12:00:00Z'),upstream=0;const now=()=>time,{env,headers}=await access(fixture(),now);
 const paths=['/api/source/espn?league=laliga','/api/source/fotmob?league=laliga','/api/source/understat?league=laliga','/api/player/fotmob?league=laliga&player=100'];
 const options={env,now,fetcher:async()=>{upstream++;throw new Error('No network in auth tests');}};
 for(const path of paths)for(const identity of [{},{...user},{...headers,'oai-authenticated-user-id':'viewer'}]){const r=await app.handle(new Request('https://grada.test'+path,{headers:identity}),{},options);assert([401,403].includes(r.status));}
 assert.equal(upstream,0);
 const unlocked=new Request('https://grada.test/api/source/fotmob?league=laliga',{headers});assert.equal(await owner.requireOwner(unlocked,env,now),null);
 const tampered=new Request(unlocked,{headers:{...headers,Cookie:headers.Cookie.replace(/.$/,'!')}});assert.equal((await owner.requireOwner(tampered,env,now)).status,401);
 time+=30*60*1000;assert.equal((await owner.requireOwner(unlocked,env,now)).status,401);
 assert.equal((await owner.requireOwner(unlocked,{},now)).status,503);
});
test('password attempts are bounded across instances and source API failures do not bypass authentication',async()=>{
 let time=Date.parse('2026-11-09T12:00:00Z');const now=()=>time,{env,headers}=await access(fixture(),now);
 for(let i=0;i<6;i++)assert.equal((await owner.handle(request('login',{body:{password:'An incorrect password'}}),env,now)).status,401);
 const blocked=await owner.handle(request('login',{body:{password:'A private test password'}}),env,now);assert.equal(blocked.status,429);assert.equal(blocked.headers.get('Retry-After'),'900');
 time+=15*60*1000;assert.equal((await owner.handle(request('login',{body:{password:'A private test password'}}),env,now)).status,200);
 const logout=await owner.handle(request('logout',{headers,body:{}}),env,now);assert.match(logout.headers.get('Set-Cookie'),/Max-Age=0/);
 for(const origin of ['https://other.test','null'])assert.equal((await owner.handle(request('login',{body:{password:'A private test password'},origin}),env,now)).status,403);
 assert.equal((await owner.handle(request('status',{method:'POST'}),env,now)).status,405);
 const oversized=request('login',{body:{password:'x'.repeat(3000)}});assert.equal((await owner.handle(oversized,env,now)).status,400);
 const corrupt={...env,BUCKET:{get:async()=>{throw new Error('Unavailable storage');}}};assert.equal((await owner.requireOwner(new Request('https://grada.test',{headers}),corrupt,now)).status,503);
});
test('concurrent first setup cannot overwrite the winning password',async()=>{
 const env=fixture(),passwords=['The first private password','The second private password'];
 const results=await Promise.all(passwords.map(password=>owner.handle(request('setup',{body:{password}}),env)));
 assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 const winner=results.findIndex(r=>r.status===200),login=await owner.handle(request('login',{body:{password:passwords[winner]}}),env);assert.equal(login.status,200);
});
