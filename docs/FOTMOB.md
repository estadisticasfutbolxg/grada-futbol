# FotMob · LaLiga 2026/27

`python scripts/import_fotmob.py` descarga 28 páginas públicas de rankings de [FotMob](https://www.fotmob.com/leagues/87/stats/season/38843/players/accurate_pass/laliga), competición 87, temporada 38843 (`2026/2027`). Extrae `__NEXT_DATA__` del HTML con el parser estándar, sin ejecutar JavaScript. No necesita cuenta ni paquetes de Python. Requiere Python 3.11+ por la serialización SQLite.

## Captura comprobada

Descarga real del 6 de noviembre de 2026: 20 equipos y 488 jugadores con minutos. No representa la temporada completa ni una lista exhaustiva de jugadores; cada ranking tiene cobertura propia. `metadata.coverage` conserva su número de filas, y `metadata.pages` la URL, fecha de consulta y SHA256 de cada HTML. La fecha es la consulta de GRADA, no una fecha interna de actualización del proveedor. Los rankings se consultan con dos peticiones simultáneas y tiempo y tamaño limitados; no forman una transacción del proveedor.

| Grupo | Métricas disponibles y unidad original |
| --- | --- |
| Pase | Pases precisos/90 y acierto (366 registros); pases rompelíneas, total y /90 (342); pases largos precisos/90 y acierto (321) |
| Defensa | Entradas, total y /90 (342); intercepciones (314); recuperaciones (366); despejes (350); bloqueos (231) |
| Ataque | Tiros a puerta/90 y % (259); regates logrados/90 y éxito (307); ocasiones creadas, total y /90 (367); grandes ocasiones creadas (195) y falladas (149); xGOT de los tiros realizados (287) |
| Presión y disciplina | Recuperaciones/90 en el tercio final y en la zona media (250); faltas/90 (339); amarillas (266); rojas (29) |
| Portería | Paradas, goles recibidos, porcentaje de paradas, goles evitados, balones aéreos atrapados y acciones de líbero (21 registros por ranking); porterías a cero (20); penaltis parados y afrontados (5) |

Los valores ausentes son `null`, aunque un jugador no aparezca en un ranking de tarjetas o acciones defensivas. No se interpreta esa ausencia como cero. Los minutos y PJ proceden de la página de minutos y se unen por identificador FotMob y club; una fila de otro equipo no se une.

## Definiciones y límites

- Los pases rompelíneas son la métrica de FotMob; no se renombran como los progresivos de StatsBomb (definición propia de avance longitudinal de GRADA).
- Los pases precisos, largos, tiros a puerta y regates solo ofrecen tasas publicadas y porcentajes en estas páginas. No se multiplican cifras redondeadas por minutos para fabricar totales. `passes` y `completed` quedan `null`; `completedPer90` usa la tasa original en `metricContexts.completed.reportedPer90`.
- Entradas, intercepciones y recuperaciones son acciones distintas. Las entradas no se etiquetan como «robos ganados» sin esa definición del proveedor.
- Las ocasiones creadas se mantienen separadas de los pases clave de Understat. No se calculan ratios entre sus modelos.
- `xgot` describe tiros a puerta realizados por el jugador. No es xG recibido por un portero. Los goles evitados son una cifra publicada por FotMob y pueden ser negativos; no se reconstruye PSxG sumándole goles de otro proveedor ni cifras redondeadas.
- Cada campo conserva minutos, PJ, fecha, URL y tasa publicada cuando existe. El cambio de unidad usa primero la tasa /90 del proveedor; las tasas sin publicación explícita requieren su propio total y minutos. Los porcentajes y campos ya etiquetados /90 conservan su unidad.

## Artefactos y reproducción

Se generan `dist/downloads/fotmob-laliga-2026-27.json` y `fotmob-laliga-2026-27.sqlite.gz`, ignorados por Git y disponibles en la web. El código valida todas las páginas antes de construir las salidas; genera JSON y SQLite desde el mismo objeto y reemplaza cada archivo individualmente. Una publicación debe empaquetar el conjunto terminado.

SQLite tiene `metadata`, `teams`, `players` y `metric_contexts`. `players` ofrece columnas de métricas y el registro íntegro en `stats_json`; `metric_contexts` conserva las tasas y la procedencia por campo. Los totales ausentes siguen `NULL`.

Para reutilizar una captura HTML real sin red, `--input-dir /ruta/captura` espera los nombres definidos en `SPECS` y conserva el `mtime` de esos archivos como fecha de consulta. Solo debe usarse con archivos originales cuya fecha se conserve, no con copias a las que se haya asignado una fecha nueva.

Para reconstruir el combinado después de generar las otras fuentes:

```sh
python scripts/import_fotmob.py
node scripts/build_combined.cjs
```

El navegador carga la captura publicada; el botón de actualización de ESPN no ejecuta este scraper ni renueva la fecha de FotMob. Una nueva captura se publica con una nueva versión del Site. La integración se describe en [COMBINED.md](COMBINED.md).

## Validación

`python -m unittest discover -s tests -p 'test_*.py'` comprueba extracción, temporada, formatos, ausencia frente a cero, cifras negativas y concordancia SQLite. `node --test tests/*.test.cjs` comprueba prioridad, denominadores, tasas originales, uniones dudosas y geometría del radar. Las fixtures aisladas de prueba no se publican.

## Ampliación del 7 de noviembre

`--league` admite el catálogo compartido: LaLiga, Premier League, Serie A, Bundesliga y Ligue 1. LaLiga añade clasificación y rankings de equipos (35 páginas en total); las otras ligas añaden también los campos principales de xG/xA, goles, asistencias y tiros/90 (42 páginas por liga). La clasificación aporta puntos y GP; los tiros a puerta/PJ son una tasa publicada y las grandes ocasiones, un total. SQLite incluye las métricas y el registro íntegro de equipos en `teams.stats_json`. Los detalles de cobertura y rankings están en [LEAGUES.md](LEAGUES.md).
