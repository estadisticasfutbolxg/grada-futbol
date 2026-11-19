'use strict';
// Isolated, deterministic records for UI/model invariants; never published.
function fixture(){
 const players=['POR','DEF','MED','DEL'].flatMap(pos=>Array.from({length:8},(_,i)=>({id:pos+i,name:pos+i,team_id:i<4?'1':'2',team:i<4?'One':'Two',pos,minutes:600+i*50,matches:10,goals:i+1,xg:i+2,xa:i+1,shots:10+i,conversion:10+i,shotsOnTargetPer90:1+i/10,dribblesPer90:i+1,completedPer90:40+i,accuracy:70+i,recoveries:30+i,tackles:10+i,interceptions:5+i,clearances:10+i,blocks:3+i,savepct:60+i,saves:20+i,conceded:10-i,prevented:i,highClaims:3+i,sweeperActions:4+i,lineBreakingPasses:10+i,chancesCreated:3+i,bigChancesCreated:2+i})));
 return {metadata:{kind:'combined',league_key:'a',competition:'a',season:'2026/27',imported_at:'2026-11-18T00:00:00Z',imported_matches:10,available_matches:380,combination:{matched_players:0},sources:{}},players,teams:[{id:'1',name:'One',goals:4,matches:99,minutes:9999,metricContexts:{goals:{source:'Understat',matches:2,minutes:180}}},{id:'2',name:'Two',goals:0,matches:99,metricContexts:{goals:{source:'FotMob',matches:4,minutes:360}}}],matches:[]};
}
module.exports={fixture};
