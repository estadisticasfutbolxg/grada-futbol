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
