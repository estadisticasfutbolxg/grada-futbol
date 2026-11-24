# LaLiga combinada, radar y filtros

> Política activa desde el 24 de noviembre de 2026: catálogo **FotMob → ESPN** en todas las ligas. Understat no se carga ni se sirve y no interviene en valores, posiciones, referencias o scores de jugadores, equipos y selecciones. Se conserva solo en archivo (código, pruebas y capturas locales) para una reactivación explícita. Las prioridades anteriores que siguen abajo son históricas. LaLiga declara únicamente los huecos de xG/xGA de equipo como opcionales y mantiene las demás comprobaciones. Las cifras ausentes siguen desconocidas; nunca se oculta la fuente de una cifra usada.

> Política vigente desde el 24 de noviembre de 2026: **FotMob → Understat conservado → ESPN** para las métricas de LaLiga. Los ceros conocidos de FotMob prevalecen; un dato ausente conserva el respaldo, con fuente, fecha y denominadores propios. `primary_source` identifica la prioridad estadística y `catalog_source` el catálogo: IDs, jugadores y partidos guardados siguen siendo los de Understat. Posiciones e identidades mantienen sus reglas anteriores. Las descripciones de prioridades anteriores más abajo son históricas.
>
> El botón general consulta ESPN y FotMob. `understatRefresh: false` en `dist/leagues.json` pausa solo las consultas de Understat; su captura se carga y se recupera de la caché local como respaldo. Se conservan `import_understat.py`, validador, adaptador del Worker y código de combinación. Al recuperar la página y disponer de autorización puede reactivarse con `understatRefresh: true`; no hace falta reconstruir la integración. `metricPriority` permite elegir por separado el orden de los proveedores. El importador general reutiliza la captura Understat conservada y no consulta esa web si falta mientras está pausada; lo comunica como error en lugar de inventar el catálogo.
>
> No se equiparan pases clave de Understat con ocasiones creadas de FotMob, ni se reconstruyen totales desde tasas redondeadas. Si FotMob carece de un componente de conversión/diferencia/porcentaje, se puede conservar la medida completa de un respaldo con ambos componentes y muestra compatibles, declarados en `componentValues` y `fromSourceRecord`. No se combina el gol FotMob con los tiros Understat. Si FotMob publica ambos componentes con muestras incompatibles, el derivado sigue desconocido; un respaldo no disimula ese conflicto. Los derivados conservan pares de una sola fuente/muestra y la excepción de frescura de goles continúa vigente. Recalcular con otra fuente puede cambiar el score y sus referencias, sin cambiar su fórmula ni el mínimo de 200 minutos.

> Desde el 20 de noviembre de 2026 el mínimo de score es **200 minutos inclusive** para todas las posiciones, tanto del jugador como de cada eje. Se mantienen 2 PJ solo para ejes de portero sin minutos propios, tras verificar los 200 minutos del jugador. [Contrato vigente y referencia común](SCORES.md); los mínimos anteriores del registro histórico quedan sustituidos.

> Definición vigente desde el 18 de noviembre: [score único por jugador con ejes de su perfil, referencia común, promedios de equipo y totales con cobertura](SCORES.md). Las definiciones anteriores de subperfiles, índices independientes, referencias por liga o sumas que aparezcan en el registro histórico quedan sustituidas por ese modelo.


> Actualización del 8 de noviembre: la interfaz usa Score de jugador; los scores de equipo/delantera/centrocampo son promedios ponderados por minutos. Se añade xGOT al score del portero y se retiran todos los enlaces de descarga. [Fórmulas, actualización general y fuentes actuales](REFRESH.md). Las descripciones de sumas y descargas de versiones anteriores que siguen abajo son históricas.


La vista **LaLiga · Combinado** usa el catálogo de jugadores de Understat y añade las métricas disponibles de ESPN y [FotMob](FOTMOB.md). Es una combinación autorizada expresamente por el usuario y sustituye la regla anterior de mantener siempre los proveedores separados. Las vistas individuales de Understat y ESPN se conservan; FotMob dispone de descargas originales JSON y SQLite.

## Identidad y prioridad

Se exige LaLiga 2026/27 validada en todas las fuentes. Se comparan nombres completos y clubes tras normalizar acentos, espacios y puntuación. Los alias verificados son «Deportivo»/«Deportivo A Coruña»/«Deportivo La Coruna» y «Deportivo Alavés»/«Alavés». No hay aproximación por apellidos ni similitud difusa.

Cada unión exige un nombre y club únicos en ambas fuentes de esa pareja, y coherencia del rol portero/campo. Los agregados de traspasos sin equipo único conservan solo Understat. No se usa un candidato ambiguo; una tercera fuente puede complementar al jugador si su coincidencia propia sí es inequívoca. Los jugadores exclusivos de ESPN siguen en su vista y descarga; no amplían el catálogo combinado ni crean duplicados dudosos.

**Prioridad: Understat → ESPN → FotMob**, incluidos los ceros conocidos. Cada proveedor posterior completa campos desconocidos. Desde el 23 de noviembre, los goles tienen además una excepción de frescura, descrita a continuación. Las discrepancias quedan en `combination.conflicting_fields`; los registros originales están en `sourceRecords`. `metadata.sources` conserva la captura de cada proveedor. El combinado usa como fecha general la más antigua, no la hora de calcular la unión.

Con las mismas capturas, la revisión del 10 de noviembre complementa 481 de 487 registros Understat: 459 coinciden con ESPN y 475 con FotMob (hay solapamiento). Seis conservan solo Understat. Understat mantiene su captura del 1 de noviembre; ESPN se actualizó el 7 de noviembre. FotMob conserva jugadores del 6 de noviembre y añade equipos del 7. Los 13 registros FotMob no unidos siguen en sus descargas; no se añaden al catálogo combinado mediante identidades dudosas. Si falta FotMob, se conserva el combinado de dos fuentes.

### Goles y capturas de distinta fecha

Los goles no quedan bloqueados por una fuente prioritaria antigua: un recuento **distinto**, con más PJ conocidos o, con iguales PJ, fecha posterior puede sustituirlo, siempre tras una unión inequívoca y en la misma liga/temporada/club. Se usa la fecha y muestra del campo (una ficha puede ser posterior al agregado). Ante igual cobertura/fecha, valores iguales o muestra desconocida o menor, se conserva la prioridad. Una consulta reciente puede devolver una muestra más corta y antigua: por eso la cobertura precede a la hora de descarga. Fechas futuras y contextos de otra liga no autorizan la sustitución. Una corrección posterior puede disminuir goles o llevarlos a cero; no se elige el máximo histórico.

`metricContexts.goals.selection` registra el método y la fuente prioritaria sustituida. Las capturas originales permanecen intactas. El caso de Budimir demuestra el fallo anterior: Understat 7 goles/10 PJ (1 de noviembre), ESPN 8/11 (7) y ficha FotMob 8/12, 930 minutos (8). El combinado corregido muestra 8 y su tasa /90 usa esos 930 minutos, sin tomar los 769 de Understat. Son cifras de las capturas conservadas, no una comprobación de su recuento actual del día.

Conversión, diferencia goles−xG, goles/xG y goles+asistencias pueden recuperar **los dos componentes originales del proveedor de los goles** si las columnas visibles conservan otras fuentes. Ambos deben tener muestra compatible; no basta con que el jugador esté unido. `fromSourceRecord` y `componentValues` identifican esa procedencia y la interfaz muestra fuente, fecha, PJ, minutos y valores utilizados. No se cambian los xG, tiros o asistencias visibles por esa recuperación. Si la muestra no se puede verificar, el derivado sigue desconocido.

En equipos, si el proveedor del recuento no publica minutos, goles/90 usa **90 minutos nominales por partido de esa misma fuente**. Se etiqueta `minutes_derived: team_nominal_90`; no son minutos observados ni se aplica a jugadores. Así goles/90 de equipo equivale a sus goles por partido, sin dividir por los minutos de otra captura. Un derivado sin par compatible continúa desconocido.

## Identidades verificadas

`dist/identity.js` cruza nombres normalizados, orden de tokens, nombres intermedios, apellidos compuestos, iniciales y contracciones en el mismo club. Reconoce diminutivos comunes como Álex/Alejandro y Toni/Antonio y transliteraciones de nombre como Odisseas/Odysseas; son reglas generales, no excepciones de jugador. Conserva hasta ocho nombres completos/abreviados publicados por proveedor cuando existen. Las fichas FotMob aportan alias solo tras verificar ID y club. Una coincidencia exacta, revisada o de los mismos tokens con ESPN puede aportar sus nombres publicados como puente hacia FotMob; no se propagan diminutivos o monónimos como si fueran identidades confirmadas. `combination.match_evidence` conserva los nombres usados, IDs y puente de origen. No usa distancia de edición ni semejanza libre de apellidos.

Se exige la mejor coincidencia única en ambos sentidos sobre toda la plantilla, sin reutilizar un registro ni fabricar unicidad eliminando candidatos ya asignados. Los homónimos, clubes desconocidos o duplicados y conflictos de portero siguen bloqueados. `combination.match_methods` registra el tipo de coincidencia y `sourceRecords` conserva nombres, IDs y valores originales. Los cambios de IDs de una identidad revisada no se pueden saltar con una regla genérica.

El registro de Mbappé en `dist/combined.js` sigue fijando sus IDs y nombres originales de Understat/ESPN/FotMob. El mecanismo genérico cubre otros casos sin añadir excepciones por persona. Las coincidencias dudosas conservan la fuente principal y no crean métricas.

## Posiciones revisadas

Las posiciones se resuelven independientemente de las estadísticas: acuerdo de dos fuentes con etiqueta inequívoca cuando existe; de lo contrario, posición de la ficha FotMob, y fuente principal/ESPN como respaldo. Se conservan las alternativas, procedencia, método y discrepancia en `positionResolution`. Sin consenso se señala incertidumbre; una posición publicada no demuestra un rol táctico en todos los partidos. Las etiquetas mixtas conservadas de Understat no votan como una posición única: pueden respaldar una etiqueta explícita de otra fuente. No se elige la posición que maximice el score ni la cobertura.

Esto corrige, entre otros, Vinícius de MED a DEL y Valverde de DEF a MED por acuerdo ESPN/FotMob, manteniendo las cifras prioritarias de Understat. Las demás métricas conservan la prioridad de la liga. Los nuevos importadores Understat preservan también todas sus etiquetas de posición, en JSON y como JSON textual en SQLite; la ficha FotMob conserva clave, etiqueta y fecha originales. No se editan las posiciones ni cifras de capturas antiguas a mano.

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

## Archivo y reactivación

`archivedPrimary` y `archivedMetricPriority` en `dist/leagues.json` conservan el comportamiento de archivo; no son fuentes activas. Para reactivarlo en el futuro, cambiar explícitamente `primary` a `Understat`, restaurar la prioridad archivada como `metricPriority`, decidir `understatRefresh` y retirar los huecos opcionales de LaLiga si la nueva captura los cubre. Después deben regenerarse combinados, auditarse scores y publicarse la nueva política. No se ha reactivado en esta entrega.

`build_legacy_links.cjs` usa identidades inequívocas del archivo para generar solo alias de IDs. Los enlaces previos continúan abriendo la ficha FotMob; el archivo original de estadísticas no forma parte del paquete desplegado. Los registros sin una ficha inequívoca en el catálogo nuevo no se unen por aproximación.
