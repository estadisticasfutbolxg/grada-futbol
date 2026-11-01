'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const baseline = window.GRADA_DATA;
let data = baseline, loaded = !!(data?.metadata && Array.isArray(data.players) && data.players.length && Array.isArray(data.teams));
let liveData = null, view = 'overview', pos = 'Todos', unit = 'total', sort = 'goals', direction = -1, choices = [], refreshing = false, interaction = 0;
const CACHE = 'grada:espn:laliga:2026-27:v1';
const labels = {name:'Jugador',team:'Equipo',pos:'Posición',matches:'PJ',minutes:'Min',goals:'Goles',assists:'Asist.',xg:'xG',xa:'xA derivada',conversion:'Conv. %',delta:'Goles − xG',passes:'Pases',completed:'Completados',accuracy:'Pases %',shots:'Tiros',saves:'Paradas',savepct:'Paradas %',conceded:'Goles rec.',xga:'xG recibidos',xga90:'xG recibidos /90',conceded90:'Goles rec. /90',psxg:'PSxG',prevented:'Goles evitados',clean:'Porterías a 0',tackles:'Entradas',interceptions:'Intercepc.',keypasses:'Pases clave',progressive:'Pases progres.'};
const descriptions = {
  rank:'Puesto dentro de los resultados visibles y del orden seleccionado. No es una clasificación oficial.',
  name:'Nombre del jugador. Selecciónalo para abrir su ficha.',team:'Equipo al que corresponden estas estadísticas.',pos:'Posición: POR portero, DEF defensa, MED centrocampista y DEL delantero.',
  matches:'Partidos en los que participó el jugador; en equipos, partidos disputados.',
  minutes:'Minutos de juego. En StatsBomb se suman intervalos de alineación hasta 90 o 120 minutos, sin añadido.',
  goals:'Goles marcados por el jugador. Los goles de equipo incluyen autogoles rivales; se excluyen las tandas.',
  assists:'Pases identificados como asistencia de gol por el proveedor.',
  xg:'Goles esperados: suma de la probabilidad de gol de los tiros antes de conocer su resultado. Modelo de StatsBomb; incluye penaltis de partido y excluye tandas.',
  xa:'xA derivada: suma del xG de los tiros enlazados con un pase del jugador. No es un modelo independiente de todos los pases.',
  conversion:'Porcentaje de conversión = goles marcados ÷ tiros realizados × 100. Sin tiros se muestra —.',
  delta:'Goles marcados menos xG acumulado. Un valor positivo indica más goles que los esperados por el modelo.',
  passes:'Intentos de pase; incluye completados y no completados.',completed:'Pases que llegaron a su destino según el proveedor.',accuracy:'Precisión de pase = pases completados ÷ intentos × 100.',
  shots:'Tiros realizados, incluidos bloqueados y fuera de portería. Tandas excluidas.',
  saves:'Tiros detenidos por el portero. En StatsBomb: Saved, Saved to Post o Saved Off Target.',
  savepct:'Porcentaje de paradas = paradas ÷ (paradas + goles recibidos) × 100. Incluye autogoles encajados y conserva su denominador al cambiar de unidad.',
  conceded:'Goles recibidos durante los intervalos en los que el portero estuvo en portería, incluidos autogoles. En equipos: goles encajados en los marcadores.',
  xga:'xG recibidos: suma del xG previo al tiro de todos los tiros rivales mientras el portero estuvo en portería. En equipos: xG de los rivales. No es PSxG.',
  xga90:'Tasa de xG recibidos por 90 minutos = xG recibidos × 90 ÷ minutos jugados. Es una frecuencia, no un porcentaje ni PSxG. Sin minutos válidos se muestra —.',
  conceded90:'Tasa de goles recibidos por 90 minutos = goles encajados × 90 ÷ minutos jugados. Incluye autogoles recibidos. Sin minutos válidos se muestra —.',
  psxg:'Goles esperados después del tiro: modelo que considera cómo llegó el balón a portería. No está disponible en estas fuentes y se muestra —.',
  prevented:'Goles evitados: requiere un modelo PSxG adecuado. No se calcula restando goles recibidos al xG previo al tiro; aquí se muestra —.',
  clean:'Partidos sin encajar del portero con al menos 60 minutos en portería, según la definición de la importación StatsBomb.',
  tackles:'Duelos de tipo Tackle en StatsBomb. El volumen depende del tiempo defendiendo y del sistema de juego.',
  interceptions:'Eventos de intercepción de pases rivales.',keypasses:'Pases que generan un tiro: pass.shot_assist en StatsBomb.',
  progressive:'Pases completados con al menos 10 metros de avance longitudinal. Definición de GRADA: 120 unidades de StatsBomb equivalen a 105 metros.'
};
const rates = GradaMetrics.rates;
const playerkeys = ['matches','minutes','goals','assists','xg','xa','shots','conversion','delta','passes','accuracy','keypasses','progressive','tackles','interceptions'];
const keeperkeys = ['matches','minutes','saves','savepct','conceded','conceded90','xga','xga90','psxg','prevented','clean','passes','accuracy'];
const teamkeys = ['matches','goals','xg','delta','conceded','xga','passes','accuracy'];
function esc(v) { return String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function initials(s) { return String(s).split(' ').map(w=>w[0]).slice(0,2).join(''); }
function players() { return loaded ? data.players : []; }
function teams() { return loaded ? data.teams : []; }
function isLive() { return data?.metadata?.source === 'ESPN'; }
function source() { return loaded ? data.metadata.source : 'Sin datos'; }
function metric(p,k) { return GradaMetrics.metric(p,k,unit); }
function columnLabel(k,isTeam = view === 'teams') {
  return (k === 'name' && isTeam ? 'Equipo' : labels[k]) + (unit === '90' && rates.has(k) ? ' /90' : '');
}
function description(k,isTeam = view === 'teams') {
  let text = k === 'name' && isTeam ? 'Nombre del equipo. Selecciónalo para abrir su ficha.' : descriptions[k];
  if (unit === '90' && rates.has(k)) text += ' Se muestra por 90 minutos: total × 90 ÷ minutos; sin minutos válidos, —.';
  if (isLive() && ['minutes','xg','xa','xga','xga90','conceded90','passes','completed','accuracy','progressive','keypasses','tackles','interceptions','clean','delta'].includes(k)) text += ' No disponible en la consulta de ESPN de LaLiga 2026/27.';
  return text + ' Un guion (—) significa que el dato no está disponible.';
}
function val(p,k) {
  const n = metric(p,k);
  if (n === null) return '—';
  const decimals = GradaMetrics.fixedRates[k] || unit === '90' && rates.has(k) ? 2 : ['xg','xa','delta','conversion','savepct','xga','psxg','prevented','minutes'].includes(k) ? 1 : 0;
  return new Intl.NumberFormat('es-ES',{maximumFractionDigits:decimals}).format(n);
}
function compare(a,b,key = sort) {
  const x = ['name','team','pos'].includes(key) ? a[key] ?? null : metric(a,key), y = ['name','team','pos'].includes(key) ? b[key] ?? null : metric(b,key);
  if (x === null && y === null) return a.name.localeCompare(b.name);
  if (x === null) return 1;
  if (y === null) return -1;
  const d = typeof x === 'string' ? x.localeCompare(y) : x-y;
  return d ? direction*d : a.name.localeCompare(b.name);
}
function keysFor(p,isTeam = false) { return (isTeam ? teamkeys : p.pos === 'POR' ? keeperkeys : playerkeys).filter(k=>unit !== '90' || !GradaMetrics.fixedRates[k]); }
function columns() {
  let base = view === 'teams' ? ['name',...teamkeys] : pos === 'POR' ? ['name','team','minutes','saves','savepct','conceded',...(unit === 'total' ? ['conceded90'] : []),'xga',...(unit === 'total' ? ['xga90'] : []),'clean'] : pos === 'DEF' ? ['name','team','minutes','tackles','interceptions','passes','accuracy','progressive'] : pos === 'MED' ? ['name','team','minutes','goals','assists','xa','keypasses','accuracy'] : ['name','team','pos','minutes','goals','assists','xg','xa','conversion'];
  if (labels[sort] && !base.includes(sort)) base.push(sort);
  return base;
}
function rows() {
  const search = $('#search').value.trim().toLocaleLowerCase('es'), tf = $('#teamfilter').value;
  return (view === 'teams' ? teams() : players().filter(p=>(pos === 'Todos' || p.pos === pos) && (!tf || p.team === tf))).filter(p=>(p.name+' '+(p.team || '')).toLocaleLowerCase('es').includes(search)).sort((a,b)=>compare(a,b));
}
// A body-level tooltip stays visible outside the horizontally scrolling table.
let helpAnchor = null, helpTimer;
const tooltip = $('#column-tooltip');
function hideHelp(force = false) {
  clearTimeout(helpTimer);
  if (!force && helpAnchor === document.activeElement) return;
  tooltip.hidden = true;
  helpAnchor = null;
}
function showHelp(button) {
  clearTimeout(helpTimer);
  helpAnchor = button;
  tooltip.textContent = description(button.dataset.help);
  tooltip.hidden = false;
  const rect = button.getBoundingClientRect(), width = tooltip.offsetWidth, height = tooltip.offsetHeight;
  tooltip.style.left = Math.max(8,Math.min(rect.left,window.innerWidth-width-8))+'px';
  tooltip.style.top = Math.max(8,rect.bottom+height+14 > window.innerHeight ? rect.top-height-8 : rect.bottom+8)+'px';
}
function bindHelp() {
  $$('[data-help]').forEach(b=>{
    b.onpointerenter = () => showHelp(b);
    b.onpointerleave = () => { helpTimer = setTimeout(()=>hideHelp(),160); };
    b.onfocus = () => showHelp(b);
    b.onblur = () => hideHelp(true);
    if (b.classList.contains('column-info')) b.onclick = () => showHelp(b);
  });
}
tooltip.onpointerenter = () => clearTimeout(helpTimer);
tooltip.onpointerleave = () => { helpTimer = setTimeout(()=>hideHelp(),160); };
document.addEventListener('keydown',e=>{ if (e.key === 'Escape') hideHelp(true); });
document.addEventListener('pointerdown',e=>{ if (!e.target.closest('[data-help]') && !tooltip.contains(e.target)) hideHelp(true); });
window.addEventListener('resize',()=>hideHelp(true));
document.addEventListener('scroll',()=>hideHelp(true),true);
function renderTable() {
  hideHelp(true);
  const cols = columns(), a = rows();
  $('#thead').innerHTML = '<tr><th scope="col"><button class="column-info" data-help="rank" aria-label="Descripción del puesto" aria-describedby="column-tooltip">#</button></th>'+cols.map(k=>'<th scope="col" aria-sort="'+(sort === k ? direction < 0 ? 'descending' : 'ascending' : 'none')+'"><div class="column-head"><button data-sort="'+k+'" data-help="'+k+'" aria-describedby="column-tooltip">'+columnLabel(k)+(sort === k ? direction < 0 ? ' ↓' : ' ↑' : '')+'</button><button class="column-info" data-help="'+k+'" aria-label="Descripción: '+esc(columnLabel(k))+'" aria-describedby="column-tooltip">ⓘ</button></div></th>').join('')+'</tr>';
  $('#tbody').innerHTML = a.map((p,i)=>'<tr><td>'+String(i+1).padStart(2,'0')+'</td>'+cols.map(k=>'<td class="'+(['goals','xg','saves'].includes(k)?'highlight':'')+'">'+(k === 'name' ? '<button class="namebtn" data-detail="'+esc(p.id)+'"><span class="initials">'+esc(initials(p.name))+'</span>'+esc(p.name)+'</button>' : k === 'pos' ? '<span class="pos">'+esc(p.pos)+'</span>' : k === 'team' ? esc(p.team) : val(p,k))+'</td>').join('')+'</tr>').join('') || '<tr><td colspan="'+(cols.length+1)+'" class="empty">'+(loaded ? 'No hay resultados con estos filtros.' : 'Aún no hay datos importados.')+'</td></tr>';
  $('#count').textContent = a.length+' '+(view === 'teams'?'equipos':'jugadores')+' · '+source()+(isLive()?' · plantillas actuales':'')+(unit === '90'?' · volumen por 90 min':'');
  $$('[data-sort]').forEach(b=>b.onclick=()=>{ direction = sort === b.dataset.sort ? -direction : -1; sort = b.dataset.sort; renderTable(); });
  $$('[data-detail]').forEach(b=>b.onclick=()=>detail(b.dataset.detail,view === 'teams'));
  bindHelp();
  $('#export').disabled = !loaded || !a.length;
}
function renderLeaders() {
  const categories = [['Goles','goals'],['Asistencias','assists'],['Goles esperados','xg'],['xA derivada de tiros','xa'],['Precisión de pase','accuracy'],['Paradas','saves']];
  $('#leaders').innerHTML = categories.map(([title,key])=>{
    const list = players().filter(p=>(key === 'saves'?p.pos === 'POR':p.pos !== 'POR') && metric(p,key) !== null && (key !== 'accuracy' || p.passes >= 30)).sort((a,b)=>(metric(b,key)-metric(a,key)) || a.name.localeCompare(b.name)).slice(0,5);
    return '<article class="leadercard"><h3>'+title+(unit === '90' && rates.has(key)?' / 90 min':'')+'</h3>'+list.map((p,i)=>'<div class="leaderrow"><span class="leaderplace">'+(i+1)+'</span><button class="namebtn" data-leader-profile="'+esc(p.id)+'"><span class="initials">'+esc(initials(p.name))+'</span><span>'+esc(p.name)+'<small>'+esc(p.team)+'</small></span></button><strong>'+val(p,key)+(key === 'accuracy'?'%':'')+'</strong></div>').join('')+(list.length?'':'<p class="empty">'+(loaded?'Métrica no disponible en esta fuente o unidad.':'Sin datos importados')+'</p>')+'<button class="leaderlink" data-leader-sort="'+key+'">Ver ranking →</button></article>';
  }).join('');
  $$('[data-leader-profile]').forEach(b=>b.onclick=()=>detail(b.dataset.leaderProfile,false));
  $$('[data-leader-sort]').forEach(b=>b.onclick=()=>{ sort = b.dataset.leaderSort; pos = sort === 'saves'?'POR':'Todos'; direction = -1; $('#search').value = ''; $('#teamfilter').value = ''; syncPositions(); navigate('players'); });
}
function sumKnown(list,key) { return list.length && list.every(p=>GradaMetrics.number(p[key])) ? list.reduce((s,p)=>s+p[key],0) : null; }
function dashboard() {
  const ts = teams(), ps = players();
  const values = [['Goles',sumKnown(ts,'goals'),'Marcadores de los equipos'],['Goles esperados · xG',sumKnown(ts,'xg'),'Suma del xG de los tiros'],['Asistencias',sumKnown(ps,'assists'),isLive()?'Plantillas actuales, cobertura parcial':'Pases marcados como asistencia'],['Paradas',sumKnown(ps.filter(p=>p.pos === 'POR'),'saves'),'Tiros detenidos por porteros']];
  $('#cards').innerHTML = values.map(([title,value,note])=>'<div class="card"><div class="label">'+title+'</div><strong>'+(value === null?'—':new Intl.NumberFormat('es-ES',{maximumFractionDigits:1}).format(value))+'</strong><small>'+note+' · totales</small></div>').join('');
  const rankKey = ts.some(t=>metric(t,'xg') !== null) ? 'xg' : 'goals';
  $('#ranktitle').textContent = rankKey === 'xg'?'El ataque más peligroso':'Equipos con más goles';
  $('#ranksub').textContent = 'Equipos por '+(rankKey === 'xg'?'xG':'goles')+(unit === '90'?' /90':' acumulados');
  const top = [...ts].filter(t=>metric(t,rankKey) !== null).sort((a,b)=>metric(b,rankKey)-metric(a,rankKey)).slice(0,5);
  $('#ranks').innerHTML = top.map((t,i)=>'<div class="rank"><span class="ranknum">'+(i+1)+'</span><span class="crest">'+esc(initials(t.name))+'</span><div class="rankname">'+esc(t.name)+'<small>'+val(t,'matches')+' partidos · '+t.goals+' goles</small></div><div class="rankscore">'+val(t,rankKey)+'</div></div>').join('') || '<p class="empty">Sin datos para esta unidad.</p>';
  const matches = loaded ? data.matches || [] : [];
  if (!matches.length) {
    $('#chart').innerHTML = '<p class="empty">'+(isLive()?'Esta consulta ofrece estadísticas de temporada, sin serie de partidos ni xG.':'El gráfico se generará con los partidos importados.')+'</p>';
    $('#insight').textContent = isLive()?'Selecciona Mundial 2022 para explorar los xG de StatsBomb.':'No se muestran estimaciones sin una fuente de datos.';
    return;
  }
  let goals = 0, expected = 0;
  const points = matches.map(m=>{ goals += m.home_goals+m.away_goals; expected += m.home_xg+m.away_xg; return [goals,expected]; });
  const max = Math.ceil(Math.max(goals,expected)/10)*10 || 10, px = i=>35+(points.length === 1?0:i/(points.length-1)*470), py = y=>175-y/max*150;
  $('#chart').innerHTML = '<svg viewBox="0 0 540 210" role="img" aria-label="Goles y xG acumulados de los partidos importados">'+[0,1,2,3].map(i=>'<line x1="35" x2="505" y1="'+py(max*i/3)+'" y2="'+py(max*i/3)+'" stroke="#dce0e3"/><text x="2" y="'+(py(max*i/3)+4)+'">'+Math.round(max*i/3)+'</text>').join('')+'<polyline points="'+points.map((v,i)=>px(i)+','+py(v[1])).join(' ')+'" fill="none" stroke="#8f99a4" stroke-width="2" stroke-dasharray="5 5"/><polyline points="'+points.map((v,i)=>px(i)+','+py(v[0])).join(' ')+'" fill="none" stroke="#c9182b" stroke-width="2.5"/><text x="35" y="202">Partido 1</text><text x="430" y="202">Partido '+matches.length+'</text></svg>';
  $('#insight').textContent = matches.length+' partidos importados · '+new Intl.NumberFormat('es-ES',{maximumFractionDigits:1}).format(goals-expected)+' goles respecto al xG. Tandas excluidas.';
}
function renderCompare() {
  const a = players();
  if (!a.length) { $('#comparegrid').innerHTML = '<p class="panel empty">Importa datos para comparar jugadores reales.</p>'; return; }
  if (!choices.length || choices.some(id=>!a.find(p=>String(p.id) === String(id)))) choices = a.slice(0,2).map(p=>String(p.id));
  $('#comparegrid').innerHTML = choices.map((id,i)=>{
    const p = a.find(p=>String(p.id) === String(id));
    return '<div class="panel"><p class="sub">JUGADOR '+(i+1)+'</p><select class="compareselect" data-compare="'+i+'" aria-label="Jugador '+(i+1)+'">'+a.map(q=>'<option value="'+esc(q.id)+'" '+(String(q.id) === String(id)?'selected':'')+'>'+esc(q.name)+' · '+esc(q.team)+'</option>').join('')+'</select><h2>'+esc(p.name)+'</h2><p class="sub">'+esc(p.team)+' · '+esc(p.pos)+'</p>'+keysFor(p).map(k=>'<div class="comparestat"><span>'+columnLabel(k,false)+'</span><b>'+val(p,k)+'</b></div>').join('')+'</div>';
  }).join('');
  $$('[data-compare]').forEach(e=>e.onchange=()=>{ choices[+e.dataset.compare] = e.value; renderCompare(); });
}
function detail(id,isTeam) {
  const p = (isTeam?teams():players()).find(p=>String(p.id) === String(id));
  if (!p) return;
  $('#detailbody').innerHTML = '<span class="badge">'+esc(source())+'</span><h1 class="detailtitle">'+esc(p.name)+'</h1><p class="sub">'+esc(p.team || data.metadata.competition)+' · '+esc(data.metadata.season)+(unit === '90'?' · volumen por 90 min':'')+'</p><div class="detailstats">'+keysFor(p,isTeam).map(k=>'<div class="comparestat"><span>'+columnLabel(k,isTeam)+'</span><b>'+val(p,k)+'</b></div>').join('')+'</div><p class="sub note">'+(isLive()?esc(data.metadata.notes):'— = no disponible. Las tasas /90 usan los minutos de juego. PSxG y goles evitados no se incluyen. xA derivada del xG de tiros asistidos.')+'</p>';
  $('#detail').showModal();
}
function navigate(v,scroll = true) {
  view = v;
  const info = {overview:['Vista general','Estadísticas de fútbol','Líderes, rankings y estadísticas de jugadores y equipos.'],players:['Jugadores','Estadísticas de jugadores','Datos de '+source()+'. Selecciona un jugador para explorar.'],teams:['Equipos','Estadísticas de equipos','Ataque, defensa y distribución de los equipos.'],compare:['Comparador','Comparador de jugadores','Contrasta perfiles y métricas en su contexto.'],glossary:['Glosario','Glosario de métricas','Definiciones y límites de los datos disponibles.']}[v];
  $('#crumb').textContent = info[0]; $('#pagetitle').textContent = info[1]; $('#pagesub').textContent = info[2];
  $$('nav button').forEach(b=>b.classList.toggle('active',b.dataset.view === v));
  $('#overview').classList.toggle('hidden',v !== 'overview'); $('#listing').classList.toggle('hidden',!['overview','teams','players'].includes(v)); $('#compare').classList.toggle('hidden',v !== 'compare'); $('#glossary').classList.toggle('hidden',v !== 'glossary');
  $('#filters').classList.toggle('hidden',v === 'glossary'); $('#export').classList.toggle('hidden',['compare','glossary'].includes(v)); $('#positions').classList.toggle('hidden',v === 'teams'); $('#teamfilter').classList.toggle('hidden',v === 'teams'); $('#allplayers').classList.toggle('hidden',v !== 'overview');
  $('#tabletitle').textContent = v === 'teams'?'Ranking de equipos':'Ranking de jugadores'; $('#tablesub').textContent = 'Selecciona un nombre para ver su perfil. — = no disponible.';
  renderTable(); renderCompare();
  if (scroll) window.scrollTo({top:0,behavior:'smooth'});
}
function syncPositions() { $$('[data-pos]').forEach(b=>b.classList.toggle('on',b.dataset.pos === pos)); }
function applyData(next) {
  data = next; loaded = !!(data?.metadata && data.players?.length && Array.isArray(data.teams)); choices = [];
  $('#search').value = ''; $('#teamfilter').innerHTML = '<option value="">Todos los equipos</option>'+[...new Set(players().map(p=>p.team))].sort().map(t=>'<option>'+esc(t)+'</option>').join('');
  $('#league').value = isLive()?'laliga':'statsbomb'; $('#season').innerHTML = '<option>'+esc(loaded?data.metadata.season:'2022 · pendiente')+'</option>';
  $$('[data-source]').forEach(e=>e.textContent = source()); $('.sidefoot').textContent = 'GRADA / '+(isLive()?'LALIGA 2026/27':'MUNDIAL 2022');
  $('.status').textContent = source();
  if (loaded) {
    const m = data.metadata, when = new Intl.DateTimeFormat('es-ES',{dateStyle:'medium',timeStyle:'short',timeZone:'UTC'}).format(new Date(m.imported_at));
    $('.scope').textContent = m.imported_matches+'/'+m.available_matches+' partidos · '+(m.complete?'cobertura completa':'cobertura parcial');
    $('#data-status').textContent = m.competition+' '+m.season+' · '+m.source+' · '+m.imported_matches+'/'+m.available_matches+' partidos. Captura: '+when+' UTC. '+(isLive()?m.notes:m.complete?'Cobertura completa de la competición.':'Cobertura parcial: los rankings no representan toda la competición.');
    $('#active-source').textContent = m.source; $('#active-source').href = m.url;
  } else { $('.scope').textContent = 'Sin datos importados'; $('#data-status').textContent = 'Aún no hay datos de StatsBomb importados. Puedes actualizar LaLiga 2026/27 o ejecutar el importador incluido.'; }
  $('#database').classList.toggle('hidden',!loaded || isLive()); $('#jsondownload').classList.toggle('hidden',!loaded);
  $('#jsondownload').href = isLive()?'#':'downloads/statsbomb.json';
  dashboard(); renderLeaders(); navigate(view,false);
}
function saveCache(next) {
  try { localStorage.setItem(CACHE,JSON.stringify(next)); return true; } catch (_) { return false; }
}
async function refreshLaLiga() {
  if (refreshing) return;
  refreshing = true; $('#refresh').disabled = true; $('#league').disabled = true; $('#refresh').textContent = 'Actualizando…'; $('#refresh-status').textContent = 'Consultando ESPN para LaLiga 2026/27…';
  try {
    const next = await GradaLaLiga.fetchSeason({onProgress:(done,total)=>{ $('#refresh-status').textContent = 'LaLiga 2026/27 · descargando plantillas: '+done+'/'+total; }});
    liveData = next;
    const saved = saveCache(next);
    applyData(next);
    $('#refresh-status').textContent = 'LaLiga 2026/27 actualizada desde ESPN. '+(saved?'Captura guardada en este navegador.':'Captura disponible en esta sesión; el navegador no permite guardar la caché.');
  } catch (e) {
    $('#refresh-status').textContent = 'No se pudo actualizar LaLiga: '+(e.name === 'AbortError'?'la fuente tardó demasiado en responder.':e.message)+' Se conserva la captura anterior y su fecha.';
  } finally { refreshing = false; $('#refresh').disabled = false; $('#league').disabled = false; $('#refresh').textContent = '↻ Actualizar LaLiga 2026/27'; }
}
const terms = [
  ['Fuentes y cobertura','Mundial 2022: StatsBomb Open Data. LaLiga 2026/27: clasificación y plantillas actuales de ESPN; temporada en curso y cobertura parcial de jugadores. Cada consulta conserva su fuente y fecha. No se mezclan proveedores.'],
  ['xG · Goles esperados',descriptions.xg+' Los endpoints de ESPN usados aquí no lo incluyen.'],['xA derivada de tiros',descriptions.xa],['Conversión y goles − xG',descriptions.conversion+' '+descriptions.delta],
  ['Paradas y xG recibidos',descriptions.saves+' '+descriptions.xga],['Tasas de porteros por 90',descriptions.xga90+' '+descriptions.conceded90],['PSxG y goles evitados',descriptions.psxg+' '+descriptions.prevented],
  ['Precisión de pase',descriptions.accuracy+' El panel de líderes exige al menos 30 intentos.'],['Pases clave y progresivos',descriptions.keypasses+' '+descriptions.progressive],['Minutos y por 90',descriptions.minutes+' Volumen × 90 ÷ minutos. Los porcentajes conservan su denominador. ESPN no proporciona minutos en esta consulta: las tasas se muestran —.'],
  ['Entradas e intercepciones',descriptions.tackles+' '+descriptions.interceptions],['Portería a cero y porcentaje de paradas',descriptions.clean+' '+descriptions.savepct],
  ['Actualizar LaLiga','El botón consulta la API pública de ESPN desde tu navegador: clasificación y plantillas de los 20 equipos. Solo sustituye la captura al validar todas las respuestas y la temporada. La copia se guarda en este navegador; no actualiza la de otros visitantes. Si falla, conserva los datos anteriores. No se eluden restricciones de FBref.']
];
$('#terms').innerHTML = terms.map((t,i)=>'<article class="panel"><span class="badge">'+String(i+1).padStart(2,'0')+'</span><h2 class="detailtitle">'+esc(t[0])+'</h2><p>'+esc(t[1])+'</p></article>').join('');
$$('nav button').forEach(b=>b.onclick=()=>navigate(b.dataset.view));
$$('[data-pos]').forEach(b=>b.onclick=()=>{ pos = b.dataset.pos; sort = pos === 'POR'?'saves':pos === 'DEF'?'tackles':pos === 'MED'?'assists':'goals'; direction = -1; syncPositions(); renderTable(); });
$$('[data-unit]').forEach(b=>b.onclick=()=>{ unit = b.dataset.unit; if (unit === '90' && GradaMetrics.fixedRates[sort]) sort = GradaMetrics.fixedRates[sort]; $$('[data-unit]').forEach(q=>q.classList.toggle('on',q === b)); dashboard(); renderTable(); renderLeaders(); renderCompare(); });
$('#search').oninput = renderTable; $('#teamfilter').onchange = renderTable; $('#allplayers').onclick = ()=>navigate('players'); $('.close').onclick = ()=>$('#detail').close();
$('#refresh').onclick = refreshLaLiga;
$('#league').onchange = ()=>{
  $('#refresh-status').textContent = '';
  if ($('#league').value === 'statsbomb') applyData(baseline);
  else if (liveData) applyData(liveData);
  else { $('#league').value = isLive()?'laliga':'statsbomb'; refreshLaLiga(); }
};
function download(content,type,name) {
  const url = URL.createObjectURL(new Blob([content],{type})), a = document.createElement('a');
  a.href = url; a.download = name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('#jsondownload').onclick = e=>{ if (isLive()) { e.preventDefault(); download(JSON.stringify(data,null,2),'application/json','grada-laliga-2026-27.json'); } };
$('#export').onclick = ()=>{
  const cols = columns(), m = data.metadata, head = [m.source,m.competition,m.season,m.imported_matches+'/'+m.available_matches+' partidos',m.imported_at,m.complete?'cobertura completa':'cobertura parcial',isLive()?'plantillas actuales':'',unit === '90'?'POR 90 MIN':'TOTALES'];
  const csv = '\uFEFF'+[head,cols.map(k=>columnLabel(k)),...rows().map(p=>cols.map(k=>['name','team','pos'].includes(k)?p[k]??'':metric(p,k)??''))].map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n');
  download(csv,'text/csv;charset=utf-8;','grada-'+(isLive()?'laliga-2026-27':'statsbomb-2022')+'-'+(view === 'teams'?'equipos':'jugadores')+'.csv');
};
document.addEventListener('pointerdown',()=>interaction++,true);
document.addEventListener('keydown',()=>interaction++,true);
async function start() {
  const initialInteraction = interaction;
  applyData(baseline);
  try { const cached = JSON.parse(localStorage.getItem(CACHE)); if (cached) liveData = GradaLaLiga.validate(cached); } catch (_) { /* A rejected cache never changes the active data. */ }
  try {
    const response = await fetch('downloads/laliga-2026-27.json');
    if (response.ok) {
      const snapshot = GradaLaLiga.validate(await response.json());
      if (!liveData || Date.parse(snapshot.metadata.imported_at) > Date.parse(liveData.metadata.imported_at)) liveData = snapshot;
    }
  } catch (_) { /* Source-only checkouts can still use the refresh button. */ }
  // Preserve any choice the visitor made while the initial snapshot was loading.
  if (liveData && interaction === initialInteraction && !refreshing && view === 'overview' && $('#league').value === 'statsbomb' && !$('#search').value) applyData(liveData);
}
start();
