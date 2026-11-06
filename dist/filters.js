(function(root) {
  'use strict';
  const metrics = typeof module === 'object' && module.exports ? require('./metrics.js') : root.GradaMetrics;
  const operators = {'>':(a,b)=>a>b,'>=':(a,b)=>a>=b,'<':(a,b)=>a<b,'<=':(a,b)=>a<=b};
  function matches(record,rules) {
    return rules.every(rule=>{
      if (rule.value === '' || rule.value === null || rule.value === undefined) return true;
      const threshold = Number(rule.value), value = metrics.metric(record,rule.key,'total');
      return Object.hasOwn(operators,rule.op) && Number.isFinite(threshold) && value !== null && operators[rule.op](value,threshold);
    });
  }
  if (typeof module === 'object' && module.exports) module.exports = {matches}; else root.GradaFilters = {matches};
})(typeof window === 'object' ? window : globalThis);
