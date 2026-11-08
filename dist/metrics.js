(function (root) {
  'use strict';
  const rates = new Set(['goals','assists','xg','xa','delta','passes','completed','shots','shotsOnTarget','saves','conceded','xga','tackles','interceptions','recoveries','keypasses','progressive','lineBreakingPasses','clearances','blocks','highClaims','sweeperActions','chancesCreated','bigChancesCreated','bigChancesMissed','yellowCards','redCards','penaltiesSaved','penaltiesFaced','xgot','prevented','psxg','xgaOnTarget']);
  const fixedRates = {xga90:'xga',conceded90:'conceded',completedPer90:'completed',psxg90:'psxg',xgaOnTarget90:'xgaOnTarget'};
  const ratios = {goalsPerXg:['goals','xg'],assistsPerXa:['assists','xa']};
  const perMatch = {psxgPerMatch:'psxg',xgaOnTargetPerMatch:'xgaOnTarget',xgaPerMatch:'xga',xgPerMatch:'xg',goalsPerMatch:'goals',pointsPerMatch:'points',bigChancesPerMatch:'bigChances',savesPerMatch:'saves',concededPerMatch:'conceded',cleanPerMatch:'clean'};
  const differences={goalDifferencePerMatch:['goals','conceded'],xgDifferencePerMatch:['xg','xga']};
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
    if(key==='psxgEfficiency')return record.metricContexts?.psxg||null;
    if(key==='shotsPer90'&&!number(record.shotsPer90))return record.metricContexts?.shots||null;
    if(Object.hasOwn(differences,key)){
      const [a,b]=differences[key],ca=record.metricContexts?.[a],cb=record.metricContexts?.[b];
      return ca&&cb&&ca.source===cb.source&&ca.matches===cb.matches?ca:null;
    }
    if (Object.hasOwn(ratios,key) && record.metricContexts) {
      const [a,b] = ratios[key];
      const ca=record.metricContexts[a],cb=record.metricContexts[b];if(!ca||!cb||ca.source!==cb.source||ca.minutes!==cb.minutes||ca.matches!==cb.matches)return null;
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
    if(key==='psxgEfficiency'){const c=context(record,key),expected=record.psxg,conceded=c?.pairedConceded;if(!number(expected)||expected<=0||!number(conceded)||conceded<0)return null;const value=(1-conceded/expected)*100;return number(value)?value:null;}
    if(key==='shotsPer90')return number(record.shotsPer90)?record.shotsPer90:normalized(record,'shots');
    if(Object.hasOwn(differences,key)){
      const [a,b]=differences[key],ctx=context(record,key),matches=ctx?ctx.matches:record.metricContexts?null:record.matches;
      if(!number(record[a])||!number(record[b])||!number(matches)||matches<=0)return null;
      const result=(record[a]-record[b])/matches;return number(result)?result:null;
    }
    if (Object.hasOwn(ratios,key)) {
      const [numerator,denominator] = ratios[key];
      if(record.metricContexts&&!context(record,key))return null;
      return ratio(record[numerator],record[denominator]);
    }
    if (Object.hasOwn(perMatch,key)) {const value=record[perMatch[key]],matches=denominator(record,key,'matches');if(key==='pointsPerMatch'&&number(value)&&number(matches)&&matches>0){const result=value/matches;return number(result)?result:null;}return ratio(value,matches);}
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
