# LaLiga combinada, radar y filtros

La vista **LaLiga · Combinado** usa el catálogo de jugadores de Understat y añade las métricas disponibles de ESPN y [FotMob](FOTMOB.md). Es una combinación autorizada expresamente por el usuario y sustituye la regla anterior de mantener siempre los proveedores separados. Las vistas individuales de Understat y ESPN se conservan; FotMob dispone de descargas originales JSON y SQLite.

## Identidad y prioridad

Se exige LaLiga 2026/27 validada en todas las fuentes. Se comparan nombres completos y clubes tras normalizar acentos, espacios y puntuación. Los alias verificados son «Deportivo»/«Deportivo A Coruña»/«Deportivo La Coruna» y «Deportivo Alavés»/«Alavés». No hay aproximación por apellidos ni similitud difusa.

Cada unión exige un nombre y club únicos en ambas fuentes de esa pareja, y coherencia del rol portero/campo. Los agregados de traspasos sin equipo único conservan solo Understat. No se usa un candidato ambiguo; una tercera fuente puede complementar al jugador si su coincidencia propia sí es inequívoca. Los jugadores exclusivos de ESPN siguen en su vista y descarga; no amplían el catálogo combinado ni crean duplicados dudosos.

**Prioridad: Understat → ESPN → FotMob**, incluidos los ceros conocidos. Cada proveedor posterior solo completa campos desconocidos. Las discrepancias quedan en `combination.conflicting_fields`; los registros originales están en `sourceRecords`. `metadata.sources` conserva la captura de cada proveedor. El combinado usa como fecha general la más antigua, no la hora de calcular la unión.

La captura actual complementa 449 de los 487 registros Understat: 411 coinciden con ESPN y 430 con FotMob (hay solapamiento). Los 38 restantes conservan solo Understat. Understat mantiene su captura del 1 de noviembre; ESPN se actualizó el 7 de noviembre. FotMob conserva jugadores del 6 de noviembre y añade equipos del 7. Los 58 registros FotMob no unidos siguen en sus descargas; no se añaden al catálogo combinado mediante identidades dudosas. Si falta FotMob, se conserva el combinado de dos fuentes.

## Identidades verificadas

Además del nombre normalizado y club, se admiten equivalencias revisadas con identificadores exactos de los proveedores. El registro en `dist/combined.js` exige identificador, nombre de origen y club, y conserva las guardas de unicidad y rol. No compara por similitud ni elimina apellidos de forma general. `combination.match_methods` distingue `verified_identity` y `name_team`.

Caso comprobado en las capturas reales: [Understat 3423](https://understat.com/player/3423), «Kylian Mbappe-Lottin»; ESPN `86:231388`, «Kylian Mbappé»; [FotMob 701154](https://www.fotmob.com/players/701154/kylian-mbappe), «Kylian Mbappé», todos Real Madrid. La unión mantiene goles/xG de Understat y añade tiros a puerta/90 y regates FotMob, con sus propios 984 minutos y 11 PJ, frente a 898 minutos/10 PJ Understat. El área comparable pasa de ausente por 4/6 ejes a 0,756 (redondeo) con los seis ejes.

Nuevas equivalencias necesitan evidencia por proveedor antes de incorporarse. Un área puede seguir ausente aunque el nombre coincida si faltan métricas o una posición válida.

## Fuentes y denominadores por campo

Cada valor tiene `fieldSources` y `metricContexts`, con proveedor, PJ y minutos del registro de origen. Se muestran debajo del valor y, si los PJ difieren, se hacen explícitos. El detalle al pasar el cursor y el CSV conservan fecha y cobertura.

Las paradas y los goles recibidos pueden proceder de ESPN mientras que minutos, xG, xA, goles y tiros proceden de Understat. Las tasas usan **el denominador del proveedor del numerador**: las paradas por partido usan los PJ ESPN y las paradas por 90 quedan ausentes si ESPN no aporta minutos. No se usan minutos Understat para normalizar una cifra ESPN, ni basta una coincidencia de número de partidos para asumir que los conjuntos son idénticos.

Goles/xG y asistencias/xA requieren el mismo proveedor en ambos campos. Conversión, goles−xG, precisión de pase y porcentaje de paradas se calculan con valores de la misma procedencia; un porcentaje publicado se conserva sin reconstruir recuentos ausentes. FotMob aporta tasas /90 publicadas que se usan directamente y se identifican en la procedencia, sin deducir totales del redondeo. Ningún proveedor usado ofrece xG previo al tiro recibido por portero en LaLiga: sigue `null`. Los goles evitados publicados por FotMob y su xGOT ofensivo son campos distintos. No se atribuye a un portero la cifra de su equipo.

## Descargas

- **ESPN JSON** descarga el conjunto ESPN disponible, con su fecha.
- **FotMob JSON / SQLite** descargan el conjunto FotMob original con sus métricas y procedencia.
- **Combinado JSON** descarga la combinación completa, fuentes, conflictos y registros originales.
- **CSV** respeta búsqueda, posición, equipo, filtros numéricos, orden y unidad. En la vista combinada añade fuente, PJ de origen y fecha por columna.
- Los SQLite originales permanecen en sus vistas individuales. No se ofrece un SQLite de Understat como si fuera combinado.

El botón «Actualizar ESPN y combinar» consulta ESPN y reconstruye la combinación usando las capturas Understat y FotMob existentes; no renueva sus fechas. Ante un fallo conserva los datos activos.

Para reproducir el JSON desde las capturas locales reales, con Node 18+ (FotMob se incorpora si su archivo existe):

```sh
node scripts/build_combined.cjs
```

Los archivos generados quedan fuera de GitHub; se distribuyen el código y sus instrucciones.

## Radar por jugador

Se ofrece en ficha y comparador. Muestra entre tres y seis ejes con estadísticas disponibles y percentiles frente a la misma posición. Delanteros priorizan goles, xG, tiros a puerta, xA, regates y conversión. Centrocampistas priorizan pases precisos/90, acierto, xA/90, recuperaciones, entradas e intercepciones. Defensas priorizan entradas, intercepciones, despejes, bloqueos, recuperaciones y pase. Porteros priorizan paradas %, paradas/PJ, goles recibidos/PJ (menos es mejor), goles evitados/90, balones aéreos atrapados y acciones de líbero. No se usan goles marcados, xG ofensivo ni xA en porteros. Existen alternativas pertinentes cuando una fuente carece de alguno de esos ejes.

Los ejes se eligen una vez por posición y conjunto, con referencia suficiente, no por cada jugador o filtro de tabla. Si a un jugador le faltan ejes comunes, puede verse un radar parcial con al menos tres valores, pero su área no se utiliza en la tabla para evitar comparaciones desiguales.

Se requieren al menos cinco referencias por eje y tres ejes válidos. La referencia exige 450 minutos en jugadores de campo y 180 en porteros; cuando no hay minutos de porteros se exigen 2 PJ. Los empates usan rango medio: `(menores + 0,5 × iguales) / referencias × 100`. En goles recibidos se invierte la escala, pues un menor valor es favorable. Las ausencias se omiten; no se dibujan como cero.

Los ejes indican su unidad (/90, /PJ o porcentaje), fuente y muestra. «Ver valores y procedencia» ofrece una alternativa textual accesible. El gráfico describe producción estadística y exposición al juego, no capacidades físicas ni una evaluación aislada del equipo o los rivales. El mínimo de minutos no se aplica al jugador consultado; puede compararse una muestra pequeña, cuyo tiempo de juego se muestra en la ficha.

### Área relativa de 0 a 1

Cada gráfico muestra su área dividida por el área del polígono máximo, con todos los ejes en P100. Para ejes equidistantes y radios `r[i] = percentil[i] / 100`, el cociente es `sum(r[i] * r[(i+1) % n]) / n`. Un radar al máximo da 1; todos los radios en P50 dan 0,25. Es una medida geométrica del radar, no el AUC de una curva ROC ni una probabilidad.

**Área radar (0–1)** aparece también en las tablas de jugadores, ficha, comparador, filtros y CSV. Solo muestra una cifra en la tabla si están todos los ejes comunes de esa posición, y puede ordenarse. Exige comparar la misma posición, conjunto, ejes y orden: el área depende de sus ejes adyacentes. Cambiar de proveedor o temporada cambia la referencia. En «Todos» se indica que hay que filtrar por posición; no se presenta como valoración universal. Los filtros y el modo total/90 no cambian el área ni sus referencias.

## Filtros

Minutos mínimos y goles mínimos se combinan mediante Y con los filtros adicionales, hasta seis. Se permiten ≥, >, ≤ y < sobre otras métricas y ratios. Los umbrales se aplican a **totales**, aunque la tabla muestre volúmenes por 90; las métricas explícitas /90 o /partido conservan su denominador propio.

Los valores desconocidos no satisfacen un filtro, ni siquiera uno de «menor que». Cero sí es un valor válido. «Limpiar métricas» mantiene los filtros de búsqueda, equipo y posición. El radar compara contra la referencia de posición completa, sin alterar los percentiles por la búsqueda o los filtros de tabla.

## Ampliación a ligas y rankings

El selector actual ofrece únicamente las cinco ligas combinadas y Todas las ligas. Se añadieron perfiles defensivo/ofensivo de centrocampistas y rankings de ataque, defensa y rendimiento global de equipos, con sus propios ejes y muestras. La unión, los modelos y el recálculo de referencias del ámbito conjunto se describen en [LEAGUES.md](LEAGUES.md). Las descargas originales siguen accesibles por liga; las vistas individuales y el Mundial ya no se incluyen en el selector.

El área general de equipo suma las áreas de toda su plantilla asignada, con cobertura visible y contribuciones; puede superar 1. Los índices específicos mantienen su escala 0–1 y los equipos con índice pendiente siguen visibles. Consulta [la definición de plantilla](LEAGUES.md#área-general-de-equipo-suma-de-jugadores).
