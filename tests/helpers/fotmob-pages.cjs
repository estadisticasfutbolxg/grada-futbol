'use strict';
// Isolated provider-format fixtures; never included in the deployed website.
const providers=require('../../worker/providers.cjs'),leagues=require('../../dist/leagues');
function htmlFor(url,league=leagues.get('laliga')){
 const spec=providers.specs(league),stat=url.includes('/overview/')?'overview':url.split('/').at(-2),kind=spec[stat];
 let pageProps;
 if(stat==='overview')pageProps={details:{id:league.fotmobId,selectedSeason:'2026/2027'},table:[{data:{leagueId:league.fotmobId,table:{all:Array.from({length:league.teams},(_,i)=>({id:i+1,played:3,scoresStr:'0-0',pts:0}))}}}]};
 else{
  const fractionNumber=['total_tackle','interception','ball_recovery','lbp_total','effective_clearance','outfielder_block','total_high_claim','total_keeper_sweeper','saves','goals_conceded','expected_goals','expected_assists'];
  const fractionPercent=['accurate_pass','accurate_long_balls','won_contest','ontarget_scoring_att','total_scoring_att'];
  let format='number',subFormat='number',value=0,subValue=0;
  if(fractionNumber.includes(stat))format='fraction';
  if(fractionPercent.includes(stat)){format='fraction';subFormat='percent';}
  if(['poss_won_att_3rd','fouls','_goals_prevented','expected_goalsontarget','expected_goals_team','expected_goals_conceded_team','ontarget_scoring_att_team'].includes(stat))format='fraction';
  if(['_save_percentage','possession_percentage_team'].includes(stat))format='percent';
  if(stat==='poss_won_att_3rd'||stat==='total_att_assist')subFormat='fraction';
  if(stat==='mins_played'){value=200;subValue=3;}
  if(stat==='penalty_conceded')subValue=3;
  const rows=Array.from({length:kind==='teams'?league.teams:1},(_,i)=>({id:kind==='teams'?i+1:9001,teamId:i+1,name:'Isolated '+(i+1),statValue:{name:stat,format,value},substatValue:{format:subFormat,value:subValue}}));
  const season=league.fotmobStatSeasons?.[stat]||league.fotmobSeason;
  pageProps={data:{currentSeasonId:season,currentStatName:stat,type:kind,leagueDetails:{id:league.fotmobId},seasons:[{id:season,name:'2026/2027'}],statsData:rows}};
 }
 return '<script id="__NEXT_DATA__">'+JSON.stringify({props:{pageProps}})+'</script>';
}
module.exports={htmlFor};
