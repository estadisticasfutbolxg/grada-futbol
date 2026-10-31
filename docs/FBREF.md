# FBref · Captura de LaLiga 2025/26

## Origen

La descarga directa de FBref devolvió 403. La alternativa descargada procede de las tablas separadas `data/clean/players/` y `data/clean/teams/` de [m-mahadi/top5-football-dataset](https://github.com/m-mahadi/top5-football-dataset). Su autor identifica esas tablas como datos de FBref; no se usa su tabla maestra que mezcla otras fuentes.

Snapshot fijado: `8940299c2c56c2c0932d3caf292336f5e1689893`, del 18 de agosto de 2026. [fbref-source.json](fbref-source.json) incluye las rutas y los SHA Git de cada archivo. El importador verifica cada SHA antes de procesar el CSV.

Es una copia de un tercero, no una exportación oficial descargada directamente de FBref. La cobertura descrita es la que declara esa copia.

## Contenido comprobado

- 11 categorías para jugadores y 11 para equipos: 22 tablas.
- 20 equipos, cada uno con 38 partidos declarados en la tabla estándar.
- 611 registros jugador-equipo en la tabla estándar, con 599 nombres distintos. Los nombres no son identificadores universales; los traspasos generan registros adicionales.
- 39 registros de porteros.
- Hay tablas que incluyen suplentes sin minutos, por lo que no tienen necesariamente el mismo número de filas que la tabla estándar.

La cobertura es de agregados de temporada. No se han descargado 380 actas ni eventos de los partidos desde esta fuente.

## Disponibilidad

| Métrica | Resultado comprobado en la captura |
| --- | --- |
| Goles y asistencias | Disponibles en los 611 registros estándar |
| Tiros | Disponibles en los 611 registros de remate |
| Minutos y partidos | Disponibles en tablas estándar y tiempo de juego |
| Paradas | Disponibles en los 39 registros de porteros |
| Pases intentados/completados | Columnas vacías en los registros seleccionados |
| xG | Ausente de las tablas seleccionadas |
| PSxG y goles evitados | Columnas vacías; no se calculan |

Se conservan las definiciones y columnas de origen. No se recalculan conversiones con denominadores de otra fuente, no se unen jugadores por nombre a StatsBomb y los valores vacíos no se convierten en cero.

## Generar SQLite y CSV

```sh
python scripts/import_fbref.py
```

El script descarga el snapshot fijado desde GitHub; no intenta superar el bloqueo de FBref. Usa biblioteca estándar, no necesita una clave API y guarda los resultados en `data/fbref/laliga-2025-26/`, fuera de Git.

Si ya tienes la captura exacta de las carpetas `players/` y `teams/`:

```sh
python scripts/import_fbref.py --input-dir ruta/a/los/csv --output ruta/de/salida
```

La salida contiene los CSV filtrados, un SQLite con una tabla por categoría y `metadata.json` con cobertura, conteos, tipos de origen, rutas, SHA y disponibilidad de cada columna. Las celdas vacías se conservan vacías en CSV y como `NULL` en SQLite.

Estos datos aún no se conectan a la web, que consume el payload generado por StatsBomb. Esa integración requiere definir el contrato de otra competición y sus métricas disponibles.

## Aviso del origen

El repositorio de procedencia declara que su licencia MIT cubre solo el código. Cada proveedor conserva sus derechos sobre los datos. Mantén su atribución y comprueba los términos aplicables antes de redistribuirlos o usarlos comercialmente. El paquete de descarga preparado conserva el README y el aviso de licencia de origen.
