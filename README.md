# GRADA · Estadísticas de fútbol

Web en español de estadísticas, perfiles y rankings por área del radar de jugadores y equipos. El selector ofrece **LaLiga, Premier League, Serie A, Bundesliga, Ligue 1** combinadas y **Todas las ligas**, temporada 2026/27. HTML/CSS/JavaScript en `dist/`, Python estándar para descargar datos reales y generar SQLite gratuitos.

## Datos reales y fuentes

LaLiga prioriza Understat → ESPN → FotMob. Las otras ligas priorizan FotMob → ESPN, incluidos xG/xA FotMob, tras comprobar las mismas familias de métricas de pase, ataque, defensa y portería. Los modelos, capturas, PJ y minutos de cada campo se conservan. No hay datos de demostración; las ausencias siguen `null`.

Las capturas verificadas reúnen 2.284 fichas jugador/liga y 96 equipos. En Todas las ligas se recalculan los percentiles sobre el conjunto seleccionado. Hay cinco perfiles de jugadores y tres de equipos, con muestras mínimas y áreas comparables solo con todos los ejes comunes. Consulta [ligas y rankings](docs/LEAGUES.md), [combinación](docs/COMBINED.md) y [estado publicado](docs/STATUS.md).

## Generar la web y las bases

Requiere Python 3.11+, Node 18+ e Internet, sin instalar paquetes ni contratar una base:

```sh
python scripts/import_leagues.py --all
python -m http.server 8000 --directory dist
```

Abre http://localhost:8000. También puedes generar una liga:

```sh
python scripts/import_leagues.py --league premier-league
```

El proceso genera JSON de cada proveedor, JSON combinado y SQLite FotMob comprimido. LaLiga mantiene además su JSON/SQLite Understat. Los archivos se sirven como descargas; **las bases y los datos generados no se incluyen en GitHub**. Los importadores separados aceptan `--league`: `scripts/import_fotmob.py`, `scripts/import_laliga.py` y `scripts/build_combined.cjs`.

Una fuente no disponible no se sustituye por datos ficticios. El proceso `--all` continúa con las ligas que pasan los controles e informa de las omitidas; falla si no puede generar ninguna. Understat puede reutilizar su captura existente con su fecha original. Si está en mantenimiento y no hay captura local, LaLiga no se habilita hasta disponer de ella. El selector solo ofrece combinados validados. [LEAGUES.md](docs/LEAGUES.md) describe reproducción desde cachés reales y todos los campos.

## Navegación y descargas

- Rankings de delanteros, porteros, defensas y perfiles defensivo/ofensivo de centrocampistas.
- Rankings de equipos por ataque, defensa y rendimiento global.
- Filtros por minutos, goles y otras métricas, búsqueda, ordenación, perfiles y comparador.
- Área del radar entre 0 y 1 en tablas, fichas y CSV, con unidades y referencia del perfil.
- Descargas JSON/SQLite por proveedor y CSV/JSON combinado. Todas añade Liga y fechas por campo.

El botón de ESPN actualiza la copia del navegador para una liga o todas; mantiene las otras capturas. Sites aloja archivos estáticos y no ejecuta Python. La web compartida se actualiza al regenerar y publicar una versión.

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

La web pública y sus versiones confirmadas están en [STATUS.md](docs/STATUS.md). El workflow opcional de GitHub Pages genera datos sin guardarlos en el historial; requiere que el propietario configure Settings → Pages → GitHub Actions. Su existencia no demuestra que esté activado o desplegado. El alojamiento principal actual es Sites.

## Herramientas de archivo

Se conservan `scripts/import_statsbomb.py` para el Mundial 2022 y `scripts/import_fbref.py` para la captura FBref 2025/26. No son opciones del selector combinado actual. Consulta [StatsBomb y sus métricas](docs/DATA.md), [FBref](docs/FBREF.md), [ESPN](docs/LALIGA.md), [Understat](docs/UNDERSTAT.md) y [FotMob](docs/FOTMOB.md). Los artefactos de archivo se generan aparte y no se cargan como estadísticas actuales.
