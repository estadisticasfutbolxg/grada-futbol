(function(root){
 'use strict';
 const multiKey='__multiple_clubs__';
 const normalize=value=>String(value??'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]/g,'');
 function info(player,teams){
  const available=teams.filter(t=>!player.league_key||!t.league_key||t.league_key===player.league_key);
  const assigned=player.team_id===null||player.team_id===undefined?null:available.find(t=>String(t.id)===String(player.team_id));
  if(assigned)return {kind:'single',clubs:[assigned],label:assigned.name,description:assigned.name};
  const parts=String(player.team||'').split(',').map(s=>s.trim()).filter(Boolean),clubs=[];
  if(parts.length>1)for(const part of parts){const candidates=available.filter(t=>normalize(t.name)===normalize(part));if(candidates.length!==1){clubs.length=0;break;}clubs.push(candidates[0]);}
  if(clubs.length>1&&new Set(clubs.map(t=>String(t.id))).size===clubs.length)return {kind:'multiple',clubs,label:'Varios clubes ('+clubs.length+')',description:'Totales de temporada entre '+clubs.map(t=>t.name).join(' y ')+'. No hay desglose por club; no se atribuyen a uno de ellos.'};
  return {kind:'unassigned',clubs:[],label:'Club sin asignar',description:'La fuente no permite asignar estas cifras a un único equipo.'};
 }
 function options(data){
  const result=data.teams.map(t=>({id:String(t.id),label:(data.metadata?.scope==='all'?t.league+' · ':'')+t.name})).sort((a,b)=>a.label.localeCompare(b.label,'es'));
  if(data.players.some(p=>info(p,data.teams).kind==='multiple'))result.push({id:multiKey,label:'Varios clubes · totales de temporada'});
  return result;
 }
 function matches(player,selection,teams){
  if(!selection)return true;const club=info(player,teams);
  return selection===multiKey?club.kind==='multiple':club.kind==='single'&&String(club.clubs[0].id)===String(selection);
 }
 const api={info,options,matches,multiKey};if(typeof module==='object'&&module.exports)module.exports=api;else root.GradaClubs=api;
})(typeof window==='object'?window:globalThis);
