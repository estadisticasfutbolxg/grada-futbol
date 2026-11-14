(function(root){
 'use strict';
 const node=typeof module==='object'&&module.exports,leagues=node?require('./leagues.js'):root.GradaLeagues;
 const labels={GK:'Portero',CB:'Central',LB:'Lateral izquierdo',RB:'Lateral derecho',LWB:'Carrilero izquierdo',RWB:'Carrilero derecho',CDM:'Pivote',CM:'Mediocentro / interior',CAM:'Mediapunta',LM:'Medio izquierdo',RM:'Medio derecho',LW:'Extremo izquierdo',RW:'Extremo derecho',ST:'Delantero centro'};
 const groups={CB:{label:'Centrales',position:'DEF',codes:['CB']},FB:{label:'Laterales / carrileros',position:'DEF',codes:['LB','RB','LWB','RWB']},DM:{label:'Pivotes',position:'MED',codes:['CDM']},CM:{label:'Mediocentros / interiores',position:'MED',codes:['CM']},AM:{label:'Mediapuntas',position:'MED',codes:['CAM']},WM:{label:'Medios de banda',position:'MED',codes:['LM','RM']},WING:{label:'Extremos',position:'DEL',codes:['LW','RW']},ST:{label:'Delanteros centro',position:'DEL',codes:['ST']},GK:{label:'Porteros',position:'POR',codes:['GK']}};
 const profileCodes={keeperlong:'GK',keeper:'GK',centerback:'CB',leftback:'LB',rightback:'RB',leftwingback:'LWB',rightwingback:'RWB',defensivemidfielder:'CDM',centerdefensivemidfielder:'CDM',centralmidfielder:'CM',centermidfielder:'CM',centerattackingmidfielder:'CAM',attackingmidfielder:'CAM',leftmidfielder:'LM',rightmidfielder:'RM',leftwinger:'LW',rightwinger:'RW',striker:'ST',secondstriker:'ST'};
 function codesFromProfile(context){const key=String(context?.key||'').toLowerCase().replace(/[^a-z]/g,'');return Object.hasOwn(profileCodes,key)?[profileCodes[key]]:[];}
 function valid(player){const c=player?.tacticalContext;return Array.isArray(player?.tacticalPositions)&&player.tacticalPositions.length>0&&player.tacticalPositions.length<=Object.keys(labels).length&&new Set(player.tacticalPositions).size===player.tacticalPositions.length&&player.tacticalPositions.every(code=>Object.hasOwn(labels,code))&&c?.source==='FotMob'&&c.identityVerified===true&&String(c.player_id)===String(player.id)&&String(c.team_id)===String(player.team_id)&&Number.isFinite(Date.parse(c.captured_at));}
 function info(record){
  const p=record.sourceRecords?.FotMob||record,context=valid(p)?p.tacticalContext:null,primary=p.positionContext,codes=codesFromProfile(primary);
  const newer=primary?.source==='FotMob'&&primary.identityVerified===true&&codes.length&&Number.isFinite(Date.parse(primary.captured_at))&&(!context||Date.parse(primary.captured_at)>Date.parse(context.captured_at));
  const reported=newer?codes:context?p.tacticalPositions:[],origin=newer?primary:context;
  const matched=Object.entries(groups).filter(([,g])=>g.position===record.pos&&g.codes.some(c=>reported.includes(c))).map(([key])=>key);
  return {codes:reported,groups:matched,label:reported.length?reported.map(c=>labels[c]).join(' / '):'Sin posición detallada verificada',context:origin,versatile:matched.length>1};
 }
 function matches(record,key){if(!key)return true;const r=info(record);return key==='UNKNOWN'?r.groups.length===0:r.groups.includes(key);}
 function coverage(players){const known=players.filter(p=>info(p).codes.length);return {known:known.length,total:players.length,classified:players.filter(p=>info(p).groups.length).length};}
 function parseSquad(html,team,leagueId,capturedAt){
  const league=leagues.get(leagueId),match=html.match(/<script\b[^>]*\bid=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script\s*>/i);if(!match)throw new Error('Plantilla sin datos.');
  const page=JSON.parse(match[1])?.props?.pageProps,d=page?.fallback?.['team-'+team.id]||page,details=d?.details;
  if(String(details?.id)!==String(team.id)||details.primaryLeagueId!==league.fotmobId||details.latestSeason!=='2026/2027'||!Number.isFinite(Date.parse(capturedAt))||Date.parse(capturedAt)>Date.now()+300000)throw new Error('Plantilla de otro club, liga o temporada.');
  const sections=d.squad?.squad;if(!Array.isArray(sections)||sections.length>12)throw new Error('Plantilla incompleta.');
  const slug=/^[a-z0-9-]+$/.test(d.seostr||'')?d.seostr:'team',url='https://www.fotmob.com/teams/'+team.id+'/squad/'+slug,seen=new Set(),players=[];
  for(const group of sections){if(group.title==='coach')continue;if(!Array.isArray(group.members)||group.members.length>100)throw new Error('Grupo de plantilla inválido.');
   for(const p of group.members){const id=String(p.id);if(!/^\d{1,12}$/.test(id)||seen.has(id))throw new Error('Identidad de plantilla inválida.');seen.add(id);
    const codes=[...new Set(String(p.positionIdsDesc||'').split(',').map(c=>c.trim()).filter(Boolean))];if(!codes.length)continue;if(codes.some(c=>!Object.hasOwn(labels,c)))throw new Error('Posición de plantilla desconocida.');
    players.push({id,team_id:String(team.id),tacticalPositions:codes,tacticalContext:{source:'FotMob',player_id:id,team_id:String(team.id),identityVerified:true,league_key:league.id,season:league.season,captured_at:capturedAt,url,kind:'squad_positions'}});
   }
  }
  if(!players.length)throw new Error('Plantilla sin posiciones verificadas.');return {source:'FotMob',league_key:league.id,season:league.season,team_id:String(team.id),captured_at:capturedAt,url,players};
 }
 function enrich(data,squads){
  if(data.metadata?.source!=='FotMob')throw new Error('Fuente de posiciones incorrecta.');
  const league=leagues.resolve(data.metadata),byId=new Map();
  for(const squad of squads){if(squad.source!=='FotMob'||squad.league_key!==league.id||squad.season!==league.season||!data.teams.some(t=>String(t.id)===squad.team_id))throw new Error('Ámbito de plantilla incorrecto.');for(const p of squad.players){if(!valid(p)||byId.has(p.id))throw new Error('Posición normalizada inválida o duplicada.');byId.set(p.id,p);}}
  let matched=0;const players=data.players.map(p=>{const role=byId.get(String(p.id));if(!role||String(role.team_id)!==String(p.team_id))return p;matched++;return {...p,tacticalPositions:[...role.tacticalPositions],tacticalContext:{...role.tacticalContext}};});
  return {...data,players,metadata:{...data.metadata,tactical_enrichment:{source:'FotMob',teams:squads.length,matched_players:matched,captured_at:squads.map(s=>s.captured_at).sort()[0]||null,definition:'Posiciones explícitas de la plantilla actual, con ID, club, liga y temporada verificados. Pueden incluir varios puestos; no describen minutos por posición ni cambian cifras de juego.'}}};
 }
 function restore(data,previous){
  if(!previous||data.metadata?.source!=='FotMob'||previous.metadata?.source!=='FotMob')return data;
  try{if(leagues.resolve(data.metadata).id!==leagues.resolve(previous.metadata).id)return data;}catch(_){return data;}
  const old=new Map(previous.players.map(p=>[String(p.id),p]));return {...data,players:data.players.map(p=>{const prior=old.get(String(p.id));if(!prior||String(prior.team_id)!==String(p.team_id)||!valid(prior)||valid(p)&&Date.parse(p.tacticalContext.captured_at)>=Date.parse(prior.tacticalContext.captured_at))return p;return {...p,tacticalPositions:[...prior.tacticalPositions],tacticalContext:{...prior.tacticalContext}};})};
 }
 const api={labels,groups,info,matches,coverage,parseSquad,enrich,restore,valid};if(node)module.exports=api;else root.GradaRoles=api;
})(typeof window==='object'?window:globalThis);
