# GRADA · Estadísticas de fútbol

Web en español de líderes, tablas por equipo y jugador, perfiles, comparación y CSV. HTML, CSS y JavaScript en `dist/`; importación y generación de bases SQLite con Python de biblioteca estándar.

## Qué incluye el repositorio

- El código de la web y un arranque vacío (`dist/data.js`). No hay cifras de demostración.
- `scripts/import_statsbomb.py`: descarga los 64 partidos del Mundial masculino 2022, agrega métricas y genera los datos de la web y SQLite.
- `scripts/import_fbref.py`: descarga una copia pública identificada como procedente de FBref, fijada por commit y SHA; extrae LaLiga 2025/26 y genera CSV y SQLite separados.
- Skills, loop, plantillas y validadores para trabajar entre dos personas.

**Las bases y los datos generados no se incluyen en Git.** La web muestra que faltan los datos hasta ejecutar la importación de StatsBomb. FBref se conserva aparte: no se mezcla automáticamente con los rankings del Mundial.

## Generar los datos de la web y la base

Requiere Python 3.10 o posterior y acceso a Internet. Desde la raíz del proyecto:

```sh
python scripts/import_statsbomb.py
python scripts/validate_data.py
python -m http.server 8000 --directory dist
```

Abre http://localhost:8000. No necesitas instalar paquetes de Python, npm ni contratar una base de datos. El CSV del navegador respeta los filtros, el orden y el modo por 90 minutos.

El importador genera:

- `dist/data.js`: estadísticas reales que consume la web.
- `dist/downloads/statsbomb.json`: payload de jugadores, equipos y partidos.
- `dist/downloads/statsbomb.sqlite.gz`: base descargable comprimida.
- `dist/downloads/SHA256SUMS`: integridad del archivo anterior.
- `data/statsbomb.sqlite` y caché original en `data/raw/`.

El `data.js` versionado es solo el arranque vacío. Al importar se modifica localmente: conserva ese cambio para explorar los datos, pero no añadas el payload generado a un commit de código. Las descargas y la caché están ignoradas por Git.

Para una importación parcial explícita:

```sh
python scripts/import_statsbomb.py --limit 3
```

La web indica esa cobertura y no presenta sus rankings como los totales del Mundial. Las salidas de una importación se validan juntas; el importador todavía no promociona todo el conjunto de manera atómica, según GRADA-003.

## Descargar FBref · LaLiga 2025/26

```sh
python scripts/import_fbref.py
```

Salida: `data/fbref/laliga-2025-26/`, con 22 CSV, `metadata.json` y `fbref_laliga_2025_26.sqlite`. La copia usada declara 38 partidos por cada uno de los 20 equipos, 611 registros jugador-equipo y 39 de porteros. Los traspasos pueden producir varias filas de un jugador.

La descarga directa de FBref devolvió 403 desde el entorno de preparación. El script usa la copia pública `m-mahadi/top5-football-dataset` identificada como FBref, fijada en [docs/fbref-source.json](docs/fbref-source.json). No descarga su tabla combinada con otros proveedores. [FBREF.md](docs/FBREF.md) documenta origen, cobertura y limitaciones.

Esta captura tiene goles, asistencias, tiros, minutos y paradas. Pases, xG y PSxG no están disponibles en las tablas seleccionadas; las celdas ausentes quedan vacías en CSV y `NULL` en SQLite. No se completan con datos ficticios ni se presentan como métricas de StatsBomb.

## Publicación opcional en GitHub Pages

El workflow `.github/workflows/pages.yml` importa StatsBomb, comprueba el código y publica `dist/` si el propietario configura **Settings → Pages → Source → GitHub Actions**. Las bases se generan durante el workflow y se sirven como artefactos de la web; no se guardan en el historial Git.

La presencia de ese archivo no confirma un despliegue. Revisa el estado y la URL reales después de ejecutarlo. También puedes servir `dist/` en otro alojamiento estático tras generar los datos.

## Métricas y colaboración

Las definiciones de goles, tandas, xA derivada, minutos nominales y porteros están en [DATA.md](docs/DATA.md). PSxG y goles evitados no se calculan en la importación StatsBomb.

Para trabajar entre dos personas, empieza por [CONTRIBUTING.md](CONTRIBUTING.md), [AGENTS.md](AGENTS.md) y [el loop](loop/README.md). Skills: `$grada-loop`, `$grada-data` y `$grada-review`.

Comprobaciones sin red:

```sh
python scripts/check_collaboration_docs.py
node --check dist/app.js
python -m py_compile scripts/import_statsbomb.py scripts/import_fbref.py
```

Después de generar StatsBomb, ejecuta `python scripts/validate_data.py`. Los datos y bases actuales se conservan localmente; este repositorio distribuye su código generador.

## Fuentes

- [StatsBomb Open Data](https://github.com/hudl/open-data) y [licencia de datos](https://github.com/hudl/open-data/blob/master/LICENSE.pdf).
- [Copia pública atribuida a FBref](https://github.com/m-mahadi/top5-football-dataset), su aviso de datos y los términos de Sports Reference. La licencia MIT de ese repositorio cubre su código, no concede derechos sobre los datos.

## LaLiga 2026/27 y ayuda de métricas

La web permite actualizar LaLiga 2026/27 desde ESPN con su botón. Para generar la captura que se sirve en Sites, ejecuta `python scripts/import_laliga.py`; no se versionan los datos generados. Consulta [fuente, campos y límites](docs/LALIGA.md). En porteros se muestran xG y goles recibidos por 90 cuando existen minutos y xG; las cabeceras explican cada métrica con cursor, teclado o el botón ⓘ.
