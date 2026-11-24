'use strict';
const leagues=require('../../dist/leagues.js'),fotmob=require('../../dist/fotmob.js');
const date='2026-11-24T13:00:00Z';
function snapshots(id,played=6){
 const l=leagues.get(id),teams=Array.from({length:l.teams},(_,i)=>({id:String(i+1),name:'Isolated club '+i,matches:played,minutes:90*played,goals:played,conceded:played,xg:played,xga:played})),players=teams.map(t=>({...Object.fromEntries(fotmob.fields.map(k=>[k,null])),id:t.id,team_id:t.id,team:t.name,name:'Isolated '+t.id,pos:'MED',minutes:played*90,matches:played,passes:null,completed:null,accuracy:80,tackles:null,interceptions:null,recoveries:null,metricContexts:{}}));
 const f={metadata:{source:'FotMob',competition:l.name,league_key:l.id,season:l.season,league_id:l.fotmobId,season_id:l.fotmobSeason,profile:'full',imported_at:date,imported_matches:l.teams*played/2,available_matches:l.matches,notes:'Isolated test only'},teams,players,matches:[]};
 const e={metadata:{source:'ESPN',competition:l.name,league_key:l.id,season:l.season,season_id:2026,imported_at:date,imported_matches:l.teams*played/2,available_matches:l.matches,notes:'Isolated test only'},teams:teams.map(t=>({...t,id:'e'+t.id,minutes:null,xg:null,xga:null})),players:players.map(p=>({...p,id:'e'+p.id,team_id:'e'+p.team_id,minutes:null,xg:null,xga:null,xa:null,psxg:null})),matches:[]};
 return {f,e};
}
module.exports={snapshots};
