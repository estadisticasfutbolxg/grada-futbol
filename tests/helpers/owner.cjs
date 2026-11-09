'use strict';
const assert=require('node:assert/strict'),owner=require('../../worker/owner.cjs');
function bucket(){
 const objects=new Map();let serial=0;
 return {objects,async get(key){const stored=objects.get(key);return stored?{etag:stored.etag,json:async()=>JSON.parse(stored.value)}:null;},async put(key,value,options={}){
  const existing=objects.get(key),condition=options.onlyIf;
  if(condition?.etagDoesNotMatch==='*'&&existing||condition?.etagMatches&&condition.etagMatches!==existing?.etag)return null;
  const etag=String(++serial);objects.set(key,{value,etag});return {etag};
 }};
}
function fixture(){return {BUCKET:bucket(),GRADA_OWNER_EMAIL:'owner@example.test',GRADA_OWNER_SESSION_SECRET:'isolated-test-session-secret-with-32-characters'};}
const user={'oai-authenticated-user-id':'site-owner-id','oai-authenticated-user-email':'owner@example.test'};
function request(action,{headers=user,body,method=body?'POST':'GET',origin='https://grada.test'}={}){return new Request('https://grada.test/api/owner/'+action,{method,headers:{...headers,...(body?{'Content-Type':'application/json',Origin:origin}:{})},body:body?JSON.stringify(body):undefined});}
async function access(env=fixture(),now=Date.now){
 const result=await owner.handle(request('setup',{body:{password:'A private test password'}}),env,now);assert.equal(result.status,200,await result.clone().text());
 return {env,headers:{...user,Cookie:result.headers.get('Set-Cookie').split(';')[0]}};
}
module.exports={fixture,user,request,access};
