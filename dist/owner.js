(function(root){
 'use strict';
 let onRefresh,dialog,busy=false;
 const get=id=>document.getElementById(id);
 function explain(text,{authenticated=false}={}){
  get('owner-description').textContent=text;
  get('owner-signin').hidden=authenticated;
  get('owner-switch').hidden=!authenticated;
  dialog.showModal();
 }
 async function open(){
  if(busy)return;busy=true;
  const status=get('refresh-status');status.textContent='Comprobando acceso…';
  try{
   const response=await fetch('/api/owner/status',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(20000)}),state=await response.json();
   if(!response.ok)throw new Error(state.error||'No se pudo verificar el acceso.');
   if(!state.owner){status.textContent='La actualización está reservada al propietario.';explain(state.authenticated?'Esta cuenta puede consultar la web. Identifícate con tu cuenta de propietario para actualizar.':'Identifícate con tu cuenta de propietario para actualizar.',state);return;}
   if(dialog.open)dialog.close();status.textContent='';await onRefresh();
  }catch(error){status.textContent=error.message;explain(error.message);}
  finally{busy=false;}
 }
 function init(options){
  onRefresh=options.onRefresh;dialog=get('owner-dialog');get('owner-close').onclick=()=>dialog.close();
  if(location.hash==='#propietario')history.replaceState(null,'',location.pathname+location.search);
 }
 root.GradaOwner={init,open};
})(typeof window==='object'?window:globalThis);
