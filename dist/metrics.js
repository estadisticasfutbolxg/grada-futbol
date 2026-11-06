(function (root) {
  'use strict';
  const rates = new Set(['goals','assists','xg','xa','delta','passes','completed','shots','saves','conceded','xga','tackles','interceptions','recoveries','keypasses','progressive','lineBreakingPasses','clearances','blocks','highClaims','sweeperActions','chancesCreated','bigChancesCreated','bigChancesMissed','yellowCards','redCards','penaltiesSaved','penaltiesFaced','xgot','prevented']);
  const fixedRates = {xga90:'xga',conceded90:'conceded',completedPer90:'completed'};
  const ratios = {goalsPerXg:['goals','xg'],assistsPerXa:['assists','xa']};
  const perMatch = {xgaPerMatch:'xga',savesPerMatch:'saves',concededPerMatch:'conceded',cleanPerMatch:'clean'};
  const number = n => typeof n === 'number' && Number.isFinite(n);
  function ratio(numerator, denominator) {
    if (!number(numerator) || numerator < 0 || !number(denominator) || denominator <= 0) return null;
    const result = numerator / denominator;
    return number(result) ? result : null;
  }
  function per90(value, minutes) {
    if(!number(value)||!number(minutes)||minutes<=0)return null;
    const result=value/minutes*90;return number(result)?result:null;
  }
  function context(record,key) {
    if (Object.hasOwn(ratios,key) && record.metricContexts) {
      const [a,b] = ratios[key];
      if (record.metricContexts[a]?.source !== record.metricContexts[b]?.source) return null;
    }
    const original = fixedRates[key] || perMatch[key] || (Object.hasOwn(ratios,key) ? ratios[key][0] : key);
    return record.metricContexts?.[original] || null;
  }
  function denominator(record,key,field) {
    const c = context(record,key);
    return c && Object.hasOwn(c,field) ? c[field] : record[field];
  }
  function normalized(record,key){
    const reported=context(record,key)?.reportedPer90;
    return number(reported)?reported:per90(record[key],denominator(record,key,'minutes'));
  }
  function metric(record, key, unit = 'total') {
    if (Object.hasOwn(ratios,key)) {
      const [numerator,denominator] = ratios[key];
      if (record.metricContexts && record.metricContexts[numerator]?.source !== record.metricContexts[denominator]?.source) return null;
      return ratio(record[numerator],record[denominator]);
    }
    if (Object.hasOwn(perMatch,key)) return ratio(record[perMatch[key]],denominator(record,key,'matches'));
    if (Object.hasOwn(fixedRates,key)) return normalized(record,fixedRates[key]);
    if(unit==='90'&&rates.has(key)) return normalized(record,key);
    const value = record[key];
    if (!number(value)) return null;
    return value;
  }
  const api = {metric,per90,ratio,rates,fixedRates,ratios,perMatch,number,context};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GradaMetrics = api;
})(typeof window === 'object' ? window : globalThis);
