'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),forms=require('../dist/formations.js');
let nextId=0;
function row(pos,codes,score=.5,profile=null,minutes=300){const id=String(++nextId);return {person:id,score,midfieldProfile:profile,codes,player:{id,name:'Isolated '+id,pos,minutes,tacticalPositions:codes,tacticalContext:{source:'FotMob',identityVerified:true,player_id:id,team_id:'1',captured_at:'2026-11-14T12:00:00Z'},team_id:'1'}};}
const gk=()=>row('POR',['GK']),back4=()=>[row('DEF',['LB']),row('DEF',['CB']),row('DEF',['CB']),row('DEF',['RB'])],dm=()=>row('MED',['CDM'],.5,'MED_DEF'),cm=()=>row('MED',['CM'],.5,'MED_DEF'),creative=()=>row('MED',['CM','CAM'],.5,'MED_ATT'),am=()=>row('MED',['CAM'],.5,'MED_ATT'),st=()=>row('DEL',['ST']),wings=()=>[row('DEL',['LW']),row('DEL',['RW'])];
const back3=()=>[row('DEF',['CB']),row('DEF',['CB']),row('DEF',['CB']),row('DEF',['LWB']),row('DEF',['RWB'])];
test('all seven systems can be chosen from a fitting pool, with one anchor, creativity, real striker and unique people',()=>{
 const samples={
  '4-3-3':[gk(),...back4(),dm(),cm(),creative(),...wings(),st()],
  '4-2-3-1':[gk(),...back4(),dm(),cm(),am(),...wings(),st()],
  '4-4-2':[gk(),...back4(),dm(),creative(),...wings(),st(),st()],
  '4-3-1-2':[gk(),...back4(),dm(),cm(),cm(),am(),st(),st()],
  '3-5-2':[gk(),...back3(),dm(),cm(),creative(),st(),st()],
  '3-4-2-1':[gk(),...back3(),dm(),cm(),am(),am(),st()],
  '4-2-2-2':[gk(),...back4(),dm(),cm(),am(),am(),st(),st()]
 };
 for(const [key,pool]of Object.entries(samples)){
  const p=forms.propose(pool);assert(p.complete,key);assert.equal(p.formation,key);assert.equal(p.selected,11);assert.equal(new Set(p.slots.map(s=>s.candidate.person)).size,11);
  assert(p.slots.some(s=>s.role==='HOLD'&&s.candidate));assert(p.slots.some(s=>['AM','CREATE'].includes(s.role)&&s.candidate));assert(p.slots.some(s=>s.role==='ST'&&s.candidate));
  for(const s of p.slots)assert(forms.evidence(s.candidate,s.role));assert.equal(p.score,.5);
 }
});
test('a winger is never a centre forward and four attacking midfielders cannot replace an anchor or fullbacks',()=>{
 const winger=row('DEL',['RW'],.99),attacker=row('MED',['CAM','CM'],.99,'MED_ATT');assert.equal(forms.evidence(winger,'ST'),null);assert.equal(forms.evidence(winger,'LW'),null);assert.equal(forms.evidence(attacker,'HOLD'),null);assert.equal(forms.evidence(attacker,'LB'),null);
 const p=forms.propose([gk(),...back4(),creative(),am(),am(),am(),...wings(),st()]);assert(!p.complete);assert.equal(p.score,null);assert(p.slots.some(s=>s.role==='HOLD'&&!s.candidate));
 assert(forms.evidence(row('MED',['CM'],.5,'MED_DEF'),'HOLD').includes('encaje teórico'));assert.equal(forms.evidence(row('MED',[],.5,'MED_DEF'),'HOLD'),null);
});
test('assignment handles versatile defenders without a greedy dead end and prioritizes filling even a zero score',()=>{
 const pool=[row('DEF',['LB','CB'],.9),row('DEF',['LB'],.8),row('DEF',['CB'],.7),row('DEF',['RB'],0)],slots=forms.templates[0].slots.filter(s=>s.pos==='DEF'),picked=forms.assign(pool,slots);
 assert(picked.every(s=>s.candidate));assert.equal(picked.find(s=>s.role==='LB').candidate.person,pool[1].person);assert.equal(new Set(picked.map(s=>s.candidate.person)).size,4);assert.equal(picked.find(s=>s.role==='RB').candidate.score,0);
});
test('matching agrees with independent exhaustive search across changing role/score combinations',()=>{
 const slots=forms.templates[0].slots.filter(s=>s.pos==='DEF');
 for(let seed=1;seed<=30;seed++){
  const pool=[['LB','CB'],['LB'],['CB'],['RB','CB'],['CB'],['RB']].map((codes,i)=>row('DEF',codes,((seed*(i+7)*13)%101)/100));let maximum=-1;
  function search(index,used,total){if(index===slots.length){maximum=Math.max(maximum,total);return;}for(let i=0;i<pool.length;i++)if(!used.has(i)&&forms.evidence(pool[i],slots[index].role)){used.add(i);search(index+1,used,total+pool[i].score);used.delete(i);}}
  search(0,new Set(),0);const picked=forms.assign(pool,slots),total=picked.reduce((s,x)=>s+x.candidate.score,0);assert(Math.abs(total-maximum)<1e-12);
 }
});
test('stronger players are retained and all eleven have equal weight despite different minutes',()=>{
 const strong=row('POR',['GK'],.4,null,900),weak=row('POR',['GK'],.1,null,200),pool=[strong,weak,...back4(),dm(),cm(),creative(),...wings(),st()];for(const p of pool)if(p.player.pos!=='POR')p.score=.9;
 const p=forms.propose(pool);assert(p.complete);assert.equal(p.slots.find(s=>s.role==='GK').candidate.person,strong.person);
 const chosen=p.slots.map(s=>s.candidate),expected=chosen.reduce((s,r)=>s+r.score,0)/11;assert.equal(p.score,expected);
});
test('within the same selected XI, defensive profile anchors and attacking profile creates; score and identities stay fixed',()=>{
 const anchor=row('MED',['CDM','CM'],.8,'MED_DEF'),support=row('MED',['CDM','CM'],.7,null),maker=creative(),pool=[gk(),...back4(),anchor,support,maker,...wings(),st()],before=JSON.stringify(pool),p=forms.propose(pool);
 assert(p.complete);assert.equal(p.slots.find(s=>s.role==='HOLD').candidate.person,anchor.person);assert.equal(p.slots.find(s=>s.role==='CREATE').candidate.person,maker.person);assert.equal(JSON.stringify(pool),before);
 const reversed=forms.propose([...pool].reverse());assert.equal(reversed.formation,p.formation);assert.deepEqual(reversed.slots.map(s=>s.candidate.person),p.slots.map(s=>s.candidate.person));
 const complete=p.alternatives.filter(a=>a.complete);assert(p.score>=Math.max(...complete.map(a=>a.score))-1e-12);
});

test('minutes cannot change equal-score identities or the preferred system while the same records stay eligible',()=>{
 const pool=[gk(),...back4(),dm(),cm(),creative(),...wings(),st(),st(),am(),row('DEF',['CB'])],before=forms.propose(pool);
 for(let i=0;i<pool.length;i++)pool[i].player.minutes=200+(pool.length-i)*799;
 const after=forms.propose(pool);assert.equal(after.score,before.score);assert.equal(after.formation,before.formation);assert.deepEqual(after.slots.map(s=>s.candidate.person),before.slots.map(s=>s.candidate.person));
 for(const a of after.alternatives)if(a.complete)assert(Math.abs(a.score-a.quality/11)<1e-12);
 assert(after.score>=Math.max(...after.alternatives.filter(a=>a.complete).map(a=>a.score))-1e-12);
});
