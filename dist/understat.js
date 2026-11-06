(function(root) {
  'use strict';
  function validate(data) {
    const m = data?.metadata, numeric = n => typeof n === 'number' && Number.isFinite(n) && n >= 0;
    if (m?.source !== 'Understat' || m.competition !== 'LaLiga' || m.season !== '2026/27' || m.season_id !== 2026 ||
        !Number.isFinite(Date.parse(m.imported_at)) || typeof m.notes !== 'string' || m.notes.length > 2000 ||
        !Array.isArray(data.teams) || data.teams.length !== 20 || !Array.isArray(data.players) || !data.players.length || data.players.length > 2000 ||
        !Array.isArray(data.matches) || !data.matches.length || data.matches.length > 380 || m.imported_matches !== data.matches.length || m.available_matches !== 380) throw new Error('Captura de Understat inválida.');
    for (const rows of [data.teams,data.players,data.matches]) {
      if (new Set(rows.map(r=>String(r.id))).size !== rows.length) throw new Error('Identidades duplicadas.');
      for (const p of rows) {
        if (!/^\d{1,12}$/.test(p.id)) throw new Error('Identidad inválida.');
        if ('name' in p && (typeof p.name !== 'string' || !p.name.trim() || p.name.length > 250)) throw new Error('Nombre inválido.');
        for (const key of ['matches','minutes','goals','assists','shots','xg','xga','xa','keypasses','home_goals','away_goals','home_xg','away_xg']) {
          if (p[key] !== undefined && p[key] !== null && !numeric(p[key])) throw new Error('Métrica inválida.');
        }
      }
    }
    if (data.players.some(p=>p.xga!==null || p.conceded!==null || p.saves!==null || p.psxg!==null)) throw new Error('Métrica de portero sin respaldo.');
    const ids = new Set(data.teams.map(t=>String(t.id)));
    if (data.matches.some(m=>!ids.has(String(m.home_id)) || !ids.has(String(m.away_id)))) throw new Error('Equipo desconocido.');
    if (data.teams.reduce((s,t)=>s+t.matches,0) !== 2*data.matches.length ||
        data.teams.reduce((s,t)=>s+t.goals,0) !== data.teams.reduce((s,t)=>s+t.conceded,0)) throw new Error('Cobertura incoherente.');
    return data;
  }
  if (typeof module === 'object' && module.exports) module.exports = {validate};
  else root.GradaUnderstat = {validate};
})(typeof window === 'object' ? window : globalThis);
