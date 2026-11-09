# Arquitectura actual

## Recorrido de los datos

```text
StatsBomb Open Data (JSON de partidos, alineaciones y eventos)
        ↓ scripts/import_statsbomb.py
        ├── data/raw/                         caché local, ignorada
        ├── data/statsbomb.sqlite              base local
        ├── dist/data.js                      window.GRADA_DATA
        └── dist/downloads/                    JSON, SQLite gzip y SHA256
                    ↓
             dist/app.js + index.html + style.css
                    ↓
          líderes, filtros, perfiles y comparación
```

El navegador usa los datos de `dist/data.js` ya cargados. SQLite se genera como artefacto y ya no tiene enlace en la interfaz. El Worker sirve las capturas y permite consultas de lectura a proveedores; el navegador conserva las actualizaciones en IndexedDB. No hay autenticación propia ni datos de visitantes escritos públicamente. El diagrama anterior describe el archivo histórico StatsBomb; el flujo actual está en [REFRESH.md](REFRESH.md).

## Responsabilidades

| Archivo | Responsabilidad |
| --- | --- |
| `dist/index.html` | Estructura, navegación y contenedores |
| `dist/style.css` | Apariencia y adaptación a pantallas |
| `dist/app.js` | Filtros, métricas por 90, rankings, fichas y comparador |
| `dist/scores.js` | Modelo común: score por posición, candidatos de perfiles y promedios de equipo |
| `scripts/import_statsbomb.py` | Descarga, agregación y creación de artefactos |
| `scripts/validate_data.py` | Coherencia de las salidas incluidas, sin red |
| `.github/workflows/pages.yml` | Importación y despliegue en GitHub Pages, si el propietario lo configura |

El importador usa Python de biblioteca estándar; no existe un build de npm. El código fuente de la web vive en `dist/`, por lo que no se debe vaciar esa carpeta para regenerar datos.

Desde el 9 de noviembre, el modelo de [SCORES.md](SCORES.md) es común a todas las vistas y al generador. La referencia se construye una vez con las ligas cargadas y los modelos se conservan mientras no cambien sus capturas. Ninguna tarjeta o ficha calcula otro score. El HTML empaquetado versiona los módulos por hash para evitar mezclar código de publicaciones diferentes.

## Puntos de coordinación

`dist/app.js` consume los nombres y tipos de [DATA.md](DATA.md). Si una tarea cambia un campo, el responsable del importador coordina la actualización del consumidor y del validador. La UI no corrige cifras por su cuenta.

Los artefactos generados se actualizan juntos. No se resuelve un conflicto de `data.js` o SQLite eligiendo fragmentos de dos importaciones: se conserva la versión de código acordada y se regenera.

## Límites actuales

El importador escribe algunos artefactos antes de terminar todas las comprobaciones; una interrupción puede dejar versiones mezcladas. El validador ayuda a detectarlo, pero no convierte la importación en una operación atómica. La tarea [GRADA-003](../loop/tasks/GRADA-003-atomic-import.md) recoge esa mejora.

El manifiesto de SHA del origen incluido fue capturado durante la descarga mediante GitHub. El importador HTTP actual no lo reconstruye. No debe presentarse un manifiesto antiguo como procedencia de una importación nueva.

## Publicación

Un push es una operación de Git, un workflow es una ejecución y una URL publicada es otro resultado. Verifica los tres por separado cuando formen parte de la tarea. El Site público y las versiones confirmadas se registran en [STATUS.md](STATUS.md).

## Importación FBref independiente

`scripts/import_fbref.py` toma una copia pública de FBref fijada en `docs/fbref-source.json`, verifica los SHA y escribe CSV y SQLite en `data/fbref/`, fuera de Git. Su esquema es distinto del payload de StatsBomb y no se conecta automáticamente a la UI. Consulta [FBREF.md](FBREF.md).

## Consulta de LaLiga 2026/27

`dist/metrics.js` contiene la normalización y las tasas; `dist/laliga.js`, la consulta/validación y adaptación de ESPN. `scripts/import_laliga.py` genera una captura real atómica para Sites, reutilizando ese adaptador. El botón actualiza la copia del navegador. Consulta [LALIGA.md](LALIGA.md) para campos, cobertura y límites. El hosting continúa siendo estático.

## Captura de Understat

`scripts/import_understat.py` extrae y valida datos públicos de LaLiga 2026/27, genera JSON y SQLite. `dist/understat.js` valida la captura consumida por la UI; `dist/security.js` restringe enlaces y protege CSV. El selector conserva las vistas individuales junto al combinado autorizado. El botón de Understat recarga la captura publicada, según [UNDERSTAT.md](UNDERSTAT.md).

## Vista combinada, radar y filtros

La vista combinada autorizada da prioridad a Understat y complementa coincidencias inequívocas con ESPN y FotMob, conservando origen, fecha y denominadores por métrica. Añade descargas explícitas, radar por posición y filtros numéricos. Consulta [definiciones y límites](COMBINED.md).

## FotMob y perfiles por posición

`scripts/import_fotmob.py` extrae rankings públicos de HTML y genera JSON/SQLite con contexto por campo. `dist/fotmob.js` valida la captura y declara sus métricas; `dist/combined.js` aplica prioridad Understat → ESPN → FotMob. `dist/metrics.js` conserva tasas publicadas y denominadores propios. `dist/radar.js` calcula referencias compartidas por posición, percentiles y área relativa; `dist/app.js` guarda perfiles derivados en memoria, sin mutar las capturas originales. `dist/filters.js` permite un lector de métricas para filtrar el área derivada. Consulta [FOTMOB.md](FOTMOB.md) y [COMBINED.md](COMBINED.md).

## Catálogo de ligas y ámbitos

`dist/leagues.json` es la configuración compartida por Python y `dist/leagues.js`. Los validadores comprueban la competición y temporada específicas, incluidos 18/20 clubes y 306/380 partidos. `scripts/import_leagues.py` prepara cada conjunto en un directorio temporal y valida cobertura antes de promover sus archivos.

`dist/scopes.js` concatena combinados por liga con IDs propios, fechas por campo y columna Liga. `dist/radar.js` fija referencias por perfil y ámbito y admite jugadores y equipos; sus perfiles de centrocampistas describen acciones, sin inventar posiciones detalladas. `dist/app.js` mantiene una caché por liga y recalcula áreas al cambiar de ámbito; los filtros solo cambian candidatos. El botón de actualización limita concurrencia y conserva cada liga fallida. Consulta [LEAGUES.md](LEAGUES.md).

`dist/squads.js` calcula áreas de plantilla desde los perfiles generales por posición y pertenencia por ID, separado del perfil activo de ranking. No modifica las capturas. `withTeamAreas` enriquece los JSON derivados, y `scopes.js` descarta sumas locales antes de recalcular Todas. Los índices específicos de equipos se mantienen en `radar.js`; los pendientes permanecen visibles. `filters.js` aplica alias de búsqueda sin modificar la identidad de datos.

`midfieldSummaries` suma exclusivamente los MED asignados usando sus perfiles MED_ATT/MED_DEF. Sus dos definiciones de ranking de equipo declaran aggregateProfile y no pasan por el radar de métricas de equipo. Las sumas y coberturas tienen campos propios; el detalle muestra las contribuciones. Los botones y handlers CSV/JSON se han retirado por petición del usuario; los JSON siguen sirviendo la carga interna y el generador. Se conservan los generadores de SQLite. La actualización general, los scores ponderados, el eje xGOT y el empaquetado Worker actuales están en [REFRESH.md](REFRESH.md).

## Worker y actualización general

`worker/providers.cjs` conserva los formatos del importador Python. `dist/profiles.js` verifica identidad/club y temporada de las fichas; `dist/refresh.js` combina éxitos parciales y conserva las fuentes fallidas. `worker/app.cjs` limita rutas, host, origen, método y caché. `scripts/build_worker.py` empaqueta una lista explícita de archivos y capturas en un único Worker sin dependencias. La aplicación no muestra enlaces de descarga.
