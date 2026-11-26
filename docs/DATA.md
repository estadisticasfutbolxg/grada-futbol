# Contrato de datos y métricas

## Competiciones actuales y agregación de temporada

El registro activo tiene quince primeras divisiones y tres torneos UEFA expresamente autorizados en `leagues.js`: Champions, Europa y Conference, 36 clubes, fase de liga 8/8/6 PJ. No se admiten otras divisiones ni fases implícitas. Fuentes activas FotMob/ESPN; Understat sigue archivado y fuera de todas las estadísticas y scores.

Cada competición conserva JSON y SQLite originales. La unión de temporada se calcula por ID FotMob en `competitions.js`, con muestras propias, cobertura por campo y posición publicada única; no se genera una base agregada ficticia. Dieciocho SQLite: 108.032.000 bytes lógicos y 9.994.286 gzip; 8.658 filas de jugadores/equipos contrastadas con sus JSON. Capturas y bases permanecen fuera de GitHub, con sus generadores versionados. [Cobertura y límites](LEAGUES.md), [score de temporada](SCORES.md).

> Desde el 25 de noviembre: solo [15 primeras divisiones](LEAGUES.md), selección múltiple y acceso a siete ligas europeas. Selecciones usa candidatos de todas las ligas disponibles (petición posterior del 25 de noviembre), manteniendo su score con referencia común de todas las primeras divisiones cargadas. No se incorporan estadísticas nuevas para este cambio.

> Política activa desde el 24 de noviembre de 2026: catálogo **FotMob → ESPN** en todas las ligas. Understat no se carga ni se sirve y no interviene en valores, posiciones, referencias o scores de jugadores, equipos y selecciones. Se conserva solo en archivo (código, pruebas y capturas locales) para una reactivación explícita. Las prioridades anteriores que siguen abajo son históricas. LaLiga declara únicamente los huecos de xG/xGA de equipo como opcionales y mantiene las demás comprobaciones. Las cifras ausentes siguen desconocidas; nunca se oculta la fuente de una cifra usada.

> Desde el 24 de noviembre de 2026: FotMob sustituye las métricas disponibles de Understat en LaLiga; se conservan los huecos, catálogo y código Understat. `primary_source` indica prioridad estadística y `catalog_source` la identidad del catálogo. [Contrato vigente](COMBINED.md).

> Desde el 23 de noviembre: [goles con frescura por campo](COMBINED.md#goles-y-capturas-de-distinta-fecha). Un recuento distinto con más PJ conocidos o, si son iguales, fecha posterior puede sustituir al prioritario. Los derivados conservan pares de la misma fuente/muestra; `fromSourceRecord` y `componentValues` declaran los componentes originales cuando difieren de otras columnas.

> Desde el 22 de noviembre: [país deportivo publicado y selecciones teóricas con sistemas coherentes](NATIONS.md). `nationality` conserva código, nombre, ID de selección y contexto de identidad/club/liga/temporada/fecha/URL. No cambia estadísticas ni el score canónico del jugador; los onces incompletos conservan score desconocido.

> [Score único de temporada por jugador](SCORES.md), modelo `role_fairplay_radar_v9`, con aporte de goles, asistencias, xG y xA por 90 en jugadores de campo y mínimo de 200 minutos inclusive. La posición y sus discrepancias siguen resolviéndose con fuentes; no se elige la posición ni el score para maximizar su puntuación.

> Definición vigente desde el 9 de noviembre: [score único por posición, referencia común, promedios de equipo y totales con cobertura](SCORES.md). Las definiciones anteriores de subperfiles, índices independientes, referencias por liga o sumas que aparezcan en el registro histórico quedan sustituidas por ese modelo.

> Actualización del 14 de noviembre: [puestos tácticos publicados, perfiles estadísticos equilibrados, muestras de métricas derivadas y agregados multiclub](ROLES_METRICS.md). Los puestos detallados no se deducen de estadísticas ni cambian el score canónico.


> Actualización del 8 de noviembre: la interfaz usa Score de jugador; los scores de equipo/delantera/centrocampo son promedios ponderados por minutos. Se añade xGOT al score del portero y se retiran todos los enlaces de descarga. [Fórmulas, actualización general y fuentes actuales](REFRESH.md). Las descripciones de sumas y descargas de versiones anteriores que siguen abajo son históricas.


## Fuente y cobertura

Fuente: [StatsBomb Open Data](https://github.com/hudl/open-data). Consulta la [licencia](https://github.com/hudl/open-data/blob/master/LICENSE.pdf). La importación actual usa competición `43`, temporada `106`: Mundial masculino 2022.

El payload tiene cuatro claves: `metadata`, `players`, `teams`, `matches`. La web no sustituye una carga ausente por datos de prueba.

`metadata` declara `source`, `url`, `competition`, `season`, `competition_id`, `season_id`, `imported_matches`, `available_matches`, `complete`, `imported_at` y `notes`. Si `complete` es falso, el visitante debe ver la cobertura parcial.

## Campos consumidos

| Entidad | Identidad | Métricas principales |
| --- | --- | --- |
| Jugador | `id`, `name`, `team_id`, `team`, `pos` | `matches`, `minutes`, `goals`, `assists`, `xg`, `xa`, `shots`, `passes`, `completed`, `accuracy`, `conversion`, `delta`, `saves`, `conceded`, `xga`, `savepct`, `clean`, `tackles`, `interceptions`, `keypasses`, `progressive`, `psxg`, `prevented` |
| Equipo | `id`, `name` | `matches`, `minutes`, `goals`, `conceded`, `xg`, `xga`, `shots`, `passes`, `completed`, `accuracy`, `delta`, `possession`, `assists` |
| Partido | `id`, `date`, `home`, `away`, `home_id`, `away_id` | `home_goals`, `away_goals`, `home_xg`, `away_xg`, `minutes` |

Identificadores y contadores son enteros; minutos, xG y derivados son números finitos. Las métricas no disponibles o sin denominador válido son `null`, nunca el texto `"null"`, un cero añadido ni `NaN`. La UI muestra `—`. `pos` usa `POR`, `DEF`, `MED`, `DEL` o `—` si falta información.

## Definiciones que deben mantenerse

- **Goles:** tiros `Goal` del jugador. Los marcadores de equipos incluyen autogoles; por tanto el total de goles de jugadores puede ser menor que el de equipos.
- **Tandas:** los periodos 1–4 alimentan las métricas. El periodo 5 puede conservarse en SQLite para consulta y se excluye de rankings.
- **xG:** suma de `shot.statsbomb_xg` de esos tiros. Los autogoles no aportan xG.
- **xA derivada:** suma del xG de los tiros enlazados por `pass.assisted_shot_id`. No equivale a un modelo independiente de valor esperado de todos los pases.
- **Pases:** todos los intentos; completados si falta `pass.outcome`. `goal_assist` y `shot_assist` proporcionan asistencias y pases clave.
- **Progresivos:** pases completados con al menos 10 metros de avance longitudinal, convirtiendo 120 unidades de StatsBomb a 105 metros. Es una definición propia de GRADA.
- **Porteros:** alineación, cambios y eventos en orden identifican al portero presente; se le atribuyen tiros rivales y autogoles encajados. Evitar asignarlos usando solo un reloj nominal, especialmente en el tiempo añadido.
- **Paradas:** resultados `Saved`, `Saved to Post` o `Saved Off Target`. Porcentaje: paradas / (paradas + goles encajados), incluidos autogoles.
- **Minutos:** intervalos de posición, limitados a 90 o 120 minutos, sin añadido. Un jugador que entra solo en el añadido puede quedar con cero minutos nominales; no se calcula por 90 para él.
- **Portería a cero:** equipo sin encajar y portero con al menos 60 minutos en portería.
- **Por 90:** volumen × 90 / minutos. Los porcentajes conservan su denominador original.
- **PSxG, goles evitados y posesión:** no calculados en esta importación. No se obtienen cambiando el nombre del xG previo al tiro.

## Artefactos que deben cuadrar

`dist/data.js` debe contener el mismo payload que `dist/downloads/statsbomb.json`. La base descomprimida incluye `metadata`, `matches`, `events`, `lineups`, `players` y `teams`; los JSON de estadísticas de esas tablas deben coincidir con el payload. `SHA256SUMS` identifica el gzip servido.

El SQLite normaliza un subconjunto de los eventos. El JSON completo de eventos se conserva en la caché local; no se incluye `freeze_frame` ni 360 en la base descargable.

El `source-manifest.json` incluido identifica rutas y SHA de GitHub usados para esta captura. No certifica una importación posterior: hay que actualizar la procedencia o indicar que no está disponible.

## Validar

```sh
python scripts/validate_data.py
```

El validador trabaja sin red, comprueba integridad y concordancia de artefactos, cobertura, identificadores, sumas y denominadores. Un resultado correcto no demuestra que todos los modelos estadísticos sean adecuados: ante un cambio de fórmula, contrasta también eventos concretos y su significado.

## Datos de referencia, no constantes universales

La captura incluida contiene 64 partidos, 32 selecciones, 681 registros de jugadores, 234.637 eventos y 172 goles en marcadores. Los registros pueden incluir personas mencionadas en eventos sin minutos nominales. No uses estos números como reglas para otras competiciones o importaciones parciales.

## Otra fuente: FBref

La importación opcional de FBref está separada y documentada en [FBREF.md](FBREF.md). No sustituye este contrato del payload de la web. Sus campos vacíos permanecen ausentes y no se completan con valores de otro proveedor.

## Tasas de porteros en la interfaz

`xga90` = `xga × 90 / minutes` y `conceded90` = `conceded × 90 / minutes`. Se muestran junto a los totales en la tabla, ficha y comparador de porteros. Son campos derivados al mostrar/exportar; no alteran los artefactos históricos. Si faltan valores o los minutos son cero, el resultado es `null`. En modo «Por 90 min» las columnas originales se normalizan una vez y no se repiten las tasas fijas. Las cabeceras y el CSV identifican la unidad.

## LaLiga 2026/27

La integración de ESPN está autorizada por el usuario y documentada en [LALIGA.md](LALIGA.md). Reutiliza la forma del payload con identificadores de jugador compuestos por equipo y jugador y campos ausentes como `null`. Cada conjunto conserva su fuente y sus definiciones. La validación de StatsBomb no valida capturas de ESPN; `dist/laliga.js` comprueba estas últimas.

## Understat · LaLiga 2026/27

La [integración Understat](UNDERSTAT.md) conserva su modelo de xG/xA y minutos como fuente independiente. Los xG recibidos de equipos no se atribuyen a porteros. El agregado de un jugador con varios equipos se conserva como lo entrega el proveedor. El JSON y SQLite se generan desde la misma respuesta validada.

## Ratios de ataque y porteros por partido

- `goalsPerXg` = `goals / xg`. Se muestra como multiplicador: 1× coincide con los goles esperados; 1,20× supone un 20 % más. No es la conversión (goles/tiros).
- `assistsPerXa` = `assists / xa`, usando la definición de xA del proveedor activo. También depende de cómo finalizan los compañeros. No se mezclan fuentes.
- `xgaPerMatch` = `xga / matches` del registro del portero. Una aparición parcial cuenta como partido jugado. No se usa el número de partidos del equipo ni se sustituye `xga` por el dato de equipo.

Estas métricas se derivan al mostrar y exportar. Se calculan a partir de los totales originales y conservan su valor en modo por 90. Con denominador cero, ausente o inválido se muestra `—`; un numerador cero con denominador positivo da 0. Las ratios de ataque se muestran con dos decimales y ×, mientras que el CSV conserva valores numéricos. Los tiros forman parte de las columnas visibles y se normalizan por 90 al seleccionar esa unidad. Understat y ESPN no ofrecen `xga` por portero en las capturas actuales: `xgaPerMatch` queda ausente.

## Vista combinada, radar y filtros

La vista combinada autorizada da prioridad a Understat y complementa coincidencias inequívocas con ESPN y FotMob, conservando origen, fecha y denominadores por métrica. Añade descargas explícitas, radar por posición y filtros numéricos. Consulta [definiciones y límites](COMBINED.md).

## FotMob y área del radar

La [captura FotMob](FOTMOB.md) añade métricas de pase, defensa, ataque, disciplina y portería a LaLiga, con tasa publicada, minutos, PJ, URL y fecha por campo. `completedPer90` puede existir sin `completed`; no se infieren totales redondeados. `lineBreakingPasses` no sustituye `progressive`. `xgot` ofensivo no sustituye `xga` de portero; `prevented` conserva el valor publicado, incluso negativo. El área del radar se deriva en memoria de percentiles con ejes comunes por posición, entre 0 y 1, según [COMBINED.md](COMBINED.md); no modifica JSON ni SQLite de las fuentes.

## Ámbito de varias ligas y equipos

El catálogo y las diferencias de modelos están en [LEAGUES.md](LEAGUES.md). Se conservan fechas y denominadores por campo al concatenar fichas; no se unen personas por nombre entre ligas. Los rankings requieren todos los ejes y mínimos por origen. Los equipos usan PJ propios, con signo en diferencias de goles/xG y escala invertida en goles/xG recibidos. Los tiros a puerta totales ESPN y las tasas publicadas FotMob son campos distintos. No se infieren recuentos ni se llama pases clave a las ocasiones creadas de otra definición.

## Penaltis cometidos y Analítica Fantasy · 26 de noviembre de 2026

`penaltiesCommitted` procede del ranking FotMob `penalty_conceded`: infracción individual que concede un penalti, independientemente del resultado del lanzamiento. Se verifica en las dieciocho competiciones. El ranking publica recuento y apariciones, no minutos: el enriquecimiento obtiene también el ranking de minutos de la misma tanda e ID/club, con iguales apariciones. Si falta esa comprobación conserva `minutes: null` y no toma los minutos antiguos del jugador para /90. Un refresco completo solo usa minutos del ranking propio capturado en la misma tanda y con iguales apariciones. Los jugadores ausentes permanecen desconocidos, nunca cero supuesto. No añade otro eje obligatorio. Por petición posterior del usuario penaliza juego limpio con peso de cinco amarillas, siempre con al menos 200 minutos propios.

Bundesliga y Ligue 1 publican este ranking 2026/27 bajo los IDs de temporada `1000001451` y `1000001834`; `fotmobStatSeasons` declara estas excepciones por ranking. No cambia las cifras ni el identificador de las capturas originales de otras métricas. Cada página debe confirmar el ID, nombre de temporada 2026/2027, competición y estadística; no basta un ID en la URL. El servicio usa la misma validación.

El generador `scripts/enrich_player_penalties.py --league laliga` actualiza únicamente el campo y su procedencia, preparando JSON/SQLite. El generador completo y el botón de actualización incluyen el ranking; navegador y Worker recuperan una captura de penaltis posterior independientemente de la fecha del resto. Las capturas válidas anteriores se conservan ante un fallo.

`scripts/import_analitica_fantasy.py` descarga la tabla pública de LaLiga Fantasy desde [Analítica Fantasy](https://www.analiticafantasy.com/fantasy-la-liga/estadisticas) y extrae el conjunto completo publicado, no solo la primera página visible. Produce JSON/CSV atribuidos con fecha y SHA256. Conserva recuentos, puntos fantasy y valores de mercado como campos distintos. Los IDs pertenecen a esa fuente; no se mezclan con FotMob/ESPN ni se usan para score, posiciones o referencias de GRADA. La descarga verificada tiene 618 filas. Acceso público no acredita licencia; no se presume permiso nuevo. No se sirven estos datos desde el Site ni se suben a GitHub: solo el generador y pruebas. Ejemplo: `python scripts/import_analitica_fantasy.py --output-dir data/analitica-fantasy`.
