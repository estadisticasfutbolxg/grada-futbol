(function(root){
 'use strict';
 const node=typeof module==='object'&&module.exports,leagues=node?require('./leagues.js'):root.GradaLeagues;
 const positions=node?require('./positions.js'):root.GradaPositions;
 const fields={successful_passes:['completed','number'],successful_passes_accuracy:['accuracy','percent'],shots:['shots','number'],shots_on_target:['shotsOnTarget','number'],expected_goals:['xg','fraction'],expected_assists:['xa','fraction'],expected_goals_on_target:['xgot','fraction'],line_breaking_passes:['lineBreakingPasses','number'],chances_created:['chancesCreated','number'],big_chances_created:['bigChancesCreated','number'],'matchstats.headers.tackles':['tackles','number'],interceptions:['interceptions','number'],recoveries:['recoveries','number'],clearances:['clearances','number'],blocked_shots:['blocks','number'],saves:['saves','number'],save_percentage:['savepct','percent'],goals_conceded:['conceded','number'],goals_prevented:['prevented','fraction'],clean_sheet_team_title:['clean','number'],penalty_saves:['penaltiesSaved','number'],keeper_high_claim:['highClaims','number'],keeper_sweeper:['sweeperActions','number'],yellow_cards:['yellowCards','number'],red_cards:['redCards','number'],expected_goals_against_while_on_pitch:['xga','fraction']};
 const rates={dribbles_succeeded:'dribblesPer90',long_balls_accurate:'longBallsPer90',fouls_committed:'foulsPer90'};
 function numeric(value,format,signed=false){
  if(typeof value==='string'&&!/^-?\d+(?:\.\d+)?$/.test(value))throw new Error('Formato de ficha inválido.');
  if(!['number','string'].includes(typeof value))throw new Error('Valor de ficha inválido.');
  const n=Number(value);if(!Number.isFinite(n)||!signed&&n<0||format==='number'&&!Number.isInteger(n)||format==='percent'&&n>100)throw new Error('Métrica de ficha inválida.');return n;
 }
 function parse(html,player,leagueId,capturedAt){
  const league=leagues.get(leagueId),match=html.match(/<script\b[^>]*\bid=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script\s*>/i);if(!match)throw new Error('Ficha FotMob sin datos.');
  const d=JSON.parse(match[1])?.props?.pageProps?.data,season=d?.statSeasons?.[0],main=d?.mainLeague,position=d?.positionDescription?.primaryPosition;
  if(String(d?.id)!==String(player.id)||String(d.primaryTeam?.teamId)!==String(player.team_id)||!Number.isFinite(Date.parse(capturedAt)))throw new Error('Ficha de otro jugador o club.');
  const nameAliases=[...new Set([player.name,d.name,d.fullName].filter(n=>typeof n==='string'&&n.trim()&&n.length<=250))];
  const pos=positions.fromFotmob(position),positionContext={source:'FotMob',captured_at:capturedAt,url:'https://www.fotmob.com/players/'+player.id+'/player',key:position?.key||null,label:position?.label||null,identityVerified:true};
  if(main?.leagueId!==league.fotmobId||main.season!=='2026/2027'||season?.seasonName!=='2026/2027'||season.tournaments?.[0]?.tournamentId!==league.fotmobId)return {id:String(player.id),team_id:String(player.team_id),pos,positionContext,nameAliases,values:{},contexts:{},captured_at:capturedAt,scope:'position_only'};
  const mainStats=new Map(main.stats.map(s=>[s.localizedTitleId,s.value])),minutes=numeric(mainStats.get('minutes_played'),'number'),matches=numeric(mainStats.get('matches_uppercase'),'number');
  if(matches>2*(league.teams-1)||minutes>matches*130)throw new Error('Muestra de ficha inválida.');
  const values={},contexts={},url='https://www.fotmob.com/players/'+player.id+'/player';
  function assign(key,value,item,derived=null){values[key]=value;contexts[key]={source:'FotMob',captured_at:capturedAt,minutes,matches,url,reportedValue:!derived,profileVerified:true,...(Number.isFinite(item?.per90)?{reportedPer90:item.per90}:{}),...(derived?{derived}:{})};}
  for(const key of ['minutes','matches'])assign(key,key==='minutes'?minutes:matches);
  for(const [key,field] of [['goals','goals'],['assists','assists']])if(mainStats.has(key))assign(field,numeric(mainStats.get(key),'number'));
  for(const group of d.firstSeasonStats?.statsSection?.items||[])for(const item of group.items||[]){
   const spec=Object.hasOwn(fields,item.localizedTitleId)?fields[item.localizedTitleId]:null;
   if(spec&&item.statFormat===spec[1]){assign(spec[0],numeric(item.statValue,spec[1],spec[0]==='prevented'),item);if(spec[0]==='shots'&&Number.isFinite(item.per90)&&item.per90>=0)assign('shotsPer90',item.per90,item);}
   const rate=Object.hasOwn(rates,item.localizedTitleId)?rates[item.localizedTitleId]:null;if(rate&&Number.isFinite(item.per90)&&item.per90>=0)assign(rate,item.per90,item);
  }
  const ownShots=d.firstSeasonStats?.shotmap;
  if(Array.isArray(ownShots)&&ownShots.length<=3000&&Number.isInteger(values.shots)&&ownShots.length===values.shots&&new Set(ownShots.map(s=>String(s.id))).size===ownShots.length&&ownShots.every(s=>String(s.playerId)===String(player.id)&&String(s.teamId)===String(player.team_id)&&s.isOwnGoal===false&&typeof s.isOnTarget==='boolean'&&['FirstHalf','SecondHalf'].includes(s.period)&&s.matchDate>='2026-07-01'&&s.matchDate<'2027-07-01')){
   const onTarget=ownShots.filter(s=>s.isOnTarget).length;assign('shotsOnTarget',onTarget,null,'player_shotmap');if(minutes>0)assign('shotsOnTargetPer90',onTarget/minutes*90,null,'player_shotmap');
  }
  // This map is explicitly attached to the keeper, never to the whole team.
  const shots=d.firstSeasonStats?.keeperShotmap;
  if(pos==='POR'&&Array.isArray(shots)&&shots.length<=3000){
   const ids=new Set(),valid=shots.every(s=>{const key=String(s.id);if(ids.has(key))return false;ids.add(key);return ['FirstHalf','SecondHalf'].includes(s.period)&&typeof s.isOwnGoal==='boolean'&&[String(s.homeTeamId),String(s.awayTeamId)].includes(String(player.team_id))&&typeof s.matchDate==='string'&&s.matchDate>='2026-07-01'&&s.matchDate<'2027-07-01';});
   const ownGoals=shots.filter(s=>s.isOwnGoal&&s.eventType==='Goal').length,goals=shots.filter(s=>!s.isOwnGoal&&s.eventType==='Goal').length,faced=shots.filter(s=>!s.isOwnGoal&&s.isOnTarget===true&&String(s.teamId)!==String(player.team_id));
   const complete=valid&&Number.isInteger(values.saves)&&Number.isInteger(values.conceded)&&faced.length===values.saves+values.conceded-ownGoals;
   if(complete&&faced.every(s=>Number.isFinite(s.expectedGoals)&&s.expectedGoals>=0&&s.expectedGoals<=1&&Number.isFinite(s.expectedGoalsOnTarget)&&s.expectedGoalsOnTarget>=0&&s.expectedGoalsOnTarget<=1)){
    assign('xgaOnTarget',faced.reduce((n,s)=>n+s.expectedGoals,0),null,'keeper_shotmap');assign('psxg',faced.reduce((n,s)=>n+s.expectedGoalsOnTarget,0),null,'keeper_shotmap');
   }
   // Opta: goals prevented = xGOT received - goals conceded, excluding own goals.
   // Invert only when the goal events account for every conceded goal in this profile.
   if(valid&&Number.isInteger(values.conceded)&&goals+ownGoals===values.conceded&&Number.isFinite(values.prevented)){
    const expected=goals+values.prevented;if(expected>=0)assign('psxg',expected,null,'goals_prevented_identity');
   }
   for(const key of ['xgaOnTarget','psxg'])if(contexts[key])Object.assign(contexts[key],{shots:faced.length,pairedConceded:values.conceded-ownGoals,pairedSaves:values.saves,ownGoalsExcluded:ownGoals,coverage:key==='psxg'&&contexts[key].derived==='goals_prevented_identity'?'Goles evitados y goles recibidos de la misma ficha; autogoles verificados en el mapa y excluidos.':'Tiros a puerta afrontados; recuento igual a paradas + goles recibidos sin autogoles.'});
  }
  return {id:String(player.id),team_id:String(player.team_id),pos,positionContext,nameAliases,values,contexts,captured_at:capturedAt};
 }
 const allowed=new Set(['minutes','matches','goals','assists','shotsPer90','shotsOnTargetPer90','psxg','xgaOnTarget',...Object.values(fields).map(v=>v[0]),...Object.values(rates)]);
 function deriveCounts(next,changed){
  for(const [key,denominator] of [['delta','xg'],['conversion','shots']])if(changed.has('goals')||changed.has(denominator)){
   const a=next.metricContexts.goals,b=next.metricContexts[denominator];
   const paired=a&&b&&a.source==='FotMob'&&b.source==='FotMob'&&a.captured_at===b.captured_at&&a.minutes===b.minutes&&a.matches===b.matches;
   next[key]=paired&&Number.isFinite(next.goals)&&Number.isFinite(next[denominator])?(key==='delta'?next.goals-next.xg:next.shots>0?next.goals/next.shots*100:null):null;
   delete next.metricContexts[key];
   if(next[key]!==null){next.metricContexts[key]={...b,reportedValue:false,derived:'profile_counts'};delete next.metricContexts[key].reportedPer90;}
  }
 }
 function apply(data,profiles,previous=null){
  data=restore(data,previous);
  const byId=new Map(profiles.map(p=>[String(p.id),p]));let matched=0;
  const retained=data.metadata.capture_recovery?.fields||0;
  const players=data.players.map(player=>{
   const candidate=byId.get(String(player.id)),profile=candidate&&String(candidate.team_id)===String(player.team_id)?candidate:null;
   const next={...player,metricContexts:{...player.metricContexts}},changed=new Set();
   for(const [key,value] of Object.entries(profile?.values||{})){const context=profile.contexts[key];if(!allowed.has(key)||!context||context.source!=='FotMob'||context.profileVerified!==true||!Number.isFinite(value)||key!=='prevented'&&value<0)throw new Error('Ficha normalizada inválida.');if(next[key]===null||next[key]===undefined||Date.parse(context.captured_at)>=Date.parse(next.metricContexts[key]?.captured_at||data.metadata.imported_at)){next[key]=value;next.metricContexts[key]=context;changed.add(key);}}
   if(profile&&profile.pos!=='—'){
    if(!Object.hasOwn(positions.labels,profile.pos))throw new Error('Posición de ficha inválida.');
    const profileAt=Date.parse(profile.positionContext?.captured_at||profile.captured_at),positionAt=Date.parse(next.positionContext?.captured_at||next.positionContext?.retained_from||data.metadata.imported_at);
    if(next.pos==='—'||profileAt>=positionAt){next.pos=profile.pos;next.positionContext=profile.positionContext||null;}
   }
   if(Array.isArray(profile?.nameAliases))next.nameAliases=[...new Set([player.name,...(Array.isArray(player.nameAliases)?player.nameAliases:[]),...profile.nameAliases].filter(n=>typeof n==='string'&&n.trim()&&n.length<=250))].slice(0,8);
   deriveCounts(next,changed);
   if(profile)matched++;return next;
  });
  return {...data,metadata:{...data.metadata,notes:(data.metadata.notes||'').replace(/ Fichas individuales verificadas.*$/,'')+' Fichas individuales verificadas añaden totales publicados y xGOT recibido con datos del portero y autogoles comprobados.',profile_enrichment:{requested:data.players.length,downloaded:profiles.length,matched,retained_profile_fields:retained,imported_at:profiles.map(p=>p.captured_at).sort()[0]||null,definition:'Fichas FotMob con ID, club, liga y temporada verificados. Pases completados publicados; sin reconstruir intentos de pase. xG a puerta desde mapas completos; xGOT desde goles evitados y goles sin autogoles comprobados, o mapa completo.'}},players};
 }
 // An aggregate capture and its individual profiles have separate timestamps.
 // A newer aggregate must not erase evidence absent from that response.
 function restore(data,previous){
  if(!previous)return data;
  let sameLeague=false;try{sameLeague=leagues.resolve(data.metadata).id===leagues.resolve(previous.metadata).id;}catch(_){}
  if(!sameLeague||data.metadata.source!=='FotMob'||previous.metadata.source!=='FotMob'||data.metadata.season_id!==previous.metadata.season_id||data.metadata.league_id!==previous.metadata.league_id)return data;
  const oldById=new Map(previous.players.map(p=>[String(p.id),p]));let fields=0,positionsRetained=0;
  const players=data.players.map(player=>{
   const prior=oldById.get(String(player.id));
   if(!prior||String(prior.team_id)!==String(player.team_id)||player.pos!=='—'&&prior.pos!=='—'&&(player.pos==='POR')!==(prior.pos==='POR'))return player;
   const next={...player,metricContexts:{...player.metricContexts}},restored=new Set();
   for(const key of allowed){
    const context=prior.metricContexts?.[key],current=next.metricContexts[key],value=prior[key];
    if(context?.source!=='FotMob'||context.profileVerified!==true||!Number.isFinite(value)||key!=='prevented'&&value<0)continue;
    const newer=Date.parse(context.captured_at)>Date.parse(current?.captured_at||data.metadata.imported_at);
    if(next[key]===null||next[key]===undefined||newer){next[key]=value;next.metricContexts[key]={...context};restored.add(key);fields++;}
   }
   const newerPosition=prior.positionContext?.identityVerified===true&&Date.parse(prior.positionContext.captured_at)>Date.parse(player.positionContext?.captured_at||data.metadata.imported_at);
   if(Object.hasOwn(positions.labels,prior.pos)&&(next.pos==='—'||newerPosition)){
    next.pos=prior.pos;next.positionContext={...prior.positionContext,retained_from:previous.metadata.imported_at};positionsRetained++;
   }
   if(Array.isArray(prior.nameAliases))next.nameAliases=[...new Set([player.name,...(Array.isArray(player.nameAliases)?player.nameAliases:[]),...prior.nameAliases].filter(n=>typeof n==='string'&&n.trim()&&n.length<=250))].slice(0,8);
   // Do not leave a derived value describing the sample that was replaced.
   deriveCounts(next,restored);
   return next;
  });
  return {...data,players,metadata:{...data.metadata,capture_recovery:{fields,positions:positionsRetained,from:previous.metadata.imported_at,definition:'Se conservan posiciones conocidas y campos de fichas verificadas para el mismo ID y club, liga y temporada. Cada campo mantiene su fecha y muestra originales.'}}};
 }
 const api={parse,apply,restore};if(node)module.exports=api;else root.GradaProfiles=api;
})(typeof window==='object'?window:globalThis);
