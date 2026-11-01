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
          líderes, filtros, perfiles, comparación y CSV
```

El navegador usa los datos de `dist/data.js` ya cargados. SQLite se ofrece como descarga, no como una base que el navegador consulte en tiempo real. No hay backend, autenticación propia ni sincronización multiusuario de datos de visitantes.

## Responsabilidades

| Archivo | Responsabilidad |
| --- | --- |
| `dist/index.html` | Estructura, navegación y contenedores |
| `dist/style.css` | Apariencia y adaptación a pantallas |
| `dist/app.js` | Filtros, métricas por 90, rankings, fichas, comparador y CSV |
| `scripts/import_statsbomb.py` | Descarga, agregación y creación de artefactos |
| `scripts/validate_data.py` | Coherencia de las salidas incluidas, sin red |
| `.github/workflows/pages.yml` | Importación y despliegue en GitHub Pages, si el propietario lo configura |

El importador usa Python de biblioteca estándar; no existe un build de npm. El código fuente de la web vive en `dist/`, por lo que no se debe vaciar esa carpeta para regenerar datos.

## Puntos de coordinación

`dist/app.js` consume los nombres y tipos de [DATA.md](DATA.md). Si una tarea cambia un campo, el responsable del importador coordina la actualización del consumidor y del validador. La UI no corrige cifras por su cuenta.

Los artefactos generados se actualizan juntos. No se resuelve un conflicto de `data.js` o SQLite eligiendo fragmentos de dos importaciones: se conserva la versión de código acordada y se regenera.

## Límites actuales

El importador escribe algunos artefactos antes de terminar todas las comprobaciones; una interrupción puede dejar versiones mezcladas. El validador ayuda a detectarlo, pero no convierte la importación en una operación atómica. La tarea [GRADA-003](../loop/tasks/GRADA-003-atomic-import.md) recoge esa mejora.

El manifiesto de SHA del origen incluido fue capturado durante la descarga mediante GitHub. El importador HTTP actual no lo reconstruye. No debe presentarse un manifiesto antiguo como procedencia de una importación nueva.

## Publicación

Un push es una operación de Git, un workflow es una ejecución y una URL publicada es otro resultado. Verifica los tres por separado cuando formen parte de la tarea. No hay despliegue confirmado de GRADA en el estado documentado; consulta [STATUS.md](STATUS.md).

## Importación FBref independiente

`scripts/import_fbref.py` toma una copia pública de FBref fijada en `docs/fbref-source.json`, verifica los SHA y escribe CSV y SQLite en `data/fbref/`, fuera de Git. Su esquema es distinto del payload de StatsBomb y no se conecta automáticamente a la UI. Consulta [FBREF.md](FBREF.md).

## Consulta de LaLiga 2026/27

`dist/metrics.js` contiene la normalización y las tasas; `dist/laliga.js`, la consulta/validación y adaptación de ESPN. `scripts/import_laliga.py` genera una captura real atómica para Sites, reutilizando ese adaptador. El botón actualiza la copia del navegador. Consulta [LALIGA.md](LALIGA.md) para campos, cobertura y límites. El hosting continúa siendo estático.
