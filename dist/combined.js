(function(root) {
  'use strict';
  const node = typeof module === 'object' && module.exports;
  const understat = node ? require('./understat.js') : root.GradaUnderstat;
  const espn = node ? require('./laliga.js') : root.GradaLaLiga;
  const SOURCE = 'Understat + ESPN';
  const fields = ['matches','minutes','goals','assists','xg','xa','shots','passes','completed','accuracy','conversion','delta','saves','savepct','conceded','xga','clean','tackles','interceptions','keypasses','progressive','psxg','prevented'];
  const numeric = n => typeof n === 'number' && Number.isFinite(n);
  function normalize(value) { return String(value ?? '').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]/g,''); }
  function teamKey(name) {
    const key = normalize(name);
    // Public names in the two validated league snapshots; no fuzzy matching.
    return key === 'deportivo' ? 'deportivolacoruna' : key;
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
  function combine(u,e) {
    understat.validate(u); espn.validate(e);
    if (u.metadata.competition !== e.metadata.competition || u.metadata.season !== e.metadata.season) throw new Error('Las fuentes no corresponden a la misma competición y temporada.');
    const uTeams = new Map(u.teams.map(t=>[String(t.id),teamKey(t.name)]));
    const eTeams = new Map(e.teams.map(t=>[String(t.id),teamKey(t.name)]));
    // An aggregated transfer row has no single team_id; keep it solely Understat.
    const uKey = p => uTeams.get(String(p.team_id))+'|'+normalize(p.name);
    const eKey = p => eTeams.get(String(p.team_id))+'|'+normalize(p.name);
    const uTeamIndex = index(u.teams,t=>teamKey(t.name)), eTeamIndex = index(e.teams,t=>teamKey(t.name));
    const ui = index(u.players.filter(p=>uTeams.has(String(p.team_id))),uKey), ei = index(e.players,eKey);
    const matchedIDs = new Set();
    const stats = {matched_players:0,understat_only_players:0,ambiguous_players:0,conflicting_players:0};
    function merge(primary,other,kind) {
      const row = {...primary,id:(kind === 'player'?'combined:':'')+primary.id,fieldSources:{name:'Understat',team:'Understat',pos:'Understat'},metricContexts:{},sourceRecords:{Understat:{...primary}}};
      if (other) row.sourceRecords.ESPN = {...other};
      const differences = [];
      for (const key of fields) {
        const source = numeric(primary[key]) ? 'Understat' : other && numeric(other[key]) ? 'ESPN' : null;
        row[key] = source ? (source === 'Understat' ? primary[key] : other[key]) : null;
        if (source) {
          const sourceRow = source === 'Understat' ? primary : other;
          row.fieldSources[key] = source;
          row.metricContexts[key] = {source,matches:sourceRow.matches ?? null,minutes:sourceRow.minutes ?? null};
        }
        if (other && numeric(primary[key]) && numeric(other[key]) && primary[key] !== other[key]) differences.push(key);
      }
      row.combination = {matched:!!other,conflicting_fields:differences};
      // Derived values must describe the same numerator/denominator cohort.
      function derived(key,a,b,calculate) {
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
      const row = merge(p,other,'player');
      row.combination.ambiguous = candidates.length > 0 && !unique;
      if (other) { stats.matched_players++; matchedIDs.add(other.id); }
      else stats.understat_only_players++;
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
    return {metadata:{...u.metadata,source:SOURCE,url:u.metadata.url,complete:false,sources,combination:{...stats,espn_players_not_joined:e.players.length-matchedIDs.size},
      imported_at:new Date(Math.min(Date.parse(u.metadata.imported_at),Date.parse(e.metadata.imported_at))).toISOString(),
      notes:'Catálogo y valores prioritarios de Understat. ESPN complementa únicamente coincidencias inequívocas de nombre y equipo. '+stats.matched_players+'/'+players.length+' jugadores combinados. Las capturas pueden cubrir distintos partidos; cada campo conserva su fuente y PJ. Los casos dudosos mantienen Understat. Las tasas usan minutos y PJ de la fuente de su numerador; no se infieren minutos de ESPN ni xG recibidos de porteros.'},
      players,teams,matches:u.matches.map(m=>({...m}))};
  }
  const api = {combine,normalize,SOURCE};
  if (node) module.exports = api; else root.GradaCombined = api;
})(typeof window === 'object' ? window : globalThis);
