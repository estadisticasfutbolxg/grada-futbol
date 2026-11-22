'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
GradaBranding.init(document);
let data = null, loaded = false;
let currentLeague='laliga',initialLoadsComplete=false,rankingProfile='DEL',rankingMinimum=GradaRadar.minimumScoreMinutes;
const datasets=new Map();
let selectedClubs=new Set(),teamCompareChoices=[];
const leagueConfig=()=>GradaLeagues.get(currentLeague);
let liveData = null, understatData = null, fotmobData = null, combinedData = null, view = 'overview', pos = 'Todos', unit = 'total', sort = 'radarArea', direction = -1, choices = [], refreshing = false, interaction = 0;
let radarProfiles = new Map(),rankingAxisKeys=new Set(),squadAreas={teams:new Map(),unassignedPlayerIds:[]},unitAreas=new Map();
let scoreModel=null,scoreCache={inputs:[],reference:null,models:new WeakMap()};
let activeLeaderKey=null;
let selectedNation='ESP';const nationCache=new WeakMap();
const leaderMinimums={field:450,saves:180};
const captureStore=GradaRefresh.captureStore();
const cacheKey=id=>'grada:espn:'+id+':2026-27:v1';
const initialQuery=new URLSearchParams(location.search),publishedCapture=initialQuery.get('datos')==='publicados';
const labels = {name:'Jugador',team:'Equipo',pos:'Posición',matches:'PJ',minutes:'Min',goals:'Goles',assists:'Asist.',xg:'xG',xa:'xA',conversion:'Conv. %',delta:'Goles − xG',passes:'Pases',completed:'Completados',accuracy:'Pases %',completedPer90:'Pases precisos /90',recoveries:'Recuperaciones',shots:'Tiros',saves:'Paradas',savepct:'Paradas %',conceded:'Goles rec.',xga:'xG recibidos',xga90:'xG recibidos /90',xgaPerMatch:'xG rec. / partido',goalsPerXg:'Goles / xG',assistsPerXa:'Asist. / xA',conceded90:'Goles rec. /90',psxg:'xGOT recibidos (PSxG)',psxgEfficiency:'Eficacia vs xGOT %',psxgPerMatch:'PSxG / partido',psxg90:'PSxG /90',xgaOnTarget:'xG tiros a puerta recibidos',xgaOnTargetPerMatch:'xG a puerta / partido',xgaOnTarget90:'xG a puerta /90',prevented:'Goles evitados',clean:'Porterías a 0',savesPerMatch:'Paradas / partido',concededPerMatch:'Goles rec. / partido',cleanPerMatch:'Porterías a 0 / partido',tackles:'Entradas',interceptions:'Intercepc.',keypasses:'Pases clave',progressive:'Pases progres.'};
Object.assign(labels,{xgPerShot:'xG por tiro',goalInvolvements:'Goles + asistencias',expectedInvolvements:'xG + xA',goalInvolvementsPer90:'Goles + asist. /90',xgXaPer90:'xG + xA /90',preventedPer90:'Goles evitados /90'});
labels.tacticalRole='Puesto publicado';labels.nationality='Nacionalidad';
const descriptions = {
  nationality:'País deportivo publicado por FotMob para el jugador y club verificados. Puede diferir del nacimiento o de todas sus ciudadanías. No acredita convocatoria ni elegibilidad internacional.',
  tacticalRole:'Puestos declarados por FotMob en la ficha o plantilla actual. CB central; LB/RB lateral; LWB/RWB carrilero; CDM pivote; CM mediocentro/interior; CAM mediapunta. Puede haber varios puestos; no se conoce el reparto de minutos. Filtrar por puesto no recalcula el score POR/DEF/MED/DEL.',
  xgPerShot:'Calidad media de las ocasiones: xG acumulado dividido entre tiros de la misma fuente y muestra. 0,15 equivale a 0,15 goles esperados por tiro. No mide el acierto del rematador. Sin tiros positivos se muestra —.',
  goalInvolvements:'Goles más asistencias publicados en la misma fuente y muestra. No suma componentes de proveedores o periodos distintos.',
  expectedInvolvements:'xG más xA del mismo proveedor y muestra. Conserva el modelo de ese proveedor; no equivale a sumar modelos de fuentes diferentes.',
  goalInvolvementsPer90:'Goles más asistencias por 90 minutos: (goles + asistencias) × 90 ÷ minutos de esa misma fuente y muestra. No se añade una tasa publicada de goles a otra de asistencias con distinta cobertura.',
  xgXaPer90:'Producción esperada por 90 minutos: (xG + xA) × 90 ÷ minutos de la misma fuente y muestra. Sirve para comparar la aportación al remate y a la creación de ocasiones.',
  preventedPer90:'Goles evitados publicados por 90 minutos de su propia fuente. Admite valores negativos; no se obtiene restando goles recibidos al xG previo al tiro.',
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
Object.assign(labels,{goalsPer90:'Goles /90 min',assistsPer90:'Asistencias /90 min',savesPer90:'Paradas /90 min'});
descriptions.goalsPer90='Goles × 90 ÷ minutos de la misma fuente y muestra. No cambia con el modo de la tabla; sin minutos positivos se muestra —.';
descriptions.assistsPer90='Asistencias × 90 ÷ minutos de la misma fuente y muestra. No cambia con el modo de la tabla; sin minutos positivos se muestra —.';
descriptions.savesPer90='Paradas por 90 minutos: tasa publicada o paradas × 90 ÷ minutos del mismo proveedor. Se usa el primer proveedor unido inequívocamente que permite verificar esa tasa. Puede diferir de la fuente del total de paradas; no se dividen paradas ESPN por minutos de otro proveedor.';
descriptions.teamArea=GradaSquads.definition+' Usa los minutos publicados de cada jugador y se recalcula por liga o Todas. Los filtros no cambian los pesos.';descriptions.areaPlayers='Jugadores con score válido y minutos positivos / plantilla asignada. Sin score o sin minutos válidos, el jugador queda pendiente y no participa en el promedio.';
for(const [key,config] of Object.entries(GradaSquads.unitKeys)){labels[config.area]=config.label;labels[config.coverage]=(config.position||'Ataque')+' ponderados';descriptions[config.area]=GradaSquads.unitDefinition(key);descriptions[config.coverage]='Jugadores con score y minutos positivos / jugadores asignados a este bloque. El filtro numérico usa el número de jugadores ponderados.';}
const squadMetricKeys=new Set(['teamArea','areaPlayers',...Object.values(GradaSquads.unitKeys).flatMap(c=>[c.area,c.coverage])]);
const scoreKeys=new Set(['radarArea','teamArea',...Object.values(GradaSquads.unitKeys).map(c=>c.area)]);
descriptions.psxgEfficiency='(1 − goles recibidos / xGOT recibido) × 100, usando ambos valores de la misma ficha y muestra del portero. Positivo: recibe menos goles de los esperados; 0: coincide con el modelo; negativo: recibe más. Se incluye en el score del portero cuando existe una referencia suficiente.';
descriptions.psxg='xGOT (xG posterior al tiro) recibido: se obtiene de los goles evitados y goles recibidos de la misma ficha FotMob, excluyendo autogoles verificados en el mapa. Si falta ese agregado, se suma el xGOT del mapa solo con cobertura completa. Método y muestra en la procedencia; no es xG previo al tiro.';descriptions.psxgPerMatch='PSxG recibidos divididos por los PJ de esa misma ficha FotMob.';descriptions.psxg90='PSxG recibidos por 90 minutos de la misma ficha.';descriptions.xgaOnTarget='Suma de xG previos al tiro de los tiros a puerta afrontados por el portero, atribuidos en su ficha FotMob. No incluye tiros fuera o bloqueados; no equivale al xG total del equipo.';descriptions.xgaOnTargetPerMatch='xG de tiros a puerta afrontados divididos por los PJ de esa ficha.';descriptions.xgaOnTarget90='xG de tiros a puerta afrontados por 90 minutos de la misma ficha.';
descriptions.shotsOnTarget='Tiros a puerta contados por ESPN o en el mapa completo de tiros del jugador en FotMob. No se reconstruyen desde tasas redondeadas; cada valor conserva sus propios PJ, minutos y fecha.';
descriptions.points='Puntos publicados en la clasificación de FotMob; se conserva su recuento y fecha.';descriptions.pointsPerMatch='Puntos divididos entre los partidos de la misma clasificación.';descriptions.bigChances='Grandes ocasiones de equipo publicadas por FotMob.';descriptions.bigChancesPerMatch='Grandes ocasiones divididas entre los PJ del mismo proveedor.';descriptions.shotsOnTargetPerMatch='Tiros a puerta por partido de equipo: tasa publicada por FotMob, sin reconstruir totales redondeados.';descriptions.goalsPerMatch='Goles marcados por el equipo divididos entre sus PJ del proveedor de esos goles.';descriptions.xgPerMatch='xG del equipo dividido entre sus PJ en la misma fuente.';descriptions.goalDifferencePerMatch='Diferencia entre goles a favor y en contra, por partido, con el mismo proveedor y cobertura.';descriptions.xgDifferencePerMatch='Diferencia entre xG a favor y recibidos, por partido, con el mismo modelo y cobertura.';descriptions.league='Liga de origen de este registro. En Todas las ligas se conservan fichas y estadísticas por competición.';
descriptions.shotsPer90='Tiros realizados por 90 minutos, tasa publicada por FotMob. No se deduce un recuento a partir de su valor redondeado.';
Object.assign(descriptions,GradaFotmob.descriptions,{
  radarArea:'Score de jugador entre 0 y 1: área del polígono del radar respecto al máximo (todos los ejes en percentil 100). Con radios r = percentil ÷ 100, se calcula la media de r[i] × r[i+1], cerrando el polígono. Se ofrece con todos los ejes comunes y muestra suficiente de su posición. Se usa una referencia común de ligas en tablas, fichas, rankings y equipos. Cada score mide rendimiento relativo a su posición. En MED, se resuelve primero el perfil ofensivo, defensivo o equilibrado y se usan los ejes de ese perfil. Sin perfil verificable se declara general. Los laterales/carrileros DEF con puesto publicado combinan entradas, intercepciones, recuperaciones, goles, xG y xA por 90, con referencia de laterales. Al área base se aplica juego limpio: intensidad = (amarillas + 10 × rojas) × 90 / minutos propios; descuento = mínimo(1; 0,10 × intensidad); factor = 1 − descuento. Penalización lineal con score mínimo 0. Los pesos son decisiones de diseño de GRADA; los recuentos agregados no permiten verificar sanciones cumplidas, dobles amarillas ni minutos en inferioridad. Sin tarjetas emparejadas y muestra suficiente, se conserva base con aviso de sin ajuste. Cambiar de ranking no lo recalcula. No es la probabilidad de jugar bien.',
  prevented:'Goles evitados publicados por FotMob: su comparación postiro entre goles esperados a puerta recibidos y goles encajados. Puede ser negativo. No se recalcula con goles de ESPN ni con xG de Understat, y no se infiere PSxG a partir del redondeo.'
});
const rates = GradaMetrics.rates;
const per90Columns={shots:'shotsPer90',goals:'goalsPer90',assists:'assistsPer90',saves:'savesPer90'};
const playerkeys = ['xgPerShot','goalInvolvementsPer90','xgXaPer90','radarArea','matches','minutes','goals','assists','xg','xa','shots','shotsOnTarget','shotsPer90','goalsPerXg','assistsPerXa','conversion','delta','completedPer90','accuracy','recoveries','keypasses','tackles','interceptions',...GradaFotmob.fields.filter(k=>!['highClaims','sweeperActions','saves','conceded','penaltiesSaved','penaltiesFaced','clean','savepct','prevented'].includes(k))];
const keeperkeys = ['radarArea','matches','minutes','saves','savesPerMatch','savepct','conceded','concededPerMatch','conceded90','xga','xga90','xgaPerMatch','psxg','psxgEfficiency','psxgPerMatch','xgaOnTarget','xgaOnTargetPerMatch','prevented','preventedPer90','clean','highClaims','sweeperActions','penaltiesSaved','penaltiesFaced','completedPer90','accuracy','longBallsPer90','longBallAccuracy','yellowCards','redCards'];
const teamkeys = ['teamArea','areaPlayers',...Object.values(GradaSquads.unitKeys).flatMap(c=>[c.area,c.coverage]),'matches','points','pointsPerMatch','goals','goalsPerMatch','xg','xgPerMatch','goalsPerXg','conceded','concededPerMatch','xga','xgaPerMatch','clean','cleanPerMatch','shotsOnTargetPerMatch','bigChances','bigChancesPerMatch','goalDifferencePerMatch','xgDifferencePerMatch'];
function esc(v) { return String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function initials(s) { return String(s).split(' ').map(w=>w[0]).slice(0,2).join(''); }
function players() { return loaded ? data.players : []; }
function teams() { return loaded ? data.teams : []; }
function isLive() { return data?.metadata?.source === 'ESPN'; }
function isUnderstat() { return data?.metadata?.source === 'Understat'; }
function isCombined() { return GradaCombined.isCombined(data); }
function isAll(){return currentLeague==='all';}
function isTeamView(){return view==='teams'||view==='rankings'&&GradaRadar.definition(rankingProfile).kind==='team';}
function scoreContext(){
  const inputs=GradaLeagues.list().filter(l=>datasets.has(l.id)).map(l=>datasets.get(l.id).combined);
  if(!scoreCache.reference||inputs.length!==scoreCache.inputs.length||inputs.some((value,i)=>value!==scoreCache.inputs[i]))scoreCache={inputs,reference:inputs.length?GradaScopes.aggregate(inputs):{metadata:{},players:[],teams:[]},models:new WeakMap()};
  return scoreCache;
}
function updateRadarProfiles(){
  const context=scoreContext(),target=data||context.reference,key=view==='rankings'?rankingProfile:null,def=GradaRadar.definition(key);
  if(!context.models.has(target))context.models.set(target,GradaScores.build(target,{referencePlayers:context.reference.players,referenceLabel:context.inputs.length+' ligas cargadas'}));
  scoreModel=context.models.get(target);squadAreas=scoreModel.overall;unitAreas=scoreModel.units;radarProfiles=new Map([...scoreModel.players,...scoreModel.teams]);
  rankingAxisKeys=new Set(GradaScores.rankingAxes(scoreModel,def));
  $('#score-reference').textContent=loaded?'Score único por jugador y perfil · referencia común: '+context.inputs.length+' ligas cargadas. Cambiar de liga filtra candidatos; conserva los scores.':'';
}
function squad(record){return scoreModel?.teams.has(record)?squadAreas.teams.get(String(record.id)):null;}
function unitSummary(record,profileKey){return scoreModel?.teams.has(record)?unitAreas.get(profileKey)?.teams.get(String(record.id)):null;}
function squadMetric(record,key){
  if(key==='teamArea'||key==='areaPlayers'){const value=squad(record);return key==='teamArea'?value?.area??null:value?.validPlayers??null;}
  for(const [profile,config] of Object.entries(GradaSquads.unitKeys))if(key===config.area||key===config.coverage){const value=unitSummary(record,profile);return key===config.area?value?.area??null:value?.validPlayers??null;}
  return null;
}
function activeUnit(){return GradaRadar.definition(rankingProfile).aggregateProfile||null;}
function rankingSort(){const def=GradaRadar.definition(rankingProfile);return def.aggregateProfile?GradaSquads.unitKeys[def.aggregateProfile].area:def.key==='TEAM_OVERALL'?'teamArea':'radarArea';}
function indexPending(record){return GradaRadar.explain(radarProfiles.get(record));}
function usesUnderstatModels() { return data?.metadata?.primary_source==='Understat' || isUnderstat(); }
function primarySource(){return data?.metadata?.primary_source || leagueConfig().primary;}
function isSeason() { return isLive() || isUnderstat() || isCombined(); }
function selectedSource() { return currentLeague; }
function source() { return loaded ? data.metadata.source : 'Sin datos'; }
function metric(p,k) { if(squadMetricKeys.has(k))return squadMetric(p,k);if(k==='radarArea')return radarProfiles.get(p)?.score??null;if(view==='rankings'&&rankingAxisKeys.has(k))return GradaMetrics.metric(p,k,GradaRadar.axis(k).unit);return GradaMetrics.metric(p,k,view==='rankings'?'total':unit); }
function columnLabel(k,isTeam = isTeamView()) {
  if(k==='radarArea'&&isTeam)return 'Score de equipo';
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
  if(isTeam&&k==='radarArea')text=GradaSquads.definition;
  if(isTeam&&k==='xgaPerMatch')text='xG recibidos del equipo divididos por sus PJ en la misma fuente.';
  if(isTeam&&k==='concededPerMatch')text='Goles recibidos por el equipo divididos por sus PJ de origen.';
  if(isCombined()&&data.metadata.sources.FotMob&&k==='clean')text='Porterías a cero publicadas por FotMob, según los criterios de su ranking de porteros.';
  if (isCombined()) text += ' Vista combinada: '+(isAll()?'prioridad según la liga original':'prioridad '+Object.keys(data.metadata.sources).join(' → '))+'. La fuente y sus PJ aparecen junto a cada valor; las tasas por 90 usan minutos de esa misma fuente o su tasa publicada. ESPN no aporta minutos ni xG recibidos de porteros.';
  if(isCombined() && data.metadata.sources.FotMob && ['completedPer90','tackles','interceptions','recoveries'].includes(k)) text += ' Para FotMob se utiliza su tasa por 90 publicada, con procedencia propia; nunca se calculan totales a partir de una tasa redondeada.';
  return text + ' Un guion (—) significa que el dato no está disponible.';
}
function missingReason(p,key){
  const composite=GradaMetrics.fixedRates[key]||key;
  if((Object.hasOwn(GradaMetrics.ratios,composite)||Object.hasOwn(GradaMetrics.sums,composite))&&p.metricContexts&&!GradaMetrics.context(p,key))return 'Los componentes requieren la misma fuente, minutos y partidos de la misma competición/temporada. Falta un componente o sus muestras no coinciden.';
  if(Object.hasOwn(GradaMetrics.ratios,composite)&&p[GradaMetrics.ratios[composite][1]]===0)return 'El denominador es cero; este cociente no se puede calcular.';
  if(squadMetricKeys.has(key))return 'No hay jugadores de esta posición con score válido y minutos positivos para ponderar.';
  if(key==='radarArea')return GradaRadar.explain(radarProfiles.get(p));
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
  if(k==='nationality')return GradaNations.label(GradaNationality.info(p));
  if(k==='areaPlayers'){const a=squad(p);return a?a.validPlayers+' / '+a.totalPlayers:'—';}
  for(const [profile,config] of Object.entries(GradaSquads.unitKeys))if(k===config.coverage){const a=unitSummary(p,profile);return a?a.validPlayers+' / '+a.totalPlayers:'—';}
  const n = metric(p,k);
  if (n === null) return '<span class="unavailable" tabindex="0" title="'+esc(missingReason(p,k))+'" aria-label="'+esc(missingReason(p,k))+'">—</span>';
  const factor = ['goalsPerXg','assistsPerXa'].includes(k);
  const decimals = scoreKeys.has(k)||k==='xgPerShot'?3:['xg','xa','xga','xgaOnTarget','psxg','prevented','delta','xgot'].includes(k)?2:view==='rankings'&&rankingAxisKeys.has(k)?2:factor || Object.hasOwn(GradaMetrics.perMatch,k) || GradaMetrics.fixedRates[k] || unit === '90' && rates.has(k) ? 2 : ['xg','xa','xgaOnTarget','psxg','psxgEfficiency','delta','conversion','savepct','xga','psxg','prevented','minutes','accuracy','xgot','shotsPer90',...GradaFotmob.publishedRates,...GradaFotmob.percentages].includes(k) ? 1 : 0;
  return new Intl.NumberFormat('es-ES',{minimumFractionDigits:scoreKeys.has(k)?3:view==='rankings'&&rankingAxisKeys.has(k)?2:factor?2:0,maximumFractionDigits:decimals}).format(n)+(factor?'×':'');
}
function compare(a,b,key = sort) {
  const x = key==='nationality'?(GradaNationality.info(a)?GradaNationality.label(GradaNationality.info(a)):null):key==='tacticalRole'?GradaRoles.info(a).label:['name','team','pos','league'].includes(key) ? a[key] ?? null : metric(a,key), y = key==='nationality'?(GradaNationality.info(b)?GradaNationality.label(GradaNationality.info(b)):null):key==='tacticalRole'?GradaRoles.info(b).label:['name','team','pos','league'].includes(key) ? b[key] ?? null : metric(b,key);
  if (x === null && y === null) return a.name.localeCompare(b.name);
  if (x === null) return 1;
  if (y === null) return -1;
  const d = typeof x === 'string' ? x.localeCompare(y) : x-y;
  return d ? direction*d : a.name.localeCompare(b.name);
}
function keysFor(p,isTeam = false) { let keys=isTeam?teamkeys:p.pos==='POR'?keeperkeys:playerkeys;if(!isTeam)keys=[...keys,...(p.pos==='POR'?['savesPer90']:['goalsPer90','assistsPer90'])];if(!isTeam&&unit==='90')keys=[...new Set(keys.map(k=>per90Columns[k]||k))];const result=keys.filter(k=>unit!=='90'||!GradaMetrics.fixedRates[k]||!keys.includes(GradaMetrics.fixedRates[k]));const first=isTeam?'teamArea':'radarArea';return [first,...new Set([...(isTeam?[]:['nationality']),...result.filter(k=>k!==first)])]; }
function columns() {
  let base;
  if (isTeamView()) base = ['name',...teamkeys];
  else if (pos === 'POR') base = ['name','team','matches','minutes','saves','savesPerMatch','savepct','conceded','concededPerMatch',...(unit === 'total' ? ['conceded90'] : []),'psxg','psxgEfficiency','psxgPerMatch','xgaOnTarget','xgaOnTargetPerMatch',...(unit === 'total' ? ['psxg90'] : []),'prevented','highClaims','sweeperActions','clean'];
  else if (pos === 'DEF') base = ['name','team','minutes','tackles','interceptions','recoveries','clearances','blocks','lineBreakingPasses','completedPer90','accuracy'];
  else if (pos === 'MED') base = ['name','team','minutes','completedPer90','accuracy','lineBreakingPasses','tackles','interceptions','recoveries','xa','keypasses','chancesCreated','bigChancesCreated','goals','assists','shots','shotsOnTargetPer90'];
  else base = ['name','team','pos','minutes','shots','shotsOnTargetPer90','goals','assists','xg','xa','xgPerShot','goalInvolvementsPer90','xgXaPer90','goalsPerXg','assistsPerXa','conversion','dribblesPer90'];
  if(view!=='teams')base.push('radarArea');
  if(!isTeamView()&&pos!=='POR'){base=base.filter(k=>k!=='keypasses');if(unit==='90')base=base.map(k=>k==='shots'?'shotsPer90':k);else base.push('shotsPer90');}
  if (view !== 'teams' && pos !== 'POR') {
    for (const key of [unit==='90'?'shotsPer90':'shots','goalsPerXg','assistsPerXa']) if (!base.includes(key)) base.push(key);
  }
  if(!isTeamView()&&unit==='90')base=base.map(k=>per90Columns[k]||k);
  for(const rule of numericRules()) if(rule.value!==''&&labels[rule.key]&&!base.includes(rule.key)) base.push(rule.key);
  if(view==='rankings'){
    const mid=activeUnit(),config=GradaSquads.unitKeys[mid];
    base=['name',...(isTeamView()?[]:['team']),...(isAll()?['league']:[]),...(isTeamView()?['teamArea','areaPlayers',...(mid?[config.area,config.coverage]:[])]:['radarArea']),isTeamView()?'matches':'minutes',...(isTeamView()?[]:[...rankingAxisKeys])];
  }
  if(isAll()&&!base.includes('league'))base.splice(1,0,'league');
  for(const rule of numericRules())if(rule.value!==''&&labels[rule.key]&&!base.includes(rule.key))base.push(rule.key);
  if (labels[sort] && !base.includes(sort)) base.push(sort);
  if(view!=='rankings'&&['goalsPer90','assistsPer90','savesPer90','completedPer90'].includes(sort)){base=base.filter(k=>k!==sort);base.splice(base.indexOf('name')+1,0,sort);}
  if(!isTeamView())base.splice(Math.max(base.indexOf('team')+1,1),0,'nationality','tacticalRole');
  base=[...new Set(base)];
  const primary=isTeamView()?(view==='rankings'&&activeUnit()?GradaSquads.unitKeys[activeUnit()].area:'teamArea'):'radarArea';
  return GradaExplore.scoreFirst(base,primary);
}

function clubOptions(){return data?GradaClubs.options(data).filter(o=>!isTeamView()||o.id!==GradaClubs.multiKey):[];}
function selectedTeamIds(){const valid=new Set(teams().map(t=>String(t.id)));return [...selectedClubs].filter(id=>valid.has(id));}
function updateClubSummary(){
  const options=clubOptions(),chosen=options.filter(o=>selectedClubs.has(String(o.id)));
  $('#club-filter-summary').textContent=chosen.length===1?chosen[0].label:chosen.length?chosen.length+' equipos':'Todos los equipos';
  $('#compare-picked').disabled=selectedTeamIds().length!==2;
}
function searchClubOptions(){
  const normalize=value=>String(value).normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase();
  const query=normalize($('#club-filter-search').value).trim();let visible=0;
  $$('#club-options label').forEach(label=>{label.hidden=!normalize(label.textContent).includes(query);if(!label.hidden)visible++;});
  $('#club-filter-empty').hidden=visible>0;
}
function renderClubOptions(){
  $('#club-options').innerHTML='<legend class="visually-hidden">Equipos incluidos</legend>'+clubOptions().map(o=>'<label><input type="checkbox" value="'+esc(o.id)+'"'+(selectedClubs.has(String(o.id))?' checked':'')+'><span>'+GradaBranding.teamLabel(teams().find(t=>String(t.id)===String(o.id))||{name:o.label},{label:o.label})+'</span></label>').join('');
  searchClubOptions();updateClubSummary();
}
function clearClubSelection(){
  selectedClubs.clear();$('#club-filter-search').value='';
  $$('#club-options input').forEach(input=>input.checked=false);searchClubOptions();updateClubSummary();
}
function renderTeamComparison(){
  $('#team-comparison').hidden=view!=='teams';if(view!=='teams')return;
  const ordered=[...teams()].sort((a,b)=>(squad(b)?.area??-1)-(squad(a)?.area??-1)||a.name.localeCompare(b.name));
  teamCompareChoices=GradaExplore.pair(ordered,teamCompareChoices);
  const alphabetical=[...teams()].sort((a,b)=>(a.league||'').localeCompare(b.league||'')||a.name.localeCompare(b.name));
  for(const [i,id]of ['#compare-team-left','#compare-team-right'].entries()){
    const select=$(id),options=alphabetical.map(t=>'<option value="'+esc(t.id)+'"'+(String(t.id)===teamCompareChoices[1-i]?' disabled':'')+'>'+esc((isAll()?t.league+' · ':'')+t.name)+'</option>').join('');
    if(select.innerHTML!==options)select.innerHTML=options;
    select.value=teamCompareChoices[i]||'';select.disabled=teams().length<2;
  }
  const details=new Map($$('#team-comparison-body details').map(el=>[el.id,el.open]));
  $('#team-comparison-body').innerHTML=GradaExplore.renderTeamComparison(GradaExplore.compareTeams(scoreModel,teamCompareChoices));
  $$('#team-comparison-body details').forEach(el=>{if(details.has(el.id))el.open=details.get(el.id);});
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
  row.innerHTML = '<select data-rule-key aria-label="Métrica del filtro">'+Object.entries(labels).filter(([k])=>!['name','team','pos','league','tacticalRole','nationality'].includes(k)).map(([k,v])=>'<option value="'+k+'">'+esc(k==='radarArea'&&isTeamView()?columnLabel(k,true):v)+'</option>').join('')+'</select><select data-rule-op aria-label="Comparación"><option value=">=">≥</option><option value=">">&gt;</option><option value="<=">≤</option><option value="<">&lt;</option></select><input data-rule-value type="number" step="any" aria-label="Valor del filtro" placeholder="Valor"><button data-rule-remove class="linkbtn" aria-label="Eliminar filtro">×</button>';
  $('#metric-rules').append(row); $('#add-rule').disabled = $$('#metric-rules .metric-rule').length >= 6;
}
function originMark(record,key) {
  if(key==='nationality'){const n=GradaNationality.info(record);return n?'<small class="metric-source" title="'+esc(n.context.url)+'">FotMob · '+esc(new Intl.DateTimeFormat('es-ES',{dateStyle:'medium',timeZone:'Europe/Madrid'}).format(new Date(n.context.captured_at)))+'</small>':'';}
  if(squadMetricKeys.has(key)&&squad(record))return '<small class="metric-source" title="'+esc(['teamArea','areaPlayers'].includes(key)?GradaSquads.definition:GradaSquads.definition)+'">GRADA · plantilla</small>';
  if(key==='radarArea'&&isTeamView()&&metric(record,key)===null)return '<small class="metric-source">'+esc(indexPending(record))+'</small>';
  if(key==='radarArea'&&metric(record,key)!==null){
    const profile=radarProfiles.get(record);
    const info=profile.fairPlay,adjustment=profile.kind==='team'?'':info?.status==='verified'?(info.penaltyFraction>0?'Juego limpio −'+new Intl.NumberFormat('es-ES',{maximumFractionDigits:2}).format(info.penaltyFraction*100)+' %':'Juego limpio · sin descuento'):'Juego limpio · sin ajuste';
    return '<small class="metric-source" title="'+esc(profile.profileLabel+' · '+profile.axes.map(a=>a.label).join(', ')+' · '+adjustment)+'">GRADA · '+esc(profile.kind==='team'?'Equipo':({DEF_FB:'Lateral mixto',MED_ATT:'MED ofensivo',MED_DEF:'MED defensivo',MED_BALANCED:'MED equilibrado',MED:'MED general'}[profile.profileKey]||record.pos))+' · '+profile.axes.length+' ejes</small>'+(adjustment?'<small class="metric-source fairplay-source">'+esc(adjustment)+'</small>':'');
  }
  return isCombined()?GradaComponents.sourceMark(record,key,data.metadata):'';
}
function combinationNote(record) {
  if (!isCombined()) return '';
  const club=record.team!==undefined?GradaClubs.info(record,teams()):null;
  const clubNote=club&&club.kind!=='single'?'<p class="sub club-note">'+esc(club.description)+'</p>':'';
  const tactical=record.team!==undefined?GradaRoles.info(record):null;
  const tacticalNote=tactical?'<p class="sub tactical-note">'+(tactical.codes.length?'Puestos publicados: '+esc(tactical.label)+' · FotMob · '+esc(new Intl.DateTimeFormat('es-ES',{dateStyle:'medium',timeZone:'Europe/Madrid'}).format(new Date(tactical.context.captured_at)))+'. Puede declarar varios puestos; no conocemos los minutos en cada uno.':'Sin posición detallada verificada; no se deduce de las estadísticas.')+'</p>':'';
  const statistical=statisticalProfileNote(record);
  const league=record.league_key||currentLeague,id=record.id.startsWith(league+':')?record.id.slice(league.length+1):record.id;
  const link='?'+new URLSearchParams({datos:'publicados',liga:league,jugador:id});
  const positionNote=record.positionResolution?'<p class="sub position-note">'+esc(GradaPositions.describe(record))+' <a href="'+esc(link)+'">Ver captura publicada</a></p>':'';
  if(isAll())return '<p class="sub combination-note">'+esc(record.league)+' · datos y prioridad de la liga original; referencia del radar: todas las ligas seleccionadas.</p>'+clubNote+positionNote+tacticalNote+statistical;
  const text = !record.combination?.matched?'Sin coincidencia única en las fuentes complementarias: se conservan los datos de la fuente principal.':record.combination.conflicting_fields.length?'Hay discrepancias entre las fuentes; se respeta la prioridad indicada arriba. Cada cifra muestra su origen.':'Registro completado con '+Object.keys(record.sourceRecords).filter(k=>k!==primarySource()).join(' y ')+'. '+primarySource()+' mantiene la prioridad.';
  return '<p class="sub combination-note">'+text+'</p>'+clubNote+positionNote+tacticalNote+statistical;
}
function statisticalProfileNote(record){
  if(record.pos!=='MED')return '';
  const kind=scoreModel.roles.get(record),attack=scoreModel.indices.get('MED_ATT')?.get(record)?.rolePercentile,defense=scoreModel.indices.get('MED_DEF')?.get(record)?.rolePercentile;
  if(!kind)return '<p class="sub midfield-note">Perfil estadístico sin clasificar: faltan ejes o muestra de sus índices. Se usa el radar general de mediocampo si tiene datos suficientes; no se le atribuye un perfil ofensivo o defensivo.</p>';
  const label={MED_ATT:'ofensivo',MED_DEF:'defensivo',MED_BALANCED:'equilibrado'}[kind];
  const pct=new Intl.NumberFormat('es-ES',{maximumFractionDigits:1});
  return '<p class="sub midfield-note">Perfil estadístico: '+label+' · índice ofensivo P'+pct.format(attack)+' / defensivo P'+pct.format(defense)+'. Hasta 10 puntos de diferencia se considera equilibrado. Describe sus cifras frente a otros MED; no determina si juega de pivote, interior o mediapunta. Este perfil selecciona los ejes de su único score; cambiar de ranking no lo modifica.</p>';
}
function radarFor(record) { return GradaComponents.radar(record,players(),data.metadata,radarProfiles.get(record)); }
function rows() {
  const search=$('#search').value.trim().toLocaleLowerCase('es'),rules=numericRules(),def=GradaRadar.definition(rankingProfile);
  return (isTeamView()?teams():players()).filter(p=>{
    if(view==='players'&&activeLeaderKey&&!leaderEligible(p,activeLeaderKey))return false;
    if(!isTeamView()&&pos!=='Todos'&&p.pos!==pos)return false;
    if(!GradaExplore.matchesTeams(p,selectedClubs,teams(),{team:isTeamView()}))return false;
    if(!isTeamView()&&!GradaRoles.matches(p,$('#rolefilter').value))return false;
    if(view==='rankings'&&!GradaScores.eligible(scoreModel,p,def,rankingMinimum,{includePending:isTeamView()}))return false;
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
  tooltip.textContent = GradaExplore.shortHelp(button.dataset.help,description(button.dataset.help),{team:isTeamView(),per90:view==='rankings'&&rankingAxisKeys.has(button.dataset.help)?GradaRadar.axis(button.dataset.help).unit==='90':unit==='90'&&rates.has(button.dataset.help)});
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
document.addEventListener('keydown',e=>{ if (e.key === 'Escape') hideHelp(true); });
document.addEventListener('pointerdown',e=>{ if (!e.target.closest('[data-help]') && !tooltip.contains(e.target)) hideHelp(true); });
window.addEventListener('resize',()=>hideHelp(true));
document.addEventListener('scroll',()=>hideHelp(true),true);
function renderTable() {
  if(view==='players')$('#tablesub').textContent=activeLeaderKey?'Ranking de '+labels[activeLeaderKey]+(activeLeaderKey==='savesPer90'?' · porteros':' · jugadores de campo')+'. Misma selección que en portada.':'Selecciona un nombre para ver su radar. Score entre 0 y 1; — = no disponible.';
  const leaderRate=view==='players'&&activeLeaderKey&&Object.hasOwn(GradaMetrics.fixedRates,activeLeaderKey);
  $('#leader-kpi-filter').hidden=!leaderRate;
  if(leaderRate){$('#leader-kpi-min').value=leaderMinimum(activeLeaderKey);$('#leader-kpi-note').textContent=labels[activeLeaderKey]+' · minutos de la fuente de esta tasa. El mismo mínimo se aplica en portada.';}
  hideHelp(true);
  const cols = columns(), a = rows();
  $('#thead').innerHTML = '<tr>'+cols.map((k,i)=>k==='rank'?'<th scope="col" class="rank-column"><button class="column-info" data-help="rank" aria-label="Descripción del puesto" aria-describedby="column-tooltip">#</button></th>':'<th scope="col"'+(i===0?' class="score-main"':'')+' aria-sort="'+(sort===k?direction<0?'descending':'ascending':'none')+'"><div class="column-head"><button data-sort="'+k+'">'+esc(columnLabel(k))+(sort===k?direction<0?' ↓':' ↑':'')+'</button><button class="column-info" data-help="'+k+'" aria-label="Descripción: '+esc(columnLabel(k))+'" aria-describedby="column-tooltip">ⓘ</button></div></th>').join('')+'</tr>';
  $('#tbody').innerHTML = a.map((p,i)=>'<tr>'+cols.map((k,column)=>{
    let content;
    if(k==='rank')content=view==='rankings'&&isTeamView()&&squadMetricKeys.has(sort)&&metric(p,sort)===null?'—':String(i+1).padStart(2,'0');
    else if(k==='name')content='<button class="namebtn" data-detail="'+esc(p.id)+'">'+(isTeamView()?GradaBranding.teamLabel(p):'<span class="initials">'+esc(initials(p.name))+'</span>'+esc(p.name))+'</button>';
    else if(k==='tacticalRole')content='<span class="role-label" title="'+esc(GradaRoles.info(p).label)+'">'+esc(GradaRoles.info(p).codes.join(' / ')||'—')+'</span>';
    else if(k==='pos')content='<span class="pos" tabindex="0" title="'+esc(GradaPositions.describe(p))+'">'+esc(p.pos)+'</span>';
    else if(k==='team')content=GradaBranding.playerClub(p,teams());
    else if(k==='league')content=GradaBranding.leagueLabel(p.league_key,p.league);
    else content=(column===0?'<strong>'+val(p,k)+'</strong>':val(p,k))+originMark(p,k);
    return '<td class="'+(column===0?'score-main':k==='rank'?'rank-column':['goals','xg','saves'].includes(k)?'highlight':'')+'">'+content+'</td>';
  }).join('')+'</tr>').join('') || '<tr><td colspan="'+cols.length+'" class="empty">'+(loaded?'No hay resultados con estos filtros.':'Aún no hay datos importados.')+'</td></tr>';
  $('#count').textContent = a.length+' '+(isTeamView()?'equipos':'jugadores')+' · '+source()+(isLive()?' · plantillas actuales':'')+(view==='rankings'?' · unidades por eje':unit === '90'?' · volumen por 90 min':'');
  $('#radar-table-note').hidden=false;
  $('#radar-table-note').textContent=view==='rankings'&&activeUnit()?GradaSquads.unitDefinition(activeUnit())+' Los filtros y el mínimo de PJ del equipo no cambian los pesos.':isTeamView()?GradaSquads.definition+' Entre 0 y 1; cobertura en Jugadores ponderados. Los filtros no cambian pesos ni scores.':view==='rankings'?'Orden por el score único de su posición y perfil; muestra filtrada desde '+rankingMinimum+' minutos. La referencia y el score se mantienen al cambiar de ranking o liga.':'Score único por jugador y perfil, entre 0 y 1; — si faltan ejes o muestra. La liga y los filtros no cambian la referencia.';
  if(view==='rankings'&&GradaRadar.definition(rankingProfile).roleKey)$('#radar-table-note').textContent+=' Solo puestos publicados verificados; los polivalentes pueden aparecer en varios grupos. Se conserva el mismo score individual; los laterales/carrileros combinan ataque y defensa.';
  $$('[data-sort]').forEach(b=>b.onclick=()=>{ direction = sort === b.dataset.sort ? -direction : -1; sort = b.dataset.sort; renderTable(); });
  $$('[data-detail]').forEach(b=>b.onclick=()=>detail(b.dataset.detail,isTeamView()));
  bindHelp();
}
function leaderMinimum(key){return Object.hasOwn(GradaMetrics.fixedRates,key)?leaderMinimums[key==='savesPer90'?'saves':'field']:0;}
function leaderEligible(player,key){
  if(key==='savesPer90'?player.pos!=='POR':player.pos==='POR')return false;
  if(GradaMetrics.metric(player,key,'total')===null)return false;
  const context=GradaMetrics.context(player,key),minimum=leaderMinimum(key),minutes=context&&Object.hasOwn(context,'minutes')?context.minutes:player.minutes;
  if(minimum>0&&(!Number.isFinite(minutes)||minutes<minimum))return false;
  return key!=='accuracy'||player.passes>=30||player.passes==null&&context?.minutes>=450;
}
function setLeaderMinimum(kind,value){const minimum=Number(value);if(!Number.isFinite(minimum)||minimum<0)return;leaderMinimums[kind]=minimum;$('#leader-field-min').value=leaderMinimums.field;$('#leader-saves-min').value=leaderMinimums.saves;renderLeaders();renderTable();}
function renderLeaders() {
  const categories = [['Goles','goals'],['Goles /90 min','goalsPer90'],['Pases completados /90 min','completedPer90'],['Asistencias','assists'],['Asistencias /90 min','assistsPer90'],['Goles esperados','xg'],['xA · '+primarySource(),'xa'],['Precisión de pase','accuracy'],['Paradas /90 min','savesPer90']];
  $('#leaders').innerHTML = categories.map(([title,key])=>{
    const value=p=>GradaMetrics.metric(p,key,'total'),rate=Object.hasOwn(GradaMetrics.fixedRates,key);
    const list=players().filter(p=>leaderEligible(p,key)).sort((a,b)=>value(b)-value(a)||a.name.localeCompare(b.name)).slice(0,5);
    const format=p=>new Intl.NumberFormat('es-ES',{maximumFractionDigits:rate?2:['xg','xa','accuracy'].includes(key)?1:0}).format(value(p));
    return '<article class="leadercard" data-leader-key="'+key+'"><h3>'+esc(title)+'</h3>'+(rate?'<p class="leader-sample-note">Mínimo '+leaderMinimum(key)+' min de su fuente</p>':'')+list.map((p,i)=>{const context=GradaMetrics.context(p,key),minutes=rate?' · '+(Number.isFinite(context?.minutes)?new Intl.NumberFormat('es-ES').format(context.minutes)+' min de la tasa':'minutos no publicados'):'';return '<div class="leaderrow"><span class="leaderplace">'+(i+1)+'</span><button class="namebtn" data-leader-profile="'+esc(p.id)+'"><span class="initials">'+esc(initials(p.name))+'</span><span>'+esc(p.name)+'<small>'+GradaBranding.playerClub(p,teams(),{size:'xs'})+esc(minutes)+'</small></span></button><strong>'+format(p)+(key==='accuracy'?'%':'')+originMark(p,key)+'</strong></div>';}).join('')+(list.length?'':'<p class="empty">'+(loaded?'Sin datos con esta tasa y muestra mínima.':'Sin datos importados')+'</p>')+'<button class="leaderlink" data-leader-sort="'+key+'">Ver ranking →</button></article>';
  }).join('');
  $$('[data-leader-profile]').forEach(b=>b.onclick=()=>detail(b.dataset.leaderProfile,false));
  $$('[data-leader-sort]').forEach(b=>b.onclick=()=>{sort=b.dataset.leaderSort;activeLeaderKey=sort;$('#rolefilter').value='';unit=Object.hasOwn(GradaMetrics.fixedRates,sort)?'90':'total';pos=sort==='savesPer90'?'POR':'Todos';direction=-1;$('#search').value='';clearClubSelection();$('#min-minutes').value='';$('#min-goals').value='';$('#metric-rules').innerHTML='';$('#add-rule').disabled=false;$$('[data-unit]').forEach(q=>q.classList.toggle('on',q.dataset.unit===unit));syncPositions();navigate('players');});
}
function openRanking(key,id=null){
  const def=GradaRadar.definition(key);rankingProfile=key;rankingMinimum=def.minimum;$('#ranking-min').value=rankingMinimum;$('#search').value='';clearClubSelection();$('#rolefilter').value='';$('#min-minutes').value='';$('#min-goals').value='';$('#metric-rules').innerHTML='';$('#add-rule').disabled=false;
  navigate('rankings');if(id)detail(id,def.kind==='team');
}
function renderRankingPreviews(){
  const targets={DEL:'#striker-leaders',POR:'#keeper-leaders',DEF:'#defender-leaders',DEF_CB:'#central-leaders',DEF_FB:'#fullback-leaders',MED_ATT:'#attacking-midfield-leaders',MED_DEF:'#defensive-midfield-leaders',MED_BALANCED:'#balanced-midfield-leaders',TEAM_ATTACK:'#ranks',TEAM_STRIKERS:'#striker-team-leaders',TEAM_DEFENSE:'#defense-leaders',TEAM_MED_ATT:'#team-attacking-midfield-leaders',TEAM_MED_DEF:'#team-defensive-midfield-leaders',TEAM_OVERALL:'#overall-team-leaders'};
  for(const def of GradaRadar.rankingDefinitions){
    const key=def.key,target=targets[key],mid=def.aggregateProfile,sum=def.kind==='team',records=sum?teams():players();
    const summary=p=>mid?unitSummary(p,mid):squad(p),score=p=>GradaScores.value(scoreModel,p,def);
    const ranked=records.filter(p=>GradaScores.eligible(scoreModel,p,def)).sort((a,b)=>score(b)-score(a)||a.name.localeCompare(b.name)).slice(0,5);
    $(target).innerHTML=ranked.map((p,i)=>{
      const coverage=sum?summary(p):null,caption=sum?coverage.validPlayers+' / '+coverage.totalPlayers+' jugadores ponderados':(p.pos==='MED'||radarProfiles.get(p).profileKey==='DEF_FB'?radarProfiles.get(p).profileLabel:p.pos);
      return '<div class="rank"><span class="ranknum">'+(i+1)+'</span><div class="rankname"><button class="namebtn" data-open-ranking="'+key+'" data-preview-id="'+esc(p.id)+'">'+(sum?GradaBranding.teamLabel(p):esc(p.name))+'</button><small>'+[p.league?GradaBranding.leagueLabel(p.league_key,p.league):'',sum?'':GradaBranding.playerClub(p,teams(),{size:'xs'}),esc(caption)].filter(Boolean).join(' · ')+'</small></div><div class="rankscore">'+new Intl.NumberFormat('es-ES',{minimumFractionDigits:3,maximumFractionDigits:3}).format(score(p))+'<small class="rank-score-label">'+(sum?'Score ponderado':def.kind==='player'?'Score de jugador':'Score 0–1')+'</small></div></div>';
    }).join('')+(ranked.length?'':'<p class="empty">Sin candidatos con scores válidos y muestra suficiente.</p>')+'<button class="linkbtn" data-open-ranking="'+key+'" '+(!loaded?'disabled':'')+'>Ver ranking completo →</button>';
  }
  $$('#overview [data-open-ranking]').forEach(button=>button.onclick=()=>openRanking(button.dataset.openRanking,button.dataset.previewId));
}
function dashboard() {
  const ts = teams(), ps = players();
  const values = [['Goles',GradaMetrics.total(ts,'goals'),'Marcadores de equipos'],['Goles esperados · xG',GradaMetrics.total(ts,'xg'),'xG de los equipos'],['Asistencias',GradaMetrics.total(ps,'assists'),'Asistencias publicadas'],['Paradas',GradaMetrics.total(ps.filter(p=>p.pos==='POR'||GradaMetrics.number(p.saves)),'saves'),'Paradas publicadas']];
  $('#cards').innerHTML = values.map(([title,total,note])=>'<div class="card"><div class="label">'+title+'</div><strong>'+(total.value===null?'—':new Intl.NumberFormat('es-ES',{maximumFractionDigits:1}).format(total.value))+'</strong><small>'+note+' · '+(total.complete?'suma':'subtotal parcial')+' · '+total.known+'/'+total.total+' registros con dato</small></div>').join('');
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
    return '<div class="panel"><p class="sub">JUGADOR '+(i+1)+'</p><select class="compareselect" data-compare="'+i+'" aria-label="Jugador '+(i+1)+'">'+a.map(q=>'<option value="'+esc(q.id)+'" '+(String(q.id) === String(id)?'selected':'')+'>'+esc(q.name)+' · '+esc(q.team)+'</option>').join('')+'</select><h2>'+esc(p.name)+'</h2><p class="sub">'+GradaBranding.playerClub(p,teams())+' · '+esc(p.pos)+'</p>'+combinationNote(p)+radarFor(p)+keysFor(p).map(k=>'<div class="comparestat"><span>'+columnLabel(k,false)+'</span><b>'+val(p,k)+originMark(p,k)+'</b></div>').join('')+'</div>';
  }).join('');
  $$('[data-compare]').forEach(e=>e.onchange=()=>{ choices[+e.dataset.compare] = e.value; renderCompare(); });
}
function unitCard(record,profile){return GradaComponents.squadArea(unitSummary(record,profile),{title:GradaSquads.unitKeys[profile].label,population:GradaSquads.unitKeys[profile].population,note:GradaSquads.unitDefinition(profile)});}
function detail(id,isTeam) {
  const p = (isTeam?teams():players()).find(p=>String(p.id) === String(id));
  if (!p) return;
  $('#detailbody').innerHTML = '<span class="badge">'+esc(source())+'</span><h1 class="detailtitle">'+(isTeam?GradaBranding.teamLabel(p,{size:'lg'}):esc(p.name))+'</h1><p class="sub">'+(isTeam?esc(data.metadata.competition):GradaBranding.playerClub(p,teams()))+(' · '+GradaBranding.leagueLabel(p.league_key||currentLeague,p.league||leagueConfig().name))+' · '+esc(data.metadata.season)+(unit === '90'?' · volumen por 90 min':'')+'</p>'+combinationNote(p)+(isTeam?GradaComponents.squadArea(squad(p)):'')+(isTeam&&view==='rankings'&&activeUnit()?unitCard(p,activeUnit()):isTeam?radarFor(p)+Object.keys(GradaSquads.unitKeys).map(key=>unitCard(p,key)).join(''):radarFor(p))+'<div class="detailstats">'+keysFor(p,isTeam).map(k=>'<div class="comparestat"><span>'+columnLabel(k,isTeam)+'</span><b>'+val(p,k)+originMark(p,k)+'</b></div>').join('')+'</div><p class="sub note">'+(isSeason()?esc(data.metadata.notes):'— = no disponible. Las tasas /90 usan los minutos de juego. PSxG y goles evitados no se calculan para StatsBomb. xA derivada del xG de tiros asistidos.')+'</p>';
  $('#detail').showModal();
}
function renderNations(){
  if(!loaded||!scoreModel){$('#nation-ranking').innerHTML='<p class="empty">Cargando países verificados…</p>';$('#nation-lineup').innerHTML='';return;}
  if(!nationCache.has(scoreModel))nationCache.set(scoreModel,GradaNations.build(scoreModel));
  const model=nationCache.get(scoreModel);
  if(!model.countries.some(c=>c.code===selectedNation))selectedNation=model.countries.find(c=>c.complete)?.code||model.countries[0]?.code||'';
  $('#nation-select').innerHTML=GradaNations.options(model,selectedNation);$('#nation-select').value=selectedNation;$('#nation-select').disabled=!model.countries.length;
  $('#nation-ranking').innerHTML=GradaNations.ranking(model,{onlyComplete:$('#nation-complete').checked!==false,selected:selectedNation});
  $('#nation-lineup').innerHTML=GradaNations.lineup(model.countries.find(c=>c.code===selectedNation),model);
  const c=model.coverage;$('#nation-coverage').textContent='Ámbito: '+scoreContext().inputs.length+' ligas cargadas · '+c.known+'/'+c.records+' fichas con país · '+c.complete+' onces completos. Siete sistemas con contención y creación. Media simple: cada titular pesa igual. Mismo score individual y mínimo '+GradaRadar.minimumScoreMinutes+' min. '+(c.duplicateRecords?c.duplicateRecords+' fichas repetidas por ID: se usa la de más minutos, sin sumar ligas. ':'')+(c.conflicts?c.conflicts+' identidades con países en conflicto, excluidas.':'');
  $$('[data-nation]').forEach(b=>b.onclick=()=>{selectedNation=b.dataset.nation;renderNations();$('#nation-select').focus();$('#nation-lineup').scrollIntoView({behavior:'smooth',block:'start'});});
  $$('[data-national-player]').forEach(b=>b.onclick=()=>detail(b.dataset.nationalPlayer,false));
}
function navigate(v,scroll=true,preserveSort=false){
  if(v==='nations'&&currentLeague!=='all'&&datasets.size>1){view=v;activateLeague('all');if(scroll)window.scrollTo({top:0,behavior:'smooth'});return;}
  if(['players','overview'].includes(v)&&view!==v&&!activeLeaderKey&&!preserveSort){sort='radarArea';direction=-1;}
  if(v!=='players')activeLeaderKey=null;
  const previous=view;view=v;
  if(v==='rankings'){const def=GradaRadar.definition(rankingProfile);if(def.kind==='player')pos=def.position;if(previous!==v){rankingMinimum=def.minimum;$('#ranking-min').value=rankingMinimum;}if(!preserveSort){sort=rankingSort();direction=-1;}}
  if(v==='teams'&&previous!==v){sort='teamArea';direction=-1;}
  updateRadarProfiles();
  const info={nations:['Selecciones','Selecciones · el mejor encaje','Jugadores de las ligas disponibles, con su score de club y país deportivo publicado.'],overview:['Vista general','Estadísticas de fútbol','Líderes y estadísticas de jugadores y equipos.'],players:['Jugadores','Estadísticas de jugadores','Datos de '+source()+'. Selecciona un jugador para explorar.'],teams:['Equipos','Estadísticas de equipos','Ataque, defensa y rendimiento de los equipos.'],rankings:['Rankings','Rankings por score del radar','Elige un perfil y compara dentro de la liga o del conjunto seleccionado.'],compare:['Comparador','Comparador de jugadores','Contrasta perfiles y métricas en su contexto.'],glossary:['Glosario','Glosario de métricas','Definiciones y límites de los datos disponibles.']}[v];
  $('#crumb').textContent=info[0];$('#pagetitle').textContent=info[1];$('#pagesub').textContent=info[2];
  $$('nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
  $('#overview').classList.toggle('hidden',v!=='overview');$('#listing').classList.toggle('hidden',!['overview','teams','players','rankings'].includes(v));$('#compare').classList.toggle('hidden',v!=='compare');$('#glossary').classList.toggle('hidden',v!=='glossary');
  $('#nations').classList.toggle('hidden',v!=='nations');$('#filters').classList.toggle('hidden',v==='glossary'||v==='nations');$('#min-minutes').closest('label').classList.toggle('hidden',isTeamView());$('#positions').classList.toggle('hidden',isTeamView()||v==='rankings');$('#allplayers').classList.toggle('hidden',v!=='overview');
  $$('#filters .seg, #filters .divider').forEach(control=>control.classList.toggle('hidden',v==='overview'||v==='rankings'));$('#ranking-controls').classList.toggle('hidden',v!=='rankings');$('#ranking-min-caption').textContent=isTeamView()?'Partidos mínimos':'Minutos mínimos';$('#ranking-profile').value=rankingProfile;
  $('#ranking-note').textContent=isTeamView()&&activeUnit()?GradaSquads.unitDefinition(activeUnit()):isTeamView()?GradaSquads.definition:GradaRadar.definition(rankingProfile).roleKey?'Solo candidatos con puesto publicado compatible. Los polivalentes pueden aparecer en varios grupos; conservan su mismo score individual, mixto para los laterales/carrileros. No se conoce el reparto de minutos por puesto.':rankingProfile.startsWith('MED_')?'Perfil estadístico por percentiles de los índices ofensivo y defensivo. Hasta 10 puntos de diferencia: equilibrado, incluido también en ambos grupos. El perfil selecciona los ejes del score. Los equilibrados conservan su radar equilibrado incluso en los otros rankings; no indica un puesto táctico. Sin ambos índices completos, el perfil queda sin clasificar; puede tener un score general explícito.':'Un score único de su posición y perfil, con muestra suficiente y todos los ejes. La referencia común de ligas se conserva en tablas, fichas y rankings.';
  $('#tabletitle').textContent=v==='rankings'?GradaRadar.definition(rankingProfile).label:isTeamView()?'Ranking de equipos':'Ranking de jugadores';$('#tablesub').textContent=isTeamView()?'Scores de equipo ponderados por minutos, entre 0 y 1. Consulta pesos y contribuciones en la ficha.':activeLeaderKey?'Ranking de '+labels[activeLeaderKey]+(activeLeaderKey==='savesPer90'?' · porteros':' · jugadores de campo')+'. Misma selección que en portada.':'Selecciona un nombre para ver su radar. Score entre 0 y 1; — = no disponible.';
  if(v==='overview'){dashboard();renderLeaders();}
  if(v==='nations'){renderNations();$('#team-comparison').hidden=true;if(scroll)window.scrollTo({top:0,behavior:'smooth'});return;}
  syncPositions();renderClubOptions();renderTable();renderCompare();renderTeamComparison();if(v==='glossary')renderTerms();if(scroll)window.scrollTo({top:0,behavior:'smooth'});
}
function syncPositions() { $$('[data-pos]').forEach(b=>b.classList.toggle('on',b.dataset.pos === pos));refreshRoleOptions(); }
function refreshRoleOptions(){
  const select=$('#rolefilter'),selected=select.value,position=pos==='Todos'?null:pos,candidates=players().filter(p=>!position||p.pos===position);
  select.innerHTML='<option value="">Todos los puestos publicados</option>'+Object.entries(GradaRoles.groups).filter(([,g])=>!position||g.position===position).map(([key,g])=>'<option value="'+key+'">'+esc(g.label)+'</option>').join('')+'<option value="UNKNOWN">Sin puesto compatible verificado</option>';
  select.value=[...select.options].some(o=>o.value===selected)?selected:'';select.hidden=isTeamView();
  const coverage=GradaRoles.coverage(candidates);$('#role-filter-note').hidden=isTeamView();$('#role-filter-note').textContent=coverage.known+'/'+coverage.total+' fichas con puestos publicados; '+coverage.classified+' compatibles con su posición canónica. Un jugador polivalente puede aparecer en varios grupos, siempre con el mismo score. Puesto táctico y perfil estadístico son distintos.';
}
function applyData(next) {
  const previousScope=data?.metadata?.league_key;
  if(previousScope!==next?.metadata?.league_key){selectedClubs.clear();teamCompareChoices=[];$('#club-filter-search').value='';$('#teamfilter').open=false;}
  data = next; loaded = !!(data?.metadata && data.players?.length && Array.isArray(data.teams)); choices = [];
  updateRadarProfiles();
  $('#search').value='';selectedClubs=GradaExplore.selection(data?GradaClubs.options(data):[],selectedClubs);renderClubOptions();
  $('#league').value = selectedSource();$('#league-country').innerHTML=GradaBranding.countryLabel(currentLeague); $('#season').innerHTML = '<option>'+esc(loaded?data.metadata.season:'2026/27 · pendiente')+'</option>';
  $$('[data-source]').forEach(e=>e.textContent = source()); $('.sidefoot').textContent = 'GRADA / '+leagueConfig().name.toUpperCase()+' 2026/27';
  $('.status').textContent = source();
  if (loaded) {
    const m = data.metadata, when = new Intl.DateTimeFormat('es-ES',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Madrid'}).format(new Date(m.imported_at));
    $('.scope').textContent = m.imported_matches+'/'+m.available_matches+' partidos · '+(m.complete?'cobertura completa':'cobertura parcial');
    $('#data-status').textContent = m.competition+' '+m.season+' · '+m.source+' · '+m.imported_matches+'/'+m.available_matches+' partidos. Captura: '+when+' (Madrid). '+(isSeason()?m.notes:m.complete?'Cobertura completa de la competición.':'Cobertura parcial: los rankings no representan toda la competición.');
    $('#active-source').textContent = isAll()?'Understat (LaLiga)':primarySource(); $('#active-source').href = GradaSecurity.sourceURL(isAll()?'Understat':primarySource(),currentLeague); $('#secondary-source').hidden = !isCombined(); $('#secondary-source a').href=GradaSecurity.sourceURL('ESPN',currentLeague); $('#fotmob-source').hidden=primarySource()==='FotMob'||!m.sources?.FotMob; $('#fotmob-source a').href=GradaSecurity.sourceURL('FotMob',currentLeague);
    $('#coverage-details').hidden = !isCombined(); $('#coverage-notes').textContent = isCombined()?m.notes:'';
    if (isCombined()) $('#data-status').textContent = m.competition+' '+m.season+' · '+m.source+' · '+m.imported_matches+'/'+m.available_matches+' partidos. '+m.combination.matched_players+'/'+data.players.length+' jugadores complementados. Prioridad '+Object.keys(m.sources).join(' → ')+'; coincidencias inequívocas. Capturas: '+Object.entries(m.sources).map(([name,meta])=>name+' '+new Intl.DateTimeFormat('es-ES',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Madrid'}).format(new Date(meta.imported_at))+' (Madrid)').join('; ')+'.';
    if(isAll()){$('#data-status').textContent='Todas las ligas · '+data.metadata.leagues.length+' ligas · '+data.players.length+' jugadores. Scores con referencia común de las ligas cargadas. xG/xA conservan el modelo de su fuente; consulta los detalles de cobertura.';$('#coverage-notes').textContent=m.notes+' '+m.leagues.map(l=>l.name+': '+Object.entries(l.sources).map(([s,m])=>s+' '+new Intl.DateTimeFormat('es-ES',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Madrid'}).format(new Date(m.imported_at))).join(', ')).join('; ');}
  } else { $('.scope').textContent = 'Sin datos importados'; $('#data-status').textContent = 'Cargando capturas verificadas de las ligas combinadas…'; }
  updateRefreshButton();
  renderTerms(); navigate(view,false,true);
}
function updateRefreshButton(){
  const button=$('#refresh');button.disabled=!loaded||refreshing;button.classList.toggle('is-refreshing',refreshing);button.setAttribute('aria-busy',String(refreshing));button.title=refreshing?'Actualizando datos…':'Actualizar datos · acceso del propietario';
}
function updateLeagueOptions(){
  const available=GradaLeagues.list().filter(l=>datasets.has(l.id));
  $('#league').innerHTML=(initialLoadsComplete&&available.length>1?'<option value="all">Todas las ligas · Combinadas</option>':'')+(available.length?available.map(l=>'<option value="'+l.id+'">'+esc(l.name)+' · '+esc(GradaBranding.country(l.id)?.name||'')+' · Combinada</option>').join(''):'<option value="" disabled>Cargando ligas combinadas…</option>');
  $('#league').value=isAll()||datasets.has(currentLeague)?currentLeague:available[0]?.id||'';$('#league').disabled=!available.length||refreshing||!initialLoadsComplete;$('#league-country').innerHTML=GradaBranding.countryLabel($('#league').value);
}
function activateLeague(id){
  if(id==='all'){
    if(!datasets.size)return;currentLeague='all';understatData=null;fotmobData=null;liveData=null;combinedData=scoreContext().reference;
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
  GradaFotmob.validate(data);
  const profiles=await GradaRefresh.loadProfiles(data,league,{onProgress:(done,total)=>{$('#refresh-status').textContent=league.name+' · FotMob: fichas '+done+'/'+total;}});
  return GradaFotmob.validate(GradaProfiles.apply(data,profiles,datasets.get(league.id)?.fotmob));
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
      const result=await GradaRefresh.refresh(state,league,{combine:next=>joinSources(next),onProgress:key=>{$('#refresh-status').textContent=league.name+' · consultando '+GradaRefresh.names[key]+'…';},fetchers:{espn:l=>readProvider('espn',l),fotmob:l=>readProvider('fotmob',l),understat:l=>readProvider('understat',l)}});
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
  ['Nacionalidad y selecciones','Se muestra el país deportivo publicado por FotMob, con ID de jugador, club, liga, temporada y fecha verificados. No se deduce de nacimiento, nombre o liga, ni confirma doble ciudadanía o elegibilidad FIFA. Se comparan 4-3-3, 4-2-3-1, 4-4-2, 4-3-1-2, 3-5-2, 3-4-2-1 y 4-2-2-2. Todos exigen portero, centrales, bandas o carriles compatibles, un jugador de contención, otro de creación y al menos un delantero centro DEL con ST publicado. La contención admite CDM o CM con perfil defensivo; la creación, CAM o CM con perfil ofensivo/equilibrado según el puesto. Los perfiles no inventan una banda. Se asigna una sola plaza a cada persona y se maximiza la suma de scores de cada sistema. Entre esos siete onces se elige la mayor media simple de sus once scores. Cada titular pesa 1/11, sin ponderación ni desempate por minutos. Las líneas usan la media simple de sus integrantes; el global no es la media de los cuatro bloques. El detalle indica evidencia del encaje y los sistemas alternativos. El puesto teórico puede diferir de la posición amplia del score solo con un puesto publicado compatible; el score nunca cambia. Se conserva el score de su posición y perfil, sin recalcularlo para la selección. Entre fichas del mismo ID FotMob se conserva la de más minutos; no se suman competiciones ni se elige el score mayor. El score teórico del once completo es suma de los once scores / 11, de 0 a 1. Un once incompleto conserva —; no se rellenan huecos con cero. Solo cubre las ligas cargadas, sin lesiones, convocatorias o rendimiento internacional.'],
  ['Juego limpio','Amarillas y rojas verificadas usan sus minutos propios. Descuento relativo = mínimo(1; 0,10 × (amarillas + 10 × rojas) × 90 / minutos). Cada tarjeta añade la misma penalización hasta un score mínimo de 0; una roja pesa diez amarillas. Ejemplo: 5 amarillas y 1 roja en 900 minutos descuentan el 15 %. Los pesos son manuales de GRADA, pendientes de calibración estadística. Las amarillas reflejan disciplina y riesgo de sanción, pero no se infieren partidos perdidos cada cinco tarjetas, ciclos por competición, dobles amarillas ni minutos en inferioridad. Sin tarjetas emparejadas o muestra suficiente se conserva la base con aviso de sin ajuste; no se imputan ceros.'],
  ['Laterales y carrileros','Un único radar mixto: entradas, intercepciones y recuperaciones junto con goles, xG y xA, todo por 90 minutos. Referencia común de laterales/carrileros con puesto publicado; no se crean perfiles ofensivo y defensivo separados.'],
  ['Puestos publicados y perfiles estadísticos',descriptions.tacticalRole+' El perfil ofensivo/defensivo/equilibrado compara percentiles de dos índices MED; una diferencia de hasta 10 puntos se considera equilibrada. Selecciona los ejes del único score MED.'],
  ['Calidad de ocasión · xG por tiro',descriptions.xgPerShot],
  ['Participación en goles y producción esperada',descriptions.goalInvolvementsPer90+' '+descriptions.xgXaPer90],
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
  ['Radar estadístico','Percentiles frente a jugadores de la misma posición: mínimo '+GradaRadar.minimumScoreMinutes+' minutos verificados del jugador y de cada eje (en porteros, 2 PJ por eje si su proveedor no publica minutos). Cada eje exige al menos cinco referencias; el gráfico necesita tres ejes. Los volúmenes usan /90 o /PJ según su etiqueta. En goles recibidos menos es mejor; el resto de ejes aumenta con el valor. Son estadísticas disponibles, no una valoración física.'],
  ['Actualizar datos','Consulta ESPN, FotMob y Understat cuando esa fuente se usa en la liga seleccionada. Las tres fuentes se consultan desde el servidor de GRADA, con caché breve. Solo el propietario identificado puede iniciar una actualización; no se pide contraseña adicional. Cada captura se valida antes de combinar. Si falla una fuente se conserva su captura y fecha anterior. Las capturas válidas se guardan en este navegador y los scores se recalculan sin cambiar su fórmula.']
];
function renderTerms(){
  const concepts=terms.map(item=>{let t=[...item];if(t[0].startsWith('xG ·'))t[1]=description('xg');if(t[0]==='xA derivada de tiros')t=['xA · Asistencias esperadas',description('xa')];return '<article class="panel"><h2 class="detailtitle">'+esc(t[0])+'</h2><p>'+esc(t[1])+'</p></article>';}).join('');
  const fields=(keys,team)=>[...new Set(keys)].filter(k=>descriptions[k]).map(k=>'<div><dt>'+esc(k==='rank'?'Puesto (#)':columnLabel(k,team))+'</dt><dd>'+esc(description(k,team))+'</dd></div>').join('');
  $('#terms').innerHTML=concepts+'<section class="panel glossary-definitions"><h2>Definiciones completas de las columnas</h2><p>Las ayudas de tabla son breves. Aquí puedes consultar las fórmulas, fuentes, muestras y límites.</p><details><summary>Columnas de jugadores</summary><dl>'+fields(['radarArea','rank',...Object.keys(labels).filter(k=>!squadMetricKeys.has(k))],false)+'</dl></details><details><summary>Columnas de equipos y líneas</summary><dl>'+fields(['teamArea','rank','name','league',...teamkeys],true)+'</dl></details></section>';
}
$('#ranking-profile').innerHTML=[['player','Jugadores'],['team','Equipos']].map(([kind,label])=>'<optgroup label="'+label+'">'+GradaRadar.rankingDefinitions.filter(d=>d.kind===kind).map(d=>'<option value="'+d.key+'">'+esc(d.label)+'</option>').join('')+'</optgroup>').join('');
$('#ranking-profile').onchange=()=>{$('#rolefilter').value='';rankingProfile=$('#ranking-profile').value;rankingMinimum=GradaRadar.definition(rankingProfile).minimum;$('#ranking-min').value=rankingMinimum;navigate('rankings',false);};
$('#ranking-min').oninput=()=>{rankingMinimum=Number($('#ranking-min').value);renderTable();};
$$('nav button').forEach(b=>b.onclick=()=>{activeLeaderKey=null;navigate(b.dataset.view);});
$$('[data-pos]').forEach(b=>b.onclick=()=>{activeLeaderKey=null;pos=b.dataset.pos;sort='radarArea';direction=-1;syncPositions();renderTable();});
$$('[data-unit]').forEach(b=>b.onclick=()=>{activeLeaderKey=null;unit=b.dataset.unit;if(unit==='90')sort=per90Columns[sort]||(GradaMetrics.fixedRates[sort]&&!Object.values(per90Columns).includes(sort)&&sort!=='completedPer90'?GradaMetrics.fixedRates[sort]:sort);else sort=Object.keys(per90Columns).find(k=>per90Columns[k]===sort)||sort;$$('[data-unit]').forEach(q=>q.classList.toggle('on',q===b));dashboard();renderTable();renderLeaders();renderCompare();});
$('#leader-field-min').oninput=()=>setLeaderMinimum('field',$('#leader-field-min').value);
$('#leader-saves-min').oninput=()=>setLeaderMinimum('saves',$('#leader-saves-min').value);
$('#leader-kpi-min').oninput=()=>{if(activeLeaderKey)setLeaderMinimum(activeLeaderKey==='savesPer90'?'saves':'field',$('#leader-kpi-min').value);};
$('#min-minutes').oninput = renderTable; $('#min-goals').oninput = renderTable;
$('#add-rule').onclick = addMetricRule;
$('#metric-rules').oninput = renderTable; $('#metric-rules').onchange = renderTable;
$('#metric-rules').onclick = e=>{ const button = e.target.closest('[data-rule-remove]'); if (button) { button.closest('.metric-rule').remove(); $('#add-rule').disabled = false; renderTable(); } };
$('#clear-metrics').onclick = ()=>{ $('#min-minutes').value = ''; $('#min-goals').value = ''; $('#metric-rules').innerHTML = ''; $('#add-rule').disabled = false; renderTable(); };
$('#rolefilter').onchange=renderTable; $('#search').oninput = renderTable;  $('#allplayers').onclick = ()=>navigate('players'); $('.close').onclick = ()=>$('#detail').close();
$('#club-filter-search').oninput=searchClubOptions;
$('#club-options').onchange=e=>{
  const input=e.target.closest('input[type="checkbox"]');if(!input)return;
  if(input.checked)selectedClubs.add(input.value);else selectedClubs.delete(input.value);
  updateClubSummary();renderTable();
};
$('#clear-clubs').onclick=()=>{clearClubSelection();renderTable();};
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#teamfilter'))$('#teamfilter').open=false;});
$('#teamfilter').onkeydown=e=>{if(e.key==='Escape'){$('#teamfilter').open=false;$('#teamfilter summary').focus();}};
for(const [i,id]of ['#compare-team-left','#compare-team-right'].entries())$(id).onchange=()=>{teamCompareChoices[i]=$(id).value;renderTeamComparison();};
$('#compare-picked').onclick=()=>{if(selectedTeamIds().length===2){teamCompareChoices=selectedTeamIds();renderTeamComparison();$('#team-comparison').scrollIntoView({behavior:'smooth',block:'start'});}};
$('#team-comparison-body').onclick=e=>{const button=e.target.closest('[data-team-detail]');if(button)detail(button.dataset.teamDetail,true);};
$('#nation-select').onchange=()=>{selectedNation=$('#nation-select').value;renderNations();};
$('#nation-complete').onchange=renderNations;
GradaOwner.init({onRefresh:refreshData});
$('#refresh').onclick = () => GradaOwner.open();
$('#league').onchange=()=>{if(refreshing){$('#league').value=currentLeague;return;}$('#refresh-status').textContent='';$('#refresh-report').hidden=true;activateLeague($('#league').value);};
document.addEventListener('pointerdown',()=>interaction++,true);
document.addEventListener('keydown',()=>interaction++,true);
async function readCapture(filename,validator){
  const r=await fetch('downloads/'+filename+(publishedCapture?'?capture=published':''),{signal:AbortSignal.timeout(15000),cache:'no-store'});
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
  const saved=await Promise.all((publishedCapture?[]:GradaRefresh.sources(l)).map(async key=>[key,await captureStore.get(l.id,key)]));
  for(const [key,cached] of saved){
    const candidates=[cached];
    if(key==='espn')try{candidates.push(JSON.parse(localStorage.getItem(cacheKey(l.id))));}catch(_){}
    for(const candidate of candidates)if(candidate)try{const selected=GradaRefresh.selectCapture(state[key],candidate,key,l),next={...state,[key]:selected};joinSources(next);state[key]=selected;}catch(_){}
  }
  for(const raw of [state.espn,state.fotmob,state.understat].filter(Boolean))if(GradaLeagues.resolve(raw.metadata).id!==l.id)throw new Error('Captura de otra liga rechazada.');
  state.combined=joinSources(state);
  datasets.set(l.id,state);updateLeagueOptions();
}
async function start(){
  try{
    await GradaLeagues.ready;applyData(null);updateLeagueOptions();
    const failures=[];
    await Promise.all(GradaLeagues.list().map(async l=>{try{await loadLeague(l);}catch(e){failures.push(l.name+': '+e.message);}}));
    const requestedLeague=initialQuery.get('liga');if(datasets.has(requestedLeague))currentLeague=requestedLeague;
    initialLoadsComplete=true;updateLeagueOptions();if(datasets.size)activateLeague(datasets.has(currentLeague)?currentLeague:GradaLeagues.list().find(l=>datasets.has(l.id)).id);
    if(!loaded)$('#data-status').textContent='No hay capturas combinadas completas publicadas. Ejecuta los importadores incluidos. '+failures.join(' ');
    else if(failures.length)$('#refresh-status').textContent='Solo se muestran ligas con las familias de métricas verificadas. No disponibles: '+failures.map(f=>f.split(':')[0]).join(', ')+'.';
    if(loaded&&publishedCapture)$('#refresh-status').textContent+=' Estás viendo las capturas de esta publicación. Tus datos guardados se conservan; recargar sin «datos=publicados» vuelve a usarlos.';
    if(loaded&&initialQuery.get('vista')==='selecciones'){selectedNation=initialQuery.get('pais')||selectedNation;navigate('nations',false);return;}
    const requestedPlayer=data?.players.find(p=>p.id===initialQuery.get('jugador'));
    if(requestedPlayer){navigate('players');$('#search').value=requestedPlayer.name;renderTable();detail(requestedPlayer.id);}
  }catch(e){$('#data-status').textContent='No se pudieron cargar las ligas: '+e.message;}
}
start();
