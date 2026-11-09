# Score único por posición y promedios de equipo

Definición vigente desde el 9 de noviembre de 2026. El modelo común es `dist/scores.js`; tablas, tarjetas, fichas, comparador, filtros y generador consumen sus resultados.

## Jugadores

Cada jugador tiene un único score para su posición publicada: POR, DEF, MED o DEL. No se recalcula al abrir otro ranking. La referencia usa los jugadores de todas las ligas cargadas, conservando fuente y denominadores por métrica. Seleccionar una liga solo filtra candidatos; el aviso de referencia indica cuántas ligas participan. Una actualización de las cifras propias o de las referencias sí puede cambiar los scores.

`radar.js` selecciona hasta seis ejes comunes por posición. Cada eje requiere cinco referencias suficientes. Los percentiles usan rango medio para empates y se invierten cuando menos es mejor. El score es el área relativa del polígono: `media(r[i] × r[i+1])`, con `r = percentil / 100` y cierre del último eje con el primero. Está entre 0 y 1 y describe rendimiento relativo a su posición.

Solo hay score cuando existen al menos tres ejes, todos los ejes comunes tienen valor y tanto el jugador como cada métrica cumplen la muestra fija: 450 minutos en campo; 180 en porteros, o 2 PJ si su proveedor no publica minutos. La alternativa de 2 PJ no acredita un filtro adicional de 900 minutos. Un radar parcial puede dibujarse, pero su área parcial no se publica como score ni contribuye a equipos. El modo total/90 y los filtros no cambian el score.

Los ejes mantienen la definición y cobertura de `metrics.js`. En porteros, Eficacia vs xGOT usa los goles emparejados con esa misma muestra y sustituye el eje de goles evitados para evitar duplicidad. No se atribuye xG de equipo a un portero.

## Perfiles de centrocampistas

Todos conservan el score MED. Dos índices auxiliares, calculados sobre sus acciones ofensivas y defensivas con las mismas referencias y mínimos, seleccionan el perfil estadístico dominante. Ofensivo si su índice ofensivo es mayor; defensivo si el defensivo es mayor. Diferencias inferiores a `1e-12` se consideran equilibradas y permiten aparecer en ambos grupos. Sin ambos índices completos, el perfil es desconocido.

Estos índices no se presentan como otro Score de jugador ni sustituyen su radar MED. Los rankings de ambos grupos se ordenan por su score MED. No se infiere una posición táctica real a partir de estadísticas. Los centros del campo de equipos muestran además el número de MED sin perfil verificable.

## Equipos

Todos los scores de equipo se calculan con los mismos scores individuales de posición:

`score del bloque = Σ(score de jugador × minutos publicados) / Σ(minutos publicados)`

Solo participan scores válidos con minutos positivos y asignación al equipo por ID. Un cero publicado válido participa. Un score o unos minutos ausentes no se sustituyen por cero. La cobertura y la ficha muestran pendientes, minutos, pesos y contribuciones con precisión completa.

| Score | Jugadores incluidos |
| --- | --- |
| General | Toda la plantilla con score y minutos válidos |
| Portería | POR |
| Defensa | DEF |
| Centro del campo | MED |
| Delantera | DEL |
| Ataque | DEL y MED de perfil ofensivo o equilibrado |
| Centro del campo ofensivo | MED de perfil ofensivo o equilibrado |
| Centro del campo defensivo | MED de perfil defensivo o equilibrado |

Un jugador se cuenta una sola vez en cada promedio. El score de un bloque está entre el mínimo y máximo de sus contribuyentes. El radar de equipo dibuja las medias de POR/DEF/MED/DEL; la cifra central es el mismo promedio general mostrado en la tabla. Ya no existe un segundo score de defensa/ataque calculado con estadísticas agregadas del equipo. Goles, xG, porterías a cero y otras estadísticas de equipo siguen disponibles como KPI, con sus propias fuentes.

Los rankings de equipo requieren inicialmente 5 PJ. Cambiar ese filtro no cambia los scores ni los pesos. Los equipos sin score siguen visibles en las tablas con guion y sin puesto; las tarjetas de líderes requieren un score conocido.

## Totales de liga

Los paneles suman únicamente valores publicados finitos. Una ausencia ya no oculta todos los valores conocidos: se muestra el subtotal parcial y `con dato / registros`. Si no hay ningún valor conocido, se conserva el guion; un cero real sí se muestra. Las paradas incluyen los registros POR y cualquier otro registro con paradas publicadas. No se añaden las cifras de dos fuentes para el mismo jugador.

Con las capturas publicadas al preparar este cambio hay 1.029 asistencias conocidas (2.281/2.284 registros) y 3.048 paradas (131/136 registros elegibles) en Todas las ligas. Son sumas de la cobertura importada, no una declaración de temporada completa.

## Artefactos y reproducción

`scores.build` calcula el modelo; `scores.value` y `scores.eligible` resuelven rankings. `squads.js` produce los promedios y sus contribuciones. `withScores` añade `playerScore`, `scorePosition`, `midfieldProfile` y scores/ledgers de equipo al JSON combinado. El modelo se identifica como `position_radar_area_v2` en `metadata.derived_metrics.playerScore`.

El generador lee las capturas verificadas de las ligas disponibles para compartir referencia. En una importación por etapas, `--reference-dir` aporta las otras ligas, y `import_leagues.py` recalcula todos los derivados tras completar las fuentes. No actualiza las fechas originales por recalcular scores. Todas las ligas descarta derivados anteriores y usa el modelo común. En el navegador, el modelo se invalida al cambiar una captura, no al cambiar de vista.

```sh
node scripts/build_combined.cjs --league laliga
python scripts/build_worker.py
node --test tests/*.test.cjs
```

El Worker empaqueta HTML con hashes en las URLs de scripts y CSS para que cada publicación cargue módulos de una misma versión. Las capturas iniciales se solicitan sin reutilizar la caché del navegador; los refrescos conservan su validación y respaldo. No se añaden secretos, permisos ni escrituras públicas. Las capturas, JSON/SQLite y Worker generado siguen fuera de GitHub.
