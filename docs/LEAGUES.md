# Ligas combinadas, ámbito conjunto y rankings

El selector ofrece **15 primeras divisiones combinadas**, con casillas para seleccionar varias ligas, **Todas las ligas** y **7 principales ligas europeas**, temporada **2026/27**. Se habilitan únicamente después de validar sus fuentes y las mismas familias de métricas de ataque, pase, defensa, disciplina, portería y equipos. Esta disponibilidad no significa que cada jugador tenga todos los campos.

Todas usan catálogo e IDs **FotMob**, prioridad **FotMob → ESPN**, con fuente, captura y muestra por campo. **Understat no se carga, sirve ni usa en valores, posiciones, referencias o scores de jugadores/equipos/selecciones**. Sus importadores, pruebas y capturas originales permanecen archivados; los enlaces antiguos de LaLiga se traducen mediante un mapa de IDs verificados sin estadísticas archivadas.

## Cobertura comprobada

Los identificadores se verificaron con páginas oficiales que confirman competición y temporada `2026/2027`; ESPN confirma `2026-27`. Las 17 incorporaciones se consultaron el 24 de noviembre de 2026. Las cinco capturas anteriores conservan sus cifras y fechas. El panel Datos cargados muestra los intervalos reales de cada fuente y metadatos de fichas, sin presentar la fecha de cálculo como una consulta nueva.

| Liga y país de competición | Clubes / calendario publicado | FotMob liga / temporada | ESPN | Fichas | PJ agregados FotMob |
| --- | ---: | --- | --- | ---: | ---: |
| LaLiga · España | 20 / 380 | 87 / 38843 | esp.1 | 488 | 110 |
| Premier League · Inglaterra | 20 / 380 | 47 / 36781 | eng.1 | 454 | 91 |
| Serie A · Italia | 20 / 380 | 55 / 36072 | ita.1 | 496 | 101 |
| Bundesliga · Alemania | 18 / 306 | 54 / 40040 | ger.1 | 417 | 73 |
| Ligue 1 · Francia | 18 / 306 | 53 / 37298 | fra.1 | 430 | 82 |
| Liga Portugal · Portugal | 18 / 306 | 61 / 40067 | por.1 | 459 | 98 |
| Eredivisie · Países Bajos | 18 / 306 | 57 / 36577 | ned.1 | 453 | 117 |
| First Division A · Bélgica | 18 / 306 | 40 / 37803 | bel.1 | 450 | 108 |
| Premiership · Escocia | 12 / 198 · regular | 64 / 36832 | sco.1 | 306 | 81 |
| Süper Lig · Turquía | 18 / 306 | 71 / 1000000512 | tur.1 | 439 | 108 |
| Saudi Pro League · Arabia Saudí | 18 / 306 | 536 / 1000000494 | ksa.1 | 464 | 105 |
| Superligaen · Dinamarca | 12 / 132 · regular | 46 / 35802 | den.1 | 313 | 90 |
| Bundesliga · Austria | 12 / 132 · regular | 38 / 38611 | aut.1 | 293 | 78 |
| Super League 1 · Grecia | 14 / 182 · regular | 135 / 44734 | gre.1 | 352 | 76 |
| A-League · Australia | 12 / 156 · regular | 113 / 1000000464 | aus.1 | 230 | 28 |

**6.044 fichas jugador/liga y 248 clubes**, con cobertura agregada de **1.346 partidos por fuente**. El 25 de noviembre se retiraron siete divisiones inferiores: 3.722 fichas, 150 clubes y 1.060 partidos de cobertura agregada. Los 30 JSON fuente, 15 SQLite y el archivo Understat conservados permanecen idénticos; no se consultaron proveedores. Los 3.939 scores válidos se recalculan contra las quince primeras divisiones y cambian 38 perfiles estadísticos MED, sin alterar posiciones publicadas, estadísticas ni fórmulas. No son archivos de encuentros individuales ni se identifican cambios por encuentro desde estos endpoints. Nacionalidad y puestos corresponden a identidades publicadas, no a inferencias por nombre o país de liga. Los escudos se resuelven por ID FotMob del club.

En Escocia se confirma la fase regular de 33 PJ por club / 198 encuentros; Australia, 26 / 156; Dinamarca y Austria, 22 / 132; Grecia, 26 / 182. Se declara solo esa fase publicada: no se inventan ni añaden las posteriores. Los límites por equipo están en `maxTeamMatches`; un formato futuro incompatible se rechaza conservando la captura válida. Las demás candidatas cargadas confirman calendario de ida/vuelta. Australia solo se habilita tras completar desde fichas verificadas los recuentos ausentes del ranking vacío de penaltis parados: ese ranking conserva valores desconocidos, sin inferir ceros. Una temporada en curso siempre sigue siendo parcial.

LaLiga conserva únicamente los huecos de xG/xGA de equipo declarados como opcionales. No se relajan las otras familias ni se infiere xG del equipo para sus porteros. Las demás ligas requieren también esas métricas de equipo. Las ausencias son `null`/«—»; un cero necesita evidencia publicada o la derivación documentada de cero tiros y cero goles de la misma muestra.

## Candidatas que no pasan el mismo contrato

Se evaluaron 26 candidatas adicionales; estas nueve no se añaden en esta publicación. No se afirma un catálogo mundial exhaustivo ni una equivalencia basada solo en el nombre de una categoría.

| Candidata | Motivo comprobado |
| --- | --- |
| Segunda de Portugal, Eerste Divisie, Croacia, Chequia, Serbia y Qatar | No publican las familias de xG/xA requeridas en las páginas de esta temporada |
| Polonia | FotMob avanzado disponible; ESPN no devuelve la clasificación esperada (HTTP 400) |
| Suiza | FotMob avanzado disponible; ESPN no confirma temporada/clasificación completa |
| Rumanía | La página de competición consultada devuelve HTTP 404; no hay captura verificada |


## Identidad y modelos

Los alias activos de clubes se revisaron contra los nombres publicados en ambas clasificaciones y quedan restringidos a su liga en `teamAliases`. No se aplica coincidencia difusa entre equipos. El cruce exige club único y mejor coincidencia de jugador única en ambos sentidos; un registro no se reutiliza. Las dudas quedan pendientes. [Reglas de combinación](COMBINED.md).

Las posiciones usan etiquetas inequívocas y fichas FotMob verificadas. Una plantilla puede completar una posición desconocida si todos sus puestos publicados pertenecen a una sola familia POR/DEF/MED/DEL; una mezcla de familias no vota como posición definitiva. Se preservan puesto, contexto, alternativas y fecha. La nacionalidad deportiva usa identidad, club, liga, temporada y código de país publicados; no se infiere elegibilidad internacional.

Cada jugador tiene **un único score de su posición/perfil**, desde **200 minutos inclusive**, con la misma referencia de todas las ligas cargadas en cualquier vista. Las fichas verificadas completan tarjetas, recuentos y posición; los porteros añaden xGOT recibido solo con muestras atribuibles y autogoles comprobados. La referencia ampliada puede cambiar scores previos aunque sus cifras no cambien. La referencia siempre son las quince primeras divisiones disponibles, incluso al elegir un subconjunto. No hay un ajuste por dificultad o fuerza de la liga; los percentiles comparan las acciones disponibles del conjunto. Los clubes usan promedios por minutos de esos mismos scores, y las selecciones, media simple de once titulares. [Fórmulas y mínimos](SCORES.md), [selecciones](NATIONS.md).

## Todas, filtros y actualización

Las casillas permiten añadir/quitar ligas sin Ctrl; la búsqueda encuentra liga o país y Vaciar deja una selección vacía explícita. Los accesos Todas y 7 principales europeas seleccionan sus miembros de una vez. El segundo incluye LaLiga, Premier League, Serie A, Bundesliga, Ligue 1, Liga Portugal y Eredivisie. Selecciones abre siempre este último grupo y admite países de todo el mundo. La actualización consulta únicamente las ligas seleccionadas con captura válida.

Todas, el grupo europeo y las selecciones personales concatenan fichas y equipos con IDs prefijados por liga, fuentes y fechas originales; no fusiona por nombre personas de ligas distintas. La deduplicación de las selecciones usa identidad explícita sin sumar muestras. Las tablas muestran 100 filas por página, con navegación y rango; búsqueda, filtros y ordenación se aplican primero a todas las fichas. Los filtros cambian candidatos, no las referencias del score. Los rankings de KPI ordenan por su medida y los de posición por score; el score sigue en la primera columna.

Actualizar datos consulta FotMob/ESPN con acceso del propietario, sin contraseña adicional, como máximo dos ligas simultáneas y tres trabajos de fichas por lote. Las actualizaciones válidas se conservan en el navegador; una fuente fallida conserva sus datos y fechas anteriores. Las cachés y rutas incluyen liga y temporada, también en IDs con dígitos como `ligue-1`. Las ligas retiradas reciben 400 en la API y 404 en capturas, incluso con caché antigua. La actualización informa jugadores nuevos/modificados y cobertura de partidos por fuente; no atribuye una nueva fecha de consulta a un cambio de cifras. No hay botones CSV, JSON o SQLite. [Servicio y fechas](REFRESH.md), [rendimiento](PERFORMANCE.md).

## Generar y reproducir

Python 3.11+ y Node 22+, biblioteca estándar, sin base de pago ni paquetes adicionales. `dist/leagues.json` es el catálogo compartido por el navegador, Worker e importadores. Fuentes y SQLite se generan localmente; no se incluyen en GitHub.

```sh
python scripts/import_leagues.py --all --squads --profiles
python scripts/download_club_badges.py
python scripts/build_worker.py
```

Se prepara cada liga en staging, valida fuentes/cobertura y genera JSON original, JSON combinado y SQLite FotMob antes de promover archivos. No se afirma una transacción atómica de todo el conjunto. `--all` informa fuentes no disponibles y continúa con las válidas; si ninguna pasa, falla. Para publicar, deben existir las capturas reales de cada liga registrada: el empaquetador falla ante una captura ausente.

Para reproducir sin red:

```sh
python scripts/import_leagues.py --league portugal \
  --input-root /ruta/rankings --squads-root /ruta/plantillas \
  --profiles-root /ruta/fichas --output-dir /ruta/staging
```

`rankings/<liga>/raw/` (o directamente `<liga>/`) contiene HTML de `SPECS`, `CORE` y `TEAM_SPECS`; `<liga>/espn/`, `standings.json` y `roster-<id>.json`. `plantillas/<liga>/<club-id>.html` y `fichas/<liga>/<jugador-id>.html` conservan los tiempos originales. `enrich_squads.py` reutiliza cada plantilla para posiciones/nacionalidad, con validación por ID, club, liga y temporada. `enrich_fotmob.py --minimum-minutes 200 --missing-only` consulta solo quienes alcanzan el mínimo y porteros, reutilizando fichas ya capturadas con su fecha original; `--keepers-only` limita a porteros. Son opciones explícitas de importación, no cambios al refresco de la web.

Los generadores separados admiten `--league`; `build_combined.cjs`, `--data-dir` y `--reference-dir`. Tras importar ligas nuevas, se regeneran todos los combinados con el mismo conjunto final como referencia. No se editan cifras a mano. [Datos](DATA.md), [FotMob](FOTMOB.md), [tarea y verificación](../loop/tasks/20261124-codex-equivalent-leagues.md).

## Retirar competiciones inactivas

El catálogo exige `division: 1` y un identificador ESPN de primera división. Tras revisar el catálogo, `python scripts/prune_inactive_data.py` muestra un plan sin borrar; `--apply` retira fuentes, combinados, SQLite, cachés de fichas/plantillas y escudos sin club activo. `--data-dir /ruta/staging --sources-only` permite limpiar otras salidas generadas. Conserva artefactos StatsBomb, FBref y el archivo Understat de LaLiga. Al abrir la web se eliminan del almacén local las capturas e historial de ligas inactivas; si el navegador deniega el acceso, se informa del fallo. El Worker no las sirve ni las actualiza aunque exista una caché anterior. El borrado afecta a las bases y capturas activas, no elimina versiones históricas ya publicadas.

## Tamaño de las capturas del 25 de noviembre

Las 15 bases SQLite FotMob ocupan **82.546.688 bytes sin comprimir (82,5 MB)** y **8.187.445 bytes gzip (8,19 MB)**. Son archivos locales; el Site usa JSON. Las 30 capturas activas FotMob/ESPN ocupan **51.700.916 bytes JSON** y **3.118.917 bytes gzip (3,12 MB)**, sin HTML de origen, archivos históricos, imágenes o código.
