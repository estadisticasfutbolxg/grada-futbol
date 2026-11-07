(function(root) {
  'use strict';
  const metrics = typeof module === 'object' && module.exports ? require('./metrics.js') : root.GradaMetrics;
  const operators = {'>':(a,b)=>a>b,'>=':(a,b)=>a>=b,'<':(a,b)=>a<b,'<=':(a,b)=>a<=b};
  function matches(record,rules,getMetric=(p,k)=>metrics.metric(p,k,'total')) {
    return rules.every(rule=>{
      if (rule.value === '' || rule.value === null || rule.value === undefined) return true;
      const threshold = Number(rule.value), value = getMetric(record,rule.key);
      return Object.hasOwn(operators,rule.op) && Number.isFinite(threshold) && value !== null && operators[rule.op](value,threshold);
    });
  }
  function textMatches(record,query){
    const fold=value=>String(value??'').normalize('NFKD').replace(/\p{M}/gu,'').toLocaleLowerCase('es').replace(/\bracing\s+de\s+santander\b/g,'racing santander').replace(/\s+/g,' ').trim();
    return fold([record.name,record.team,record.league].filter(Boolean).join(' ')).includes(fold(query));
  }
  if (typeof module === 'object' && module.exports) module.exports = {matches,textMatches}; else root.GradaFilters = {matches,textMatches};
})(typeof window === 'object' ? window : globalThis);
