'use strict';
// Sites supplies the identity headers. The private bucket never serves objects.
const CONFIG='owner/config.json',ATTEMPTS='owner/unlock-attempts.json';
const COOKIE='__Host-grada-owner',TTL=30*60,WINDOW=15*60*1000,MAX_ATTEMPTS=6;
const encoder=new TextEncoder();
function response(body,status=200,headers={}){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',Vary:'Cookie, oai-authenticated-user-id',...headers}});}
function identity(request){const id=request.headers.get('oai-authenticated-user-id');return id&&id.length<=250?{id,email:request.headers.get('oai-authenticated-user-email')||''}:null;}
function ready(env){return env?.BUCKET&&typeof env.GRADA_OWNER_EMAIL==='string'&&env.GRADA_OWNER_SESSION_SECRET?.length>=32;}
function bootstrapOwner(user,env){return !!user&&!!user.email&&user.email.trim().toLowerCase()===env.GRADA_OWNER_EMAIL.trim().toLowerCase();}
function b64(bytes){return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function bytes(value){if(typeof value!=='string'||!/^[\w-]+$/.test(value))throw new Error('Invalid encoding');return Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));}
async function config(env){
 const object=await env.BUCKET.get(CONFIG);if(!object)return null;
 const data=await object.json();
 if(typeof data.owner_user_id!=='string'||typeof data.auth_version!=='string'||bytes(data.password_salt).length!==16||bytes(data.password_hash).length!==32)throw new Error('Invalid owner configuration');
 return data;
}
async function passwordHash(password,salt){const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);return new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:100000},key,256));}
async function signingKey(env){return crypto.subtle.importKey('raw',encoder.encode(env.GRADA_OWNER_SESSION_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
async function cookie(env,data,now){
 const payload=b64(encoder.encode(JSON.stringify({uid:data.owner_user_id,version:data.auth_version,exp:Math.floor(now()/1000)+TTL}))),signature=b64(new Uint8Array(await crypto.subtle.sign('HMAC',await signingKey(env),encoder.encode(payload))));
 return COOKIE+'='+payload+'.'+signature+'; Path=/; Max-Age='+TTL+'; Secure; HttpOnly; SameSite=Strict';
}
async function unlocked(request,env,data,user,now){
 if(!data||!user||data.owner_user_id!==user.id)return false;
 const value=(request.headers.get('Cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
 if(!value||value.length>2048)return false;
 try{const parts=value.split('.');if(parts.length!==2||!await crypto.subtle.verify('HMAC',await signingKey(env),bytes(parts[1]),encoder.encode(parts[0])))return false;
  const payload=JSON.parse(new TextDecoder().decode(bytes(parts[0]))),seconds=Math.floor(now()/1000);
  return payload.uid===user.id&&payload.version===data.auth_version&&Number.isInteger(payload.exp)&&payload.exp>seconds&&payload.exp<=seconds+TTL;
 }catch(_){return false;}
}
async function requireOwner(request,env,now=Date.now){
 if(!ready(env))return response({error:'La actualización privada todavía no está disponible.'},503);
 const user=identity(request);if(!user)return response({error:'Identifícate como propietario para actualizar.'},401);
 try{const data=await config(env);if(!data||data.owner_user_id!==user.id)return response({error:'Solo el propietario puede actualizar los datos.'},403);
  if(!await unlocked(request,env,data,user,now))return response({error:'Introduce tu contraseña para desbloquear la actualización.'},401);
  return null;
 }catch(_){return response({error:'No se pudo verificar el acceso. Inténtalo más tarde.'},503);}
}
async function reserveAttempt(env,now){
 const object=await env.BUCKET.get(ATTEMPTS),previous=object?await object.json():null,time=now();
 const current=previous&&Number.isFinite(previous.start)&&previous.start<=time&&time-previous.start<WINDOW?previous:{start:time,count:0};
 if(!Number.isInteger(current.count)||current.count<0||current.count>=MAX_ATTEMPTS)return false;
 const saved=await env.BUCKET.put(ATTEMPTS,JSON.stringify({start:current.start,count:current.count+1}),{onlyIf:object?{etagMatches:object.etag}:{etagDoesNotMatch:'*'}});
 return !!saved;
}
async function bodyJSON(request){
 if(request.headers.get('Content-Type')?.split(';')[0].trim()!=='application/json')throw new Error('Invalid body');
 if(Number(request.headers.get('Content-Length'))>2048)throw new Error('Invalid body');
 const reader=request.body?.getReader();if(!reader)throw new Error('Invalid body');let length=0;const chunks=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>2048)throw new Error('Invalid body');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}
 const joined=new Uint8Array(length);let offset=0;for(const chunk of chunks){joined.set(chunk,offset);offset+=chunk.length;}
 const value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(joined));if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid body');return value;
}
async function handle(request,env,now=Date.now){
 const url=new URL(request.url),action=url.pathname.slice('/api/owner/'.length),read=action==='status';
 if(!['status','setup','login','logout'].includes(action)||url.search)return response({error:'Consulta no permitida.'},400);
 if(request.method!==(read?'GET':'POST'))return response({error:'Método no permitido.'},405,{Allow:read?'GET':'POST'});
 const origin=request.headers.get('Origin');if((!read&&origin!==url.origin)||(origin&&origin!==url.origin)||request.headers.get('Sec-Fetch-Site')==='cross-site')return response({error:'Origen no permitido.'},403);
 if(!ready(env))return response({error:'La actualización privada todavía no está disponible.'},503);
 try{
  const user=identity(request),data=await config(env),owner=!!user&&(data?data.owner_user_id===user.id:bootstrapOwner(user,env));
  if(read)return response({authenticated:!!user,owner,can_setup:owner&&!data,unlocked:owner&&await unlocked(request,env,data,user,now)});
  if(!user||!owner)return response({error:'Solo el propietario puede gestionar la actualización.'},user?403:401);
  if(action==='logout')return response({ok:true},200,{'Set-Cookie':COOKIE+'=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Strict'});
  let body;try{body=await bodyJSON(request);}catch(_){return response({error:'Envía un formulario válido.'},400);}
  const password=body.password;
  if(typeof password!=='string'||password.length<12||password.length>128)return response({error:'Usa una contraseña de entre 12 y 128 caracteres.'},400);
  if(action==='setup'){
   if(data)return response({error:'La contraseña ya está configurada.'},409);
   const salt=crypto.getRandomValues(new Uint8Array(16)),created={owner_user_id:user.id,password_salt:b64(salt),password_hash:b64(await passwordHash(password,salt)),auth_version:crypto.randomUUID(),created_at:new Date(now()).toISOString()};
   const saved=await env.BUCKET.put(CONFIG,JSON.stringify(created),{onlyIf:{etagDoesNotMatch:'*'}});
   if(!saved)return response({error:'La contraseña ya está configurada.'},409);
   return response({ok:true},200,{'Set-Cookie':await cookie(env,created,now)});
  }
  if(!data)return response({error:'Define primero tu contraseña.'},409);
  if(!await reserveAttempt(env,now))return response({error:'Demasiados intentos. Espera 15 minutos antes de intentarlo de nuevo.'},429,{'Retry-After':'900'});
  const actual=await passwordHash(password,bytes(data.password_salt)),expected=bytes(data.password_hash);let different=0;for(let i=0;i<expected.length;i++)different|=actual[i]^expected[i];
  if(different)return response({error:'Contraseña incorrecta.'},401);
  return response({ok:true},200,{'Set-Cookie':await cookie(env,data,now)});
 }catch(_){return response({error:'No se pudo completar la operación. Revisa los campos o inténtalo más tarde.'},503);}
}
module.exports={handle,requireOwner};
