(function (root) {
  'use strict';
  const rates = new Set(['goals','assists','xg','xa','delta','passes','completed','shots','saves','conceded','xga','tackles','interceptions','keypasses','progressive']);
  const fixedRates = {xga90:'xga',conceded90:'conceded'};
  const ratios = {goalsPerXg:['goals','xg'],assistsPerXa:['assists','xa']};
  const perMatch = {xgaPerMatch:'xga',savesPerMatch:'saves',concededPerMatch:'conceded',cleanPerMatch:'clean'};
  const number = n => typeof n === 'number' && Number.isFinite(n);
  function ratio(numerator, denominator) {
    if (!number(numerator) || numerator < 0 || !number(denominator) || denominator <= 0) return null;
    const result = numerator / denominator;
    return number(result) ? result : null;
  }
  function per90(value, minutes) {
    return number(value) && number(minutes) && minutes > 0 ? value * 90 / minutes : null;
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
  function metric(record, key, unit = 'total') {
    if (Object.hasOwn(ratios,key)) {
      const [numerator,denominator] = ratios[key];
      if (record.metricContexts && record.metricContexts[numerator]?.source !== record.metricContexts[denominator]?.source) return null;
      return ratio(record[numerator],record[denominator]);
    }
    if (Object.hasOwn(perMatch,key)) return ratio(record[perMatch[key]],denominator(record,key,'matches'));
    if (fixedRates[key]) return per90(record[fixedRates[key]], denominator(record,key,'minutes'));
    const value = record[key];
    if (!number(value)) return null;
    return unit === '90' && rates.has(key) ? per90(value, denominator(record,key,'minutes')) : value;
  }
  const api = {metric,per90,ratio,rates,fixedRates,ratios,perMatch,number,context};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GradaMetrics = api;
})(typeof window === 'object' ? window : globalThis);
