'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
let data = null, loaded = false;
let currentLeague='laliga',initialLoadsComplete=false,rankingProfile='DEL',rankingMinimum=450;
const datasets=new Map();
const leagueConfig=()=>GradaLeagues.get(currentLeague);
let liveData = null, understatData = null, fotmobData = null, combinedData = null, view = 'overview', pos = 'Todos', unit = 'total', sort = 'goals', direction = -1, choices = [], refreshing = false, interaction = 0;
let radarProfiles = new Map(),rankingAxisKeys=new Set(),squadAreas={teams:new Map(),unassignedPlayerIds:[]},unitAreas=new Map();
const captureStore=GradaRefresh.captureStore();
const cacheKey=id=>'grada:espn:'+id+':2026-27:v1';
const labels = {name:'Jugador',team:'Equipo',pos:'Posición',matches:'PJ',minutes:'Min',goals:'Goles',assists:'Asist.',xg:'xG',xa:'xA',conversion:'Conv. %',delta:'Goles − xG',passes:'Pases',completed:'Completados',accuracy:'Pases %',completedPer90:'Pases precisos /90',recoveries:'Recuperaciones',shots:'Tiros',saves:'Paradas',savepct:'Paradas %',conceded:'Goles rec.',xga:'xG recibidos',xga90:'xG recibidos /90',xgaPerMatch:'xG rec. / partido',goalsPerXg:'Goles / xG',assistsPerXa:'Asist. / xA',conceded90:'Goles rec. /90',psxg:'xGOT recibidos (PSxG)',psxgEfficiency:'Eficacia vs xGOT %',psxgPerMatch:'PSxG / partido',psxg90:'PSxG /90',xgaOnTarget:'xG tiros a puerta recibidos',xgaOnTargetPerMatch:'xG a puerta / partido',xgaOnTarget90:'xG a puerta /90',prevented:'Goles evitados',clean:'Porterías a 0',savesPerMatch:'Paradas / partido',concededPerMatch:'Goles rec. / partido',cleanPerMatch:'Porterías a 0 / partido',tackles:'Entradas',interceptions:'Intercepc.',keypasses:'Pases clave',progressive:'Pases progres.'};
const descriptions = {
  rank:'Puesto dentro de los resultados visibles y del orden seleccionado. No es una clasificación oficial.',
  name:'Nombre del jugador. Selecciónalo para abrir su ficha.',team:'Equipo al que corresponden estas estadísticas.',pos:'Posición: POR portero, DEF defensa, MED centrocampista y DEL delantero.',
  matches:'Partidos en los que participó el jugador; en equipos, partidos disputados.',
  minutes:'Minutos de juego. En StatsBomb se suman intervalos de alineación hasta 90 o 120 minutos, sin añadido.',
  goals:'Goles marcados por el jugador. Los goles de equipo incluyen autogoles rivales; se excluyen las tandas.',
  assists:'Pases identificados como asistencia de gol por el proveedor.',
  xg:'Goles esperados: suma de la probabilidad de gol de los tiros antes de conocer su resultado. Modelo de StatsBomb; incluye penaltis de partido y excluye tandas.',
  xa:'xA derivada: suma del xG de los tiros enlazados con un pase del jugador. No es un modelo independiente de todos los pases.',
  goalsPerXg:'Goles marcados ÷ xG acumulado. Se muestra como multiplicador: 1× coincide con el xG, 1,20× significa un 20 % más de goles y 0,80× un 20 % menos. No es una probabilidad ni un porcentaje de conversión; con xG cero o ausente se muestra —. Se calcula con el mismo proveedor y conserva su valor en modo por 90.',
  assistsPerXa:'Asistencias de gol ÷ xA acumulada de la fuente activa. Multiplicador: 1× coincide con la xA y 1,20× significa un 20 % más de asistencias. Depende también de la finalización de los compañeros; con xA cero o ausente se muestra —. Conserva su valor en modo por 90.',
  xgaPerMatch:'xG recibidos por partido jugado = xG atribuidos al portero ÷ partidos en los que participó ese portero. Una aparición parcial cuenta como un partido; no equivale a xG recibidos por 90 minutos. Sin xG atribuibles o sin partidos válidos se muestra —. Nunca se sustituye por el xG recibido de su equipo.',
  conversion:'Porcentaje de conversión = goles marcados ÷ tiros realizados × 100. Sin tiros se muestra —.',
  delta:'Goles marcados menos xG acumulado. Un valor positivo indica más goles que los esperados por el modelo.',
  passes:'Intentos de pase; incluye completados y no completados.',completed:'Pases que llegaron a su destino según el proveedor.',accuracy:'Precisión de pase = pases completados ÷ intentos × 100.',
  completedPer90:'Pases completados por 90 minutos. Se usa la tasa publicada por FotMob cuando está disponible; no se reconstruyen totales a partir de su valor redondeado. En otras fuentes se requieren pases completados y minutos propios.',
  recoveries:'Balones recuperados según el proveedor: acciones que devuelven la posesión al equipo. No equivale necesariamente a una entrada ganada o a cortar un pase. Se mantienen separados de entradas e intercepciones.',
  shots:'Tiros realizados, incluidos bloqueados y fuera de portería. Tandas excluidas.',
  saves:'Tiros detenidos por el portero. En StatsBomb: Saved, Saved to Post o Saved Off Target.',
  savepct:'Porcentaje de paradas = paradas ÷ (paradas + goles recibidos) × 100. Incluye autogoles encajados y conserva su denominador al cambiar de unidad.',
  conceded:'Goles recibidos durante los intervalos en los que el portero estuvo en portería, incluidos autogoles. En equipos: goles encajados en los marcadores.',
  xga:'xG recibidos: suma del xG previo al tiro de todos los tiros rivales mientras el portero estuvo en portería. En equipos: xG de los rivales. No es PSxG.',
  xga90:'Tasa de xG recibidos por 90 minutos = xG recibidos × 90 ÷ minutos jugados. Es una frecuencia, no un porcentaje ni PSxG. Sin minutos válidos se muestra —.',
  conceded90:'Tasa de goles recibidos por 90 minutos = goles encajados × 90 ÷ minutos jugados. Incluye autogoles recibidos. Sin minutos válidos se muestra —.',
  psxg:'Goles esperados después del tiro: modelo que considera cómo llegó el balón a portería. No está publicado en estas capturas y se muestra —.',
  prevented:'Goles evitados: requiere un modelo PSxG adecuado. No se calcula restando goles recibidos al xG previo al tiro; aquí se muestra —.',
  savesPerMatch:'Paradas divididas entre los partidos del portero en la fuente que proporciona las paradas.',
  concededPerMatch:'Goles recibidos divididos entre los partidos del portero en la misma fuente. Menos es mejor en el radar, con el contexto del equipo.',
  cleanPerMatch:'Porterías a cero divididas entre los partidos de la fuente que publica ese dato.',
  clean:'Partidos sin encajar del portero con al menos 60 minutos en portería, según la definición de la importación StatsBomb.',
  tackles:'Entradas registradas por el proveedor. El volumen depende del tiempo defendiendo y del sistema de juego.',
  interceptions:'Eventos de intercepción de pases rivales.',keypasses:'Pases que generan un tiro: pass.shot_assist en StatsBomb.',
  progressive:'Pases completados con al menos 10 metros de avance longitudinal. Definición de GRADA: 120 unidades de StatsBomb equivalen a 105 metros.'
};
Object.assign(labels,GradaFotmob.labels,{radarArea:'Score de jugador (0–1)',teamArea:'Score de equipo',areaPlayers:'Jugadores ponderados',shotsPer90:'Tiros /90',shotsOnTarget:'Tiros a puerta',league:'Liga',points:'Puntos',goalsPerMatch:'Goles /PJ',xgPerMatch:'xG /PJ',pointsPerMatch:'Puntos /PJ',bigChances:'Grandes ocasiones',bigChancesPerMatch:'Grandes ocasiones /PJ',shotsOnTargetPerMatch:'Tiros a puerta /PJ',goalDifferencePerMatch:'Dif. goles /PJ',xgDifferencePerMatch:'Dif. xG /PJ'});
descriptions.teamArea=GradaSquads.definition+' Usa los minutos publicados de cada jugador y se recalcula por liga o Todas. Los filtros no cambian los pesos.';descriptions.areaPlayers='Jugadores con score válido y minutos positivos / plantilla asignada. Sin score o sin minutos válidos, el jugador queda pendiente y no participa en el promedio.';
for(const [key,config] of Object.entries(GradaSquads.unitKeys)){labels[config.area]=config.label;labels[config.coverage]=config.position+' ponderados';descriptions[config.area]=GradaSquads.unitDefinition(key);descriptions[config.coverage]='Jugadores con score y minutos positivos / jugadores asignados de esta posición. El filtro numérico usa el número de jugadores ponderados.';}
const squadMetricKeys=new Set(['teamArea','areaPlayers',...Object.values(GradaSquads.unitKeys).flatMap(c=>[c.area,c.coverage])]);
descriptions.psxgEfficiency='(1 − goles recibidos / xGOT recibido) × 100, usando ambos valores de la misma ficha y muestra del portero. Positivo: recibe menos goles de los esperados; 0: coincide con el modelo; negativo: recibe más. Se incluye en el score del portero cuando existe una referencia suficiente.';
descriptions.psxg='xGOT (xG posterior al tiro) recibido: se obtiene de los goles evitados y goles recibidos de la misma ficha FotMob, excluyendo autogoles verificados en el mapa. Si falta ese agregado, se suma el xGOT del mapa solo con cobertura completa. Método y muestra en la procedencia; no es xG previo al tiro.';descriptions.psxgPerMatch='PSxG recibidos divididos por los PJ de esa misma ficha FotMob.';descriptions.psxg90='PSxG recibidos por 90 minutos de la misma ficha.';descriptions.xgaOnTarget='Suma de xG previos al tiro de los tiros a puerta afrontados por el portero, atribuidos en su ficha FotMob. No incluye tiros fuera o bloqueados; no equivale al xG total del equipo.';descriptions.xgaOnTargetPerMatch='xG de tiros a puerta afrontados divididos por los PJ de esa ficha.';descriptions.xgaOnTarget90='xG de tiros a puerta afrontados por 90 minutos de la misma ficha.';
descriptions.shotsOnTarget='Tiros a puerta contados por ESPN o en el mapa completo de tiros del jugador en FotMob. No se reconstruyen desde tasas redondeadas; cada valor conserva sus propios PJ, minutos y fecha.';
descriptions.points='Puntos publicados en la clasificación de FotMob; se conserva su recuento y fecha.';descriptions.pointsPerMatch='Puntos divididos entre los partidos de la misma clasificación.';descriptions.bigChances='Grandes ocasiones de equipo publicadas por FotMob.';descriptions.bigChancesPerMatch='Grandes ocasiones divididas entre los PJ del mismo proveedor.';descriptions.shotsOnTargetPerMatch='Tiros a puerta por partido de equipo: tasa publicada por FotMob, sin reconstruir totales redondeados.';descriptions.goalsPerMatch='Goles marcados por el equipo divididos entre sus PJ del proveedor de esos goles.';descriptions.xgPerMatch='xG del equipo dividido entre sus PJ en la misma fuente.';descriptions.goalDifferencePerMatch='Diferencia entre goles a favor y en contra, por partido, con el mismo proveedor y cobertura.';descriptions.xgDifferencePerMatch='Diferencia entre xG a favor y recibidos, por partido, con el mismo modelo y cobertura.';descriptions.league='Liga de origen de este registro. En Todas las ligas se conservan fichas y estadísticas por competición.';
descriptions.shotsPer90='Tiros realizados por 90 minutos, tasa publicada por FotMob. No se deduce un recuento a partir de su valor redondeado.';
Object.assign(descriptions,GradaFotmob.descriptions,{
  radarArea:'Score de jugador entre 0 y 1, calculado con el polígono del radar respecto al máximo (todos los ejes en percentil 100). Con radios r = percentil ÷ 100, se calcula la media de r[i] × r[i+1], cerrando el polígono. Solo se ofrece en la tabla con todos los ejes comunes de esa posición. Compara la misma posición, ejes, orden y fuente/temporada; los scores de posiciones distintas no constituyen una clasificación común. No es la probabilidad de jugar bien.',
  prevented:'Goles evitados publicados por FotMob: su comparación postiro entre goles esperados a puerta recibidos y goles encajados. Puede ser negativo. No se recalcula con goles de ESPN ni con xG de Understat, y no se infiere PSxG a partir del redondeo.'
});
const rates = GradaMetrics.rates;
const playerkeys = ['radarArea','matches','minutes','goals','assists','xg','xa','shots','shotsOnTarget','shotsPer90','goalsPerXg','assistsPerXa','conversion','delta','passes','completedPer90','accuracy','recoveries','keypasses','progressive','tackles','interceptions',...GradaFotmob.fields.filter(k=>!['highClaims','sweeperActions','saves','conceded','penaltiesSaved','penaltiesFaced','clean','savepct','prevented'].includes(k))];
const keeperkeys = ['radarArea','matches','minutes','saves','savesPerMatch','savepct','conceded','concededPerMatch','conceded90','xga','xga90','xgaPerMatch','psxg','psxgEfficiency','psxgPerMatch','xgaOnTarget','xgaOnTargetPerMatch','prevented','clean','highClaims','sweeperActions','penaltiesSaved','penaltiesFaced','passes','completedPer90','accuracy','longBallsPer90','longBallAccuracy','yellowCards','redCards'];
const teamkeys = ['teamArea','areaPlayers','strikerArea','strikerPlayers','midfieldAttackArea','midfieldAttackPlayers','midfieldDefenseArea','midfieldDefensePlayers','radarArea','matches','points','pointsPerMatch','goals','goalsPerMatch','xg','xgPerMatch','goalsPerXg','conceded','concededPerMatch','xga','xgaPerMatch','clean','cleanPerMatch','shotsOnTargetPerMatch','bigChances','bigChancesPerMatch','goalDifferencePerMatch','xgDifferencePerMatch'];
function esc(v) { return String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function initials(s) { return String(s).split(' ').map(w=>w[0]).slice(0,2).join(''); }
function players() { return loaded ? data.players : []; }
function teams() { return loaded ? data.teams : []; }
function isLive() { return data?.metadata?.source === 'ESPN'; }
function isUnderstat() { return data?.metadata?.source === 'Understat'; }
function isCombined() { return GradaCombined.isCombined(data); }
function isAll(){return currentLeague==='all';}
function isTeamView(){return view==='teams'||view==='rankings'&&GradaRadar.definition(rankingProfile).kind==='team';}
function updateRadarProfiles(){
  const key=view==='rankings'?rankingProfile:null,def=GradaRadar.definition(key),defaultPlayers=GradaRadar.profiles(players());
  squadAreas=GradaSquads.summarize({metadata:data?.metadata,players:players(),teams:teams()},defaultPlayers);
  unitAreas=GradaSquads.unitSummaries({metadata:data?.metadata,players:players(),teams:teams()});
  const activePlayers=key&&GradaRadar.definition(key).kind==='player'?GradaRadar.profiles(players(),{profileKey:key}):defaultPlayers;
  radarProfiles=new Map([...activePlayers,...GradaRadar.profiles(teams(),{kind:'team',profileKey:key&&def.kind==='team'&&!def.aggregateProfile?key:'TEAM_OVERALL'})]);
  const sample=(isTeamView()?teams():players()).find(p=>isTeamView()||p.pos===GradaRadar.definition(rankingProfile).position);rankingAxisKeys=new Set(def.aggregateProfile?[]:radarProfiles.get(sample)?.expectedAxes||[]);
}
function squad(record){return squadAreas.teams.get(String(record.id));}
function unitSummary(record,profileKey){return unitAreas.get(profileKey)?.teams.get(String(record.id));}
function squadMetric(record,key){
  if(key==='teamArea'||key==='areaPlayers'){const value=squad(record);return key==='teamArea'?value?.area??null:value?.validPlayers??null;}
  for(const [profile,config] of Object.entries(GradaSquads.unitKeys))if(key===config.area||key===config.coverage){const value=unitSummary(record,profile);return key===config.area?value?.area??null:value?.validPlayers??null;}
  return null;
}
function activeUnit(){return GradaRadar.definition(rankingProfile).aggregateProfile||null;}
function rankingSort(){const def=GradaRadar.definition(rankingProfile);return def.aggregateProfile?GradaSquads.unitKeys[def.aggregateProfile].area:def.key==='TEAM_OVERALL'?'teamArea':'radarArea';}
function indexPending(record){const profile=radarProfiles.get(record);return profile?.missingAxes?.length?'Pendiente: '+profile.missingAxes.map(k=>GradaRadar.axis(k)?.label||k).join(', '):'Muestra insuficiente para este índice.';}
function usesUnderstatModels() { return data?.metadata?.primary_source==='Understat' || isUnderstat(); }
function primarySource(){return data?.metadata?.primary_source || leagueConfig().primary;}
function isSeason() { return isLive() || isUnderstat() || isCombined(); }
function selectedSource() { return currentLeague; }
function source() { return loaded ? data.metadata.source : 'Sin datos'; }
function metric(p,k) { if(squadMetricKeys.has(k))return squadMetric(p,k);if(k==='radarArea'){const profile=radarProfiles.get(p);if(profile?.kind==='team'&&view==='rankings'&&!GradaRadar.rankingEligible(p,profile,rankingMinimum))return null;return profile?.comparableArea??null;}if(view==='rankings'&&rankingAxisKeys.has(k))return radarProfiles.get(p)?.axes.find(a=>a.key===k)?.value??null;return GradaMetrics.metric(p,k,view==='rankings'?'total':unit); }
function columnLabel(k,isTeam = isTeamView()) {
  if(k==='radarArea'&&isTeam)return view==='rankings'&&rankingProfile==='TEAM_ATTACK'?'Score de ataque (0–1)':view==='rankings'&&rankingProfile==='TEAM_DEFENSE'?'Score de defensa (0–1)':'Score global (0–1)';
  if(view==='rankings'&&rankingAxisKeys.has(k))return GradaRadar.axis(k).label;
  return (k === 'name' && isTeam ? 'Equipo' : k === 'xa' && isCombined() ? 'xA' : labels[k]) + (unit === '90' && rates.has(k) ? ' /90' : '');
}
function description(k,isTeam = isTeamView()) {
  let text = k === 'name' && isTeam ? 'Nombre del equipo. Selecciónalo para abrir su ficha.' : descriptions[k];
  if (usesUnderstatModels() && k === 'xg') text = 'Goles esperados según el modelo Understat: suma de las probabilidades de gol de los tiros, incluidos penaltis de partido.';
  if (usesUnderstatModels() && k === 'xa') text = 'xA de Understat: goles esperados de los tiros generados por los pases del jugador, según el modelo de este proveedor.';
  if (usesUnderstatModels() && k === 'minutes') text = 'Minutos publicados por Understat. Para equipos se usan 90 minutos por partido de liga.';
  if (isUnderstat() && ['saves','savepct','conceded','conceded90','xga','xga90','xgaPerMatch','clean','passes','completed','accuracy','completedPer90','recoveries','tackles','interceptions','progressive'].includes(k) && !(isTeamView() && ['conceded','xga'].includes(k))) text += ' No disponible para este registro en la descarga de Understat; no se usa el dato de equipo como si fuera de un portero.';
  if (unit === '90' && rates.has(k)) text += ' Se muestra por 90 minutos: total × 90 ÷ minutos; sin minutos válidos, —.';
  if (isLive() && ['minutes','xg','xa','xga','xga90','xgaPerMatch','goalsPerXg','assistsPerXa','conceded90','passes','completed','accuracy','progressive','keypasses','tackles','interceptions','recoveries','completedPer90','clean','delta'].includes(k)) text += ' No disponible en la consulta de ESPN de LaLiga 2026/27.';
  if(isCombined()&&primarySource()==='FotMob'&&k==='xg')text='Goles esperados publicados por FotMob, con su modelo y fecha; no se intercambian con xG Understat.';
  if(isCombined()&&primarySource()==='FotMob'&&k==='xa')text='Asistencias esperadas publicadas por FotMob; conserva su definición y fuente.';
  if(isCombined()&&primarySource()==='FotMob'&&k==='minutes')text='Minutos publicados por FotMob. Los equipos usan 90 minutos nominales por partido de su propia clasificación.';
  if(isCombined()&&primarySource()==='FotMob'&&k==='conversion')text='Conversión publicada por FotMob en su ranking de tiros. No se recalcula mezclando sus goles con tiros de ESPN.';
  if(isAll()&&k==='xg')text='Goles esperados del proveedor indicado por registro: Understat en LaLiga, FotMob en las demás ligas. Los modelos pueden diferir.';
  if(isAll()&&k==='xa')text='Asistencias esperadas del proveedor indicado en cada registro. Se mantienen los modelos de la liga original.';
  if(isAll()&&k==='minutes')text='Minutos publicados por la fuente de cada jugador; cada métrica conserva los minutos o PJ de su propio proveedor.';
  if(isTeam&&k==='radarArea')text='Índice específico del radar de equipo, entre 0 y 1. Conserva sus ejes de ataque, defensa o rendimiento; queda pendiente si faltan datos. El score general de plantilla es el promedio ponderado por minutos y se muestra por separado.';
  if(isTeam&&k==='xgaPerMatch')text='xG recibidos del equipo divididos por sus PJ en la misma fuente.';
  if(isTeam&&k==='concededPerMatch')text='Goles recibidos por el equipo divididos por sus PJ de origen.';
  if(isCombined()&&data.metadata.sources.FotMob&&k==='clean')text='Porterías a cero publicadas por FotMob, según los criterios de su ranking de porteros.';
  if (isCombined()) text += ' Vista combinada: '+(isAll()?'prioridad según la liga original':'prioridad '+Object.keys(data.metadata.sources).join(' → '))+'. La fuente y sus PJ aparecen junto a cada valor; las tasas por 90 usan minutos de esa misma fuente o su tasa publicada. ESPN no aporta minutos ni xG recibidos de porteros.';
  if(isCombined() && data.metadata.sources.FotMob && ['completedPer90','tackles','interceptions','recoveries'].includes(k)) text += ' Para FotMob se utiliza su tasa por 90 publicada, con procedencia propia; nunca se calculan totales a partir de una tasa redondeada.';
  return text + ' Un guion (—) significa que el dato no está disponible.';
}
function missingReason(p,key){
  if(squadMetricKeys.has(key))return 'No hay jugadores de esta posición con score válido y minutos positivos para ponderar.';
  if(key==='radarArea'){const profile=radarProfiles.get(p);return profile?.missingAxes?.length?'Faltan ejes del perfil: '+profile.missingAxes.map(k=>GradaRadar.axis(k)?.label||k).join(', '):'No hay una referencia suficiente para calcular el score.';}
  if(key==='passes')return 'No hay un recuento publicado de pases intentados. No se reconstruye desde porcentajes redondeados; consulta Pases completados.';
  if(key==='progressive')return 'No se publica la definición de pases progresivos en estas fuentes. Pases rompelíneas es una métrica distinta.';
  if(key==='psxgEfficiency'&&p.psxg===0)return 'El xGOT recibido es cero; el cociente de eficacia no tiene un denominador positivo.';
  if(key==='psxg'||key==='psxgEfficiency'||key==='psxg90'||key==='psxgPerMatch')return 'No se pudo verificar xGOT y goles sin autogoles en la misma muestra del portero; no se sustituye con el xG del equipo.';
  if(key==='xgaOnTarget'||key==='xgaOnTargetPerMatch')return 'El mapa del portero no permite comprobar todos los tiros a puerta afrontados en esta muestra.';
  const base=GradaMetrics.fixedRates[key]||GradaMetrics.perMatch[key]||key,context=GradaMetrics.context(p,base);
  if(GradaMetrics.fixedRates[key]||unit==='90'&&rates.has(key)){if(!Number.isFinite(context?.minutes??p.minutes)||(context?.minutes??p.minutes)<=0)return 'Faltan minutos positivos de la fuente de este dato para calcular la tasa.';}
  if(p.pos==='POR'&&['xga','xga90','xgaPerMatch'].includes(key))return 'No se publica xG de todos los tiros recibidos por este portero. Hay métricas separadas de xG a puerta y xGOT cuando su cobertura se verifica.';
  return 'El dato no aparece en las fuentes verificadas para este jugador, competición y muestra. No se completa con cero.';
}
function val(p,k) {
  if(k==='areaPlayers'){const a=squad(p);return a?a.validPlayers+' / '+a.totalPlayers:'—';}
  for(const [profile,config] of Object.entries(GradaSquads.unitKeys))if(k===config.coverage){const a=unitSummary(p,profile);return a?a.validPlayers+' / '+a.totalPlayers:'—';}
  const n = metric(p,k);
  if (n === null) return '<span class="unavailable" tabindex="0" title="'+esc(missingReason(p,k))+'" aria-label="'+esc(missingReason(p,k))+'">—</span>';
  const factor = Object.hasOwn(GradaMetrics.ratios,k);
  const decimals = ['radarArea','teamArea','strikerArea','midfieldAttackArea','midfieldDefenseArea'].includes(k)?3:view==='rankings'&&rankingAxisKeys.has(k)?2:factor || Object.hasOwn(GradaMetrics.perMatch,k) || GradaMetrics.fixedRates[k] || unit === '90' && rates.has(k) ? 2 : ['xg','xa','xgaOnTarget','psxg','psxgEfficiency','delta','conversion','savepct','xga','psxg','prevented','minutes','accuracy','xgot','shotsPer90',...GradaFotmob.publishedRates,...GradaFotmob.percentages].includes(k) ? 1 : 0;
  return new Intl.NumberFormat('es-ES',{minimumFractionDigits:['radarArea','teamArea','strikerArea','midfieldAttackArea','midfieldDefenseArea'].includes(k)?3:view==='rankings'&&rankingAxisKeys.has(k)?2:factor?2:0,maximumFractionDigits:decimals}).format(n)+(factor?'×':'');
}
function compare(a,b,key = sort) {
  const x = ['name','team','pos','league'].includes(key) ? a[key] ?? null : metric(a,key), y = ['name','team','pos'].includes(key) ? b[key] ?? null : metric(b,key);
  if (x === null && y === null) return a.name.localeCompare(b.name);
  if (x === null) return 1;
  if (y === null) return -1;
  const d = typeof x === 'string' ? x.localeCompare(y) : x-y;
  return d ? direction*d : a.name.localeCompare(b.name);
}
function keysFor(p,isTeam = false) { let keys=isTeam?teamkeys:p.pos==='POR'?keeperkeys:playerkeys; if(!isTeam&&unit==='90')keys=[...new Set(keys.map(k=>k==='shots'?'shotsPer90':k))];return keys.filter(k=>unit!=='90'||!GradaMetrics.fixedRates[k]||!keys.includes(GradaMetrics.fixedRates[k])); }
function columns() {
  let base;
  if (isTeamView()) base = ['name',...teamkeys];
  else if (pos === 'POR') base = ['name','team','matches','minutes','saves','savesPerMatch','savepct','conceded','concededPerMatch',...(unit === 'total' ? ['conceded90'] : []),'psxg','psxgEfficiency','psxgPerMatch','xgaOnTarget','xgaOnTargetPerMatch',...(unit === 'total' ? ['psxg90'] : []),'prevented','highClaims','sweeperActions','clean'];
  else if (pos === 'DEF') base = ['name','team','minutes','tackles','interceptions','recoveries','clearances','blocks','lineBreakingPasses','completedPer90','accuracy','progressive'];
  else if (pos === 'MED') base = ['name','team','minutes','completedPer90','accuracy','lineBreakingPasses','tackles','interceptions','recoveries','xa','keypasses','chancesCreated','bigChancesCreated','goals','assists','shots','shotsOnTargetPer90'];
  else base = ['name','team','pos','minutes','shots','shotsOnTargetPer90','goals','assists','xg','xa','goalsPerXg','assistsPerXa','conversion','dribblesPer90'];
  if(view!=='teams')base.push('radarArea');
  if(!isTeamView()&&pos!=='POR'){base=base.filter(k=>k!=='keypasses');if(unit==='90')base=base.map(k=>k==='shots'?'shotsPer90':k);else base.push('shotsPer90');}
  if (view !== 'teams' && pos !== 'POR') {
    for (const key of [unit==='90'?'shotsPer90':'shots','goalsPerXg','assistsPerXa']) if (!base.includes(key)) base.push(key);
  }
  for(const rule of numericRules()) if(rule.value!==''&&labels[rule.key]&&!base.includes(rule.key)) base.push(rule.key);
  if(view==='rankings'){
    const mid=activeUnit(),config=GradaSquads.unitKeys[mid];
    base=['name',...(isTeamView()?[]:['team']),...(isAll()?['league']:[]),...(isTeamView()?['teamArea','areaPlayers']:[]),...(mid?[config.area,config.coverage]:['radarArea']),isTeamView()?'matches':'minutes',...(mid?[]:radarProfiles.get((isTeamView()?teams():players()).find(p=>isTeamView()||p.pos===GradaRadar.definition(rankingProfile).position))?.expectedAxes||[])];
  }
  if(isAll()&&!base.includes('league'))base.splice(1,0,'league');
  for(const rule of numericRules())if(rule.value!==''&&labels[rule.key]&&!base.includes(rule.key))base.push(rule.key);
  if (labels[sort] && !base.includes(sort)) base.push(sort);
  base=[...new Set(base)];
  return base;
}

function numericRules() {
  const rules = [];
  for (const [id,key] of [['min-minutes','minutes'],['min-goals','goals']]) if ((key!=='minutes'||!isTeamView())&&$('#'+id).value !== '') rules.push({key,op:'>=',value:$('#'+id).value});
  $$('#metric-rules .metric-rule').forEach(row=>rules.push({key:row.querySelector('[data-rule-key]').value,op:row.querySelector('[data-rule-op]').value,value:row.querySelector('[data-rule-value]').value}));
  return rules;
}
function addMetricRule() {
  if ($$('#metric-rules .metric-rule').length >= 6) return;
  const row = document.createElement('div'); row.className = 'metric-rule';
  row.innerHTML = '<select data-rule-key aria-label="Métrica del filtro">'+Object.entries(labels).filter(([k])=>!['name','team','pos','league'].includes(k)).map(([k,v])=>'<option value="'+k+'">'+esc(k==='radarArea'&&isTeamView()?columnLabel(k,true):v)+'</option>').join('')+'</select><select data-rule-op aria-label="Comparación"><option value=">=">≥</option><option value=">">&gt;</option><option value="<=">≤</option><option value="<">&lt;</option></select><input data-rule-value type="number" step="any" aria-label="Valor del filtro" placeholder="Valor"><button data-rule-remove class="linkbtn" aria-label="Eliminar filtro">×</button>';
  $('#metric-rules').append(row); $('#add-rule').disabled = $$('#metric-rules .metric-rule').length >= 6;
}
function originMark(record,key) {
  if(squadMetricKeys.has(key)&&squad(record))return '<small class="metric-source" title="'+esc(['teamArea','areaPlayers'].includes(key)?GradaSquads.definition:GradaSquads.definition)+'">GRADA · plantilla</small>';
  if(key==='radarArea'&&isTeamView()&&metric(record,key)===null)return '<small class="metric-source">'+esc(indexPending(record))+'</small>';
  if(key==='radarArea'&&metric(record,key)!==null){
    const profile=radarProfiles.get(record);
    return '<small class="metric-source" title="'+esc(profile.profileLabel+' · '+profile.axes.map(a=>a.label).join(', ')+' · comparar solo la misma posición y ejes')+'">GRADA · '+esc(profile.kind==='team'?'Equipo':record.pos)+' · '+profile.axes.length+' ejes</small>';
  }
  return isCombined()?GradaComponents.sourceMark(record,key,data.metadata):'';
}
function combinationNote(record) {
  if (!isCombined()) return '';
  if(isAll())return '<p class="sub combination-note">'+esc(record.league)+' · datos y prioridad de la liga original; referencia del radar: todas las ligas seleccionadas.</p>';
  const text = !record.combination?.matched?'Sin coincidencia única en las fuentes complementarias: se conservan los datos de la fuente principal.':record.combination.conflicting_fields.length?'Hay discrepancias entre las fuentes; se respeta la prioridad indicada arriba. Cada cifra muestra su origen.':'Registro completado con '+Object.keys(record.sourceRecords).filter(k=>k!==primarySource()).join(' y ')+'. '+primarySource()+' mantiene la prioridad.';
  return '<p class="sub combination-note">'+text+'</p>';
}
function radarFor(record) { return GradaComponents.radar(record,players(),data.metadata,radarProfiles.get(record)); }
function rows() {
  const search=$('#search').value.trim().toLocaleLowerCase('es'),tf=$('#teamfilter').value,rules=numericRules(),def=GradaRadar.definition(rankingProfile);
  return (isTeamView()?teams():players()).filter(p=>{
    if(!isTeamView()&&(pos!=='Todos'&&p.pos!==pos||tf&&(isAll()?p.league_key+'|'+p.team:p.team)!==tf))return false;
    if(view==='rankings'){if(isTeamView()){if(!Number.isFinite(p.matches)||p.matches<rankingMinimum)return false;}else if(p.pos!==def.position||!GradaRadar.rankingEligible(p,radarProfiles.get(p),rankingMinimum))return false;}
    return GradaFilters.textMatches(p,search)&&GradaFilters.matches(p,rules,(record,key)=>(key==='radarArea'||squadMetricKeys.has(key))?metric(record,key):GradaMetrics.metric(record,key,'total'));
  }).sort((a,b)=>compare(a,b));
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
  $('#tbody').innerHTML = a.map((p,i)=>'<tr><td>'+(view==='rankings'&&isTeamView()&&(sort==='radarArea'||squadMetricKeys.has(sort))&&metric(p,sort)===null?'—':String(i+1).padStart(2,'0'))+'</td>'+cols.map(k=>'<td class="'+(['goals','xg','saves'].includes(k)?'highlight':'')+'">'+(k === 'name' ? '<button class="namebtn" data-detail="'+esc(p.id)+'"><span class="initials">'+esc(initials(p.name))+'</span>'+esc(p.name)+'</button>' : k === 'pos' ? '<span class="pos">'+esc(p.pos)+'</span>' : k === 'team' ? esc(p.team) : k==='league'?esc(p.league) : val(p,k)+originMark(p,k))+'</td>').join('')+'</tr>').join('') || '<tr><td colspan="'+(cols.length+1)+'" class="empty">'+(loaded ? 'No hay resultados con estos filtros.' : 'Aún no hay datos importados.')+'</td></tr>';
  $('#count').textContent = a.length+' '+(isTeamView()?'equipos':'jugadores')+' · '+source()+(isLive()?' · plantillas actuales':'')+(view==='rankings'?' · unidades por eje':unit === '90'?' · volumen por 90 min':'');
  $('#radar-table-note').hidden=false;
  $('#radar-table-note').textContent=view==='rankings'&&activeUnit()?GradaSquads.unitDefinition(activeUnit())+' Los filtros y el mínimo de PJ del equipo no cambian los pesos.':isTeamView()?'Score de equipo = promedio de scores ponderado por minutos, entre 0 y 1; cobertura en Jugadores ponderados. '+(view==='rankings'&&rankingProfile!=='TEAM_OVERALL'?'Orden inicial por índice específico; los equipos con datos pendientes aparecen sin puesto.':'Orden inicial por score ponderado; el índice global se conserva aparte.')+' Los filtros no cambian los pesos.':view==='rankings'?'Ranking por score con todos los ejes y muestra mínima de '+rankingMinimum+' minutos; referencia fija para este perfil y selección.':'Score de jugadores por posición, entre 0 y 1; — si faltan ejes. Los filtros no cambian la referencia.';
  $$('[data-sort]').forEach(b=>b.onclick=()=>{ direction = sort === b.dataset.sort ? -direction : -1; sort = b.dataset.sort; renderTable(); });
  $$('[data-detail]').forEach(b=>b.onclick=()=>detail(b.dataset.detail,isTeamView()));
  bindHelp();
}
function renderLeaders() {
  const categories = [['Goles','goals'],['Pases completados','completed'],['Asistencias','assists'],['Goles esperados','xg'],['xA · '+primarySource(),'xa'],['Precisión de pase','accuracy'],['Paradas','saves']];
  $('#leaders').innerHTML = categories.map(([title,key])=>{
    const list = players().filter(p=>(key === 'saves'?p.pos === 'POR':p.pos !== 'POR') && metric(p,key) !== null && (key !== 'accuracy' || p.passes >= 30 || p.passes == null && GradaMetrics.context(p,'accuracy')?.minutes >= 450)).sort((a,b)=>(metric(b,key)-metric(a,key)) || a.name.localeCompare(b.name)).slice(0,5);
    return '<article class="leadercard"><h3>'+title+(unit === '90' && rates.has(key)?' / 90 min':'')+'</h3>'+list.map((p,i)=>'<div class="leaderrow"><span class="leaderplace">'+(i+1)+'</span><button class="namebtn" data-leader-profile="'+esc(p.id)+'"><span class="initials">'+esc(initials(p.name))+'</span><span>'+esc(p.name)+'<small>'+esc(p.team)+'</small></span></button><strong>'+val(p,key)+(key === 'accuracy'?'%':'')+originMark(p,key)+'</strong></div>').join('')+(list.length?'':'<p class="empty">'+(loaded?'Métrica no disponible en esta fuente o unidad.':'Sin datos importados')+'</p>')+'<button class="leaderlink" data-leader-sort="'+key+'">Ver ranking →</button></article>';
  }).join('');
  $$('[data-leader-profile]').forEach(b=>b.onclick=()=>detail(b.dataset.leaderProfile,false));
  $$('[data-leader-sort]').forEach(b=>b.onclick=()=>{ sort = b.dataset.leaderSort; pos = sort === 'saves'?'POR':'Todos'; direction = -1; $('#search').value = ''; $('#teamfilter').value = ''; syncPositions(); navigate('players'); });
}
function sumKnown(list,key) { return list.length && list.every(p=>GradaMetrics.number(p[key])) ? list.reduce((s,p)=>s+p[key],0) : null; }
function openRanking(key,id=null){
  const def=GradaRadar.definition(key);rankingProfile=key;rankingMinimum=def.minimum;$('#ranking-min').value=rankingMinimum;$('#search').value='';$('#teamfilter').value='';$('#min-minutes').value='';$('#min-goals').value='';$('#metric-rules').innerHTML='';$('#add-rule').disabled=false;
  navigate('rankings');if(id)detail(id,def.kind==='team');
}
function renderRankingPreviews(){
  const targets={DEL:'#striker-leaders',POR:'#keeper-leaders',DEF:'#defender-leaders',MED_ATT:'#attacking-midfield-leaders',MED_DEF:'#defensive-midfield-leaders',TEAM_ATTACK:'#ranks',TEAM_STRIKERS:'#striker-team-leaders',TEAM_DEFENSE:'#defense-leaders',TEAM_MED_ATT:'#team-attacking-midfield-leaders',TEAM_MED_DEF:'#team-defensive-midfield-leaders',TEAM_OVERALL:'#overall-team-leaders'};
  for(const def of GradaRadar.rankingDefinitions){
    const key=def.key,target=targets[key],mid=def.aggregateProfile,overall=key==='TEAM_OVERALL',sum=mid||overall,records=def.kind==='team'?teams():players(),profiles=sum?null:GradaRadar.profiles(records,{kind:def.kind,profileKey:key});
    const summary=p=>mid?unitSummary(p,mid):squad(p),score=p=>sum?summary(p)?.area??null:profiles.get(p)?.comparableArea??null;
    const ranked=records.filter(p=>sum?Number.isFinite(p.matches)&&p.matches>=def.minimum&&score(p)!==null:(def.kind==='team'||p.pos===def.position)&&GradaRadar.rankingEligible(p,profiles.get(p),def.minimum)).sort((a,b)=>score(b)-score(a)||a.name.localeCompare(b.name)).slice(0,5);
    $(target).innerHTML=ranked.map((p,i)=>{
      const coverage=sum?summary(p):null,caption=sum?coverage.validPlayers+' / '+coverage.totalPlayers+(mid?' '+GradaSquads.unitKeys[mid].position:' jugadores')+' ponderados':def.kind==='team'?p.matches+' PJ':p.team;
      return '<div class="rank"><span class="ranknum">'+(i+1)+'</span><div class="rankname"><button class="namebtn" data-open-ranking="'+key+'" data-preview-id="'+esc(p.id)+'">'+esc(p.name)+'</button><small>'+esc([p.league,caption].filter(Boolean).join(' · '))+'</small></div><div class="rankscore">'+new Intl.NumberFormat('es-ES',{minimumFractionDigits:3,maximumFractionDigits:3}).format(score(p))+'<small class="rank-score-label">'+(sum?'Score ponderado':def.kind==='player'?'Score de jugador':'Score 0–1')+'</small></div></div>';
    }).join('')+(ranked.length?'':'<p class="empty">Sin candidatos con scores válidos y muestra suficiente.</p>')+'<button class="linkbtn" data-open-ranking="'+key+'" '+(!loaded?'disabled':'')+'>Ver ranking completo →</button>';
  }
  $$('#overview [data-open-ranking]').forEach(button=>button.onclick=()=>openRanking(button.dataset.openRanking,button.dataset.previewId));
}
function dashboard() {
  const ts = teams(), ps = players();
  const values = [['Goles',sumKnown(ts,'goals'),'Marcadores de los equipos'],['Goles esperados · xG',sumKnown(ts,'xg'),'Suma del xG de los tiros'],['Asistencias',sumKnown(ps,'assists'),isLive()?'Plantillas actuales, cobertura parcial':'Pases marcados como asistencia'],['Paradas',sumKnown(ps.filter(p=>p.pos === 'POR'),'saves'),'Tiros detenidos por porteros']];
  $('#cards').innerHTML = values.map(([title,value,note])=>'<div class="card"><div class="label">'+title+'</div><strong>'+(value === null?'—':new Intl.NumberFormat('es-ES',{maximumFractionDigits:1}).format(value))+'</strong><small>'+note+' · totales</small></div>').join('');
  renderRankingPreviews();
  const matches = loaded ? data.matches || [] : [];
  if (!matches.length) {
    $('#chart').innerHTML = '<p class="empty">'+(isLive()?'Esta consulta ofrece estadísticas de temporada, sin serie de partidos ni xG.':'Esta captura no incluye una serie de xG por partido. Puedes consultar los totales de los equipos.')+'</p>';
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
    return '<div class="panel"><p class="sub">JUGADOR '+(i+1)+'</p><select class="compareselect" data-compare="'+i+'" aria-label="Jugador '+(i+1)+'">'+a.map(q=>'<option value="'+esc(q.id)+'" '+(String(q.id) === String(id)?'selected':'')+'>'+esc(q.name)+' · '+esc(q.team)+'</option>').join('')+'</select><h2>'+esc(p.name)+'</h2><p class="sub">'+esc(p.team)+' · '+esc(p.pos)+'</p>'+combinationNote(p)+radarFor(p)+keysFor(p).map(k=>'<div class="comparestat"><span>'+columnLabel(k,false)+'</span><b>'+val(p,k)+originMark(p,k)+'</b></div>').join('')+'</div>';
  }).join('');
  $$('[data-compare]').forEach(e=>e.onchange=()=>{ choices[+e.dataset.compare] = e.value; renderCompare(); });
}
function unitCard(record,profile){return GradaComponents.squadArea(unitSummary(record,profile),{title:GradaSquads.unitKeys[profile].label,population:GradaSquads.unitKeys[profile].population,note:GradaSquads.unitDefinition(profile)});}
function detail(id,isTeam) {
  const p = (isTeam?teams():players()).find(p=>String(p.id) === String(id));
  if (!p) return;
  $('#detailbody').innerHTML = '<span class="badge">'+esc(source())+'</span><h1 class="detailtitle">'+esc(p.name)+'</h1><p class="sub">'+esc(p.team || data.metadata.competition)+(p.league?' · '+esc(p.league):'')+' · '+esc(data.metadata.season)+(unit === '90'?' · volumen por 90 min':'')+'</p>'+combinationNote(p)+(isTeam?GradaComponents.squadArea(squad(p)):'')+(isTeam&&view==='rankings'&&activeUnit()?unitCard(p,activeUnit()):isTeam?radarFor(p)+Object.keys(GradaSquads.unitKeys).map(key=>unitCard(p,key)).join(''):radarFor(p))+'<div class="detailstats">'+keysFor(p,isTeam).map(k=>'<div class="comparestat"><span>'+columnLabel(k,isTeam)+'</span><b>'+val(p,k)+originMark(p,k)+'</b></div>').join('')+'</div><p class="sub note">'+(isSeason()?esc(data.metadata.notes):'— = no disponible. Las tasas /90 usan los minutos de juego. PSxG y goles evitados no se calculan para StatsBomb. xA derivada del xG de tiros asistidos.')+'</p>';
  $('#detail').showModal();
}
function navigate(v,scroll=true,preserveSort=false){
  const previous=view;view=v;
  if(v==='rankings'){const def=GradaRadar.definition(rankingProfile);if(def.kind==='player')pos=def.position;if(previous!==v){rankingMinimum=def.minimum;$('#ranking-min').value=rankingMinimum;}if(!preserveSort){sort=rankingSort();direction=-1;}}
  if(v==='teams'&&previous!==v){sort='teamArea';direction=-1;}
  updateRadarProfiles();
  const info={overview:['Vista general','Estadísticas de fútbol','Líderes y estadísticas de jugadores y equipos.'],players:['Jugadores','Estadísticas de jugadores','Datos de '+source()+'. Selecciona un jugador para explorar.'],teams:['Equipos','Estadísticas de equipos','Ataque, defensa y rendimiento de los equipos.'],rankings:['Rankings','Rankings por score del radar','Elige un perfil y compara dentro de la liga o del conjunto seleccionado.'],compare:['Comparador','Comparador de jugadores','Contrasta perfiles y métricas en su contexto.'],glossary:['Glosario','Glosario de métricas','Definiciones y límites de los datos disponibles.']}[v];
  $('#crumb').textContent=info[0];$('#pagetitle').textContent=info[1];$('#pagesub').textContent=info[2];
  $$('nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
  $('#overview').classList.toggle('hidden',v!=='overview');$('#listing').classList.toggle('hidden',!['overview','teams','players','rankings'].includes(v));$('#compare').classList.toggle('hidden',v!=='compare');$('#glossary').classList.toggle('hidden',v!=='glossary');
  $('#filters').classList.toggle('hidden',v==='glossary');$('#min-minutes').closest('label').classList.toggle('hidden',isTeamView());$('#positions').classList.toggle('hidden',isTeamView()||v==='rankings');$('#teamfilter').classList.toggle('hidden',isTeamView());$('#allplayers').classList.toggle('hidden',v!=='overview');
  $('#filters .seg').classList.toggle('hidden',v==='rankings');$('#ranking-controls').classList.toggle('hidden',v!=='rankings');$('#ranking-min-caption').textContent=isTeamView()?'Partidos mínimos':'Minutos mínimos';$('#ranking-profile').value=rankingProfile;
  $('#ranking-note').textContent=isTeamView()&&activeUnit()?GradaSquads.unitDefinition(activeUnit()):isTeamView()?'El score general pondera los jugadores por minutos. Los índices específicos conservan sus ejes; los datos pendientes se muestran y no reciben puesto.':rankingProfile.startsWith('MED_')?'Perfiles estadísticos para centrocampistas: un jugador puede aparecer en el defensivo y el ofensivo.':'Cada perfil utiliza sus propios ejes, con al menos cinco referencias por eje. Los datos ausentes no puntúan.';
  $('#tabletitle').textContent=v==='rankings'?GradaRadar.definition(rankingProfile).label:isTeamView()?'Ranking de equipos':'Ranking de jugadores';$('#tablesub').textContent=isTeamView()?'Scores de equipo ponderados por minutos, entre 0 y 1. Consulta pesos y contribuciones en la ficha.':'Selecciona un nombre para ver su radar. Score entre 0 y 1; — = no disponible.';
  if(v==='overview'){dashboard();renderLeaders();}
  syncPositions();renderTable();renderCompare();if(scroll)window.scrollTo({top:0,behavior:'smooth'});
}
function syncPositions() { $$('[data-pos]').forEach(b=>b.classList.toggle('on',b.dataset.pos === pos)); }
function applyData(next) {
  data = next; loaded = !!(data?.metadata && data.players?.length && Array.isArray(data.teams)); choices = [];
  updateRadarProfiles();
  $('#search').value='';const clubs=new Map(players().map(p=>[isAll()?p.league_key+'|'+p.team:p.team,isAll()?p.league+' · '+p.team:p.team]));$('#teamfilter').innerHTML='<option value="">Todos los equipos</option>'+[...clubs].sort((a,b)=>a[1].localeCompare(b[1])).map(([id,name])=>'<option value="'+esc(id)+'">'+esc(name)+'</option>').join('');
  $('#league').value = selectedSource(); $('#season').innerHTML = '<option>'+esc(loaded?data.metadata.season:'2026/27 · pendiente')+'</option>';
  $$('[data-source]').forEach(e=>e.textContent = source()); $('.sidefoot').textContent = 'GRADA / '+leagueConfig().name.toUpperCase()+' 2026/27';
  $('.status').textContent = source();
  if (loaded) {
    const m = data.metadata, when = new Intl.DateTimeFormat('es-ES',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Madrid'}).format(new Date(m.imported_at));
    $('.scope').textContent = m.imported_matches+'/'+m.available_matches+' partidos · '+(m.complete?'cobertura completa':'cobertura parcial');
    $('#data-status').textContent = m.competition+' '+m.season+' · '+m.source+' · '+m.imported_matches+'/'+m.available_matches+' partidos. Captura: '+when+' (Madrid). '+(isSeason()?m.notes:m.complete?'Cobertura completa de la competición.':'Cobertura parcial: los rankings no representan toda la competición.');
    $('#active-source').textContent = isAll()?'Understat (LaLiga)':primarySource(); $('#active-source').href = GradaSecurity.sourceURL(isAll()?'Understat':primarySource(),currentLeague); $('#secondary-source').hidden = !isCombined(); $('#secondary-source a').href=GradaSecurity.sourceURL('ESPN',currentLeague); $('#fotmob-source').hidden=primarySource()==='FotMob'||!m.sources?.FotMob; $('#fotmob-source a').href=GradaSecurity.sourceURL('FotMob',currentLeague);
    $('#coverage-details').hidden = !isCombined(); $('#coverage-notes').textContent = isCombined()?m.notes:'';
    if (isCombined()) $('#data-status').textContent = m.competition+' '+m.season+' · '+m.source+' · '+m.imported_matches+'/'+m.available_matches+' partidos. '+m.combination.matched_players+'/'+data.players.length+' jugadores complementados. Prioridad '+Object.keys(m.sources).join(' → ')+'; coincidencias inequívocas. Capturas: '+Object.entries(m.sources).map(([name,meta])=>name+' '+new Intl.DateTimeFormat('es-ES',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Madrid'}).format(new Date(meta.imported_at))+' (Madrid)').join('; ')+'.';
    if(isAll()){$('#data-status').textContent='Todas las ligas · '+data.metadata.leagues.length+' ligas · '+data.players.length+' jugadores. Percentiles del conjunto seleccionado. xG/xA conservan el modelo de su fuente; consulta los detalles de cobertura.';$('#coverage-notes').textContent=m.notes+' '+m.leagues.map(l=>l.name+': '+Object.entries(l.sources).map(([s,m])=>s+' '+new Intl.DateTimeFormat('es-ES',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Madrid'}).format(new Date(m.imported_at))).join(', ')).join('; ');}
  } else { $('.scope').textContent = 'Sin datos importados'; $('#data-status').textContent = 'Cargando capturas verificadas de las ligas combinadas…'; }
  updateRefreshButton();
  renderTerms(); navigate(view,false,true);
}
function updateRefreshButton(){
  $('#refresh').disabled=!loaded||refreshing;$('#refresh').textContent=refreshing?'Actualizando…':isAll()?'↻ Actualizar datos · todas':'↻ Actualizar datos';
}
function updateLeagueOptions(){
  const available=GradaLeagues.list().filter(l=>datasets.has(l.id));
  $('#league').innerHTML=(initialLoadsComplete&&available.length>1?'<option value="all">Todas las ligas · Combinadas</option>':'')+(available.length?available.map(l=>'<option value="'+l.id+'">'+esc(l.name)+' · Combinada</option>').join(''):'<option value="" disabled>Cargando ligas combinadas…</option>');
  $('#league').value=isAll()||datasets.has(currentLeague)?currentLeague:available[0]?.id||'';$('#league').disabled=!available.length||refreshing;
}
function activateLeague(id){
  if(id==='all'){
    if(!datasets.size)return;currentLeague='all';understatData=null;fotmobData=null;liveData=null;combinedData=GradaScopes.aggregate(GradaLeagues.list().filter(l=>datasets.has(l.id)).map(l=>datasets.get(l.id).combined));
  }else{
    const state=datasets.get(id);if(!state)return;currentLeague=id;understatData=state.understat;fotmobData=state.fotmob;liveData=state.espn;combinedData=state.combined;
  }
  applyData(combinedData);
}
function joinSources(state,espn=state.espn){
  const next=state.understat?GradaCombined.combine(state.understat,espn,state.fotmob):GradaCombined.combine(state.fotmob,espn);
  const coverage=GradaCombined.coverage(next);
  if(!coverage.complete)throw new Error('Falta cobertura para: '+coverage.missing.map(k=>labels[k]||k).join(', '));
  next.metadata.metric_coverage=coverage.counts;return next;
}
async function readProvider(key,league){
  const response=await fetch('/api/source/'+key+'?league='+encodeURIComponent(league.id),{signal:AbortSignal.timeout(120000),cache:'no-store'});
  if(!response.ok)throw new Error('No se pudo consultar '+GradaRefresh.names[key]+'.');
  const data=await response.json();if(key!=='fotmob')return data;
  const profiles=[];let cursor=0,done=0;
  async function worker(){while(cursor<data.players.length){const player=data.players[cursor++];try{
    const r=await fetch('/api/player/fotmob?league='+encodeURIComponent(league.id)+'&player='+encodeURIComponent(player.id),{signal:AbortSignal.timeout(30000),cache:'no-store'});if(r.ok)profiles.push(await r.json());
  }catch(_){}finally{done++;$('#refresh-status').textContent=league.name+' · FotMob: fichas '+done+'/'+data.players.length;}}}
  await Promise.all([worker(),worker(),worker()]);return GradaFotmob.validate(GradaProfiles.apply(data,profiles,datasets.get(league.id)?.fotmob));
}
function showRefreshReport(outcomes,ids){
  let changed=0,added=0,removed=0;
  const rows=ids.map(id=>{
    const outcome=outcomes.find(o=>o.id===id),report=outcome.report,league=GradaLeagues.get(id);
    const count=report.players.added.length+report.players.modified.length;changed+=count;added+=report.players.added.length;removed+=report.players.removed.length;
    const coverage=report.sources.map(s=>esc(GradaRefresh.names[s.key])+': '+(s.matches===null?'sin recuento':s.matches+' partidos')+(s.coverageDelta?'<small>'+esc((s.coverageDelta>0?'+':'')+s.coverageDelta)+' en cobertura</small>':'')).join('<br>')||'Se conserva la cobertura anterior';
    const matchDetails=report.sources.filter(s=>s.matchesChanged).map(s=>{
      const matches=s.matchesChanged,items=[...matches.added.map(m=>({m,new:true})),...matches.modified.map(m=>({m,new:false}))];
      return '<p>'+esc(GradaRefresh.names[s.key])+': '+items.length+' partidos con cambios ('+matches.added.length+' nuevos).'+(matches.removed.length?' '+matches.removed.length+' retirados de la captura.':'')+'</p>'+(items.length?'<details><summary>Ver partidos actualizados</summary><ul class="refresh-items">'+items.map(({m,new:isNew})=>'<li>'+esc(m.home)+' — '+esc(m.away)+' · '+esc(m.date)+(isNew?' · nuevo':' · modificado')+'</li>').join('')+'</ul></details>':'');
    }).join('');
    const playerDetails=count?'<details><summary>Ver '+count+' jugadores con cambios</summary><ul class="refresh-items">'+[...report.players.added.map(p=>({p,new:true})),...report.players.modified.map(p=>({p,new:false}))].sort((a,b)=>a.p.name.localeCompare(b.p.name,'es')).map(({p,new:isNew})=>'<li>'+esc(p.name)+' · '+esc(p.team)+(isNew?' · nuevo':' · modificado')+'</li>').join('')+'</ul></details>':'';
    const profileDetails=report.sources.filter(s=>s.profiles).map(s=>'<p>Fichas FotMob verificadas: '+esc(s.profiles.matched)+'/'+esc(s.profiles.requested)+'.'+(s.profiles.matched<s.profiles.requested?' Se conservan los datos anteriores donde no hay ficha válida.':'')+'</p>').join('');
    return '<tr><th scope="row">'+esc(league.name)+'</th><td>'+count+' ('+report.players.added.length+' nuevos)'+(report.players.removed.length?'<small>'+report.players.removed.length+' retirados</small>':'')+'</td><td>'+coverage+'</td></tr><tr class="refresh-detail"><td colspan="3">'+playerDetails+matchDetails+profileDetails+(!report.sources.some(s=>s.matchesChanged)?'<p>Sin registros por partido en las fuentes validadas; no se puede identificar qué encuentros cambiaron.</p>':'')+'</td></tr>';
  }).join('');
  $('#refresh-report-body').innerHTML='<p>Jugadores con cambios compara sus datos con los anteriores; una nueva fecha de consulta no cuenta como cambio. Partidos cubiertos indica el total de temporada por fuente, sin sumar proveedores. Los partidos actualizados se identifican solo cuando hay registros por encuentro.</p><div class="tablewrap"><table><thead><tr><th>Liga</th><th>Jugadores con cambios</th><th>Partidos cubiertos · fuente</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
  $('#refresh-report').hidden=false;$('#refresh-report').open=true;
  return 'Jugadores con cambios: '+changed+' ('+added+' nuevos). '+(removed?'Retirados: '+removed+'. ':'');
}
async function refreshData(){
  if(refreshing||!loaded)return;
  const scope=currentLeague,ids=isAll()?GradaLeagues.list().filter(l=>datasets.has(l.id)).map(l=>l.id):[currentLeague];
  refreshing=true;$('#league').disabled=true;$('#refresh-report').hidden=true;updateRefreshButton();
  const outcomes=[];let cursor=0;
  async function worker(){while(cursor<ids.length){
    const id=ids[cursor++],league=GradaLeagues.get(id),state=datasets.get(id);
    try{
      const result=await GradaRefresh.refresh(state,league,{combine:next=>joinSources(next),onProgress:key=>{$('#refresh-status').textContent=league.name+' · consultando '+GradaRefresh.names[key]+'…';},fetchers:{espn:l=>GradaLaLiga.fetchSeason({leagueId:l.id}),fotmob:l=>readProvider('fotmob',l),understat:l=>readProvider('understat',l)}});
      datasets.set(id,result.state);
      const saved=await Promise.all(result.checked.map(key=>captureStore.set(id,key,result.state[key])));
      outcomes.push({id,...result,report:GradaRefresh.report(state,result),saved:saved.every(Boolean)});
    }catch(_){const result={state,checked:[],updated:[],failed:GradaRefresh.sources(league)};outcomes.push({id,...result,report:GradaRefresh.report(state,result),saved:true});}
  }}
  try{
    await Promise.all(Array.from({length:Math.min(2,ids.length)},worker));
    if(outcomes.some(o=>o.checked.length))activateLeague(scope);
    const checked=outcomes.reduce((n,o)=>n+o.checked.length,0),total=ids.reduce((n,id)=>n+GradaRefresh.sources(GradaLeagues.get(id)).length,0),failed=outcomes.flatMap(o=>o.failed.map(key=>GradaLeagues.get(o.id).name+' · '+GradaRefresh.names[key]));
    const summary=showRefreshReport(outcomes,ids);
    $('#refresh-status').textContent='Actualización finalizada. '+summary+'Fuentes consultadas: '+checked+'/'+total+'. '+(checked?'Datos combinados y scores recalculados. ':'')+(failed.length?'Se conservan las capturas anteriores de '+failed.join('; ')+'. ':'')+'Cada fuente mantiene su fecha. '+(outcomes.some(o=>!o.saved)?'No se pudo guardar alguna captura en este navegador.':'Las capturas válidas se guardan en este navegador.');
  }finally{refreshing=false;$('#league').disabled=false;updateRefreshButton();}
}
const terms = [
  ['Fuentes y cobertura','Selector de ligas combinadas 2026/27. LaLiga prioriza Understat, ESPN y FotMob, en ese orden. Las demás ligas usan FotMob como fuente principal y ESPN como complemento. Los modelos de xG/xA pueden diferir entre proveedores; las cifras conservan origen, fecha y denominador. Solo se habilitan ligas con todas las familias de métricas verificadas.'],
  ['xG · Goles esperados',descriptions.xg+' Los endpoints de ESPN usados aquí no lo incluyen.'],['xA derivada de tiros',descriptions.xa],['Conversión y goles − xG',descriptions.conversion+' '+descriptions.delta],
  ['Paradas y xG recibidos',descriptions.saves+' '+descriptions.xga],['Goles/xG y asistencias/xA',descriptions.goalsPerXg+' '+descriptions.assistsPerXa],['xG recibidos por partido',descriptions.xgaPerMatch],['Tasas de porteros por 90',descriptions.xga90+' '+descriptions.conceded90],['PSxG y goles evitados',descriptions.psxg+' '+descriptions.prevented],
  ['Recuperaciones e intercepciones',descriptions.recoveries+' '+descriptions.interceptions+' Las entradas son otra acción distinta; no se presentan como robos ganados si el proveedor no lo especifica.'],
  ['Pases precisos por 90',descriptions.completedPer90],
  ['Precisión de pase',descriptions.accuracy+' El panel de líderes exige al menos 30 intentos; si solo hay porcentaje publicado, exige 450 minutos de su proveedor.'],['Pases clave y progresivos',descriptions.keypasses+' '+descriptions.progressive],['Minutos y por 90',descriptions.minutes+' Volumen × 90 ÷ minutos. Los porcentajes conservan su denominador. ESPN no proporciona minutos en esta consulta: las tasas se muestran —.'],
  ['Entradas e intercepciones',descriptions.tackles+' '+descriptions.interceptions],['Portería a cero y porcentaje de paradas',descriptions.clean+' '+descriptions.savepct],
  ['Vista combinada y filtros','Se conserva el catálogo y prioridad declarados para cada liga (Understat → ESPN → FotMob en LaLiga; FotMob → ESPN en las demás); se exige coincidencia inequívoca de nombre y equipo. Las tasas usan los denominadores de la fuente original. Los filtros de tabla se aplican a totales y se combinan con Y; un dato ausente no satisface un filtro. Cada métrica conserva su procedencia.'],
  ['Score de jugador',descriptions.radarArea],
  ['Score general de equipo',descriptions.teamArea],
  ['Centros del campo y delantera',GradaSquads.definition+' Los perfiles describen acciones y pueden solaparse; no identifican una posición detallada ni valoran el sistema táctico completo.'],
  ['Pases rompelíneas y métricas FotMob',descriptions.lineBreakingPasses+' '+descriptions.shotsOnTargetPer90+' '+descriptions.chancesCreated+' Más métricas disponibles en la ficha y en Añadir otra métrica; no todas las páginas publican todos los jugadores.'],
  ['Radar estadístico','Percentiles frente a jugadores de la misma posición: mínimo 450 minutos, o 180 para porteros (2 PJ si no hay minutos). Cada eje exige al menos cinco referencias; el gráfico necesita tres ejes. Los volúmenes usan /90 o /PJ según su etiqueta. En goles recibidos menos es mejor; el resto de ejes aumenta con el valor. Son estadísticas disponibles, no una valoración física.'],
  ['Actualizar datos','Consulta ESPN, FotMob y Understat cuando esa fuente se usa en la liga seleccionada. FotMob y Understat se consultan desde el servidor de GRADA, con caché breve. Cada captura se valida antes de combinar. Si falla una fuente se conserva su captura y fecha anterior. Las capturas válidas se guardan en este navegador y los scores se recalculan sin cambiar su fórmula.']
];
function renderTerms(){ $('#terms').innerHTML = terms.map((item,i)=>{let t=[...item];if(t[0].startsWith('xG ·'))t[1]=description('xg');if(t[0]==='xA derivada de tiros')t=['xA · Asistencias esperadas',description('xa')];return t;}).map((t,i)=>'<article class="panel"><span class="badge">'+String(i+1).padStart(2,'0')+'</span><h2 class="detailtitle">'+esc(t[0])+'</h2><p>'+esc(t[1])+'</p></article>').join(''); }
$('#ranking-profile').innerHTML=[['player','Jugadores'],['team','Equipos']].map(([kind,label])=>'<optgroup label="'+label+'">'+GradaRadar.rankingDefinitions.filter(d=>d.kind===kind).map(d=>'<option value="'+d.key+'">'+esc(d.label)+'</option>').join('')+'</optgroup>').join('');
$('#ranking-profile').onchange=()=>{rankingProfile=$('#ranking-profile').value;rankingMinimum=GradaRadar.definition(rankingProfile).minimum;$('#ranking-min').value=rankingMinimum;navigate('rankings',false);};
$('#ranking-min').oninput=()=>{rankingMinimum=Number($('#ranking-min').value);renderTable();};
$$('nav button').forEach(b=>b.onclick=()=>navigate(b.dataset.view));
$$('[data-pos]').forEach(b=>b.onclick=()=>{ pos = b.dataset.pos; sort = pos==='Todos'?'goals':'radarArea'; direction = -1; syncPositions(); renderTable(); });
$$('[data-unit]').forEach(b=>b.onclick=()=>{ unit = b.dataset.unit; if (unit === '90' && GradaMetrics.fixedRates[sort] && sort !== 'completedPer90') sort = GradaMetrics.fixedRates[sort]; $$('[data-unit]').forEach(q=>q.classList.toggle('on',q === b)); dashboard(); renderTable(); renderLeaders(); renderCompare(); });
$('#min-minutes').oninput = renderTable; $('#min-goals').oninput = renderTable;
$('#add-rule').onclick = addMetricRule;
$('#metric-rules').oninput = renderTable; $('#metric-rules').onchange = renderTable;
$('#metric-rules').onclick = e=>{ const button = e.target.closest('[data-rule-remove]'); if (button) { button.closest('.metric-rule').remove(); $('#add-rule').disabled = false; renderTable(); } };
$('#clear-metrics').onclick = ()=>{ $('#min-minutes').value = ''; $('#min-goals').value = ''; $('#metric-rules').innerHTML = ''; $('#add-rule').disabled = false; renderTable(); };
$('#search').oninput = renderTable; $('#teamfilter').onchange = renderTable; $('#allplayers').onclick = ()=>navigate('players'); $('.close').onclick = ()=>$('#detail').close();
$('#refresh').onclick = () => refreshData();
$('#league').onchange=()=>{if(refreshing){$('#league').value=currentLeague;return;}$('#refresh-status').textContent='';$('#refresh-report').hidden=true;activateLeague($('#league').value);};
document.addEventListener('pointerdown',()=>interaction++,true);
document.addEventListener('keydown',()=>interaction++,true);
async function readCapture(filename,validator){
  const r=await fetch('downloads/'+filename,{signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw new Error('No hay captura publicada: '+filename);
  return validator(await r.json());
}
async function loadLeague(l){
  const [espn,fotmob,understat]=await Promise.all([
    readCapture(l.espnFile,GradaLaLiga.validate),
    readCapture('fotmob-'+l.id+'-2026-27.json',GradaFotmob.validate),
    l.primary==='Understat'?readCapture('understat-'+l.id+'-2026-27.json',GradaUnderstat.validate):Promise.resolve(null)
  ]);
  const state={espn,fotmob,understat,combined:null};
  for(const key of GradaRefresh.sources(l)){
    const cached=await captureStore.get(l.id,key),candidates=[cached];
    if(key==='espn')try{candidates.push(JSON.parse(localStorage.getItem(cacheKey(l.id))));}catch(_){}
    for(const candidate of candidates)try{const valid=GradaRefresh.validate(candidate,key,l);if(Date.parse(valid.metadata.imported_at)>Date.parse(state[key].metadata.imported_at)){const next={...state,[key]:valid};joinSources(next);state[key]=valid;}}catch(_){}
  }
  for(const raw of [state.espn,state.fotmob,state.understat].filter(Boolean))if(GradaLeagues.resolve(raw.metadata).id!==l.id)throw new Error('Captura de otra liga rechazada.');
  state.combined=joinSources(state);
  datasets.set(l.id,state);updateLeagueOptions();if(!loaded)activateLeague(l.id);
}
async function start(){
  try{
    await GradaLeagues.ready;applyData(null);updateLeagueOptions();
    const failures=[];
    try{await loadLeague(GradaLeagues.get('laliga'));}catch(e){failures.push('LaLiga: '+e.message);}
    await Promise.all(GradaLeagues.list().filter(l=>l.id!=='laliga').map(async l=>{try{await loadLeague(l);}catch(e){failures.push(l.name+': '+e.message);}}));
    initialLoadsComplete=true;updateLeagueOptions();
    if(!loaded)$('#data-status').textContent='No hay capturas combinadas completas publicadas. Ejecuta los importadores incluidos. '+failures.join(' ');
    else if(failures.length)$('#refresh-status').textContent='Solo se muestran ligas con las familias de métricas verificadas. No disponibles: '+failures.map(f=>f.split(':')[0]).join(', ')+'.';
  }catch(e){$('#data-status').textContent='No se pudieron cargar las ligas: '+e.message;}
}
start();
