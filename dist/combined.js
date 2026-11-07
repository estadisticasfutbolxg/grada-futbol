(function(root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const understat = node ? require('./understat.js') : root.GradaUnderstat;
  const espn = node ? require('./laliga.js') : root.GradaLaLiga;
  const fotmob = node ? require('./fotmob.js') : root.GradaFotmob;
  const SOURCE = 'Understat + ESPN';
  const fields = [...new Set(['matches','minutes','goals','assists','xg','xa','shots','passes','completed','accuracy','conversion','delta','saves','savepct','conceded','xga','clean','tackles','interceptions','recoveries','keypasses','progressive','psxg','prevented',...fotmob.fields])];
  const numeric = n => typeof n === 'number' && Number.isFinite(n);
  function normalize(value) { return String(value ?? '').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]/g,''); }
  function teamKey(name) {
    const key = normalize(name);
    // Public names in the validated league snapshots; no fuzzy matching.
    return ({deportivo:'deportivolacoruna',deportivoacoruna:'deportivolacoruna',deportivoalaves:'alaves'})[key] || key;
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
    understat.validate(u); espn.validate(e); if(f) fotmob.validate(f);
    if (u.metadata.competition !== e.metadata.competition || u.metadata.season !== e.metadata.season) throw new Error('Las fuentes no corresponden a la misma competición y temporada.');
    const uTeams = new Map(u.teams.map(t=>[String(t.id),teamKey(t.name)]));
    const eTeams = new Map(e.teams.map(t=>[String(t.id),teamKey(t.name)]));
    // An aggregated transfer row has no single team_id; keep it solely Understat.
    const uKey = p => playerKey(p,'Understat',uTeams.get(String(p.team_id)));
    const eKey = p => playerKey(p,'ESPN',eTeams.get(String(p.team_id)));
    const uTeamIndex = index(u.teams,t=>teamKey(t.name)), eTeamIndex = index(e.teams,t=>teamKey(t.name));
    const ui = index(u.players.filter(p=>uTeams.has(String(p.team_id))),uKey), ei = index(e.players,eKey);
    const fTeams = new Map((f?.teams||[]).map(t=>[String(t.id),teamKey(t.name)]));
    const fi = index(f?.players||[],p=>playerKey(p,'FotMob',fTeams.get(String(p.team_id))));
    const fTeamIndex = index(f?.teams||[],t=>teamKey(t.name));
    const matchedIDs = new Set(), matchedFotmobIDs = new Set();
    const stats = {matched_players:0,understat_only_players:0,ambiguous_players:0,conflicting_players:0,espn_matched_players:0,fotmob_matched_players:0};
    function merge(primary,other,kind,additional=null) {
      const row = {...primary,id:(kind === 'player'?'combined:':'')+primary.id,fieldSources:{name:'Understat',team:'Understat',pos:'Understat'},metricContexts:{},sourceRecords:{Understat:{...primary}}};
      if (other) row.sourceRecords.ESPN = {...other};
      if(additional) row.sourceRecords.FotMob = {...additional};
      const differences = [];
      for (const key of fields) {
        const chosen = [['Understat',primary],['ESPN',other],['FotMob',additional]].find(([,r])=>r&&(numeric(r[key])||numeric(r.metricContexts?.[key]?.reportedPer90)));
        const source = chosen?.[0], sourceRow = chosen?.[1];
        row[key] = sourceRow && numeric(sourceRow[key]) ? sourceRow[key] : null;
        if (source) {
          row.fieldSources[key] = source;
          row.metricContexts[key] = {...sourceRow.metricContexts?.[key],source,matches:sourceRow.matches ?? null,minutes:sourceRow.minutes ?? null};
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
      return row;
    }
    const players = u.players.map(p=>{
      const key = uKey(p), candidates = ei.get(key) || [], own = ui.get(key) || [];
      const sameKeeperRole = candidates.length === 1 && ((p.pos === 'POR') === (candidates[0].pos === 'POR'));
      const club = uTeams.get(String(p.team_id));
      const unique = !!club && !!normalize(p.name) && uTeamIndex.get(club)?.length === 1 && eTeamIndex.get(club)?.length === 1 && own.length === 1 && candidates.length === 1 && sameKeeperRole;
      const other = unique ? candidates[0] : null;
      const fc = fi.get(key)||[];
      const fRole = fc.length===1&&((p.pos==='POR')===(fc[0].pos==='POR'));
      const fUnique = !!club&&!!normalize(p.name)&&own.length===1&&fc.length===1&&fRole&&uTeamIndex.get(club)?.length===1&&fTeamIndex.get(club)?.length===1;
      const extra = fUnique?fc[0]:null;
      const row = merge(p,other,'player',extra);
      row.combination.match_methods={};
      if(other)row.combination.match_methods.ESPN=identity(p,'Understat',club)?'verified_identity':'name_team';
      if(extra)row.combination.match_methods.FotMob=identity(p,'Understat',club)?'verified_identity':'name_team';
      row.combination.ambiguous = (candidates.length > 0 && !unique)||(fc.length>0&&!fUnique);
      if (other||extra) stats.matched_players++; else stats.understat_only_players++;
      if(other){stats.espn_matched_players++;matchedIDs.add(other.id);}
      if(extra){stats.fotmob_matched_players++;matchedFotmobIDs.add(extra.id);}
      if (row.combination.ambiguous) stats.ambiguous_players++;
      if (row.combination.conflicting_fields.length) stats.conflicting_players++;
      return row;
    });
    const et = index(e.teams,t=>teamKey(t.name)), ut = index(u.teams,t=>teamKey(t.name));
    const teams = u.teams.map(t=>{
      const club = teamKey(t.name), candidates = et.get(club) || [];
      return merge(t,club && candidates.length === 1 && ut.get(teamKey(t.name)).length === 1 ? candidates[0] : null,'team');
    });
    const sources = {Understat:{...u.metadata},ESPN:{...e.metadata}};
    if(f) sources.FotMob={...f.metadata};
    return {metadata:{...u.metadata,kind:'combined',source:SOURCE+(f?' + FotMob':''),url:u.metadata.url,complete:false,sources,combination:{...stats,espn_players_not_joined:e.players.length-matchedIDs.size,fotmob_players_not_joined:f?f.players.length-matchedFotmobIDs.size:0},
      imported_at:new Date(Math.min(...Object.values(sources).map(m=>Date.parse(m.imported_at)))).toISOString(),
      notes:'Catálogo y valores prioritarios de Understat. ESPN y, cuando está disponible, FotMob complementan coincidencias inequívocas de nombre y equipo. '+stats.matched_players+'/'+players.length+' jugadores combinados. Las capturas pueden cubrir distintos partidos; cada campo conserva su fuente y PJ. Los casos dudosos mantienen Understat. Las tasas usan minutos y PJ de la fuente de su numerador; no se infieren minutos de ESPN ni xG recibidos de porteros.'},
      players,teams,matches:u.matches.map(m=>({...m}))};
  }
  function isCombined(data){return data?.metadata?.kind==='combined'||data?.metadata?.source===SOURCE;}
  const api = {combine,normalize,SOURCE,isCombined};
  if (node) module.exports = api; else root.GradaCombined = api;
})(typeof window === 'object' ? window : globalThis);
