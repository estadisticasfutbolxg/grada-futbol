(function (root) {
  'use strict';
  const rates = new Set(['goals','assists','xg','xa','delta','passes','completed','shots','shotsOnTarget','saves','conceded','xga','tackles','interceptions','recoveries','keypasses','progressive','lineBreakingPasses','clearances','blocks','highClaims','sweeperActions','chancesCreated','bigChancesCreated','bigChancesMissed','yellowCards','redCards','penaltiesSaved','penaltiesFaced','xgot','prevented','psxg','xgaOnTarget']);
  const fixedRates = {goalsPer90:'goals',assistsPer90:'assists',savesPer90:'saves',xga90:'xga',conceded90:'conceded',completedPer90:'completed',psxg90:'psxg',xgaOnTarget90:'xgaOnTarget',goalInvolvementsPer90:'goalInvolvements',xgXaPer90:'expectedInvolvements',preventedPer90:'prevented'};
  const ratios = {goalsPerXg:['goals','xg'],assistsPerXa:['assists','xa'],xgPerShot:['xg','shots']};
  const sums={goalInvolvements:['goals','assists'],expectedInvolvements:['xg','xa']};
  for(const key of Object.keys(sums))rates.add(key);
  const perMatch = {psxgPerMatch:'psxg',xgaOnTargetPerMatch:'xgaOnTarget',xgaPerMatch:'xga',xgPerMatch:'xg',goalsPerMatch:'goals',pointsPerMatch:'points',bigChancesPerMatch:'bigChances',savesPerMatch:'saves',concededPerMatch:'conceded',cleanPerMatch:'clean'};
  const differences={goalDifferencePerMatch:['goals','conceded'],xgDifferencePerMatch:['xg','xga']};
  const number = n => typeof n === 'number' && Number.isFinite(n);
  function sameSample(a,b){
    if(!a||!b||!a.source||a.source!==b.source||a.minutes!==b.minutes||a.matches!==b.matches||a.league_key&&b.league_key&&a.league_key!==b.league_key)return false;
    return !(a.sample_id||b.sample_id)||a.sample_id===b.sample_id;
  }
  function pair(record,a,b,derived){
    let first=record.metricContexts?.[a],second=record.metricContexts?.[b],left=record[a],right=record[b],fromRecord=false;
    if(!sameSample(first,second)){
      // A refreshed goal total may differ from the preferred xG/shot sample.
      // Use both components of that goal provider's original record; never
      // divide its new goals by a denominator from another provider or sample.
      const goal=record.metricContexts?.goals,source=goal?.source,raw=record.sourceRecords?.[source];
      if(![a,b].includes('goals')||goal?.selection?.method!=='goal_sample_freshness_v1'||!raw||raw.goals!==record.goals)return null;
      const nominal=goal.minutes_derived==='team_nominal_90'&&!Object.hasOwn(raw,'team_id')&&Number.isInteger(raw.matches),minutes=raw.minutes??(nominal?raw.matches*90:null);
      const original=key=>raw.metricContexts?.[key]||(!goal.profileVerified&&raw.matches===goal.matches&&minutes===goal.minutes?{source,captured_at:goal.captured_at,matches:raw.matches,minutes,...(nominal?{minutes_derived:'team_nominal_90'}:{}),...(goal.league_key?{league_key:goal.league_key}:{})}:null);
      first=original(a);second=original(b);left=raw[a];right=raw[b];
      if(!number(left)||!number(right)||!sameSample(first,second)||!sameSample(first,goal))return null;
      fromRecord=true;
    }
    const c={...first,reportedValue:false,derived,components:[a,b],componentCaptures:{[a]:first.captured_at||null,[b]:second.captured_at||null}};delete c.reportedPer90;delete c.rateContext;
    if(fromRecord){c.fromSourceRecord=true;c.componentValues={[a]:left,[b]:right};}
    return {first:left,second:right,context:c};
  }
  function componentContext(record,a,b,derived){
    return pair(record,a,b,derived)?.context||null;
  }
  function ratio(numerator, denominator) {
    if (!number(numerator) || numerator < 0 || !number(denominator) || denominator <= 0) return null;
    const result = numerator / denominator;
    return number(result) ? result : null;
  }
  function per90(value, minutes) {
    if(!number(value)||!number(minutes)||minutes<=0)return null;
    const result=value/minutes*90;return number(result)?result:null;
  }
  function context(record,key,unit='total') {
    const direct=record.metricContexts?.[key];
    if(unit==='90'&&direct?.rateContext)return direct.rateContext;
    if(Object.hasOwn(fixedRates,key)&&!direct?.aggregation&&record.metricContexts?.[fixedRates[key]]?.rateContext)return record.metricContexts[fixedRates[key]].rateContext;
    if(record.metricContexts?.[key]?.aggregation)return record.metricContexts[key];
    if(key==='savesPer90'&&record.metricContexts?.savesPer90)return record.metricContexts.savesPer90;
    if(key==='psxgEfficiency')return record.metricContexts?.psxg||null;
    if(key==='shotsPer90'&&!number(record.shotsPer90))return record.metricContexts?.shots||null;
    if(Object.hasOwn(differences,key)){
      const [a,b]=differences[key];return componentContext(record,a,b,'difference_per_match');
    }
    if (Object.hasOwn(ratios,key) && record.metricContexts) {
      const [a,b] = ratios[key];return componentContext(record,a,b,'ratio');
    }
    const original = fixedRates[key] || perMatch[key] || (Object.hasOwn(ratios,key) ? ratios[key][0] : key);
    if(Object.hasOwn(sums,original)){
      const [a,b]=sums[original];return componentContext(record,a,b,'sum');
    }
    return record.metricContexts?.[original] || null;
  }
  function denominator(record,key,field) {
    const c = context(record,key);
    return c && Object.hasOwn(c,field) ? c[field] : record[field];
  }
  function normalized(record,key){
    if(Object.hasOwn(sums,key)&&record.metricContexts&&!context(record,key))return null;
    const sample=context(record,key,'90'),reported=sample?.reportedPer90;
    return number(reported)?reported:per90(Object.hasOwn(sums,key)?metric(record,key):record[key],sample&&Object.hasOwn(sample,'minutes')?sample.minutes:record.minutes);
  }
  function metric(record, key, unit = 'total') {
    if(Object.hasOwn(fixedRates,key)&&record.metricContexts?.[key]?.aggregation&&number(record[key]))return record[key];
    if(key==='savesPer90'&&number(record.savesPer90))return record.savesPer90;
    if(key==='psxgEfficiency'){const c=context(record,key),expected=record.psxg,conceded=c?.pairedConceded;if(!number(expected)||expected<=0||!number(conceded)||conceded<0)return null;const value=(1-conceded/expected)*100;return number(value)?value:null;}
    if(key==='shotsPer90')return number(record.shotsPer90)?record.shotsPer90:normalized(record,'shots');
    if(Object.hasOwn(differences,key)){
      const [a,b]=differences[key],ctx=context(record,key),matches=ctx?ctx.matches:record.metricContexts?null:record.matches;
      const first=ctx?.componentValues?.[a]??record[a],second=ctx?.componentValues?.[b]??record[b];
      if(!number(first)||!number(second)||!number(matches)||matches<=0)return null;
      const result=(first-second)/matches;return number(result)?result:null;
    }
    if (Object.hasOwn(ratios,key)) {
      const [numerator,denominator] = ratios[key];
      const ctx=context(record,key);if(record.metricContexts&&!ctx)return null;
      return ratio(ctx?.componentValues?.[numerator]??record[numerator],ctx?.componentValues?.[denominator]??record[denominator]);
    }
    if(Object.hasOwn(sums,key)){
      const ctx=context(record,key);if(record.metricContexts&&!ctx)return null;
      const [a,b]=sums[key],first=ctx?.componentValues?.[a]??record[a],second=ctx?.componentValues?.[b]??record[b],value=number(first)&&first>=0&&number(second)&&second>=0?first+second:null,sum=number(value)?value:null;return unit==='90'?per90(sum,denominator(record,key,'minutes')):sum;
    }
    if (Object.hasOwn(perMatch,key)) {const value=record[perMatch[key]],matches=denominator(record,key,'matches');if(key==='pointsPerMatch'&&number(value)&&number(matches)&&matches>0){const result=value/matches;return number(result)?result:null;}return ratio(value,matches);}
    if (Object.hasOwn(fixedRates,key)) return normalized(record,fixedRates[key]);
    if(unit==='90'&&rates.has(key)) return normalized(record,key);
    const value = record[key];
    if (!number(value)) return null;
    return value;
  }
  function total(records,key){
    const known=records.filter(record=>number(record[key]));
    return {value:known.length?known.reduce((sum,record)=>sum+record[key],0):null,known:known.length,total:records.length,complete:records.length>0&&known.length===records.length&&known.every(record=>{const coverage=record.metricContexts?.[key]?.coverage;return !coverage||coverage.known===coverage.total;})};
  }
  const api = {metric,per90,ratio,rates,fixedRates,ratios,sums,differences,perMatch,number,context,total,sameSample,pair};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GradaMetrics = api;
})(typeof window === 'object' ? window : globalThis);
