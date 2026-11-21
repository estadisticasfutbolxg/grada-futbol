'use strict';
// Sites owns sign-in and supplies trusted identity headers. No second password.
const CONFIG='owner/config.json',COOKIE='__Host-grada-owner';
function response(body,status=200,headers={}){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',Vary:'Cookie, oai-authenticated-user-id',...headers}});}
function identity(request){const id=request.headers.get('oai-authenticated-user-id');return id&&id.length<=250?{id,email:request.headers.get('oai-authenticated-user-email')||''}:null;}
function ready(env){return typeof env?.BUCKET?.get==='function'&&typeof env.GRADA_OWNER_EMAIL==='string'&&env.GRADA_OWNER_EMAIL.trim().length>0;}
async function isOwner(user,env){
 if(!user)return false;
 const object=await env.BUCKET.get(CONFIG);
 if(object){
  const data=await object.json();
  if(typeof data?.owner_user_id!=='string'||!data.owner_user_id||data.owner_user_id.length>250)throw new Error('Invalid owner identity');
  // Retain the pinned Site ID from the previous configuration. Legacy password
  // fields are neither read for authorization nor exposed or rewritten.
  return data.owner_user_id===user.id;
 }
 return !!user.email&&user.email.trim().toLowerCase()===env.GRADA_OWNER_EMAIL.trim().toLowerCase();
}
async function requireOwner(request,env){
 if(!ready(env))return response({error:'La actualización privada todavía no está disponible.'},503);
 const user=identity(request);if(!user)return response({error:'Identifícate como propietario para actualizar.'},401);
 try{return await isOwner(user,env)?null:response({error:'Solo el propietario puede actualizar los datos.'},403);}
 catch(_){return response({error:'No se pudo verificar el acceso. Inténtalo más tarde.'},503);}
}
async function handle(request,env){
 const url=new URL(request.url);
 if(url.pathname!=='/api/owner/status'||url.search)return response({error:'Consulta no permitida.'},404);
 if(request.method!=='GET')return response({error:'Método no permitido.'},405,{Allow:'GET'});
 const origin=request.headers.get('Origin');
 if(origin&&origin!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site')return response({error:'Origen no permitido.'},403);
 if(!ready(env))return response({error:'La actualización privada todavía no está disponible.'},503);
 try{
  const user=identity(request),owner=await isOwner(user,env);
  const clear=(request.headers.get('Cookie')||'').split(';').some(value=>value.trim().startsWith(COOKIE+'='));
  // Compatibility fields let an already open older tab run without its password.
  return response({authenticated:!!user,owner,password_required:false,can_setup:false,unlocked:owner},200,clear?{'Set-Cookie':COOKIE+'=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Strict'}:{});
 }catch(_){return response({error:'No se pudo verificar el acceso. Inténtalo más tarde.'},503);}
}
module.exports={handle,requireOwner};
