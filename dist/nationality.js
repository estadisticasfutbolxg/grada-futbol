(function(root){
 'use strict';
 const node=typeof module==='object'&&module.exports,leagues=node?require('./leagues.js'):root.GradaLeagues,roles=node?require('./roles.js'):root.GradaRoles;
 // FIFA/provider codes are not ISO alpha-3 (GER, SUI, KVX, etc.). Region codes
 // below translate labels/flags only; they never assign a country to a player.
 const regions=Object.fromEntries(('GER:DE TUR:TR BIH:BA AUT:AT JPN:JP SUI:CH MAR:MA ALG:DZ KOR:KR MLI:ML FRA:FR DEN:DK CMR:CM BEL:BE NED:NL POR:PT SVK:SK NOR:NO HUN:HU COD:CD SRB:RS ESP:ES BRA:BR CRO:HR TUN:TN GHA:GH CIV:CI JAM:JM ARG:AR BFA:BF USA:US NGA:NG CZE:CZ KVX:XK THA:TH POL:PL BUL:BG ITA:IT SLE:SL BEN:BJ PHI:PH EST:EE SEN:SN GEO:GE ISL:IS AUS:AU IDN:ID UKR:UA SWE:SE GRE:GR GUI:GN COM:KM GAM:GM ZAM:ZM TOG:TG CAN:CA COL:CO PER:PE FIN:FI SUR:SR CPV:CV URU:UY MKD:MK GLP:GP ISR:IL CHI:CL MEX:MX GNB:GW ROU:RO ALB:AL ANG:AO SVN:SI VEN:VE KEN:KE RUS:RU DOM:DO IRL:IE EGY:EG GAB:GA MAS:MY MAD:MG HAI:HT MTN:MR CTA:CF MTQ:MQ CGO:CG ECU:EC MNE:ME KSA:SA PAR:PY TAN:TZ BDI:BI CRC:CR JOR:JO NZL:NZ LUX:LU UZB:UZ MOZ:MZ LTU:LT ARM:AM EQG:GQ NIG:NE').split(' ').map(item=>item.split(':')));
 const special={ENG:'Inglaterra',SCO:'Escocia',WAL:'Gales',NIR:'Irlanda del Norte'},localFlags={ESP:'es',ENG:'gb-eng',FRA:'fr',GER:'de',ITA:'it'};
 const display=typeof Intl.DisplayNames==='function'?new Intl.DisplayNames(['es'],{type:'region'}):null;
 function label(value){const code=value?.code;return special[code]||(regions[code]&&display?.of(regions[code]))||value?.name||'Sin nacionalidad publicada';}
 function flag(value){const code=value?.code;if(localFlags[code])return {path:'/assets/flags/'+localFlags[code]+'.svg'};const iso=regions[code];return iso?{text:String.fromCodePoint(...[...iso].map(c=>127397+c.charCodeAt(0)))}:{text:code||'—'};}
 const id=value=>typeof value==='string'||typeof value==='number'?String(value):'';
 function valid(player,value=player?.nationality,leagueKey=null){
  const c=value?.context;
  if(!/^\d{1,12}$/.test(id(player?.id))||!/^\d{1,12}$/.test(id(player?.team_id)))return false;
  // eslint-disable-next-line no-control-regex -- Reject control characters in provider names.
  if(!value||!/^[A-Z]{3}$/.test(value.code)||!/^\d{1,12}$/.test(id(value.nationalTeamId))||Number(value.nationalTeamId)<=0||typeof value.name!=='string'||!value.name.trim()||value.name.length>100||/[<>\x00-\x1f]/.test(value.name))return false;
  if(c?.source!=='FotMob'||c.identityVerified!==true||id(c.player_id)!==id(player?.id)||id(c.team_id)!==id(player?.team_id)||c.season!=='2026/27'||!Number.isFinite(Date.parse(c.captured_at))||Date.parse(c.captured_at)>Date.now()+300000)return false;
  try{if(leagues.get(c.league_key).season!==c.season||leagueKey&&c.league_key!==leagueKey)return false;}catch(_){return false;}
  const teamURL='https://www.fotmob.com/teams/'+id(player.team_id)+'/squad/',playerURL='https://www.fotmob.com/players/'+id(player.id)+'/player';
  return c.kind==='squad_country'?typeof c.url==='string'&&c.url.startsWith(teamURL)&&/^[a-z0-9-]+$/.test(c.url.slice(teamURL.length)):c.kind==='profile_country'&&c.url===playerURL;
 }
 function info(record){
  const p=record?.sourceRecords?.FotMob||record,value=p?.nationality||record?.nationality;
  return valid(p,value,record?.league_key||null)?value:null;
 }
 function country(player,code,name,nationalTeamId,context){
  const value={code,name:typeof name==='string'?name.trim():name,nationalTeamId:id(nationalTeamId),context:{source:'FotMob',identityVerified:true,...context,player_id:id(player.id),team_id:id(player.team_id)}};
  return valid(player,value)?value:null;
 }
 function fromProfile(d,player,leagueId,capturedAt){
  if(id(d.id)!==id(player.id)||id(d.primaryTeam?.teamId)!==id(player.team_id))return null;
  const items=(Array.isArray(d.playerInformation)?d.playerInformation:[]).filter(item=>item.translationKey==='country_sentencecase');
  if(items.length!==1)return null;
  const item=items[0];return country(player,item.countryCode,item.value?.fallback,item.nationalTeamId,{league_key:leagueId,season:leagues.get(leagueId).season,captured_at:capturedAt,url:'https://www.fotmob.com/players/'+id(player.id)+'/player',kind:'profile_country'});
 }
 function parseSquad(html,team,leagueId,capturedAt){
  const d=roles.squadPage(html,team,leagueId,capturedAt),slug=/^[a-z0-9-]+$/.test(d.seostr||'')?d.seostr:'team',url='https://www.fotmob.com/teams/'+team.id+'/squad/'+slug,players=[],seen=new Set();
  for(const group of d.squad.squad){if(group.title==='coach')continue;if(!Array.isArray(group.members)||group.members.length>100)throw Error('Grupo de plantilla inválido.');
   for(const row of group.members){const player={id:id(row.id),team_id:id(team.id)};if(!/^\d{1,12}$/.test(player.id)||seen.has(player.id))throw Error('Identidad de plantilla inválida.');seen.add(player.id);
    const nationality=country(player,row.ccode,row.cname,row.nationalTeamId,{league_key:leagueId,season:leagues.get(leagueId).season,captured_at:capturedAt,url,kind:'squad_country'});if(nationality)players.push({...player,nationality});
   }
  }
  return {source:'FotMob',league_key:leagueId,season:leagues.get(leagueId).season,team_id:id(team.id),captured_at:capturedAt,players};
 }
 function apply(player,value,leagueKey){
  if(!valid(player,value,leagueKey))return player;
  const previous=player.nationality;if(valid(player,previous,leagueKey)&&Date.parse(previous.context.captured_at)>Date.parse(value.context.captured_at))return player;
  return {...player,nationality:{...value,context:{...value.context}}};
 }
 function enrich(data,squads){
  if(data.metadata?.source!=='FotMob')throw Error('Fuente de nacionalidad incorrecta.');
  const league=leagues.resolve(data.metadata),records=new Map();
  for(const s of squads){if(s.source!=='FotMob'||s.league_key!==league.id||s.season!==league.season||!data.teams.some(t=>id(t.id)===s.team_id))throw Error('Ámbito de nacionalidad incorrecto.');for(const p of s.players){const key=p.id+'|'+p.team_id;if(id(p.team_id)!==s.team_id||!valid(p,p.nationality,league.id)||records.has(key))throw Error('País o identidad duplicada.');records.set(key,p.nationality);}}
  let matched=0;const players=data.players.map(p=>{const n=records.get(id(p.id)+'|'+id(p.team_id));if(n)matched++;return n?apply(p,n,league.id):p;});
  return {...data,players,metadata:{...data.metadata,nationality_enrichment:{source:'FotMob',teams:squads.length,matched_players:matched,captured_at:squads.map(s=>s.captured_at).sort()[0]||null,definition:'País deportivo publicado en plantillas verificadas. No acredita todas las ciudadanías, convocatoria ni elegibilidad internacional.'}}};
 }
 function restore(data,previous){
  if(!previous||data.metadata?.source!=='FotMob'||previous.metadata?.source!=='FotMob')return data;
  let league;try{league=leagues.resolve(data.metadata);if(leagues.resolve(previous.metadata).id!==league.id)return data;}catch(_){return data;}
  const old=new Map(previous.players.map(p=>[id(p.id)+'|'+id(p.team_id),p]));
  return {...data,players:data.players.map(p=>{const prior=old.get(id(p.id)+'|'+id(p.team_id));if(!prior||!valid(prior,prior.nationality,league.id)||valid(p,p.nationality,league.id)&&Date.parse(p.nationality.context.captured_at)>=Date.parse(prior.nationality.context.captured_at))return p;return apply(p,prior.nationality,league.id);})};
 }
 const api={valid,info,label,flag,fromProfile,parseSquad,apply,enrich,restore};if(node)module.exports=api;else root.GradaNationality=api;
})(typeof window==='object'?window:globalThis);
