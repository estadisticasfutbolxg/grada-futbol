# Understat · LaLiga 2026/27

El importador descarga los datos públicos que usa [la página de LaLiga de Understat](https://understat.com/league/La_liga/2026). Prueba su respuesta JSON y, cuando la web incluye los datos en HTML, extrae `teamsData`, `playersData` y `datesData` sin ejecutar JavaScript del origen. No elude captchas, autenticación ni bloqueos.

## Descargar y generar SQLite

Requiere Python 3.11+ con SQLite, sin paquetes externos:

```sh
python scripts/import_understat.py
```

Produce `dist/downloads/understat-laliga-2026-27.json` y `dist/downloads/understat-laliga-2026-27.sqlite.gz`. La base SQLite es gratuita, se puede abrir localmente y contiene `metadata`, `players`, `teams` y `matches`. Los archivos generados quedan fuera de GitHub; se sube el código que los genera.

Para reutilizar una respuesta JSON real ya descargada:

```sh
python scripts/import_understat.py --input /ruta/a/understat-laliga-2026.json
```

Con `--input`, la fecha de captura se toma del archivo o de `--captured-at`; nunca se presenta como una nueva descarga. El SHA de la respuesta normalizada queda en los metadatos. Una respuesta inválida o una descarga fallida no sustituye los archivos anteriores. JSON y SQLite se generan y validan en memoria antes de escribir; cada archivo se sustituye atómicamente, aunque la pareja no forma una transacción de filesystem.

## Métricas y cobertura

- Jugadores: goles, asistencias, tiros, minutos, xG, xA y pases clave de Understat. Conversión = goles / tiros × 100 y goles − xG. Por 90 = total × 90 / minutos; sin denominador válido se muestra `—`.
- Equipos: partidos, goles a favor y en contra, xG y xG recibidos; minutos nominales de equipo = partidos × 90.
- Partidos: fecha, equipos, marcador y xG de ambos equipos. Solo se agregan partidos finalizados de la temporada 2026/27; el calendario esperado tiene 380 partidos.
- Posición: agrupada a partir de los códigos de Understat. Los registros de jugadores con varios equipos conservan el agregado que entrega la fuente.
- La descarga de liga no aporta paradas, goles recibidos ni xG recibidos por portero, ni PSxG. Esos campos quedan `null`; no se reparten los xG de un equipo entre porteros ni se mezclan estadísticas de otro proveedor.

Se comprueban identificadores, números finitos, temporada, 20 equipos, cobertura, equilibrio de goles y coherencia de marcadores/xG entre partidos y equipos. Los valores ausentes permanecen `null`. No hay estadísticas de prueba en los archivos publicados.

## En la web

El selector ofrece «LaLiga · Understat (xG)», «LaLiga · ESPN» y el Mundial de StatsBomb. Cada conjunto mantiene su procedencia y fecha. Understat es la captura inicial cuando existe; la ficha, comparación, CSV y descargas usan el conjunto activo.

«Recargar captura Understat» carga el último archivo publicado de GRADA; **no ejecuta Python en Sites ni descarga Understat en directo**. Understat no permite esas peticiones desde este navegador mediante CORS. Para una nueva captura se ejecuta el importador y se publica la web. El botón de ESPN consulta directamente su API pública con CORS y actualiza la copia del navegador.

## Seguridad y comprobaciones

El origen y temporada de descarga son fijos, con límite de tamaño y tiempo, TLS verificado y sin credenciales del visitante. El JSON incrustado se decodifica como datos, sin `eval`. Las inserciones SQLite están parametrizadas. La interfaz escapa nombres, restringe enlaces de proveedores y neutraliza fórmulas en CSV; su CSP limita scripts y conexiones. La CSP en HTML no sustituye cabeceras HTTP ni una auditoría externa.

```sh
python -m unittest discover -s tests -p 'test_*.py'
node --test tests/metrics.test.cjs tests/laliga.test.cjs tests/security.test.cjs
python scripts/validate_data.py
```
