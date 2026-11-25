# GRADA · Estadísticas de fútbol

> Definición vigente desde el 19 de noviembre: [score único por jugador con ejes de su perfil, referencia común, promedios de equipo y totales con cobertura](docs/SCORES.md). El perfil MED y el puesto de lateral seleccionan los ejes; juego limpio aplica una penalización lineal con tarjetas verificadas y mayor peso de las rojas. Cambiar de ranking no recalcula el score.


Web en español de estadísticas, perfiles y rankings por score del radar de jugadores y equipos. El selector ofrece **15 primeras divisiones y tres torneos UEFA combinados**, con selección múltiple, **Todas las ligas**, **Ligas y torneos** y **7 principales ligas europeas**, temporada 2026/27. HTML/CSS/JavaScript en `dist/`, Python estándar para descargar datos reales y generar SQLite gratuitos.

## Datos reales y fuentes

Desde el 24 de noviembre, la aplicación activa usa **solo FotMob y ESPN**, incluido el catálogo de LaLiga y todos los scores. Understat queda archivado; las referencias anteriores de esta documentación son históricas. La captura de equipos de LaLiga del 25 de noviembre recupera xG/xGA FotMob; cualquier hueco sigue desconocido y con cobertura explícita. Se conservan los enlaces antiguos mediante un mapa de IDs verificados.

La columna Nacionalidad y el apartado **Selecciones** reúnen países publicados por FotMob y onces teóricos elegidos entre siete sistemas coherentes, con contención, creación y score como media simple de sus once titulares. [Cobertura, procedencia, fórmula y generadores](docs/NATIONS.md). Los candidatos proceden de todas las quince primeras divisiones cargadas; se agrupan países de todo el mundo. Son simulaciones, no convocatorias oficiales.

Todas las ligas usan catálogo y prioridad FotMob → ESPN, incluidos xG/xA FotMob, tras comprobar las mismas familias de métricas de pase, ataque, defensa y portería. Los goles admiten un recuento distinto de mayor cobertura o, con iguales PJ, captura posterior, con fuente y fecha explícitas. Understat conserva su código e importador archivados para una reactivación futura. Los modelos, capturas, PJ y minutos de cada campo se conservan. No hay datos de demostración; las ausencias siguen `null`.

Las ligas reúnen 6.044 fichas jugador/liga; Champions, Europa League y Conference añaden 2.258 fichas de competición. Ligas y torneos une por ID FotMob verificado: 6.766 jugadores distintos y 286 clubes. El score canónico usa toda la temporada disponible, conserva un único perfil/posición y no cambia al abrir otra competición. Los totales y tasas visibles corresponden al ámbito elegido, con cobertura y minutos propios de cada fuente. Hay rankings de delanteros, porteros, defensas, centrales, laterales y perfiles MED ofensivo/defensivo/equilibrado; los equipos usan promedios ponderados de esos mismos scores. Los scores individuales requieren todos los ejes de su posición/perfil. Consulta [ligas y rankings](docs/LEAGUES.md), [combinación](docs/COMBINED.md) y [estado publicado](docs/STATUS.md).

## Generar la web y las bases

Requiere Python 3.11+, Node 22+ e Internet, sin instalar paquetes ni contratar una base:

```sh
python scripts/import_leagues.py --all --squads --profiles
python scripts/download_club_badges.py
python scripts/build_worker.py
node scripts/serve.mjs 8000
```

Abre http://localhost:8000. También puedes generar una liga:

```sh
python scripts/import_leagues.py --league premier-league
```

El proceso genera JSON de cada proveedor, JSON combinado y SQLite FotMob comprimido. Las capturas Understat anteriores pueden conservarse localmente como archivo y no se necesitan para las ligas activas. Los JSON sirven para cargar la web; la interfaz no muestra enlaces de descarga de CSV, JSON o SQLite. **Las bases y los datos generados no se incluyen en GitHub**. Los importadores separados aceptan `--league`: `scripts/import_fotmob.py`, `scripts/import_laliga.py` y `scripts/build_combined.cjs`.

Una fuente no disponible no se sustituye por datos ficticios. El proceso `--all` continúa con las ligas que pasan los controles e informa de las omitidas; falla si no puede generar ninguna. La aplicación activa no depende de la disponibilidad de Understat. El selector solo ofrece combinados validados. [LEAGUES.md](docs/LEAGUES.md) describe reproducción desde cachés reales y todos los campos.

Los escudos y banderas se sirven localmente. [Procedencia, generación y fallback de imágenes](docs/ASSETS.md).

## Navegación y scores

El panel **Datos cargados** de cada vista muestra las fechas de captura por fuente y liga, con detalle de estadísticas, fichas y último intento en este navegador. Las fechas se actualizan al cargar capturas válidas y se conservan si una fuente falla. [Definición y límites](docs/REFRESH.md#fechas-visibles-de-los-datos).

- Rankings de delanteros, porteros, defensas y perfiles defensivo/ofensivo de centrocampistas.
- Rankings de equipos por ataque, defensa, rendimiento global y centros del campo ofensivos/defensivos.
- Filtros por minutos, goles y otras métricas, búsqueda, ordenación, perfiles y comparador.
- Scores individuales e índices de perfil entre 0 y 1; promedios de plantilla/posiciones ponderados por minutos con cobertura y contribuciones en ficha y JSON generado.
- Inicio con bloques de defensas individuales, equipos ofensivos/defensivos y centrocampistas/centros del campo ofensivos/defensivos.
- Rankings de jugadores antes que equipos, con campos y fechas de origen. Los guiones explican por qué falta un valor.

Actualizar datos consulta todas las fuentes aplicables y conserva cada captura que falle. Las fichas FotMob amplían pases, posiciones, tiros y xGOT del portero; su eficacia frente al xGOT participa en el score. El score de equipo y de posiciones es un promedio ponderado por minutos. Sites ejecuta el Worker de consultas; Python sigue siendo el generador externo de artefactos. Consulta [actualización y fórmulas](docs/REFRESH.md).

Consulta [herramientas de calidad, CI y rendimiento medido](docs/QUALITY.md).

## Comprobaciones

```sh
node --check dist/app.js
node --test tests/*.test.cjs
python -m unittest discover -s tests -p 'test_*.py'
python scripts/check_collaboration_docs.py
```

Las pruebas aisladas nunca se publican como estadísticas. Al cambiar los datos se comprueban sus JSON/SQLite y unidades; los controles históricos de StatsBomb siguen en `python scripts/validate_data.py` cuando se hayan generado esos artefactos.

## Colaboración y publicación

Empieza por [CONTRIBUTING.md](CONTRIBUTING.md), [AGENTS.md](AGENTS.md), [arquitectura](docs/ARCHITECTURE.md) y [el loop](loop/README.md). Skills del repositorio: `$grada-loop`, `$grada-data` y `$grada-review`.

La web, privada para su propietario desde el 14 de noviembre de 2026, y sus versiones confirmadas están en [STATUS.md](docs/STATUS.md). El workflow opcional de GitHub Pages genera datos sin guardarlos en el historial; requiere que el propietario configure Settings → Pages → GitHub Actions. Su existencia no demuestra que esté activado o desplegado. El alojamiento principal actual es Sites.

## Herramientas de archivo

Se conservan `scripts/import_statsbomb.py` para el Mundial 2022 y `scripts/import_fbref.py` para la captura FBref 2025/26. No son opciones del selector combinado actual. Consulta [StatsBomb y sus métricas](docs/DATA.md), [FBref](docs/FBREF.md), [ESPN](docs/LALIGA.md), [Understat](docs/UNDERSTAT.md) y [FotMob](docs/FOTMOB.md). Los artefactos de archivo se generan aparte y no se cargan como estadísticas actuales.
