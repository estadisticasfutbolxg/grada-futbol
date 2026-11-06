'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {csvCell,sourceURL}=require('../dist/security.js');
test('CSV escapes formulas in source text while preserving negative numeric statistics',()=>{
 for(const v of ['=1+1','+SUM(A1:A2)','@SUM(A1)','-2+3','  =HYPERLINK("x")','\t=1']) assert(csvCell(v).startsWith('"\''));
 assert.equal(csvCell(-2.5),'"-2.5"');assert.equal(csvCell('Jordi "A"'),'"Jordi ""A"""');assert.equal(csvCell('Mbappé'),'"Mbappé"');
});
test('provider links cannot introduce executable or arbitrary URLs',()=>{
 assert.equal(sourceURL('javascript:alert(1)'),'#');
 assert.equal(sourceURL('Understat'),'https://understat.com/league/La_liga/2026');
});
