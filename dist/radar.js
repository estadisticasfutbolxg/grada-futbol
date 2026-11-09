(function(root) {
  'use strict';
  const metrics = typeof module === 'object' && module.exports ? require('./metrics.js') : root.GradaMetrics;
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
    POR:['savepct','savesPerMatch','concededPerMatch','psxgEfficiency','prevented','highClaims','sweeperActions','cleanPerMatch','longBallsPer90','accuracy','completedPer90','passes'],
    MED_DEF:['completedPer90','accuracy','recoveries','tackles','interceptions','lineBreakingPasses'],
    MED_ATT:['xa','chancesCreated','bigChancesCreated','shotsOnTargetPer90','dribblesPer90','goals'],
  };
  const rankingDefinitions=[
    {key:'DEL',label:'Delanteros',position:'DEL',kind:'player',minimum:450},
    {key:'POR',label:'Porteros',position:'POR',kind:'player',minimum:180},
    {key:'DEF',label:'Defensas',position:'DEF',kind:'player',minimum:450},
    {key:'MED_DEF',label:'Centrocampistas · perfil defensivo',position:'MED',kind:'player',minimum:450},
    {key:'MED_ATT',label:'Centrocampistas · perfil ofensivo',position:'MED',kind:'player',minimum:450},
    {key:'TEAM_ATTACK',label:'Equipos · mejores ataques',kind:'team',minimum:5,aggregateProfile:'ATTACK'},
    {key:'TEAM_STRIKERS',label:'Equipos · mejor delantera',kind:'team',minimum:5,aggregateProfile:'DEL'},
    {key:'TEAM_DEFENSE',label:'Equipos · mejores defensas',kind:'team',minimum:5,aggregateProfile:'DEF'},
    {key:'TEAM_MED_ATT',label:'Equipos · centro del campo ofensivo',kind:'team',minimum:5,aggregateProfile:'MED_ATT'},
    {key:'TEAM_MED_DEF',label:'Equipos · centro del campo defensivo',kind:'team',minimum:5,aggregateProfile:'MED_DEF'},
    {key:'TEAM_OVERALL',label:'Equipos · rendimiento global',kind:'team',minimum:5}
  ];
  function definition(key){return rankingDefinitions.find(d=>d.key===key)||{key,label:key==='MED'?'Centrocampistas':key,position:key,kind:'player',minimum:450};}
  function percentile(value,reference,lowerBetter=false) {
    if (!Number.isFinite(value) || !reference.length) return null;
    const below = reference.filter(v=>v<value).length, equal = reference.filter(v=>v===value).length;
    const result = (below+equal/2)/reference.length*100;
    return lowerBetter ? 100-result : result;
  }
  function relativeArea(percentiles) {
    if(percentiles.length<3||percentiles.some(p=>!Number.isFinite(p)||p<0||p>100))return null;
    // Shoelace area / area of the regular polygon at P100. Equal angular gaps.
    return percentiles.reduce((sum,p,i)=>sum+p/100*(percentiles[(i+1)%percentiles.length]/100),0)/percentiles.length;
  }
  function reference(all,key) {
    const def=definition(key),position=def.position,minimum=def.minimum;
    if(def.kind==='team')throw new Error('Los scores de equipo se calculan con los scores de sus jugadores en GradaScores.');
    const samePosition = all.filter(p=>p.pos === position);
    function eligible(record,key) {
      if(!baseEligible(record,position,minimum))return false;
      const ctx = metrics.context(record,key);
      const minutes = ctx && Object.hasOwn(ctx,'minutes') ? ctx.minutes : record.minutes;
      const matches = ctx && Object.hasOwn(ctx,'matches') ? ctx.matches : record.matches;
      return Number.isFinite(minutes) ? minutes >= minimum : position === 'POR' && Number.isFinite(matches) && matches >= 2;
    }
    const candidates=priorities[key]||[],samples=new Map();
    for(const key of candidates){
      const values=samePosition.filter(p=>eligible(p,key)).map(p=>metrics.metric(p,key,axes[key][1])).filter(Number.isFinite);
      if(values.length>=5)samples.set(key,values);
    }
    return {definition:def,minimum,samples,keys:[...samples.keys()].filter(k=>!(position==='POR'&&samples.has('psxgEfficiency')&&k==='prevented')).slice(0,6),peerCount:samePosition.filter(p=>candidates.some(key=>eligible(p,key)&&Number.isFinite(metrics.metric(p,key,axes[key][1])))).length};
  }
  function baseEligible(record,position,minimum){return Number.isFinite(record.minutes)?record.minutes>=minimum:position==='POR'&&Number.isFinite(record.matches)&&record.matches>=2;}
  function profile(player,all,plan=reference(all,player.pos)) {
    const values=[];
    for(const key of plan.keys){
      const [label,unit,lower]=axes[key],value=metrics.metric(player,key,unit),sample=plan.samples.get(key);
      if(!Number.isFinite(value))continue;
      values.push({key,label,value,percentile:percentile(value,sample,lower),lowerBetter:!!lower,referenceCount:sample.length,source:metrics.context(player,key)?.source||null});
    }
    const visible=values.length>=3?values:[],area=relativeArea(visible.map(a=>a.percentile));
    const sampleEnough=baseEligible(player,player.pos,plan.minimum)&&values.every(a=>{
      const c=metrics.context(player,a.key),minutes=c&&Object.hasOwn(c,'minutes')?c.minutes:player.minutes,matches=c&&Object.hasOwn(c,'matches')?c.matches:player.matches;
      return Number.isFinite(minutes)?minutes>=plan.minimum:player.pos==='POR'&&Number.isFinite(matches)&&matches>=2;
    });
    const score=values.length===plan.keys.length&&sampleEnough?area:null;
    return {axes:visible,area,score,comparableArea:score,expectedAxes:plan.keys,missingAxes:plan.keys.filter(k=>!values.some(a=>a.key===k)),sampleEnough,minimumMinutes:plan.minimum,minimumMatches:null,kind:'player',profileKey:plan.definition.key,profileLabel:plan.definition.label,peerCount:plan.peerCount,availableAxes:values.length,
      referenceRule:player.pos==='POR'?'misma posición, mínimo 180 min o 2 PJ del proveedor de cada eje':'misma posición, mínimo 450 minutos'};
  }
  function profiles(all,{referencePlayers=all,kind='player'}={}){
    if(kind!=='player')throw new Error('Los equipos usan promedios de sus jugadores en GradaScores.');
    const plans=new Map([...new Set(all.map(p=>p.pos))].map(key=>[key,reference(referencePlayers,key)]));
    return new Map(all.map(p=>[p,profile(p,referencePlayers,plans.get(p.pos))]));
  }
  function midfieldIndices(all,{referencePlayers=all}={}){
    return new Map(['MED_ATT','MED_DEF'].map(key=>{
      const plan=reference(referencePlayers,key);
      return [key,new Map(all.filter(p=>p.pos==='MED').map(p=>[p,{...profile(p,referencePlayers,plan),kind:'index'}]))];
    }));
  }
  function midfieldRole(player,indices){
    if(player.pos!=='MED')return null;
    const attack=indices.get('MED_ATT')?.get(player)?.score,defense=indices.get('MED_DEF')?.get(player)?.score;
    if(!Number.isFinite(attack)||!Number.isFinite(defense))return null;
    return Math.abs(attack-defense)<1e-12?'MED_BALANCED':attack>defense?'MED_ATT':'MED_DEF';
  }
  function rankingEligible(record,profile,minimum){
    if(!profile||profile.comparableArea===null||!Number.isFinite(minimum)||minimum<0)return false;
    const team=profile.kind==='team',base=team?record.matches:record.minutes;
    if(Number.isFinite(base)?base<minimum:team||record.pos!=='POR'||minimum>180||!Number.isFinite(record.matches)||record.matches<2)return false;
    return profile.axes.every(a=>{
      const ctx=metrics.context(record,a.key),minutes=ctx&&Object.hasOwn(ctx,'minutes')?ctx.minutes:record.minutes,matches=ctx&&Object.hasOwn(ctx,'matches')?ctx.matches:record.matches;
      return team?Number.isFinite(matches)&&matches>=minimum:Number.isFinite(minutes)?minutes>=minimum:record.pos==='POR'&&minimum<=180&&Number.isFinite(matches)&&matches>=2;
    });
  }
  const axis=key=>axes[key]?{label:axes[key][0],unit:axes[key][1],lowerBetter:!!axes[key][2]}:null;
  const api = {profile,profiles,midfieldIndices,midfieldRole,percentile,relativeArea,rankingDefinitions,definition,rankingEligible,axis};
  if (typeof module === 'object' && module.exports) module.exports = api; else root.GradaRadar = api;
})(typeof window === 'object' ? window : globalThis);
