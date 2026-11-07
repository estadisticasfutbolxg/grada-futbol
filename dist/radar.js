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
    passes:['Pases /90','90'],accuracy:['Pases completados %','total'],savepct:['Paradas %','total'],savesPerMatch:['Paradas /PJ','total'],
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
    POR:['savepct','savesPerMatch','concededPerMatch','prevented','highClaims','sweeperActions','cleanPerMatch','longBallsPer90','accuracy','completedPer90','passes'],
    MED_DEF:['completedPer90','accuracy','recoveries','tackles','interceptions','lineBreakingPasses'],
    MED_ATT:['xa','chancesCreated','bigChancesCreated','shotsOnTargetPer90','dribblesPer90','goals'],
    TEAM_ATTACK:['goalsPerMatch','xgPerMatch','shotsOnTargetPerMatch','bigChancesPerMatch','goalsPerXg'],
    TEAM_DEFENSE:['concededPerMatch','xgaPerMatch','cleanPerMatch'],
    TEAM_OVERALL:['pointsPerMatch','goalDifferencePerMatch','xgDifferencePerMatch','goalsPerMatch','concededPerMatch','cleanPerMatch']
  };
  const rankingDefinitions=[
    {key:'DEL',label:'Delanteros',position:'DEL',kind:'player',minimum:450},
    {key:'POR',label:'Porteros',position:'POR',kind:'player',minimum:180},
    {key:'DEF',label:'Defensas',position:'DEF',kind:'player',minimum:450},
    {key:'MED_DEF',label:'Centrocampistas · perfil defensivo',position:'MED',kind:'player',minimum:450},
    {key:'MED_ATT',label:'Centrocampistas · perfil ofensivo',position:'MED',kind:'player',minimum:450},
    {key:'TEAM_ATTACK',label:'Equipos · mejores ataques',kind:'team',minimum:5},
    {key:'TEAM_DEFENSE',label:'Equipos · mejores defensas',kind:'team',minimum:5},
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
    const def=definition(key),position=def.position,minimum=def.minimum,team=def.kind==='team';
    const samePosition = team?all:all.filter(p=>p.pos === position);
    function eligible(record,key) {
      const ctx = metrics.context(record,key);
      const minutes = ctx && Object.hasOwn(ctx,'minutes') ? ctx.minutes : record.minutes;
      const matches = ctx && Object.hasOwn(ctx,'matches') ? ctx.matches : record.matches;
      if(team)return Number.isFinite(matches)&&matches>=minimum;
      return Number.isFinite(minutes) ? minutes >= minimum : position === 'POR' && Number.isFinite(matches) && matches >= 2;
    }
    const candidates=priorities[key]||[],samples=new Map();
    for(const key of candidates){
      const values=samePosition.filter(p=>eligible(p,key)).map(p=>metrics.metric(p,key,axes[key][1])).filter(Number.isFinite);
      if(values.length>=5)samples.set(key,values);
    }
    return {definition:def,minimum,samples,keys:[...samples.keys()].slice(0,6),peerCount:samePosition.filter(p=>candidates.some(key=>eligible(p,key)&&Number.isFinite(metrics.metric(p,key,axes[key][1])))).length};
  }
  function profile(player,all,plan=reference(all,player.pos)) {
    const values=[];
    for(const key of plan.keys){
      const [label,unit,lower]=axes[key],value=metrics.metric(player,key,unit),sample=plan.samples.get(key);
      if(!Number.isFinite(value))continue;
      values.push({key,label,value,percentile:percentile(value,sample,lower),lowerBetter:!!lower,referenceCount:sample.length,source:metrics.context(player,key)?.source||null});
    }
    const visible=values.length>=3?values:[],area=relativeArea(visible.map(a=>a.percentile));
    return {axes:visible,area,comparableArea:values.length===plan.keys.length?area:null,expectedAxes:plan.keys,missingAxes:plan.keys.filter(k=>!values.some(a=>a.key===k)),minimumMinutes:plan.definition.kind==='team'?null:plan.minimum,minimumMatches:plan.definition.kind==='team'?plan.minimum:null,kind:plan.definition.kind,profileKey:plan.definition.key,profileLabel:plan.definition.label,peerCount:plan.peerCount,availableAxes:values.length,
      referenceRule:plan.definition.kind==='team'?'equipos del ámbito seleccionado, mínimo 5 PJ de la fuente de cada eje':player.pos==='POR'?'misma posición, mínimo 180 min o 2 PJ del proveedor de cada eje':'misma posición y perfil, mínimo 450 minutos'};
  }
  function profiles(all,{profileKey=null,kind='player'}={}){
    const keyFor=p=>kind==='team'?(profileKey||'TEAM_OVERALL'):profileKey&&definition(profileKey).position===p.pos?profileKey:p.pos;
    const plans=new Map([...new Set(all.map(keyFor))].map(key=>[key,reference(all,key)]));
    return new Map(all.map(p=>[p,profile(p,all,plans.get(keyFor(p)))]));
  }
  function rankingEligible(record,profile,minimum){
    if(!profile||profile.comparableArea===null||!Number.isFinite(minimum)||minimum<0)return false;
    const team=profile.kind==='team',base=team?record.matches:record.minutes;
    if(!Number.isFinite(base)||base<minimum)return false;
    return profile.axes.every(a=>{
      const ctx=metrics.context(record,a.key),minutes=ctx&&Object.hasOwn(ctx,'minutes')?ctx.minutes:record.minutes,matches=ctx&&Object.hasOwn(ctx,'matches')?ctx.matches:record.matches;
      return team?Number.isFinite(matches)&&matches>=minimum:Number.isFinite(minutes)?minutes>=minimum:record.pos==='POR'&&Number.isFinite(matches)&&matches>=2;
    });
  }
  const axis=key=>axes[key]?{label:axes[key][0],unit:axes[key][1],lowerBetter:!!axes[key][2]}:null;
  const api = {profile,profiles,percentile,relativeArea,rankingDefinitions,definition,rankingEligible,axis};
  if (typeof module === 'object' && module.exports) module.exports = api; else root.GradaRadar = api;
})(typeof window === 'object' ? window : globalThis);
