(function(root){
 'use strict';
 const node=typeof module==='object'&&module.exports,tactical=node?require('./roles.js'):root.GradaRoles;
 const method='national_xi_balanced_mean_v3',epsilon=1e-12;
 const definitions={
  GK:{label:'Portero',pos:'POR'},CB:{label:'Central',pos:'DEF'},
  LB:{label:'Lateral izquierdo',pos:'DEF'},RB:{label:'Lateral derecho',pos:'DEF'},
  LWB:{label:'Carril izquierdo',pos:'DEF'},RWB:{label:'Carril derecho',pos:'DEF'},
  HOLD:{label:'Contención',pos:'MED'},LINK:{label:'Apoyo del pivote',pos:'MED'},
  CM:{label:'Interior',pos:'MED'},CREATE:{label:'Interior creativo',pos:'MED'},
  AM:{label:'Mediapunta',pos:'MED'},LM:{label:'Banda izquierda',pos:'MED'},RM:{label:'Banda derecha',pos:'MED'},
  LW:{label:'Extremo izquierdo',pos:'DEL'},RW:{label:'Extremo derecho',pos:'DEL'},ST:{label:'Delantero centro',pos:'DEL'}
 };
 const back4=[['LB','LB'],['CB1','CB'],['CB2','CB'],['RB','RB']],back3=[['CB1','CB'],['CB2','CB'],['CB3','CB']],keeper=[['GK','GK']];
 const templates=[
  {key:'4-3-3',lines:[[['LW','LW'],['ST','ST'],['RW','RW']],[['CREATE','CREATE'],['CM','CM']],[['HOLD','HOLD']],back4,keeper]},
  {key:'4-2-3-1',lines:[[['ST','ST']],[['LM','LM'],['AM','AM'],['RM','RM']],[['HOLD','HOLD'],['LINK','LINK']],back4,keeper]},
  {key:'4-4-2',lines:[[['ST1','ST'],['ST2','ST']],[['LM','LM'],['HOLD','HOLD'],['CREATE','CREATE'],['RM','RM']],back4,keeper]},
  {key:'4-3-1-2',lines:[[['ST1','ST'],['ST2','ST']],[['AM','AM']],[['CM1','CM'],['HOLD','HOLD'],['CM2','CM']],back4,keeper]},
  {key:'3-5-2',lines:[[['ST1','ST'],['ST2','ST']],[['CREATE','CREATE'],['CM','CM']],[['LWB','LWB'],['HOLD','HOLD'],['RWB','RWB']],back3,keeper]},
  {key:'3-4-2-1',lines:[[['ST','ST']],[['AM1','AM'],['AM2','AM']],[['LWB','LWB'],['HOLD','HOLD'],['LINK','LINK'],['RWB','RWB']],back3,keeper]},
  {key:'4-2-2-2',lines:[[['ST1','ST'],['ST2','ST']],[['AM1','AM'],['AM2','AM']],[['HOLD','HOLD'],['LINK','LINK']],back4,keeper]}
 ].map(t=>({...t,slots:t.lines.flatMap((line,row)=>line.map(([key,role])=>({key,role,row,...definitions[role]})))}));
 const mean=rows=>rows.length?rows.reduce((sum,p)=>sum+p.score,0)/rows.length:null;
 const order=(a,b)=>b.score-a.score||a.player.name.localeCompare(b.player.name,'es')||String(a.player.id).localeCompare(String(b.player.id));
 function prepare(candidate){return {...candidate,codes:tactical.info(candidate.player).codes};}
 function evidence(candidate,role){
  const codes=candidate.codes||tactical.info(candidate.player).codes,pos=candidate.player.pos,has=code=>codes.includes(code);
  const published=list=>{const code=list.find(has);return code?code+' publicado · FotMob':null;};
  if(role==='GK')return pos==='POR'?'POR · posición canónica':null;
  if(['CB','LB','RB','LWB','RWB'].includes(role)){
   if(pos!=='DEF')return null;
   return published({CB:['CB'],LB:['LB','LWB'],RB:['RB','RWB'],LWB:['LWB','LB'],RWB:['RWB','RB']}[role]);
  }
  if(['LW','RW','LM','RM','ST','AM'].includes(role)){
   if(!['MED','DEL'].includes(pos))return null;
   if(role==='ST')return pos==='DEL'?published(['ST']):null;
   if(role==='AM')return published(['CAM'])||(pos==='MED'&&has('CM')&&candidate.midfieldProfile==='MED_ATT'?'CM publicado · perfil ofensivo; encaje teórico':null);
   return published({LW:['LW'],RW:['RW'],LM:['LM','LW'],RM:['RM','RW']}[role]);
  }
  if(pos!=='MED')return null;
  if(role==='HOLD')return published(['CDM'])||(has('CM')&&candidate.midfieldProfile==='MED_DEF'?'CM publicado · perfil defensivo; encaje teórico':null);
  if(role==='LINK')return published(['CM','CDM']);
  if(role==='CM')return published(['CM']);
  if(role==='CREATE'&&has('CM'))return published(['CAM'])||(candidate.midfieldProfile==='MED_ATT'?'CM publicado · perfil ofensivo; encaje teórico':null);
  return null;
 }
 function affinity(candidate,slot){
  const has=code=>candidate.codes.includes(code),profile=candidate.midfieldProfile;
  if(slot.role==='HOLD')return (has('CDM')?4:1)+(profile==='MED_DEF'?2:0);
  if(['AM','CREATE'].includes(slot.role))return (has('CAM')?4:1)+(profile==='MED_ATT'?2:0);
  if(['CM','LINK'].includes(slot.role))return has('CM')?4:2;
  const preferred={LWB:'LWB',RWB:'RWB',LB:'LB',RB:'RB',LM:'LM',RM:'RM'}[slot.role];
  return preferred&&has(preferred)?4:2;
 }
 // Rectangular Hungarian assignment. Dummy columns represent missing players.
 // Their cost prioritizes filled compatible slots over any numerical score;
 // an incompatible player always costs more than leaving the slot empty.
 function assign(pool,slots,weight=c=>c.score){
  const candidates=[...pool].sort(order),n=slots.length,m=candidates.length+n;
  const proof=slots.map(slot=>candidates.map(c=>evidence(c,slot.role))),weights=slots.map(slot=>candidates.map(c=>weight(c,slot))),scale=Math.max(1,...weights.flat().map(Math.abs)),missing=2*n+1;
  const cost=proof.map((row,i)=>Array.from({length:m},(_,j)=>j>=candidates.length?missing:row[j]?-weights[i][j]/scale:4*missing));
  const u=Array(n+1).fill(0),v=Array(m+1).fill(0),p=Array(m+1).fill(0),way=Array(m+1).fill(0);
  for(let i=1;i<=n;i++){
   p[0]=i;let j0=0;const min=Array(m+1).fill(Infinity),used=Array(m+1).fill(false);
   do{
    used[j0]=true;const i0=p[j0];let delta=Infinity,j1=0;
    for(let j=1;j<=m;j++)if(!used[j]){
     const value=cost[i0-1][j-1]-u[i0]-v[j];
     if(value<min[j]){min[j]=value;way[j]=j0;}
     if(min[j]<delta){delta=min[j];j1=j;}
    }
    for(let j=0;j<=m;j++)if(used[j]){u[p[j]]+=delta;v[j]-=delta;}else min[j]-=delta;
    j0=j1;
   }while(p[j0]!==0);
   do{const j1=way[j0];p[j0]=p[j1];j0=j1;}while(j0!==0);
  }
  const result=slots.map(s=>({...s,candidate:null,evidence:null}));
  for(let j=1;j<=m;j++)if(p[j]&&j<=candidates.length&&proof[p[j]-1][j-1])Object.assign(result[p[j]-1],{candidate:candidates[j-1],evidence:proof[p[j]-1][j-1]});
  return result;
 }
 function evaluate(pool,template){
  const initial=assign(pool,template.slots),chosen=initial.filter(s=>s.candidate).map(s=>s.candidate),complete=chosen.length===11;
  // Reassign only those same players to their most suitable roles. This tie
  // breaker changes neither the selected identities nor either score total.
  const slots=assign(chosen,template.slots,affinity);
  // Every selected player has equal weight. Maximizing the sum of eleven
  // scores also maximizes their arithmetic mean, independently of minutes.
  return {formation:template.key,slots,complete,selected:chosen.length,score:complete?mean(chosen):null,quality:chosen.reduce((s,p)=>s+p.score,0),minutes:chosen.reduce((s,p)=>s+p.player.minutes,0)};
 }
 function propose(pool){
  const candidates=pool.map(prepare),alternatives=templates.map(t=>evaluate(candidates,t));
  const compare=(a,b)=>Number(b.complete)-Number(a.complete)||(a.complete&&Math.abs(b.score-a.score)>epsilon?b.score-a.score:0)||b.selected-a.selected||b.quality-a.quality||templates.findIndex(t=>t.key===a.formation)-templates.findIndex(t=>t.key===b.formation);
  return {...[...alternatives].sort(compare)[0],alternatives};
 }
 const api={method,templates,definitions,evidence,assign,mean,propose};if(node)module.exports=api;else root.GradaFormations=api;
})(typeof window==='object'?window:globalThis);
