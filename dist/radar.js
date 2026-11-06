(function(root) {
  'use strict';
  const metrics = typeof module === 'object' && module.exports ? require('./metrics.js') : root.GradaMetrics;
  const axes = {
    goals:['Goles /90','90'],xg:['xG /90','90'],xa:['xA /90','90'],shots:['Tiros /90','90'],assists:['Asistencias /90','90'],keypasses:['Pases clave /90','90'],
    conversion:['Conversión %','total'],tackles:['Entradas /90','90'],interceptions:['Intercepciones /90','90'],progressive:['Pases progresivos /90','90'],
    passes:['Pases /90','90'],accuracy:['Pases completados %','total'],savepct:['Paradas %','total'],savesPerMatch:['Paradas /PJ','total'],
    concededPerMatch:['Goles recibidos /PJ','total',true],cleanPerMatch:['Porterías a cero /PJ','total']
  };
  const priorities = {
    DEL:['goals','xg','xa','shots','keypasses','conversion'],
    MED:['xa','keypasses','assists','accuracy','progressive','passes','xg','goals','shots'],
    DEF:['tackles','interceptions','progressive','accuracy','passes','keypasses','xa','assists','shots','xg','goals'],
    POR:['savepct','savesPerMatch','concededPerMatch','accuracy','cleanPerMatch','passes']
  };
  function percentile(value,reference,lowerBetter=false) {
    if (!Number.isFinite(value) || !reference.length) return null;
    const below = reference.filter(v=>v<value).length, equal = reference.filter(v=>v===value).length;
    const result = (below+equal/2)/reference.length*100;
    return lowerBetter ? 100-result : result;
  }
  function profile(player,all) {
    const minimum = player.pos === 'POR' ? 180 : 450;
    const samePosition = all.filter(p=>p.pos === player.pos);
    function eligible(record,key) {
      const ctx = metrics.context(record,key);
      const minutes = ctx && Object.hasOwn(ctx,'minutes') ? ctx.minutes : record.minutes;
      const matches = ctx && Object.hasOwn(ctx,'matches') ? ctx.matches : record.matches;
      return Number.isFinite(minutes) ? minutes >= minimum : player.pos === 'POR' && Number.isFinite(matches) && matches >= 2;
    }
    const peers = samePosition.filter(p=>(priorities[player.pos] || []).some(key=>eligible(p,key) && Number.isFinite(metrics.metric(p,key,axes[key][1]))));
    const values = [];
    for (const key of priorities[player.pos] || []) {
      const [label,unit,lower] = axes[key], value = metrics.metric(player,key,unit);
      const reference = peers.filter(p=>eligible(p,key)).map(p=>metrics.metric(p,key,unit)).filter(Number.isFinite);
      if (!Number.isFinite(value) || reference.length < 5) continue;
      values.push({key,label,value,percentile:percentile(value,reference,lower),lowerBetter:!!lower,referenceCount:reference.length,source:metrics.context(player,key)?.source || null});
      if (values.length === 6) break;
    }
    return {axes:values.length>=3?values:[],minimumMinutes:minimum,peerCount:peers.length,availableAxes:values.length,referenceRule:player.pos === 'POR'?'misma posición, mínimo 180 min o 2 PJ del proveedor de cada eje':'misma posición, mínimo 450 minutos'};
  }
  const api = {profile,percentile};
  if (typeof module === 'object' && module.exports) module.exports = api; else root.GradaRadar = api;
})(typeof window === 'object' ? window : globalThis);
