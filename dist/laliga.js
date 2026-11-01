(function (root) {
  'use strict';
  const YEAR = 2026;
  const STANDINGS = 'https://site.api.espn.com/apis/v2/sports/soccer/esp.1/standings?season=2026';
  const rosterURL = id => 'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/teams/' + encodeURIComponent(id) + '/roster?season=2026';
  const numeric = n => typeof n === 'number' && Number.isFinite(n) && n >= 0;
  function season(doc) {
    if (doc?.season?.year !== YEAR || !/2026[–/-](?:20)?27/.test(doc.season.displayName || doc.season.name || '')) {
      throw new Error('La fuente no confirma la temporada 2026/27.');
    }
  }
  function entries(doc) {
    season(doc);
    const rows = (doc.children || []).flatMap(c => c.standings?.entries || []);
    if (rows.length !== 20 || new Set(rows.map(r => String(r.team?.id))).size !== 20 || rows.some(r => !/^\d+$/.test(r.team?.id))) {
      throw new Error('La clasificación no contiene los 20 equipos esperados.');
    }
    return rows;
  }
  function statsMap(stats) {
    return Object.fromEntries((stats || []).filter(s => typeof s.name === 'string').map(s => [s.name,numeric(s.value) ? s.value : null]));
  }
  function adapt(standings, rosters, importedAt = new Date().toISOString()) {
    const rows = entries(standings), players = [], teams = [];
    if (!Array.isArray(rosters) || rosters.length !== rows.length) throw new Error('Faltan plantillas: se conserva la captura anterior.');
    rows.forEach(row => {
      const id = String(row.team.id), name = row.team.displayName, s = statsMap(row.stats);
      if (!name || ![s.gamesPlayed,s.pointsFor,s.pointsAgainst].every(numeric)) throw new Error('Clasificación incompleta.');
      teams.push({id,name,matches:s.gamesPlayed,minutes:null,goals:s.pointsFor,conceded:s.pointsAgainst,xg:null,xga:null,delta:null,passes:null,accuracy:null});
      const roster = rosters.find(r => String(r.team?.id) === id);
      if (!roster) throw new Error('Falta una plantilla.');
      season(roster);
      if (!Array.isArray(roster.athletes) || !roster.athletes.length) throw new Error('Plantilla vacía.');
      roster.athletes.forEach(a => {
        if (!a.id || !a.displayName) throw new Error('Jugador sin identidad.');
        const categories = a.statistics?.splits?.categories || [];
        const p = statsMap(categories.flatMap(c => c.stats || []));
        const pos = ({G:'POR',GK:'POR',D:'DEF',M:'MED',F:'DEL'})[a.position?.abbreviation] || '—';
        const value = key => p[key] ?? null;
        const goals = value('totalGoals'), shots = value('totalShots');
        const saves = pos === 'POR' ? value('saves') : null, conceded = pos === 'POR' ? value('goalsConceded') : null;
        players.push({id:id+':'+a.id,name:a.displayName,team_id:id,team:name,pos,matches:value('appearances'),minutes:null,
          goals,assists:value('goalAssists'),shots,conversion:numeric(goals)&&numeric(shots)&&shots>0?goals/shots*100:null,
          saves,conceded,savepct:numeric(saves)&&numeric(conceded)&&saves+conceded>0?saves/(saves+conceded)*100:null,
          xg:null,xa:null,xga:null,psxg:null,prevented:null,delta:null,passes:null,completed:null,accuracy:null,
          clean:null,tackles:null,interceptions:null,keypasses:null,progressive:null});
      });
    });
    const matches = teams.reduce((sum,t) => sum+t.matches,0)/2;
    const payload = {metadata:{source:'ESPN',url:'https://www.espn.com/soccer/standings/_/league/esp.1/season/2026',competition:'LaLiga',season:'2026/27',
      season_id:YEAR,imported_matches:matches,available_matches:380,complete:false,imported_at:importedAt,
      provider_timestamps:rosters.map(r=>r.timestamp).filter(Boolean),
      notes:'20 equipos. Jugadores de las plantillas actuales; puede faltar la aportación de jugadores que hayan salido. Temporada en curso. ESPN no ofrece xG, minutos, pases ni PSxG en estos endpoints.'},
      players,teams,matches:[]};
    validate(payload);
    return payload;
  }
  function validate(data) {
    if (data?.metadata?.source !== 'ESPN' || data.metadata.season !== '2026/27' || data.metadata.season_id !== YEAR ||
        !Number.isFinite(Date.parse(data.metadata.imported_at)) || !Array.isArray(data.teams) || data.teams.length !== 20 ||
        !Array.isArray(data.players) || data.players.length < 20 || new Set(data.teams.map(t=>String(t.id))).size !== 20 ||
        new Set(data.players.map(p=>p.id)).size !== data.players.length || !Array.isArray(data.matches)) throw new Error('Captura de LaLiga inválida.');
    const teamIDs = new Set(data.teams.map(t=>String(t.id)));
    for (const row of [...data.teams,...data.players]) {
      if (!row.id || typeof row.name !== 'string' || !row.name.trim()) throw new Error('Registro sin identidad.');
      for (const key of ['matches','minutes','goals','assists','shots','saves','conceded','xg','xga','xa','passes','savepct','conversion']) {
        if (row[key] !== undefined && row[key] !== null && !numeric(row[key])) throw new Error('Métrica no válida: '+key);
      }
    }
    if (data.players.some(p=>!teamIDs.has(String(p.team_id)))) throw new Error('Jugador sin equipo válido.');
    // These endpoints do not supply minutes or expected-goal models. Reject a cache that claims otherwise.
    if ([...data.players,...data.teams].some(p=>p.minutes!==null || p.xg!==null || p.xga!==null) || data.players.some(p=>p.xa!==null || p.psxg!==null)) throw new Error('Métrica sin respaldo en la fuente.');
    const played = data.teams.reduce((sum,t)=>sum+t.matches,0)/2;
    if (!Number.isInteger(played) || played < 0 || played > 380 || played !== data.metadata.imported_matches ||
        data.teams.some(t=>![t.matches,t.goals,t.conceded].every(numeric)) ||
        data.teams.reduce((sum,t)=>sum+t.goals,0)!==data.teams.reduce((sum,t)=>sum+t.conceded,0)) throw new Error('Clasificación incoherente.');
    return data;
  }
  async function fetchSeason({fetchImpl = fetch,signal,onProgress = () => {}} = {}) {
    const controller = new AbortController();
    const cancel = () => controller.abort();
    if (signal?.aborted) cancel();
    signal?.addEventListener('abort',cancel,{once:true});
    const timer = setTimeout(cancel,75000);
    async function json(url) {
      const response = await fetchImpl(url,{cache:'no-store',signal:controller.signal});
      if (!response.ok) throw new Error('La fuente ha respondido con HTTP '+response.status+'.');
      return response.json();
    }
    try {
      const standings = await json(STANDINGS), rows = entries(standings), rosters = new Array(rows.length);
      let cursor = 0, done = 0;
      await Promise.all(Array.from({length:3},async () => {
        while (cursor < rows.length) {
          const index = cursor++;
          rosters[index] = await json(rosterURL(rows[index].team.id));
          onProgress(++done,rows.length);
        }
      }));
      return adapt(standings,rosters);
    } catch (error) { controller.abort(); throw error; }
    finally { clearTimeout(timer); signal?.removeEventListener('abort',cancel); }
  }
  const api = {adapt,validate,fetchSeason,STANDINGS,rosterURL};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GradaLaLiga = api;
})(typeof window === 'object' ? window : globalThis);
