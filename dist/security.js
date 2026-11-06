(function(root) {
  'use strict';
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
  function sourceURL(source) { return SOURCE_URLS[source] || '#'; }
  const api = {csvCell,sourceURL};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GradaSecurity = api;
})(typeof window === 'object' ? window : globalThis);
