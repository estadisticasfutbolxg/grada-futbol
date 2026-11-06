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
    concededPerMatch:['Goles recibidos /PJ','total',true],cleanPerMatch:['Porterías a cero /PJ','total']
  };
  const priorities = {
    DEL:['goals','xg','shotsOnTargetPer90','xa','dribblesPer90','conversion','shots','keypasses'],
    MED:['completedPer90','accuracy','xa','recoveries','tackles','interceptions','keypasses','assists','progressive','passes','xg','goals','shots'],
    DEF:['tackles','interceptions','clearances','blocks','recoveries','completedPer90','accuracy','progressive','passes'],
    POR:['savepct','savesPerMatch','concededPerMatch','prevented','highClaims','sweeperActions','cleanPerMatch','longBallsPer90','accuracy','completedPer90','passes']
  };
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
  function reference(all,position) {
    const minimum = position === 'POR' ? 180 : 450;
    const samePosition = all.filter(p=>p.pos === position);
    function eligible(record,key) {
      const ctx = metrics.context(record,key);
      const minutes = ctx && Object.hasOwn(ctx,'minutes') ? ctx.minutes : record.minutes;
      const matches = ctx && Object.hasOwn(ctx,'matches') ? ctx.matches : record.matches;
      return Number.isFinite(minutes) ? minutes >= minimum : position === 'POR' && Number.isFinite(matches) && matches >= 2;
    }
    const candidates=priorities[position]||[],samples=new Map();
    for(const key of candidates){
      const values=samePosition.filter(p=>eligible(p,key)).map(p=>metrics.metric(p,key,axes[key][1])).filter(Number.isFinite);
      if(values.length>=5)samples.set(key,values);
    }
    return {minimum,samples,keys:[...samples.keys()].slice(0,6),peerCount:samePosition.filter(p=>candidates.some(key=>eligible(p,key)&&Number.isFinite(metrics.metric(p,key,axes[key][1])))).length};
  }
  function profile(player,all,plan=reference(all,player.pos)) {
    const values=[];
    for(const key of plan.keys){
      const [label,unit,lower]=axes[key],value=metrics.metric(player,key,unit),sample=plan.samples.get(key);
      if(!Number.isFinite(value))continue;
      values.push({key,label,value,percentile:percentile(value,sample,lower),lowerBetter:!!lower,referenceCount:sample.length,source:metrics.context(player,key)?.source||null});
    }
    const visible=values.length>=3?values:[],area=relativeArea(visible.map(a=>a.percentile));
    return {axes:visible,area,comparableArea:values.length===plan.keys.length?area:null,expectedAxes:plan.keys,minimumMinutes:plan.minimum,peerCount:plan.peerCount,availableAxes:values.length,
      referenceRule:player.pos==='POR'?'misma posición, mínimo 180 min o 2 PJ del proveedor de cada eje':'misma posición, mínimo 450 minutos'};
  }
  function profiles(all){
    const plans=new Map([...new Set(all.map(p=>p.pos))].map(pos=>[pos,reference(all,pos)]));
    return new Map(all.map(p=>[p,profile(p,all,plans.get(p.pos))]));
  }
  const api = {profile,profiles,percentile,relativeArea};
  if (typeof module === 'object' && module.exports) module.exports = api; else root.GradaRadar = api;
})(typeof window === 'object' ? window : globalThis);
