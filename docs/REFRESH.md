# Actualización general y scores

La web se sirve en el mismo proyecto Sites mediante un Worker. El generador `scripts/build_worker.py` empaqueta los archivos HTML/CSS/JS y las capturas reales comprimidas en `dist/server/index.js`. Ese archivo incluye datos y está ignorado por Git. El manifiesto conserva project_id y no declara static. No se añaden bases alojadas, credenciales, permisos ni cuentas externas.

## Botón Actualizar datos

El botón consulta ESPN, FotMob y, en LaLiga, Understat. Todas las ligas procesa las cinco competiciones con concurrencia limitada. ESPN conserva su adaptador de clasificación/plantillas. El servidor consulta los rankings HTML y las fichas de FotMob y los datos públicos de Understat, sin ejecutar JavaScript de las fuentes.

Solo se aceptan rutas, competiciones y jugadores de plantillas verificadas. Las consultas son GET de lectura, no admiten URLs arbitrarias, rechazan orígenes cruzados y métodos de escritura, limitan tamaño/tiempo y permiten redirecciones únicamente dentro del mismo host HTTPS. Caché: 5 minutos para consultas de fuente, 1 hora para fichas y 2 minutos para fallos, con deduplicación. La última respuesta válida se conserva separada de los fallos.

La caché de servidor con nombre es opcional; Sites puede denegar Cache API. No se consulta caches.default. Ante una denegación se usa memoria por instancia, limitada a 16 MiB/256 entradas, con caducidad y descarte de entradas antiguas. Una instancia nueva puede perder esa memoria y volver a las capturas publicadas. La lectura de esas capturas no depende de disponer de caché.

El navegador valida fuente, ID, club, temporada, fechas y cobertura antes de combinar. Guarda capturas válidas en IndexedDB; conserva los datos de las fuentes y fichas que fallen, con sus fechas y denominadores originales. La clasificación y los filtros siguen utilizables durante la consulta. Los datos individuales publicados permanecen como capturas de respaldo. La copia de cada navegador puede contener una actualización más reciente que la del paquete inicial.

Al finalizar se abre un resumen por liga: jugadores con cambios, nuevos y retirados, con lista de nombres/equipos, y cobertura de partidos por proveedor. Cada jugador combinado cuenta una vez en su liga aunque lo consulten varias fuentes. Se comparan valores y contextos estadísticos; una fecha de captura o URL nueva no cuenta por sí sola. El resumen indica las fichas verificadas y las que conservan datos anteriores. Las fuentes fallidas no se cuentan como actualizadas.

ESPN/FotMob no proporcionan una lista de partidos en estos adaptadores: se informa de su recuento de temporada y variación de cobertura, que no equivale a partidos individualmente modificados. Understat permite comparar encuentros por ID y listar nuevos/modificados, incluidos cambios de marcador o xG. Un recuento no disponible permanece desconocido. Las fuentes no se suman entre sí para contar partidos. El resumen corresponde a la última actualización de esa sesión y se limpia al cambiar de liga.

## Score de jugador y de equipo

Score de jugador renombra el área normalizada del radar, entre 0 y 1, con referencia fija por posición/perfil y ámbito. La fórmula geométrica no cambia. Los rankings de una métrica concreta se ordenan por esa métrica; los rankings generales y las posiciones usan score. La actualización conserva la columna y dirección seleccionadas.

El score de equipo es `Σ(score_i × minutos_i) / Σ(minutos_i)`. Solo participan jugadores asignados al equipo por ID con score válido y minutos positivos publicados. No se imputan minutos ni scores ausentes. Se muestran jugadores ponderados/total, minutos utilizados, pesos y contribuciones. Un score cero válido participa; cero minutos no añade peso; sin participantes el resultado es null.

La misma ponderación se usa para Mejor delantera (DEL) y los centros del campo ofensivo/defensivo (MED_ATT/MED_DEF). Todas recalcula percentiles antes del promedio. Los filtros no cambian los pesos ni las referencias. Se conservan los índices específicos de ataque/defensa de equipo calculados a partir de sus propias estadísticas; no eran sumas de jugadores.

## Fichas FotMob y valores ausentes

Las fichas verificadas por ID y club añaden pases completados totales y otras cifras publicadas, además de posiciones amplias. Una ficha cuya competición/temporada no coincide puede aportar únicamente la posición explícita; sus estadísticas numéricas no se mezclan. Los intentos de pase no se reconstruyen de porcentajes redondeados. Los pases progresivos y rompelíneas siguen siendo conceptos distintos.

El mapa completo de tiros de un jugador puede completar los tiros a puerta cuando su recuento coincide con los tiros publicados. En porteros, el xG de tiros a puerta recibidos se suma únicamente cuando el mapa permite verificar la cobertura de paradas y goles sin autogoles. No equivale al xG previo de todos los tiros rivales ni al total de equipo.

## xGOT recibido y score del portero

Opta define goles evitados como xGOT recibido menos goles encajados, excluyendo autogoles. Véanse [la definición del modelo](https://www.statsperform.com/insights/introducing-expected-goals-on-target-xgot/) y [la explicación publicada en FotMob](https://www.fotmob.com/news/akm7eviorlg214sbuz28xtlp8/donnarumma-v-navas-are-psg-really-getting-a-goalkeeper-upgrade).

Se obtiene xGOT/PSxG como goles evitados publicados + goles encajados sin autogoles de la misma ficha. Los autogoles y la cobertura de todos los goles se verifican en el mapa. Si ese agregado no está disponible, se usa la suma por tiro únicamente cuando el recuento completo se comprueba. Se registra método, fecha, minutos, PJ, goles emparejados y autogoles excluidos. No se calcula a partir de cifras de ESPN ni del xG de equipo.

El eje Eficacia vs xGOT es `100 × (1 − goles_sin_autogoles / xGOT_recibido)`, con ambos componentes de esa misma muestra. Positivo significa menos goles recibidos que el modelo; cero coincide; negativo indica más. Se incorpora al score de porteros cuando hay cinco referencias suficientes y sustituye el eje de goles evitados para no contar dos veces el mismo componente. Con xGOT cero el cociente queda desconocido.

Los guiones de tablas y fichas explican su causa: dato ausente, definición diferente, minutos insuficientes, muestra xGOT no verificable o falta de ejes. Nunca se sustituyen automáticamente por cero.

## Generación reproducible

```sh
python scripts/import_leagues.py --all --profiles
python scripts/build_worker.py
node scripts/serve.mjs 8000
```

Python 3.11+ y Node 22+; sin paquetes adicionales. Para acceso a Internet desde Node, conserva el proxy/CA configurados en tu entorno. Con Node 24 puede utilizarse `NODE_USE_ENV_PROXY=1`.

Para reutilizar HTML real, `--input-root` mantiene los rankings/ESPN y `--profiles-root` lee `<liga>/<id>.html`, conservando mtime como fecha de captura. `scripts/enrich_fotmob.py` también se ejecuta por liga y regenera JSON/SQLite coherentes. `scripts/build_combined.cjs` incorpora los scores ponderados y sus contribuciones. Los datos, caches, bases y Worker generado quedan fuera de GitHub.

El servidor estático de Python permite revisar las capturas y la interfaz; las rutas de actualización de FotMob/Understat requieren el Worker. GitHub Pages sirve capturas estáticas y no ejecuta estos endpoints. Sites es el alojamiento principal.
