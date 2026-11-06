'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const {metric,per90} = require('../dist/metrics.js');
test('goalkeeper rates preserve totals and are normalized once in both modes',()=>{
 const p={xga:12,conceded:8,minutes:720,savepct:75};
 for(const unit of ['total','90']) {
  assert.equal(metric(p,'xga90',unit),1.5);
  assert.equal(metric(p,'conceded90',unit),1);
  assert.equal(metric(p,'savepct',unit),75);
 }
 assert.equal(metric(p,'xga','total'),12);
 assert.equal(metric(p,'xga','90'),1.5);
});
test('zero goals are valid; missing values and invalid denominators are unavailable',()=>{
 assert.equal(per90(0,90),0);
 for(const minutes of [0,null,undefined,NaN,Infinity,-1,'90']) assert.equal(per90(2,minutes),null);
 for(const value of [null,undefined,NaN,Infinity,'2']) assert.equal(per90(value,90),null);
 assert.equal(metric({xga:null,minutes:90},'xga90'),null);
 assert.equal(metric({goals:2,minutes:null},'goals','90'),null);
});
test('finishing and assist ratios are factors independent of minutes and unit',()=>{
 const p={goals:12,xg:10,assists:6,xa:4,minutes:450};
 for(const unit of ['total','90']) {
  assert.equal(metric(p,'goalsPerXg',unit),1.2);
  assert.equal(metric(p,'assistsPerXa',unit),1.5);
 }
 assert.equal(metric({...p,minutes:null},'goalsPerXg','90'),1.2);
 assert.equal(metric({goals:0,xg:2},'goalsPerXg'),0);
 assert.equal(metric({assists:0,xa:2},'assistsPerXa'),0);
 for(const denominator of [0,null,undefined,NaN,Infinity,-2,'2']) {
  assert.equal(metric({goals:1,xg:denominator},'goalsPerXg'),null);
  assert.equal(metric({assists:1,xa:denominator},'assistsPerXa'),null);
 }
 assert.equal(metric({goals:null,xg:2},'goalsPerXg'),null);
 assert.equal(metric({goals:1e308,xg:1e-308},'goalsPerXg'),null);
});
test('keeper xGA per appearance uses keeper matches and stays different from per 90',()=>{
 const keeper={xga:3,matches:2,minutes:90};
 for(const unit of ['total','90']) assert.equal(metric(keeper,'xgaPerMatch',unit),1.5);
 assert.equal(metric(keeper,'xga90'),3);
 assert.equal(metric({xga:0,matches:2},'xgaPerMatch'),0);
 assert.equal(metric({xga:3,matches:0},'xgaPerMatch'),null);
 assert.equal(metric({xga:null,matches:10},'xgaPerMatch'),null);
 assert.equal(metric({xga:3,matches:null},'xgaPerMatch'),null);
 assert.equal(metric({xga:3,teamMatches:10},'xgaPerMatch'),null);
});
