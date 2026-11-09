(function(root){
 'use strict';
 let onRefresh,dialog,state,busy=false;
 const get=id=>document.getElementById(id);
 async function call(action,body){
  const response=await fetch('/api/owner/'+action,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
  const data=await response.json();if(!response.ok)throw new Error(data.error||'No se pudo verificar el acceso.');return data;
 }
 function message(text){get('owner-message').textContent=text;}
 function render(){
  get('owner-signin').hidden=state.authenticated;
  get('owner-switch').hidden=!state.authenticated;
  get('owner-form').hidden=!state.owner||state.unlocked;
  get('owner-unlocked').hidden=!state.unlocked;
  get('owner-confirm-row').hidden=!state.can_setup;
  get('owner-confirm').required=!!state.can_setup;
  get('owner-password').autocomplete=state.can_setup?'new-password':'current-password';
  get('owner-submit').textContent=state.can_setup?'Guardar mi contraseña':'Desbloquear actualización';
  get('owner-title').textContent=state.can_setup?'Tu acceso de propietario':'Actualizar datos';
  get('owner-description').textContent=!state.authenticated?'Identifícate con tu cuenta de propietario para acceder a la actualización.':!state.owner?'Esta cuenta puede consultar la web. La actualización está reservada al propietario.':state.can_setup?'Define una contraseña de al menos 12 caracteres. Solo tú la eliges; no necesitas enviarla por el chat.':state.unlocked?'Actualización desbloqueada durante 30 minutos en este navegador.':'Introduce tu contraseña para desbloquear la actualización durante 30 minutos.';
 }
 async function open(){
  if(busy)return;dialog.showModal();message('Comprobando acceso…');get('owner-form').hidden=true;get('owner-unlocked').hidden=true;get('owner-signin').hidden=true;get('owner-switch').hidden=true;
  busy=true;try{state=await call('status');render();message('');if(state.owner&&!state.unlocked)get('owner-password').focus();}catch(error){message(error.message);}finally{busy=false;}
 }
 function clear(){get('owner-password').value='';get('owner-confirm').value='';}
 function init(options){
  onRefresh=options.onRefresh;dialog=get('owner-dialog');get('owner-close').onclick=()=>dialog.close();dialog.addEventListener('close',clear);
  get('owner-form').onsubmit=async event=>{
   event.preventDefault();if(busy)return;const password=get('owner-password').value;
   if(state.can_setup&&password!==get('owner-confirm').value){message('Las contraseñas no coinciden.');return;}
   busy=true;get('owner-submit').disabled=true;message('Verificando…');
   try{await call(state.can_setup?'setup':'login',{password});clear();state=await call('status');render();message('');}catch(error){clear();message(error.message);}finally{busy=false;get('owner-submit').disabled=false;}
  };
  get('owner-run').onclick=()=>{dialog.close();onRefresh();};
  get('owner-lock').onclick=async()=>{if(busy)return;busy=true;try{await call('logout',{});state=await call('status');render();message('Acceso bloqueado.');}catch(error){message(error.message);}finally{busy=false;}};
  if(location.hash==='#propietario'){history.replaceState(null,'',location.pathname+location.search);open();}
 }
 root.GradaOwner={init,open};
})(typeof window==='object'?window:globalThis);
