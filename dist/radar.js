(function(root) {
  'use strict';
  const metrics = typeof module === 'object' && module.exports ? require('./metrics.js') : root.GradaMetrics;
  const tactical = typeof module === 'object' && module.exports ? require('./roles.js') : root.GradaRoles;
  const fairplay = typeof module === 'object' && module.exports ? require('./fairplay.js') : root.GradaFairPlay;
  const {minimumScoreMinutes} = typeof module === 'object' && module.exports ? require('./sampling.js') : root.GradaSampling;
  const axes = {
    goals:['Goles /90','90'],xg:['xG /90','90'],xa:['xA /90','90'],shots:['Tiros /90','90'],assists:['Asistencias /90','90'],keypasses:['Pases clave /90','90'],
    completedPer90:['Pases completados /90','total'],recoveries:['Recuperaciones /90','90'],
    shotsOnTargetPer90:['Tiros a puerta /90','total'],dribblesPer90:['Regates logrados /90','total'],
    clearances:['Despejes /90','90'],blocks:['Bloqueos /90','90'],
    prevented:['Goles evitados /90','90'],highClaims:['Balones aéreos atrapados /90','90'],sweeperActions:['Acciones de líbero /90','90'],longBallsPer90:['Pases largos precisos /90','total'],
    conversion:['Conversión %','total'],tackles:['Entradas /90','90'],interceptions:['Intercepciones /90','90'],progressive:['Pases progresivos /90','90'],
    passes:['Pases /90','90'],accuracy:['Pases completados %','total'],psxgEfficiency:['Eficacia vs xGOT %','total'],savepct:['Paradas %','total'],savesPerMatch:['Paradas /PJ','total'],
    concededPerMatch:['Goles recibidos /PJ','total',true],cleanPerMatch:['Porterías a cero /PJ','total'],
    lineBreakingPasses:['Pases rompelíneas /90','90'],chancesCreated:['Ocasiones creadas /90','90'],bigChancesCreated:['Grandes ocasiones /90','90'],
    goalsPerMatch:['Goles /PJ','total'],xgPerMatch:['xG /PJ','total'],xgaPerMatch:['xG recibidos /PJ','total',true],goalsPerXg:['Goles /xG','total'],
    shotsOnTargetPerMatch:['Tiros a puerta /PJ','total'],bigChancesPerMatch:['Grandes ocasiones /PJ','total'],pointsPerMatch:['Puntos /PJ','total'],
    goalDifferencePerMatch:['Diferencia de goles /PJ','total'],xgDifferencePerMatch:['Diferencia xG /PJ','total']
  };
  const priorities = {
    DEL:['goals','xg','shotsOnTargetPer90','xa','dribblesPer90','conversion','shots','keypasses'],
    MED:['completedPer90','accuracy','xa','recoveries','tackles','interceptions','keypasses','assists','progressive','passes','xg','goals','shots'],
    DEF:['tackles','interceptions','clearances','blocks','recoveries','completedPer90','accuracy','progressive','passes'],
    DEF_FB:['tackles','interceptions','recoveries','goals','xg','xa'],
    POR:['savepct','savesPerMatch','concededPerMatch','psxgEfficiency','prevented','highClaims','sweeperActions','cleanPerMatch','longBallsPer90','accuracy','completedPer90','passes'],
    MED_DEF:['completedPer90','accuracy','recoveries','tackles','interceptions','lineBreakingPasses'],
    MED_ATT:['xa','chancesCreated','bigChancesCreated','shotsOnTargetPer90','dribblesPer90','goals'],
  };
  const attackKeys = ['goals','assists','xg','xa'];
  const attackWeights = Object.freeze({DEF:0.05,DEF_FB:0.15,MED_DEF:0.05,MED:0.10,MED_ATT:0.25,DEL:0.35});
  const rankingDefinitions=[
    {key:'DEL',label:'Delanteros',position:'DEL',kind:'player',minimum:minimumScoreMinutes},
    {key:'POR',label:'Porteros',position:'POR',kind:'player',minimum:minimumScoreMinutes},
    {key:'DEF',label:'Defensas',position:'DEF',kind:'player',minimum:minimumScoreMinutes},
    {key:'DEF_CB',label:'Centrales',position:'DEF',roleKey:'CB',kind:'player',minimum:minimumScoreMinutes},
    {key:'DEF_FB',label:'Laterales y carrileros · ataque y defensa',position:'DEF',roleKey:'FB',kind:'player',minimum:minimumScoreMinutes},
    {key:'MED_DEF',label:'Centrocampistas · perfil defensivo',position:'MED',kind:'player',minimum:minimumScoreMinutes},
    {key:'MED_ATT',label:'Centrocampistas · perfil ofensivo',position:'MED',kind:'player',minimum:minimumScoreMinutes},
    {key:'TEAM_ATTACK',label:'Equipos · mejores ataques',kind:'team',minimum:5,aggregateProfile:'ATTACK'},
    {key:'TEAM_STRIKERS',label:'Equipos · mejor delantera',kind:'team',minimum:5,aggregateProfile:'DEL'},
    {key:'TEAM_DEFENSE',label:'Equipos · mejores defensas',kind:'team',minimum:5,aggregateProfile:'DEF'},
    {key:'TEAM_MED_ATT',label:'Equipos · centro del campo ofensivo',kind:'team',minimum:5,aggregateProfile:'MED_ATT'},
    {key:'TEAM_MED_DEF',label:'Equipos · centro del campo defensivo',kind:'team',minimum:5,aggregateProfile:'MED_DEF'},
    {key:'TEAM_OVERALL',label:'Equipos · rendimiento global',kind:'team',minimum:5}
  ];
  function definition(key){return rankingDefinitions.find(d=>d.key===key)||{key,label:key==='MED'?'Centrocampistas':key,position:key,kind:'player',minimum:minimumScoreMinutes};}
  function percentile(value,reference,lowerBetter=false) {
    if (!Number.isFinite(value) || !reference.length) return null;
    const below = reference.filter(v=>v<value).length, equal = reference.filter(v=>v===value).length;
    const result = (below+equal/2)/reference.length*100;
    return lowerBetter ? 100-result : result;
  }
  // Plans own these sorted samples; public percentile() still accepts mutable arrays.
  function rankedPercentile(value,sorted,lowerBetter=false){
    if(!Number.isFinite(value)||!sorted.length)return null;
    function bound(inclusive){let lo=0,hi=sorted.length;while(lo<hi){const mid=(lo+hi)>>>1;if(sorted[mid]<value||inclusive&&sorted[mid]===value)lo=mid+1;else hi=mid;}return lo;}
    const below=bound(false),equal=bound(true)-below,result=(below+equal/2)/sorted.length*100;
    return lowerBetter?100-result:result;
  }
  function relativeArea(percentiles) {
    if(percentiles.length<3||percentiles.some(p=>!Number.isFinite(p)||p<0||p>100))return null;
    // Shoelace area / area of the regular polygon at P100. Equal angular gaps.
    return percentiles.reduce((sum,p,i)=>sum+p/100*(percentiles[(i+1)%percentiles.length]/100),0)/percentiles.length;
  }
  function reference(all,key,{withAttack=false}={}) {
    const def=definition(key),position=def.position,minimum=def.minimum;
    if(def.kind==='team')throw new Error('Los scores de equipo se calculan con los scores de sus jugadores en GradaScores.');
    const samePosition = all.filter(p=>p.pos === position&&(!def.roleKey||tactical.matches(p,def.roleKey)));
    function eligible(record,key) {
      if(!baseEligible(record,minimum))return false;
      const ctx = metrics.context(record,key,axes[key]?.[1]);
      const minutes = ctx && Object.hasOwn(ctx,'minutes') ? ctx.minutes : record.minutes;
      const matches = ctx && Object.hasOwn(ctx,'matches') ? ctx.matches : record.matches;
      return Number.isFinite(minutes) ? minutes >= minimum : position === 'POR' && Number.isFinite(matches) && matches >= 2;
    }
    const attackWeight=withAttack?attackWeights[key]:undefined;
    // Preserve the original six-axis selection before separating attack. Removing
    // attack first promoted fallback metrics into new mandatory requirements.
    const candidates=priorities[key]||[],samples=new Map();
    for(const key of candidates){
      const values=samePosition.filter(p=>eligible(p,key)).map(p=>metrics.metric(p,key,axes[key][1])).filter(Number.isFinite);
      if(values.length>=5)samples.set(key,values);
    }
    const attackPeers=attackWeight&&key==='DEF'?samePosition.filter(p=>!tactical.matches(p,'FB')):samePosition;
    const attackSamples=new Map();
    if(attackWeight)for(const metric of attackKeys){
      const values=attackPeers.filter(p=>eligible(p,metric)).map(p=>metrics.metric(p,metric,'90')).filter(Number.isFinite);
      if(values.length>=5)attackSamples.set(metric,values.sort((a,b)=>a-b));
    }
    const originalKeys=[...samples.keys()].filter(k=>!(position==='POR'&&samples.has('psxgEfficiency')&&k==='prevented')).slice(0,6);
    return {definition:def,minimum,samples,attackWeight,attackSamples,ranked:new Map([...samples].map(([key,values])=>[key,[...values].sort((a,b)=>a-b)])),keys:attackWeight?originalKeys.filter(k=>!attackKeys.includes(k)):originalKeys,displayKeys:attackWeight?[...new Set([...originalKeys,...attackKeys])]:originalKeys,peerCount:samePosition.filter(p=>candidates.some(key=>eligible(p,key)&&Number.isFinite(metrics.metric(p,key,axes[key][1])))).length};
  }
  function baseEligible(record,minimum){return !record.identityConflict&&Number.isFinite(record.minutes)&&record.minutes>=minimum;}
  function attackingContribution(player,plan,radarScore){
    const weight=plan.attackWeight/attackKeys.length;
    const entries=attackKeys.map(key=>{
      const sample=plan.attackSamples.get(key),context=metrics.context(player,key,'90');
      const minutes=context&&Object.hasOwn(context,'minutes')?context.minutes:player.minutes;
      const value=metrics.metric(player,key,'90');
      const percentile=baseEligible(player,plan.minimum)&&Number.isFinite(minutes)&&minutes>=plan.minimum&&sample?rankedPercentile(value,sample):null;
      return {key,value,percentile,referenceCount:sample?.length??0,weight:percentile===null?0:weight};
    });
    const usedWeight=entries.reduce((sum,metric)=>sum+metric.weight,0);
    const contribution=entries.reduce((sum,metric)=>sum+(metric.percentile===null?0:metric.weight*(metric.percentile/100)**2),0);
    const score=Number.isFinite(radarScore)?radarScore*(1-usedWeight)+contribution:null;
    return {maxWeight:plan.attackWeight,usedWeight,entries,score};
  }
  function profile(player,all,plan) {
    if(!plan)return profiles([player],{referencePlayers:all}).get(player);
    const values=[];
    for(const key of plan.keys){
      const [label,unit,lower]=axes[key],value=metrics.metric(player,key,unit),sample=plan.samples.get(key);
      if(!Number.isFinite(value))continue;
      values.push({key,label,value,percentile:plan.ranked?.has(key)?rankedPercentile(value,plan.ranked.get(key),lower):percentile(value,sample,lower),lowerBetter:!!lower,referenceCount:sample.length,source:metrics.context(player,key,unit)?.source||null});
    }
    const visible=values.length>=3?values:[],area=relativeArea(visible.map(a=>a.percentile));
    const insufficientSamples=values.flatMap(a=>{
      const c=metrics.context(player,a.key,axes[a.key]?.[1]),minutes=c&&Object.hasOwn(c,'minutes')?c.minutes:player.minutes,matches=c&&Object.hasOwn(c,'matches')?c.matches:player.matches;
      const enough=Number.isFinite(minutes)?minutes>=plan.minimum:player.pos==='POR'&&Number.isFinite(matches)&&matches>=2;
      return enough?[]:[{key:a.key,source:c?.source||null,minutes:Number.isFinite(minutes)?minutes:null,matches:Number.isFinite(matches)?matches:null}];
    });
    const baseSampleEnough=baseEligible(player,plan.minimum),sampleEnough=baseSampleEnough&&!insufficientSamples.length;
    const radarScore=values.length===plan.keys.length&&sampleEnough?area:null;
    const attack=plan.attackWeight?attackingContribution(player,plan,radarScore):null;
    const score=attack?attack.score:radarScore;
    // The complete visual radar is descriptive. Only the non-attack polygon and
    // the separately weighted attack block enter the score, once each.
    const displayByKey=new Map(values.map(a=>[a.key,a]));
    if(attack)for(const entry of attack.entries)if(entry.percentile!==null){
      const [label,unit]=axes[entry.key];
      displayByKey.set(entry.key,{key:entry.key,label,value:entry.value,percentile:entry.percentile,referenceCount:entry.referenceCount,lowerBetter:false,source:metrics.context(player,entry.key,unit)?.source||null});
    }
    const displayValues=plan.displayKeys.map(key=>displayByKey.get(key)).filter(Boolean),displayAxes=displayValues.length>=3?displayValues:[];
    return {axes:visible,displayAxes,displayMissingAxes:plan.displayKeys.filter(key=>!displayByKey.has(key)),displayArea:relativeArea(displayAxes.map(a=>a.percentile)),area,score,comparableArea:score,attack,expectedAxes:plan.keys,missingAxes:plan.keys.filter(k=>!values.some(a=>a.key===k)),sampleEnough,baseSampleEnough,insufficientSamples,minimumMinutes:plan.minimum,minimumMatches:null,kind:'player',profileKey:plan.definition.key,profileLabel:plan.definition.label,peerCount:plan.peerCount,availableAxes:values.length,
      referenceRule:(plan.definition.key==='DEF_FB'?'laterales y carrileros con puesto publicado':'misma posición')+', mínimo '+plan.minimum+' min del jugador y de cada eje'+(player.pos==='POR'?' (2 PJ por eje si su proveedor no publica minutos)':'')};
  }
  function profiles(all,{referencePlayers=all,kind='player',midfieldRoles=null}={}){
    if(kind!=='player')throw new Error('Los equipos usan promedios de sus jugadores en GradaScores.');
    const roles=midfieldRoles||new Map(),indices=midfieldRoles?null:midfieldIndices(all,{referencePlayers});
    if(indices)for(const p of all)if(p.pos==='MED')roles.set(p,midfieldRole(p,indices));
    const keyFor=p=>p.pos==='DEF'&&tactical.matches(p,'FB')?'DEF_FB':p.pos==='MED'&&['MED_ATT','MED_DEF'].includes(roles.get(p))?roles.get(p):p.pos;
    const plans=new Map([...new Set(all.map(keyFor))].map(key=>[key,reference(referencePlayers,key,{withAttack:true})]));
    return new Map(all.map(p=>{
      const key=keyFor(p),result=profile(p,referencePlayers,plans.get(key));
      if(p.pos==='MED')result.profileLabel={MED_ATT:'Centrocampista · perfil ofensivo',MED_DEF:'Centrocampista · perfil defensivo',MED:'Centrocampista · perfil general (sin clasificar)'}[key];
      if(key==='DEF_FB')result.profileLabel='Lateral / carrilero · ataque y defensa';
      return [p,fairplay.apply(p,result)];
    }));
  }
  function midfieldIndices(all,{referencePlayers=all}={}){
    return new Map(['MED_ATT','MED_DEF'].map(key=>{
      const plan=reference(referencePlayers,key);
      const distribution=referencePlayers.filter(p=>p.pos==='MED').map(p=>profile(p,referencePlayers,plan).score).filter(Number.isFinite);
      const ranked=[...distribution].sort((a,b)=>a-b);
      return [key,new Map(all.filter(p=>p.pos==='MED').map(p=>{const index=profile(p,referencePlayers,plan);return [p,{...index,kind:'index',rolePercentile:Number.isFinite(index.score)&&distribution.length>=5?rankedPercentile(index.score,ranked):null}];}))];
    }));
  }
  function midfieldRole(player,indices){
    if(player.pos!=='MED')return null;
    const attack=indices.get('MED_ATT')?.get(player)?.rolePercentile,defense=indices.get('MED_DEF')?.get(player)?.rolePercentile;
    if(!Number.isFinite(attack)||!Number.isFinite(defense))return null;
    return attack-defense>10?'MED_ATT':'MED_DEF';
  }
  function rankingEligible(record,profile,minimum){
    if(!profile||profile.comparableArea===null||!Number.isFinite(minimum)||minimum<0)return false;
    const team=profile.kind==='team',base=team?record.matches:record.minutes;
    if(!Number.isFinite(base)||base<minimum)return false;
    return profile.axes.every(a=>{
      const ctx=metrics.context(profile.scoreRecord||record,a.key,axes[a.key]?.[1]),minutes=ctx&&Object.hasOwn(ctx,'minutes')?ctx.minutes:record.minutes,matches=ctx&&Object.hasOwn(ctx,'matches')?ctx.matches:record.matches;
      return team?Number.isFinite(matches)&&matches>=minimum:Number.isFinite(minutes)?minutes>=minimum:record.pos==='POR'&&minimum<=minimumScoreMinutes&&Number.isFinite(matches)&&matches>=2;
    });
  }
  const axis=key=>axes[key]?{label:axes[key][0],unit:axes[key][1],lowerBetter:!!axes[key][2]}:null;
  // Exact additive decomposition of the current polygon + attack formula.
  // Split each polygon edge equally between its two adjacent axes.
  function scoreSectors(profile){
    if(!Number.isFinite(profile?.score)||profile.kind==='team')return [];
    const axes=profile.axes,n=axes.length;
    if(n<3||axes.some(a=>!Number.isFinite(a.percentile)))return [];
    const factor=Number.isFinite(profile.fairPlay?.factor)?profile.fairPlay.factor:1;
    const weight=(1-(profile.attack?.usedWeight||0))/n;
    const entries=axes.map((a,i)=>{
      const r=a.percentile/100,previous=axes[(i+n-1)%n].percentile/100,next=axes[(i+1)%n].percentile/100;
      return {key:a.key,label:a.label,weight,performance:r*(previous+next)/2*factor,percentile:a.percentile,joint:true};
    });
    for(const a of profile.attack?.entries||[])if(a.weight>0&&Number.isFinite(a.percentile))entries.push({key:a.key,label:axis(a.key).label,weight:a.weight,performance:(a.percentile/100)**2*factor,percentile:a.percentile,joint:false});
    return entries.map(a=>({...a,contribution:a.weight*a.performance}));
  }
  function explain(profile){
    if(profile?.identityConflict)return 'Score pendiente: el mismo ID tiene posiciones de portero y jugador de campo incompatibles entre fuentes.';
    if(!profile)return 'No hay una referencia suficiente para calcular el score.';
    if(profile.kind==='team')return Number.isFinite(profile.score)?'Score ponderado de sus jugadores con minutos suficientes; faltan posiciones para dibujar el radar completo.':'Faltan scores de jugadores con minutos positivos para ponderar este equipo.';
    if(profile.score!==null&&Number.isFinite(profile.score))return 'Score completo de '+profile.profileLabel+'. Los ceros publicados cuentan como valores válidos.';
    const parts=[];
    if(profile.baseSampleEnough===false)parts.push('La muestra del jugador no alcanza el mínimo de '+profile.minimumMinutes+' min');
    if(profile.missingAxes?.length)parts.push('Faltan métricas publicadas: '+profile.missingAxes.map(k=>axis(k)?.label||k).join(', '));
    if(profile.insufficientSamples?.length)parts.push('Muestra insuficiente por métrica (mínimo '+profile.minimumMinutes+' min): '+profile.insufficientSamples.map(a=>(axis(a.key)?.label||a.key)+(a.source?' · '+a.source:'')+' · '+(a.minutes===null?'sin minutos':a.minutes+' min')).join('; '));
    if((profile.expectedAxes?.length||0)<3)parts.push('No hay al menos tres ejes con cinco referencias suficientes');
    return (parts.join('. ')||'Faltan métricas o muestra suficiente de su posición')+'. Los ceros reales sí se incluyen; un dato ausente no se sustituye por cero.';
  }
  const api = {scoreSectors,attackKeys,attackWeights,profile,profiles,midfieldIndices,midfieldRole,percentile,relativeArea,rankingDefinitions,definition,rankingEligible,axis,explain,minimumScoreMinutes};
  if (typeof module === 'object' && module.exports) module.exports = api; else root.GradaRadar = api;
})(typeof window === 'object' ? window : globalThis);
