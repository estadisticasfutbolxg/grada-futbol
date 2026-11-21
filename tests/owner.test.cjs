'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),owner=require('../worker/owner.cjs'),app=require('../worker/app.cjs');
const {fixture,user,request,access}=require('./helpers/owner.cjs');
test('pinned owner updates without a password, session secret or cookie; legacy password fields are inert',async()=>{
 const env=fixture();await env.BUCKET.put('owner/config.json',JSON.stringify({owner_user_id:user['oai-authenticated-user-id'],password_salt:'obsolete',password_hash:'obsolete',auth_version:'obsolete'}));
 const original=env.BUCKET.objects.get('owner/config.json').value;
 assert.equal(await owner.requireOwner(request('status'),env),null);
 const status=await owner.handle(request('status'),env);assert.deepEqual(await status.json(),{authenticated:true,owner:true,password_required:false,can_setup:false,unlocked:true});assert.equal(status.headers.get('Cache-Control'),'no-store');assert.equal(status.headers.get('Set-Cookie'),null);
 const sameEmail={...user,'oai-authenticated-user-id':'different-site-id'};assert.equal((await owner.requireOwner(request('status',{headers:sameEmail}),env)).status,403);
 const newEmail={...user,'oai-authenticated-user-email':'changed@example.test'};assert.equal(await owner.requireOwner(request('status',{headers:newEmail}),env),null);
 const oldCookie={...user,Cookie:'__Host-grada-owner=invalid-old-cookie'};assert.equal(await owner.requireOwner(request('status',{headers:oldCookie}),env),null);const cleared=await owner.handle(request('status',{headers:oldCookie}),env);assert.match(cleared.headers.get('Set-Cookie'),/Max-Age=0; Secure; HttpOnly; SameSite=Strict/);
 assert.equal(env.BUCKET.objects.get('owner/config.json').value,original);assert.equal(env.BUCKET.objects.size,1);
});
test('all source and player routes reject anonymous or other identities before any provider request',async()=>{
 const {env,headers}=await access();let upstream=0;
 const paths=['/api/source/espn?league=laliga','/api/source/fotmob?league=laliga','/api/source/understat?league=laliga','/api/player/fotmob?league=laliga&player=100','/api/players/fotmob?league=laliga&players=100'];
 const options={env,fetcher:async()=>{upstream++;throw Error('No real network');}};
 for(const path of paths)for(const identity of [{},{...user,'oai-authenticated-user-id':'viewer',Cookie:'__Host-grada-owner=fake'},{'oai-authenticated-user-email':user['oai-authenticated-user-email']}]){const r=await app.handle(new Request('https://owner-auth.test'+path,{headers:identity}),{},options);assert([401,403].includes(r.status));}
 assert.equal(upstream,0);assert.equal(await owner.requireOwner(new Request('https://owner-auth.test',{headers}),env),null);
 const allowed=await app.handle(new Request('https://owner-auth.test/api/source/understat?league=laliga',{headers}),{},options);assert.equal(allowed.status,503);assert(upstream>0,'owner without cookie reaches the mocked provider');assert(!(await allowed.text()).includes('contraseña'));
});
test('verified bootstrap email works without setup, and missing or broken authorization fails closed',async()=>{
 const env=fixture();assert.equal(await owner.requireOwner(request('status'),env),null);assert.equal(env.BUCKET.objects.size,0);
 for(const headers of [{...user,'oai-authenticated-user-email':'viewer@example.test'},{...user,'oai-authenticated-user-email':''}])assert.equal((await owner.requireOwner(request('status',{headers}),env)).status,403);
 assert.equal((await owner.requireOwner(request('status',{headers:{...user,'oai-authenticated-user-id':'x'.repeat(251)}}),env)).status,401);
 assert.equal((await owner.requireOwner(request('status'),{})).status,503);
 const unavailable={...env,BUCKET:{get:async()=>{throw Error('Unavailable');}}};assert.equal((await owner.requireOwner(request('status'),unavailable)).status,503);assert.equal((await owner.handle(request('status'),unavailable)).status,503);
 await env.BUCKET.put('owner/config.json',JSON.stringify({owner_user_id:''}));assert.equal((await owner.requireOwner(request('status'),env)).status,503,'invalid pin must not fall back to email');
});
test('password management routes are removed and status remains read-only and same-origin',async()=>{
 const env=fixture();for(const action of ['setup','login','logout'])assert.equal((await owner.handle(request(action,{body:{password:'Unused password'}}),env)).status,404);
 assert.equal(env.BUCKET.objects.size,0);assert.equal((await owner.handle(request('status?unexpected=1'),env)).status,404);
 assert.equal((await owner.handle(request('status',{method:'POST'}),env)).status,405);
 for(const headers of [{...user,Origin:'https://other.test'},{...user,'Sec-Fetch-Site':'cross-site'}])assert.equal((await owner.handle(request('status',{headers}),env)).status,403);
 const anonymous=await(await owner.handle(request('status',{headers:{}}),env)).json();assert.deepEqual(anonymous,{authenticated:false,owner:false,password_required:false,can_setup:false,unlocked:false});
});
function client(state,{status=200,refresh=async()=>{}}={}){
 const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,{hidden:false,open:false,textContent:'',shown:0,showModal(){this.open=true;this.shown++;},close(){this.open=false;},set innerHTML(_){throw Error('Use textContent');}});return nodes.get(id);};let calls=0;
 const root={},context={window:root,document:{getElementById:get},location:{hash:'',pathname:'/',search:''},AbortSignal,fetch:async url=>{assert.equal(url,'/api/owner/status');calls++;return new Response(JSON.stringify(state),{status});}};
 vm.runInNewContext(fs.readFileSync(__dirname+'/../dist/owner.js','utf8'),context);root.GradaOwner.init({onRefresh:refresh});return {owner:root.GradaOwner,get,calls:()=>calls};
}
test('owner button starts refresh directly once, with no password dialog or second confirmation',async()=>{
 let count=0,finish;const c=client({authenticated:true,owner:true},{refresh:async()=>{count++;await new Promise(resolve=>{finish=resolve;});}}),first=c.owner.open();
 await new Promise(resolve=>setImmediate(resolve));assert.equal(count,1);assert.equal(c.get('owner-dialog').shown,0);await c.owner.open();assert.equal(c.calls(),1);finish();await first;assert.equal(c.get('refresh-status').textContent,'');
 const html=fs.readFileSync(__dirname+'/../dist/index.html','utf8');assert(!/type="password"|id="owner-(?:form|run|lock|confirm)"/.test(html));assert(html.includes('/signin-with-chatgpt?return_to='));assert(html.includes('target="_top"'));
});
test('expired sign-in, a different account and status failures explain access without starting refresh',async()=>{
 let count=0;
 for(const state of [{authenticated:false,owner:false},{authenticated:true,owner:false}]){const c=client(state,{refresh:async()=>{count++;}});await c.owner.open();assert.equal(c.get('owner-dialog').shown,1);assert.equal(c.get('owner-signin').hidden,state.authenticated);assert.equal(c.get('owner-switch').hidden,!state.authenticated);}
 const c=client({error:'No se pudo verificar <acceso>'},{status:503,refresh:async()=>{count++;}});await c.owner.open();assert.equal(c.get('owner-description').textContent,'No se pudo verificar <acceso>');assert.equal(c.get('owner-dialog').shown,1);assert.equal(count,0);
});
