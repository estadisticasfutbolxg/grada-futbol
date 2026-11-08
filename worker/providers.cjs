'use strict';
// Same public rankings, formats and source denominators as the Python importers.
const leagues=require('../dist/leagues.js'),fotmob=require('../dist/fotmob.js'),understat=require('../dist/understat.js');
const LIMIT=8*1024*1024;
const extra={
 lbp_total:[['lineBreakingPasses','substatValue','number']],effective_clearance:[['clearances','substatValue','number']],outfielder_block:[['blocks','substatValue','number']],total_high_claim:[['highClaims','substatValue','number']],total_keeper_sweeper:[['sweeperActions','substatValue','number']],saves:[['saves','substatValue','number']],goals_conceded:[['conceded','substatValue','number']],
 ontarget_scoring_att:[['shotsOnTargetPer90','statValue','fraction',false,true],['shotsOnTargetPct','substatValue','percent']],accurate_long_balls:[['longBallsPer90','statValue','fraction',false,true],['longBallAccuracy','substatValue','percent']],won_contest:[['dribblesPer90','statValue','fraction',false,true],['dribbleSuccess','substatValue','percent']],poss_won_att_3rd:[['finalThirdRecoveriesPer90','statValue','fraction',false,true],['midfieldRecoveriesPer90','substatValue','fraction',false,true]],fouls:[['foulsPer90','statValue','fraction',false,true]],total_att_assist:[['chancesCreated','statValue','number']],big_chance_created:[['bigChancesCreated','statValue','number']],big_chance_missed:[['bigChancesMissed','statValue','number']],yellow_card:[['yellowCards','statValue','number']],red_card:[['redCards','statValue','number']],penalty_save:[['penaltiesSaved','statValue','number'],['penaltiesFaced','substatValue','number']],clean_sheet:[['clean','statValue','number']],_save_percentage:[['savepct','statValue','percent']],_goals_prevented:[['prevented','statValue','fraction',true]],expected_goalsontarget:[['xgot','statValue','fraction']]
};
const defensive={total_tackle:'tackles',interception:'interceptions',ball_recovery:'recoveries'};
const rateCount=new Set(['lbp_total','effective_clearance','outfielder_block','total_high_claim','total_keeper_sweeper','saves','goals_conceded']);
function specs(league){return {...Object.fromEntries(['accurate_pass','total_tackle','interception','ball_recovery','mins_played',...Object.keys(extra)].map(k=>[k,'players'])),...Object.fromEntries(['accurate_pass_team','clean_sheet_team','ontarget_scoring_att_team','big_chance_team','possession_percentage_team','goals_team_match','goals_conceded_team_match'].map(k=>[k,'teams'])),overview:'overview',...(league.primary==='FotMob'?{expected_goals:'players',expected_assists:'players',total_scoring_att:'players',goals:'players',goal_assist:'players',expected_goals_team:'teams',expected_goals_conceded_team:'teams'}:{})};}
function number(value,{integer=false,signed=false,nullable=false,coerce=false}={}){
 if(nullable&&(value===null||value===undefined||value===''))return null;
 if(typeof value==='boolean'||value===null||value===undefined||value==='')throw new Error('Métrica ausente o inválida.');
 if(coerce&&!['string','number'].includes(typeof value))throw new Error('Tipo numérico inválido.');
 const n=coerce?Number(value):value;
 if(typeof n!=='number'||!Number.isFinite(n)||!signed&&n<0||integer&&!Number.isInteger(n))throw new Error('Formato numérico inválido.');return n;
}
function name(value){if(typeof value!=='string'||!value.trim()||value.length>250)throw new Error('Nombre inválido.');return value.trim();}
function id(value){const s=String(value);if(!/^\d{1,12}$/.test(s))throw new Error('Identidad inválida.');return s;}
async function textResponse(url,{fetcher=fetch,headers={}}={}){
 const u=new URL(url);if(u.protocol!=='https:'||!['www.fotmob.com','understat.com'].includes(u.hostname))throw new Error('Fuente no permitida.');
 let current=url,response;
 for(let redirects=0;redirects<4;redirects++){
  response=await fetcher(current,{redirect:'manual',signal:AbortSignal.timeout(20000),headers:{'User-Agent':'GRADA football statistics/1.0',Accept:'text/html,application/json',...headers}});
  if(![301,302,303,307,308].includes(response.status))break;
  const next=new URL(response.headers.get('location')||'',current);
  if(next.protocol!=='https:'||next.hostname!==u.hostname||next.port||next.username||next.password)throw new Error('Redirección de fuente no permitida.');
  await response.body?.cancel();current=next.href;
 }
 if(!response.ok)throw new Error('Fuente no disponible (HTTP '+response.status+').');
 if(Number(response.headers.get('content-length'))>LIMIT)throw new Error('Respuesta demasiado grande.');
 const reader=response.body.getReader(),chunks=[];let length=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>LIMIT)throw new Error('Respuesta demasiado grande.');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}
 const bytes=new Uint8Array(length);let at=0;for(const part of chunks){bytes.set(part,at);at+=part.length;}
 return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
}
function parseFotmob(html,stat,league){
 const match=html.match(/<script\b[^>]*\bid=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script\s*>/i);if(!match)throw new Error('FotMob no publica sus datos en esta respuesta.');
 const page=JSON.parse(match[1])?.props?.pageProps;
 if(stat==='overview'){
  if(page?.details?.id!==league.fotmobId||page.details.selectedSeason!=='2026/2027')throw new Error('Clasificación de otra temporada.');
  const tables=(page.table||[]).filter(t=>t.data?.leagueId===league.fotmobId).map(t=>t.data.table?.all);
  if(tables.length!==1||tables[0]?.length!==league.teams)throw new Error('Clasificación incompleta.');return {statsData:tables[0]};
 }
 const d=page?.data;
 if(String(d?.currentSeasonId)!==String(league.fotmobSeason)||d.currentStatName!==stat||d.type!==specs(league)[stat]||d.leagueDetails?.id!==league.fotmobId||!d.seasons?.some(s=>String(s.id)===String(league.fotmobSeason)&&s.name==='2026/2027'))throw new Error('FotMob: competición, temporada o métrica incorrecta.');
 if(!Array.isArray(d.statsData)||!d.statsData.length||d.statsData.length>1500)throw new Error('Ranking incompleto.');
 const seen=new Set();for(const r of d.statsData){const pid=id(r.id);id(r.teamId);name(r.name);if(seen.has(pid)||r.statValue?.name!==stat)throw new Error('Fila incoherente.');seen.add(pid);number(r.statValue.value,{signed:stat==='_goals_prevented'});}
 return {statsData:d.statsData};
}
function buildFotmob(pages,league){
 const rows=stat=>{if(!pages[stat])throw new Error('Falta '+stat);return pages[stat].data.statsData;};
 const teamRows=rows('accurate_pass_team');if(teamRows.length!==league.teams)throw new Error('Faltan equipos.');
 const teams=teamRows.map(r=>({id:id(r.id),name:name(r.name)})),teamMap=new Map(teams.map(t=>[t.id,t.name])),players=new Map();let skipped=0;
 for(const r of rows('mins_played')){
  const tid=id(r.teamId);if(!teamMap.has(tid)||r.substatValue?.format!=='number')throw new Error('Plantilla inválida.');
  const p={id:id(r.id),name:name(r.name),team_id:tid,team:teamMap.get(tid),pos:r.position===11?'POR':'—',minutes:number(r.statValue.value),matches:number(r.substatValue.value,{integer:true}),passes:null,completed:null,accuracy:null,tackles:null,interceptions:null,recoveries:null,metricContexts:{}};
  for(const entries of Object.values(extra))for(const [key] of entries)p[key]=null;players.set(p.id,p);
 }
 const context=(p,stat,rate)=>({source:'FotMob',minutes:p.minutes,matches:p.matches,captured_at:pages[stat].captured_at,url:pages[stat].url,minutes_captured_at:pages.mins_played.captured_at,...(rate===undefined?{}:{reportedPer90:rate})});
 for(const stat of ['accurate_pass',...Object.keys(defensive)])for(const r of rows(stat)){
  const p=players.get(String(r.id));if(!p||p.team_id!==String(r.teamId)){skipped++;continue;}
  if(r.statValue.format!=='fraction')throw new Error('Tasa FotMob inválida.');const rate=number(r.statValue.value),sub=r.substatValue;
  if(stat==='accurate_pass'){
   if(sub?.format!=='percent')throw new Error('Porcentaje de pases inválido.');p.accuracy=number(sub.value);if(p.accuracy>100)throw new Error('Porcentaje inválido.');p.metricContexts.accuracy={...context(p,stat),reportedValue:true};p.metricContexts.completed=context(p,stat,rate);
  }else{if(sub?.format!=='number')throw new Error('Conteo defensivo inválido.');const key=defensive[stat];p[key]=number(sub.value,{integer:true});p.metricContexts[key]=context(p,stat,rate);}
 }
 for(const [stat,entries] of Object.entries(extra))for(const r of rows(stat)){
  const p=players.get(String(r.id));if(!p||p.team_id!==String(r.teamId)){skipped++;continue;}
  for(const [key,part,format,signed=false,isRate=false] of entries){
   const item=r[part];if(item?.format!==format)throw new Error('Formato incorrecto: '+stat+'/'+key);
   const value=number(item.value,{integer:format==='number',signed});if(format==='percent'&&value>100)throw new Error('Porcentaje inválido.');
   const c=context(p,stat);if(isRate)c.reportedPer90=value;if(format==='percent')c.reportedValue=true;
   if(rateCount.has(stat)){if(r.statValue.format!=='fraction')throw new Error('Tasa inválida.');c.reportedPer90=number(r.statValue.value);}
   if(stat==='total_att_assist'){if(r.substatValue?.format!=='fraction')throw new Error('Ocasiones /90 inválidas.');c.reportedPer90=number(r.substatValue.value);}
   p[key]=value;p.metricContexts[key]=c;
  }
 }
 for(const p of players.values())for(const key of ['minutes','matches'])p.metricContexts[key]=context(p,'mins_played');
 const base='https://www.fotmob.com/leagues/'+league.fotmobId+'/stats/season/'+league.fotmobSeason;
 const metadata={source:'FotMob',competition:league.name,league_key:league.id,season:league.season,season_id:league.fotmobSeason,league_id:league.fotmobId,url:base+'/players/accurate_pass/'+league.fotmobSlug,imported_at:Object.values(pages).map(p=>p.captured_at).sort()[0],complete:false,imported_matches:null,available_matches:league.matches,coverage:Object.fromEntries(Object.entries(pages).map(([key,p])=>[key,p.data.statsData.length])),skipped_rows:skipped,pages:Object.fromEntries(Object.entries(pages).map(([key,p])=>[key,{url:p.url,captured_at:p.captured_at,...(p.sha256?{sha256:p.sha256}:{})}])),notes:'Rankings públicos FotMob de '+league.name+' 2026/27. Las ausencias no son ceros. Tasas y porcentajes publicados, sin inferir totales redondeados. Pases rompelíneas y progresivos son métricas distintas. Goles evitados publicados, sin reconstruir PSxG. Fecha de consulta de GRADA, no de actualización interna del proveedor.'};
 const teamsById=new Map(teams.map(t=>[t.id,t]));
 for(const row of rows('overview')){
  const t=teamsById.get(String(row.id)),score=String(row.scoresStr).match(/^(\d+)-(\d+)$/),gp=number(row.played,{integer:true});
  if(!t||!score||gp>2*(league.teams-1))throw new Error('Clasificación inválida.');
  Object.assign(t,{matches:gp,minutes:gp*90,points:number(row.pts,{integer:true,signed:true}),goals:Number(score[1]),conceded:Number(score[2]),xg:null,xga:null,clean:null,bigChances:null,shotsOnTargetPerMatch:null,possession:null,metricContexts:{}});
  for(const key of ['matches','minutes','points','goals','conceded'])t.metricContexts[key]={...context(t,'overview'),minutes_captured_at:pages.overview.captured_at};
 }
 function assignTeam(t,key,value,stat){t[key]=value;t.metricContexts[key]={...context(t,stat),minutes_captured_at:pages.overview.captured_at};}
 for(const [stat,key,format] of [['clean_sheet_team','clean','number'],['ontarget_scoring_att_team','shotsOnTargetPerMatch','fraction'],['big_chance_team','bigChances','number'],['possession_percentage_team','possession','percent']])for(const row of rows(stat)){
  const t=teamsById.get(String(row.id));if(!t||row.statValue?.format!==format)throw new Error('Métrica de equipo inválida.');const v=number(row.statValue.value,{integer:format==='number'});if(format==='percent'&&v>100)throw new Error('Posesión inválida.');assignTeam(t,key,v,stat);
 }
 if(teams.reduce((s,t)=>s+t.goals-t.conceded,0)!==0)throw new Error('Marcadores desequilibrados.');metadata.imported_matches=teams.reduce((s,t)=>s+t.matches,0)/2;if(!Number.isInteger(metadata.imported_matches))throw new Error('PJ incoherentes.');
 if(league.primary==='FotMob'){
  for(const p of players.values())for(const key of ['goals','assists','shots','xg','xa','xga','psxg','conversion','delta','keypasses','progressive','shotsPer90'])p[key]=null;
  function assign(p,key,value,stat,reported=false){p[key]=value;p.metricContexts[key]={...context(p,stat),...(reported?{reportedValue:true}:{})};}
  for(const [stat,main,sub] of [['expected_goals','xg','goals'],['expected_assists','xa','assists'],['total_scoring_att','shotsPer90','conversion']])for(const row of rows(stat)){
   const p=players.get(String(row.id));if(!p||p.team_id!==String(row.teamId))continue;const a=row.statValue,b=row.substatValue;
   if(a.format!=='fraction'||b?.format!==(stat==='total_scoring_att'?'percent':'number'))throw new Error('Formato principal incorrecto.');assign(p,main,number(a.value),stat);assign(p,sub,number(b.value,{integer:stat!=='total_scoring_att'}),stat,true);if(sub==='conversion'&&p[sub]>100)throw new Error('Conversión inválida.');
  }
  for(const [stat,key] of [['goals','goals'],['goal_assist','assists']])for(const row of rows(stat)){
   const p=players.get(String(row.id));if(!p||p.team_id!==String(row.teamId)||p[key]!==null)continue;if(row.statValue.format!=='number')throw new Error('Conteo inválido.');assign(p,key,number(row.statValue.value,{integer:true}),stat);
  }
  for(const p of players.values())if(p.goals!==null&&p.xg!==null)assign(p,'delta',p.goals-p.xg,'expected_goals');
  for(const [stat,key] of [['expected_goals_team','xg'],['expected_goals_conceded_team','xga']]){if(rows(stat).length!==league.teams)throw new Error('Falta xG de equipos.');for(const row of rows(stat)){const t=teamsById.get(String(row.id));if(!t||row.statValue.format!=='fraction')throw new Error('xG de equipo inválido.');assignTeam(t,key,number(row.statValue.value),stat);}}
  metadata.profile='full';metadata.notes+=' Modelo xG/xA FotMob; tiros totales solo mediante identidad ESPN validada. Sin serie xG por partido.';
 }
 return fotmob.validate({metadata,players:[...players.values()],teams,matches:[]});
}
async function fetchFotmob(leagueId,{fetcher=fetch,now=()=>new Date().toISOString()}={}){
 const league=leagues.get(leagueId),entries=Object.entries(specs(league)),pages={};let cursor=0,failed=false;
 async function worker(){while(!failed&&cursor<entries.length){const [stat,kind]=entries[cursor++],base='https://www.fotmob.com/leagues/'+league.fotmobId,url=stat==='overview'?base+'/overview/'+league.fotmobSlug:base+'/stats/season/'+league.fotmobSeason+'/'+kind+'/'+stat+'/'+league.fotmobSlug;try{const html=await textResponse(url,{fetcher});pages[stat]={url,captured_at:now(),data:parseFotmob(html,stat,league)};}catch(error){failed=true;throw error;}}}
 const results=await Promise.allSettled([worker(),worker()]),error=results.find(r=>r.status==='rejected');if(error)throw error.reason;return buildFotmob(pages,league);
}
function extractUnderstat(html){
 const title=html.match(/<title>([\s\S]*?)<\/title>/i);if(!title||!/2026\s*[/–-]\s*(?:20)?27/.test(title[1]))throw new Error('Understat no confirma LaLiga 2026/27.');
 const raw={};for(const [variable,key] of [['teamsData','teams'],['playersData','players'],['datesData','dates']]){
  const match=html.match(new RegExp('\\b'+variable+"\\s*=\\s*JSON\\.parse\\(\\s*'((?:\\\\.|[^'\\\\])*)'\\s*\\)"));
  if(!match||/\\(?!x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|[\\'"/bfnrt])/.test(match[1]))throw new Error('JSON Understat ausente o inválido.');
  raw[key]=JSON.parse(match[1].replace(/\\x([0-9a-fA-F]{2})/g,(_,h)=>String.fromCharCode(parseInt(h,16))));
 }return raw;
}
function adaptUnderstat(raw,capturedAt){
 if(!raw.teams||typeof raw.teams!=='object'||Array.isArray(raw.teams)||Object.keys(raw.teams).length!==20||!Array.isArray(raw.players)||!raw.players.length||!Array.isArray(raw.dates)||raw.dates.length!==380)throw new Error('Understat: cobertura incorrecta.');
 const n=(v,integer=false)=>number(v,{integer,nullable:true,coerce:true}),sum=(rows,key)=>{const a=rows.map(r=>n(r[key]));if(!a.length||a.some(v=>v===null))return null;let total=0,correction=0;for(const value of a){const next=total+value;correction+=Math.abs(total)>=Math.abs(value)?(total-next)+value:(value-next)+total;total=next;}return total+correction;};
 const teams=Object.values(raw.teams).map(t=>{if(!Array.isArray(t.history))throw new Error('Falta historial.');const goals=sum(t.history,'scored'),xg=sum(t.history,'xG');return {id:id(t.id),name:name(t.title),matches:t.history.length,minutes:t.history.length*90,goals,conceded:sum(t.history,'missed'),xg,xga:sum(t.history,'xGA'),delta:goals!==null&&xg!==null?goals-xg:null,passes:null,accuracy:null};}),teamIds=new Map(teams.map(t=>[t.name,t.id]));
 if(teams.some(t=>['goals','conceded','xg','xga'].some(k=>!Number.isFinite(t[k]))))throw new Error('Totales de equipo incompletos.');
 const players=raw.players.map(p=>{const goals=n(p.goals,true),xg=n(p.xG),shots=n(p.shots,true),team=name(p.team_title),positions=String(p.position||'').split(/\s+/),pos=positions.includes('GK')?'POR':positions.map(x=>({D:'DEF',M:'MED',F:'DEL'})[x]).find(Boolean)||'—';return {id:id(p.id),name:name(p.player_name),team_id:teamIds.get(team)??null,team,pos,matches:n(p.games,true),minutes:n(p.time),goals,assists:n(p.assists,true),xg,xa:n(p.xA),shots,keypasses:n(p.key_passes,true),conversion:goals!==null&&shots?goals/shots*100:null,delta:goals!==null&&xg!==null?goals-xg:null,...Object.fromEntries(['passes','completed','accuracy','progressive','saves','savepct','conceded','xga','psxg','prevented','clean','tackles','interceptions'].map(k=>[k,null]))};});
 const matches=raw.dates.filter(m=>m.isResult===true).map(m=>{if(typeof m.datetime!=='string'||!/^202[67]-\d\d-\d\d \d\d:\d\d:\d\d$/.test(m.datetime)||m.datetime<'2026-07-01'||m.datetime>='2027-07-01')throw new Error('Fecha fuera de temporada.');const date=new Date(m.datetime.replace(' ','T')+'Z');if(!Number.isFinite(date.valueOf())||date.toISOString().slice(0,19).replace('T',' ')!==m.datetime)throw new Error('Fecha inválida.');return {id:id(m.id),date:m.datetime,home:name(m.h.title),away:name(m.a.title),home_id:id(m.h.id),away_id:id(m.a.id),home_goals:n(m.goals?.h,true),away_goals:n(m.goals?.a,true),home_xg:n(m.xG?.h),away_xg:n(m.xG?.a),minutes:90};}).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
 const goals=teams.reduce((s,t)=>s+t.goals,0),matchGoals=matches.reduce((s,m)=>s+m.home_goals+m.away_goals,0),xg=teams.reduce((s,t)=>s+t.xg,0),matchXg=matches.reduce((s,m)=>s+m.home_xg+m.away_xg,0);
 if(goals!==matchGoals||Math.abs(xg-matchXg)>0.02)throw new Error('Totales Understat incoherentes.');
 return understat.validate({metadata:{source:'Understat',url:'https://understat.com/league/La_liga/2026',competition:'LaLiga',season:'2026/27',season_id:2026,imported_matches:matches.length,available_matches:380,complete:matches.length===380,imported_at:capturedAt,notes:'Temporada en curso. xG/xA del modelo Understat. Minutos de equipos: 90 por partido. Posiciones agrupadas de Understat. Agregados de traspasos conservados. Sin paradas, goles ni xG recibidos por portero; no se atribuye el xG del equipo a su portero.'},players,teams,matches});
}
async function fetchUnderstat(leagueId,{fetcher=fetch,now=()=>new Date().toISOString()}={}){
 if(leagues.get(leagueId).primary!=='Understat')throw new Error('Esta liga no usa Understat.');
 const headers={'X-Requested-With':'XMLHttpRequest',Referer:'https://understat.com/league/La_liga/2026'};
 try{return adaptUnderstat(JSON.parse(await textResponse('https://understat.com/getLeagueData/La%20liga/2026',{fetcher,headers})),now());}catch(_){return adaptUnderstat(extractUnderstat(await textResponse('https://understat.com/league/La_liga/2026',{fetcher,headers})),now());}
}
module.exports={specs,parseFotmob,buildFotmob,extractUnderstat,adaptUnderstat,fetchFotmob,fetchUnderstat,textResponse};
