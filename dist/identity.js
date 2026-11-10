(function(root){
 'use strict';
 const substitutions={'ø':'o','ł':'l','đ':'d','ð':'d','þ':'th','æ':'ae','œ':'oe','ß':'ss'};
 function text(value){return String(value??'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[øłđðþæœß]/g,c=>substitutions[c]);}
 function normalize(value){return text(value).replace(/[^a-z0-9]/g,'');}
 const particles=new Set(['de','del','da','das','do','dos','di','van','von','der','den','la','le']);
 function tokens(value){return (text(value).match(/[a-z0-9]+/g)||[]).map(t=>t==='jr'?'junior':t).filter(t=>!particles.has(t));}
 function compatibleRole(a,b){const known=p=>['POR','DEF','MED','DEL'].includes(p.pos);return !known(a)||!known(b)||(a.pos==='POR')===(b.pos==='POR');}
 function sameTokens(a,b){return a.length===b.length&&[...a].sort().join('|')===[...b].sort().join('|');}
 const givenVariants=[['alex','alejandro'],['toni','antonio'],['odisseas','odysseas']];
 function variant(a,b,keyA,keyB){
  // Reviewed IDs remain pinned; a generic name rule cannot bypass them.
  if(keyA.includes('|@')||keyB.includes('|@'))return keyA===keyB?{weight:6,method:'verified_identity'}:null;
  if(normalize(a.name)===normalize(b.name))return {weight:5,method:'name_team'};
  const at=tokens(a.name),bt=tokens(b.name);if(!at.length||!bt.length)return null;
  if(sameTokens(at,bt))return {weight:4,method:'name_tokens_team'};
  const shared=[...new Set(at.filter(t=>bt.includes(t)))],subset=(x,y)=>x.every(t=>y.includes(t));
  if(shared.filter(t=>t.length>1).length>=2&&(subset(at,bt)||subset(bt,at)))return {weight:3,method:'name_extended_team'};
  // An initial is a contraction, not a license to equate two full given names.
  const initial=(x,y)=>x===y||x.length===1&&y.startsWith(x)||y.length===1&&x.startsWith(y);
  const lastA=at.at(-1),lastB=bt.at(-1),firstA=at[0],firstB=bt[0];
  if(at.length>=2&&bt.length>=2&&lastA===lastB&&lastA.length>=4){
   const middleA=at.slice(1,-1),middleB=bt.slice(1,-1);
   const middleCompatible=middleA.every(x=>middleB.some(y=>initial(x,y)))||middleB.every(x=>middleA.some(y=>initial(x,y)));
   if(middleCompatible&&initial(firstA,firstB))return {weight:2,method:'name_initials_team'};
   if(middleCompatible&&Math.min(firstA.length,firstB.length)>=3&&Math.max(firstA.length,firstB.length)>=5&&(firstA.startsWith(firstB)||firstB.startsWith(firstA)))return {weight:2,method:'name_contracted_team'};
   if(middleCompatible&&givenVariants.some(pair=>pair.includes(firstA)&&pair.includes(firstB)))return {weight:2,method:'name_given_variant_team'};
  }
  if((at.length===1&&at[0].length>=4&&bt.includes(at[0]))||(bt.length===1&&bt[0].length>=4&&at.includes(bt[0])))return {weight:1,method:'name_mononym_team'};
  return null;
 }
 function names(record){return [...new Set([record.name,...(Array.isArray(record.nameAliases)?record.nameAliases:[])].filter(n=>typeof n==='string'&&n.trim()&&n.length<=250))].slice(0,8);}
 function variants(a,b,keyA,keyB){
  if(keyA.includes('|@')||keyB.includes('|@'))return variant(a,b,keyA,keyB);
  let selected=null;
  for(const first of names(a))for(const second of names(b)){
   const match=variant({name:first},{name:second},keyA,keyB);if(!match||selected&&selected.weight>=match.weight)continue;
   selected={...match,method:first===a.name&&second===b.name?match.method:'provider_alias_team'};
  }
  return selected;
 }
 function link(primary,secondary,{primaryClub,secondaryClub,primaryKey=p=>normalize(p.name),secondaryKey=p=>normalize(p.name)}){
  const clubs=new Map(),edges=new Map(),reverse=new Map(),states=new Map(),matches=new Map();
  for(const p of secondary){const club=secondaryClub(p);if(!club||!normalize(p.name))continue;if(!clubs.has(club))clubs.set(club,[]);clubs.get(club).push(p);}
  for(const p of primary){
   const club=primaryClub(p),candidates=[],state={ambiguous:false,roleConflict:false,candidates:0};
   if(club&&normalize(p.name))for(const other of clubs.get(club)||[]){
    const match=variants(p,other,primaryKey(p),secondaryKey(other));if(!match)continue;
    state.candidates++;if(!compatibleRole(p,other)){state.roleConflict=true;continue;}
    const edge={primary:p,record:other,...match};candidates.push(edge);
    if(!reverse.has(other))reverse.set(other,[]);reverse.get(other).push(edge);
   }
   edges.set(p,candidates);states.set(p,state);
  }
  // Mutual unique best matches over the entire club, independent of row order.
  // Removing already matched rows must not manufacture uniqueness for a namesake.
  const best=items=>{const top=Math.max(...items.map(x=>x.weight));return items.filter(x=>x.weight===top);};
  for(const p of primary){
   const candidates=edges.get(p),state=states.get(p);if(!candidates.length){state.ambiguous=state.candidates>0;continue;}
   const top=best(candidates);if(top.length!==1){state.ambiguous=true;continue;}
   const edge=top[0],back=best(reverse.get(edge.record));
   if(back.length!==1||back[0].primary!==p){state.ambiguous=true;continue;}
   matches.set(p,{record:edge.record,method:edge.method});
  }
  return {matches,states};
 }
 const api={normalize,tokens,variant,link,compatibleRole};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.GradaIdentity=api;
})(typeof window==='object'?window:globalThis);
