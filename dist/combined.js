(function(root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const understat = node ? require('./understat.js') : root.GradaUnderstat;
  const espn = node ? require('./laliga.js') : root.GradaLaLiga;
  const fotmob = node ? require('./fotmob.js') : root.GradaFotmob;
  const leagues = node ? require('./leagues.js') : root.GradaLeagues;
  const metrics = node ? require('./metrics.js') : root.GradaMetrics;
  const identitiesAPI = node ? require('./identity.js') : root.GradaIdentity;
  const positions = node ? require('./positions.js') : root.GradaPositions;
  const SOURCE = 'Understat + ESPN';
  const fields = [...new Set(['matches','minutes','goals','assists','xg','xa','shots','shotsOnTarget','shotsPer90','passes','completed','accuracy','conversion','delta','saves','savepct','conceded','xga','xgaOnTarget','clean','tackles','interceptions','recoveries','keypasses','progressive','psxg','prevented','points','bigChances','shotsOnTargetPerMatch','possession',...fotmob.fields])];
  const numeric = n => typeof n === 'number' && Number.isFinite(n);
  function normalize(value) { return String(value ?? '').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]/g,''); }
  function teamKey(name) {
    const key = normalize(name);
    // Public names in the validated league snapshots; no fuzzy matching.
    return ({deportivo:'deportivolacoruna',deportivoacoruna:'deportivolacoruna',deportivoalaves:'alaves',racingdesantander:'racingsantander',
      internazionale:'inter',acmilan:'milan',asroma:'roma',bayernmunich:'bayernmunchen',scfreiburg:'freiburg',svelversberg:'elversberg',hamburgsv:'hamburgersv',mainz:'mainz05',fcaugsburg:'augsburg',tsghoffenheim:'hoffenheim',fccologne:'1fckoln',scpaderborn07:'paderborn','1fcunionberlin':'unionberlin',staderennais:'rennes',asmonaco:'monaco',ajauxerre:'auxerre',lehavreac:'lehavre'})[key] || key;
  }
  // Reviewed source identities. IDs, club and original name must all agree.
  // Evidence and maintenance rules: docs/COMBINED.md#identidades-verificadas.
  const identities = [{club:'realmadrid',Understat:{id:'3423',name:'Kylian Mbappe-Lottin'},ESPN:{id:'86:231388',name:'Kylian Mbappé'},FotMob:{id:'701154',name:'Kylian Mbappé'}}];
  function identity(record,provider,club){
    return identities.find(entry=>entry.club===club&&entry[provider]?.id===String(record.id)&&normalize(entry[provider].name)===normalize(record.name));
  }
  function playerKey(record,provider,club){
    const known=identity(record,provider,club);
    return club+'|'+(known?'@'+known.Understat.id:normalize(record.name));
  }
  function index(rows,key) {
    const map = new Map();
    for (const row of rows) {
      const k = key(row);
      if (!map.has(k)) map.set(k,[]);
      map.get(k).push(row);
    }
    return map;
  }
  function combine(u,e,f=null) {
    const primarySource=u?.metadata?.source;
    if(primarySource==='Understat')understat.validate(u);
    else if(primarySource==='FotMob'&&u.metadata.profile==='full')fotmob.validate(u);
    else throw new Error('Falta la fuente principal completa.');
    espn.validate(e); if(f) fotmob.validate(f);
    const league=leagues.resolve(u.metadata);
    if(primarySource!==league.primary)throw new Error('Fuente principal no admitida para esta liga.');
    if (u.metadata.competition !== e.metadata.competition || u.metadata.season !== e.metadata.season) throw new Error('Las fuentes no corresponden a la misma competición y temporada.');
    if(f&&(f.metadata.competition!==u.metadata.competition||f.metadata.season!==u.metadata.season||primarySource==='FotMob'))throw new Error('Combinación de fuentes o ligas inválida.');
    const uTeams = new Map(u.teams.map(t=>[String(t.id),teamKey(t.name)]));
    const eTeams = new Map(e.teams.map(t=>[String(t.id),teamKey(t.name)]));
    // An aggregated transfer row has no single team_id; keep it solely Understat.
    const uKey = p => playerKey(p,primarySource,uTeams.get(String(p.team_id)));
    const eKey = p => playerKey(p,'ESPN',eTeams.get(String(p.team_id)));
    const uTeamIndex = index(u.teams,t=>teamKey(t.name)), eTeamIndex = index(e.teams,t=>teamKey(t.name));
    const fTeams = new Map((f?.teams||[]).map(t=>[String(t.id),teamKey(t.name)]));
    const fTeamIndex = index(f?.teams||[],t=>teamKey(t.name));
    const matchedIDs = new Set(), matchedFotmobIDs = new Set();
    const stats = {matched_players:0,understat_only_players:0,ambiguous_players:0,conflicting_players:0,espn_matched_players:0,fotmob_matched_players:0};
    function merge(primary,other,kind,additional=null) {
      const row = {...primary,id:(kind === 'player'?'combined:':'')+primary.id,fieldSources:{name:primarySource,team:primarySource,pos:primarySource},metricContexts:{},sourceRecords:{[primarySource]:{...primary}}};
      if (other) row.sourceRecords.ESPN = {...other};
      if(additional) row.sourceRecords.FotMob = {...additional};
      if(kind==='player'){row.positionResolution=positions.resolve(row.sourceRecords,primarySource);row.pos=row.positionResolution.position;row.fieldSources.pos=row.positionResolution.source;}
      const differences = [];
      for (const key of fields) {
        const chosen = [[primarySource,primary],['ESPN',other],['FotMob',additional]].find(([,r])=>r&&(numeric(r[key])||numeric(r.metricContexts?.[key]?.reportedPer90)));
        const source = chosen?.[0], sourceRow = chosen?.[1];
        row[key] = sourceRow && numeric(sourceRow[key]) ? sourceRow[key] : null;
        if (source) {
          row.fieldSources[key] = source;
          const original=sourceRow.metricContexts?.[key];
          row.metricContexts[key] = {...original,source,matches:original&&Object.hasOwn(original,'matches')?original.matches:sourceRow.matches??null,minutes:original&&Object.hasOwn(original,'minutes')?original.minutes:sourceRow.minutes??null};
        }
        if (new Set([primary,other,additional].filter(Boolean).map(r=>r[key]).filter(numeric)).size>1) differences.push(key);
      }
      row.combination = {matched:!!other||!!additional,conflicting_fields:differences};
      // Derived values must describe the same numerator/denominator cohort.
      function derived(key,a,b,calculate) {
        if (row.metricContexts[key]?.reportedValue && numeric(row[key])) return;
        if (numeric(row[a]) && numeric(row[b]) && row.fieldSources[a] === row.fieldSources[b]) {
          row[key] = calculate(row[a],row[b]);
          if (numeric(row[key])) { row.fieldSources[key] = row.fieldSources[a]; row.metricContexts[key] = {...row.metricContexts[a]}; return; }
        }
        row[key] = null; delete row.fieldSources[key]; delete row.metricContexts[key];
      }
      derived('conversion','goals','shots',(a,b)=>b>0?a/b*100:null);
      derived('delta','goals','xg',(a,b)=>a-b);
      derived('accuracy','completed','passes',(a,b)=>b>0?a/b*100:null);
      derived('savepct','saves','conceded',(a,b)=>a+b>0?a/(a+b)*100:null);
      if(kind==='player'){
        // A rate may use a different provider from the absolute total, but its
        // own numerator and minutes must always describe the same sample.
        row.savesPer90=null;
        for(const [source,record] of [[primarySource,primary],['ESPN',other],['FotMob',additional]]){
          if(!record)continue;
          const value=metrics.metric(record,'saves','90');if(!numeric(value)||value<0)continue;
          const original=metrics.context(record,'saves');
          row.savesPer90=value;row.fieldSources.savesPer90=source;
          row.metricContexts.savesPer90={...original,source,minutes:original&&Object.hasOwn(original,'minutes')?original.minutes:record.minutes??null,matches:original&&Object.hasOwn(original,'matches')?original.matches:record.matches??null,captured_at:original?.captured_at||({[primarySource]:u.metadata,ESPN:e.metadata,FotMob:f?.metadata||u.metadata})[source].imported_at,derived:numeric(original?.reportedPer90)?'published_per90':'same_source_per90'};
          break;
        }
      }
      return row;
    }
    function clubFor(teamMap,teamIndex){return p=>{const club=teamMap.get(String(p.team_id));return club&&teamIndex.get(club)?.length===1?club:null;};}
    const primaryClub=clubFor(uTeams,uTeamIndex);
    const espnLinks=identitiesAPI.link(u.players,e.players,{primaryClub,secondaryClub:clubFor(eTeams,eTeamIndex),primaryKey:uKey,secondaryKey:eKey});
    // Only an exact, reviewed or equal-token ESPN match may supply published
    // aliases as a bridge to the third provider. Never propagate a guessed alias.
    const fotmobInputs=new Map(u.players.map(p=>{
      const linked=espnLinks.matches.get(p);
      return [p,linked?.confidence>=4?{...p,nameAliases:[...new Set([p.name,...identitiesAPI.publishedNames(linked.record),...identitiesAPI.publishedNames(p)])].slice(0,8)}:p];
    }));
    const fotmobLinks=identitiesAPI.link([...fotmobInputs.values()],f?.players||[],{primaryClub,secondaryClub:clubFor(fTeams,fTeamIndex),primaryKey:uKey,secondaryKey:p=>playerKey(p,'FotMob',fTeams.get(String(p.team_id)))});
    const players = u.players.map(p=>{
      const em=espnLinks.matches.get(p),fm=fotmobLinks.matches.get(fotmobInputs.get(p)),other=em?.record||null,extra=fm?.record||null;
      const row=merge(p,other,'player',extra);row.combination.match_methods={};row.combination.match_evidence={};
      if(em)row.combination.match_methods.ESPN=em.method;
      if(fm)row.combination.match_methods.FotMob=fm.method;
      if(em)row.combination.match_evidence.ESPN={names:em.names,source_id:other.id};
      if(fm)row.combination.match_evidence.FotMob={names:fm.names,source_id:extra.id,...(fm.method==='provider_alias_team'&&em?.confidence>=4?{alias_bridge_source:'ESPN',alias_bridge_id:other.id}:{})};
      row.combination.ambiguous=espnLinks.states.get(p)?.ambiguous||fotmobLinks.states.get(fotmobInputs.get(p))?.ambiguous||false;
      if(other||extra)stats.matched_players++;else stats.understat_only_players++;
      if(other){stats.espn_matched_players++;matchedIDs.add(other.id);}
      if(extra){stats.fotmob_matched_players++;matchedFotmobIDs.add(extra.id);}
      if(row.combination.ambiguous)stats.ambiguous_players++;
      if(row.combination.conflicting_fields.length)stats.conflicting_players++;
      return row;
    });
    const et = index(e.teams,t=>teamKey(t.name)), ut = index(u.teams,t=>teamKey(t.name));
    const teams = u.teams.map(t=>{
      const club = teamKey(t.name), candidates = et.get(club) || [];
      const fc=fTeamIndex.get(club)||[],extra=fc.length===1&&ut.get(club)?.length===1?fc[0]:null;
      return merge(t,club && candidates.length === 1 && ut.get(teamKey(t.name)).length === 1 ? candidates[0] : null,'team',extra);
    });
    stats.position_corrected_players=players.filter(p=>p.pos!==p.sourceRecords[primarySource].pos).length;
    stats.position_conflicting_players=players.filter(p=>p.positionResolution.conflicting).length;
    stats.generic_name_matches=players.reduce((n,p)=>n+Object.values(p.combination.match_methods).filter(m=>!['name_team','verified_identity'].includes(m)).length,0);
    const sources = {[primarySource]:{...u.metadata},ESPN:{...e.metadata}};
    if(f) sources.FotMob={...f.metadata};
    return {metadata:{...u.metadata,league_key:league.id,primary_source:primarySource,kind:'combined',source:primarySource+' + ESPN'+(f?' + FotMob':''),url:u.metadata.url,complete:false,sources,combination:{...stats,understat_only_players:primarySource==='Understat'?stats.understat_only_players:0,primary_only_players:stats.understat_only_players,espn_players_not_joined:e.players.length-matchedIDs.size,fotmob_players_not_joined:f?f.players.length-matchedFotmobIDs.size:0},
      imported_at:new Date(Math.min(...Object.values(sources).map(m=>Date.parse(m.imported_at)))).toISOString(),
      notes:'Catálogo y valores prioritarios de '+primarySource+'. ESPN'+(f?' y FotMob':'')+' complementan coincidencias inequívocas de nombres, iniciales o apellidos y equipo, o identidad revisada. Las posiciones usan consenso entre fuentes y, sin consenso, la posición de ficha FotMob cuando existe; las demás métricas conservan su prioridad. '+stats.matched_players+'/'+players.length+' jugadores complementados. Las capturas pueden cubrir distintos partidos; cada campo conserva su fuente y PJ. Los casos dudosos mantienen la fuente principal. Las tasas usan minutos y PJ de la fuente de su numerador o su tasa publicada; no se infieren minutos de ESPN ni xG recibidos de porteros.'},
      players,teams,matches:u.matches.map(m=>({...m}))};
  }
  function isCombined(data){return data?.metadata?.kind==='combined'||data?.metadata?.source===SOURCE;}
  function coverage(data){
    const metrics=node?require('./metrics.js'):root.GradaMetrics;
    const keys=['goals','assists','shots','xg','xa','minutes','completedPer90','accuracy','lineBreakingPasses','tackles','interceptions','recoveries','clearances','blocks','shotsOnTargetPer90','dribblesPer90','longBallsPer90','chancesCreated','bigChancesCreated','bigChancesMissed','yellowCards','redCards','saves','savepct','conceded','prevented','clean','highClaims','sweeperActions','penaltiesSaved'];
    const counts=Object.fromEntries(keys.map(k=>[k,data.players.filter(p=>metrics.metric(p,k,'total')!==null).length]));
    const teamKeys=['goals','conceded','xg','xga','matches','points','clean','shotsOnTargetPerMatch','bigChances'];
    const team_counts=Object.fromEntries(teamKeys.map(k=>[k,data.teams.filter(t=>metrics.metric(t,k,'total')!==null).length]));
    const missing=[...keys.filter(k=>!counts[k]),...teamKeys.filter(k=>!team_counts[k]).map(k=>'equipos: '+k)];
    return {counts,team_counts,missing,complete:!missing.length};
  }
  const api = {combine,normalize,SOURCE,isCombined,coverage};
  if (node) module.exports = api; else root.GradaCombined = api;
})(typeof window === 'object' ? window : globalThis);
