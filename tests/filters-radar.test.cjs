'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const filters=require('../dist/filters.js'),radar=require('../dist/radar.js');
test('numeric filters combine with AND, preserve zero, and exclude unknowns',()=>{
 const rules=[{key:'minutes',op:'>=',value:'500'},{key:'goals',op:'>',value:'3'}];
 assert(filters.matches({minutes:600,goals:4},rules));assert(!filters.matches({minutes:499,goals:4},rules));assert(!filters.matches({minutes:600,goals:3},rules));assert(!filters.matches({minutes:null,goals:9},rules));
 assert(filters.matches({goals:0},[{key:'goals',op:'<=',value:0}]));assert(!filters.matches({goals:null},[{key:'goals',op:'<=',value:0}]));
 assert(filters.matches({goals:12,xg:10},[{key:'goalsPerXg',op:'>=',value:1.2}]));assert(!filters.matches({goals:12},[{key:'goals',op:'toString',value:0}]));
});
test('percentiles handle ties and invert lower-is-better axes',()=>{
 assert.equal(radar.percentile(1,[0,1,1,2]),50);assert.equal(radar.percentile(0,[0,1,1,2],true),87.5);assert.equal(radar.percentile(null,[]),null);
});
test('radar needs three real axes and five same-position references',()=>{
 const p={id:1,pos:'DEL',minutes:900,goals:10,xg:8,xa:4,shots:30,keypasses:10,conversion:33};
 const peers=Array.from({length:5},(_,i)=>({...p,id:i}));
 const profile=radar.profile(p,[...peers,...Array.from({length:10},()=>({...p,pos:'POR',goals:100}))]);
 assert.equal(profile.axes.length,6);assert.equal(profile.peerCount,5);assert(profile.axes.every(a=>a.percentile===50));
 assert.equal(radar.profile(p,peers.slice(0,4)).axes.length,0);
 assert.equal(radar.profile({pos:'DEL',minutes:100},peers).axes.length,0);
});
test('keeper radar supports appearances when the source has no minutes',()=>{
 const peers=Array.from({length:6},(_,i)=>({id:i,pos:'POR',minutes:null,matches:3,saves:9,conceded:3,savepct:75}));
 const profile=radar.profile(peers[0],peers);assert.equal(profile.axes.length,3);assert(profile.axes.some(a=>a.key==='concededPerMatch'&&a.lowerBetter));
});

test('each radar reference axis uses its own provider coverage',()=>{
 const keepers=Array.from({length:6},(_,i)=>({id:i,pos:'POR',minutes:900,matches:10,saves:9,conceded:3,savepct:75,metricContexts:Object.fromEntries(['saves','conceded','savepct'].map(k=>[k,{source:'ESPN',minutes:null,matches:i===5?1:3}]))}));
 const profile=radar.profile(keepers[0],keepers);assert.equal(profile.axes.length,3);assert(profile.axes.every(a=>a.referenceCount===5));
});
