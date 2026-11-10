(function(root){
 'use strict';
 const labels={POR:'portero',DEF:'defensa',MED:'centrocampista',DEL:'delantero'};
 const fotmobKeys={keeperlong:'POR',keeper:'POR',centerback:'DEF',leftback:'DEF',rightback:'DEF',leftwingback:'DEF',rightwingback:'DEF',defensivemidfielder:'MED',centerdefensivemidfielder:'MED',centralmidfielder:'MED',centermidfielder:'MED',centerattackingmidfielder:'MED',attackingmidfielder:'MED',leftmidfielder:'MED',rightmidfielder:'MED',leftwinger:'DEL',rightwinger:'DEL',striker:'DEL',forward:'DEL',secondstriker:'DEL'};
 function fromFotmob(position){
  const key=String(position?.key||'').toLowerCase().replace(/[^a-z]/g,''),generic={midfielder:'MED',defender:'DEF',attacker:'DEL',forward:'DEL',keeper:'POR',goalkeeper:'POR'};
  return fotmobKeys[key]||generic[String(position?.label||'').toLowerCase()]||'—';
 }
 function fromUnderstat(position){const map={GK:'POR',D:'DEF',M:'MED',F:'DEL'};return [...new Set(String(position||'').split(/\s+/).filter(p=>map[p]).map(p=>map[p]))];}
 function resolve(records,primarySource){
  const alternatives=Object.fromEntries(Object.entries(records).filter(([,p])=>Object.hasOwn(labels,p.pos)).map(([s,p])=>[s,p.pos]));
  const counts=new Map();for(const pos of Object.values(alternatives))counts.set(pos,(counts.get(pos)||0)+1);
  const consensus=[...counts].find(([,count])=>count>=2)?.[0];
  const order=[...new Set(['FotMob',primarySource,'ESPN'])];
  const source=consensus?order.find(s=>alternatives[s]===consensus):order.find(s=>alternatives[s]);
  const position=source?alternatives[source]:records[primarySource]?.pos||'—',conflicting=counts.size>1;
  return {position,source:source||primarySource,method:consensus?'source_consensus':source==='FotMob'?'profile_position':'primary_position',conflicting,uncertain:conflicting&&!consensus,alternatives,context:records[source]?.positionContext||null};
 }
 function describe(record){
  const r=record.positionResolution;if(!r)return 'Posición publicada: '+(labels[record.pos]||record.pos)+'.';
  const agreeing=Object.entries(r.alternatives).filter(([,pos])=>pos===r.position).map(([s])=>s);
  return 'Posición: '+(labels[r.position]||r.position)+'. '+(r.method==='source_consensus'?'Coinciden '+agreeing.join(' y ')+'. ':'Fuente de posición: '+r.source+'. ')+(r.conflicting?'Discrepancia entre fuentes: '+Object.entries(r.alternatives).map(([s,p])=>s+' '+p).join('; ')+'. ':'');
 }
 const api={labels,fromFotmob,fromUnderstat,resolve,describe};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.GradaPositions=api;
})(typeof window==='object'?window:globalThis);
