(function(root){
 'use strict';
 const labels={POR:'portero',DEF:'defensa',MED:'centrocampista',DEL:'delantero'};
 const fotmobKeys={keeperlong:'POR',keeper:'POR',centerback:'DEF',leftback:'DEF',rightback:'DEF',leftwingback:'DEF',rightwingback:'DEF',defensivemidfielder:'MED',centerdefensivemidfielder:'MED',centralmidfielder:'MED',centermidfielder:'MED',centerattackingmidfielder:'MED',attackingmidfielder:'MED',leftmidfielder:'MED',rightmidfielder:'MED',leftwinger:'DEL',rightwinger:'DEL',striker:'DEL',forward:'DEL',secondstriker:'DEL'};
 function fromFotmob(position){
  const key=String(position?.key||'').toLowerCase().replace(/[^a-z]/g,''),generic={midfielder:'MED',defender:'DEF',attacker:'DEL',forward:'DEL',keeper:'POR',goalkeeper:'POR'};
  const label=String(position?.label||'').toLowerCase();
  return Object.hasOwn(fotmobKeys,key)?fotmobKeys[key]:Object.hasOwn(generic,key)?generic[key]:Object.hasOwn(generic,label)?generic[label]:'—';
 }
 function fromUnderstat(position){const map={GK:'POR',D:'DEF',M:'MED',F:'DEL'};return [...new Set(String(position||'').split(/\s+/).filter(p=>Object.hasOwn(map,p)).map(p=>map[p]))];}
 function resolve(records,primarySource){
  const reportedPositions=Object.fromEntries(Object.entries(records).map(([source,p])=>{
   const reported=Array.isArray(p.positions)?[...new Set(p.positions.filter(pos=>Object.hasOwn(labels,pos)))]:[];
   return [source,reported.length?reported:Object.hasOwn(labels,p.pos)?[p.pos]:[]];
  }).filter(([,positions])=>positions.length));
  const alternatives=Object.fromEntries(Object.entries(reportedPositions).map(([s,positions])=>[s,positions.includes(records[s].pos)?records[s].pos:positions[0]]));
  // A mixed label such as "D M" is evidence of two possible roles, not a
  // definite vote for the first token. Only unambiguous source labels vote.
  const counts=new Map();for(const positions of Object.values(reportedPositions))if(positions.length===1)counts.set(positions[0],(counts.get(positions[0])||0)+1);
  const consensus=[...counts].find(([,count])=>count>=2)?.[0];
  const order=[...new Set(['FotMob',primarySource,'ESPN'])];
  const supported=alternatives.ESPN&&reportedPositions[primarySource]?.length>1&&reportedPositions[primarySource].includes(alternatives.ESPN)?'ESPN':null;
  const source=consensus?order.find(s=>reportedPositions[s]?.length===1&&alternatives[s]===consensus):alternatives.FotMob?'FotMob':supported||order.find(s=>alternatives[s]);
  const position=source?alternatives[source]:records[primarySource]?.pos||'—',conflicting=new Set(Object.values(reportedPositions).flat()).size>1;
  return {position,source:source||primarySource,method:consensus?'source_consensus':source==='FotMob'?'profile_position':source===supported?'supported_position':'primary_position',conflicting,uncertain:conflicting&&!consensus,alternatives,reportedPositions,context:records[source]?.positionContext||null};
 }
 function describe(record){
  const r=record.positionResolution;if(!r)return 'Posición publicada: '+(labels[record.pos]||record.pos)+'.';
  const agreeing=Object.entries(r.alternatives).filter(([source,pos])=>pos===r.position&&(r.reportedPositions?.[source]?.length||1)===1).map(([s])=>s);
  return 'Posición: '+(labels[r.position]||r.position)+'. '+(r.method==='source_consensus'?'Coinciden '+agreeing.join(' y ')+'. ':'Fuente de posición: '+r.source+'. ')+(r.conflicting?'Etiquetas publicadas: '+Object.entries(r.alternatives).map(([s,p])=>s+' '+(r.reportedPositions?.[s]?.join('/')||p)).join('; ')+'. ':'');
 }
 const api={labels,fromFotmob,fromUnderstat,resolve,describe};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.GradaPositions=api;
})(typeof window==='object'?window:globalThis);
