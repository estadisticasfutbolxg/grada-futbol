(function(root) {
  'use strict';
  const leagues=typeof module==='object'&&module.exports?require('./leagues.js'):root.GradaLeagues;
  const SOURCE_URLS = Object.freeze({
    'StatsBomb Open Data':'https://github.com/statsbomb/open-data',
    ESPN:'https://www.espn.com/soccer/standings/_/league/esp.1/season/2026',
    Understat:'https://understat.com/league/La_liga/2026'
  });
  // Quoting CSV syntax alone does not stop spreadsheet formulas in source text.
  function csvCell(value) {
    let text = String(value ?? '');
    if (typeof value === 'string' && /^[\s\u0000-\u001f]*[=+@\-]/u.test(text)) text = "'"+text;
    return '"'+text.replace(/"/g,'""')+'"';
  }
  function sourceURL(source,leagueId='laliga') {
    if(leagueId==='all'&&source==='FotMob')return 'https://www.fotmob.com/';
    if(leagueId==='all'&&source==='ESPN')return 'https://www.espn.com/soccer/';
    if(source==='FotMob'){const l=leagues.get(leagueId);return 'https://www.fotmob.com/leagues/'+l.fotmobId+'/stats/season/'+l.fotmobSeason+'/players/accurate_pass/'+l.fotmobSlug;}
    if(source==='ESPN'){const l=leagues.get(leagueId);return 'https://www.espn.com/soccer/standings/_/league/'+l.espn+'/season/2026';}
    return SOURCE_URLS[source] || '#';
  }
  const api = {csvCell,sourceURL};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GradaSecurity = api;
})(typeof window === 'object' ? window : globalThis);
