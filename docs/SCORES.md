# Score único por jugador y perfil; promedios de equipo

Definición actualizada el 17 de noviembre de 2026, modelo `role_radar_area_v3`. Sustituye el score MED general usado para todos los perfiles desde el 9 de noviembre. El modelo común es `dist/scores.js`; tablas, tarjetas, fichas, comparador, filtros y generador consumen sus resultados.

## Jugadores

Cada jugador tiene un único score. Primero se resuelve su posición con las fuentes: POR, DEF, MED o DEL. En MED se resuelve además su perfil estadístico y se eligen los ejes correspondientes antes de calcular el score. La posición usa consenso entre proveedores y, sin acuerdo, la ficha FotMob cuando existe; conserva alternativas y procedencia según [COMBINED.md](COMBINED.md). No se cambia la posición para obtener un score mejor. La referencia usa jugadores de esa misma posición de todas las ligas cargadas, conservando fuente y denominadores por métrica. Seleccionar una liga o ranking solo filtra candidatos; no cambia el perfil, los ejes o el score. Una actualización de cifras o referencias sí puede cambiarlos.

`radar.js` selecciona hasta seis ejes comunes por posición/perfil. Cada eje requiere cinco referencias suficientes de la posición amplia: todos los MED con muestra válida son referencia de los ejes MED, no solo los candidatos visibles de un subgrupo. Los percentiles usan rango medio para empates y se invierten cuando menos es mejor. El score es el área relativa del polígono: `media(r[i] × r[i+1])`, con `r = percentil / 100` y cierre del último eje con el primero. Está entre 0 y 1 y describe rendimiento relativo según esos ejes; scores de perfiles distintos no representan una misma habilidad física ni una probabilidad.

Solo hay score cuando existen al menos tres ejes, todos los ejes comunes tienen valor y tanto el jugador como cada métrica cumplen la muestra fija: 450 minutos en campo; 180 en porteros, o 2 PJ si su proveedor no publica minutos. La alternativa de 2 PJ no acredita un filtro adicional de 900 minutos. Un radar parcial puede dibujarse, pero su área parcial no se publica como score ni contribuye a equipos. La tabla y el radar explican si faltan métricas y qué fuente no cumple sus minutos propios. El modo total/90 y los filtros no cambian el score. Un valor publicado cero, incluido un score exactamente cero, es válido en tablas, rankings y ponderaciones. Un campo ausente o un cociente con denominador cero permanece desconocido y no se sustituye por cero.

Los ejes mantienen la definición y cobertura de `metrics.js`. En porteros, Eficacia vs xGOT usa los goles emparejados con esa misma muestra y sustituye el eje de goles evitados para evitar duplicidad. No se atribuye xG de equipo a un portero.

## Perfiles de centrocampistas

Desde el 14 de noviembre, los dos índices auxiliares de acciones ofensivas y defensivas se convierten en percentiles de sus respectivas distribuciones MED, con referencia común y mínimos fijos. Una diferencia de hasta 10 puntos percentiles se considera equilibrada; por encima, domina el percentil mayor. La regla de clasificación no cambia el 17 de noviembre. Este umbral descriptivo no es un intervalo de confianza.

La corrección del 17 de noviembre hace que ese perfil determine los ejes del score mostrado. No se calculan scores alternativos para elegir el mayor ni se sustituye el score al abrir otro ranking.

| Perfil MED | Ejes del score, en el orden del polígono |
| --- | --- |
| Ofensivo | xA/90, ocasiones creadas/90, grandes ocasiones creadas/90, tiros a puerta/90, regates logrados/90, goles/90 |
| Defensivo | pases completados/90, precisión de pase, recuperaciones/90, entradas/90, intercepciones/90, pases rompelíneas/90 |
| Equilibrado | pases completados/90, xA/90, ocasiones creadas/90, recuperaciones/90, entradas/90, intercepciones/90 |
| Sin perfil verificable | General explícito: conserva los ejes generales anteriores (pases completados/90, precisión, xA/90, recuperaciones/90, entradas/90 e intercepciones/90 con las capturas actuales) |

Sin ambos índices completos, el perfil es desconocido: no se atribuye ofensivo/defensivo por intuición. Puede tener un score general si sus propios ejes tienen muestra y datos suficientes, pero no entra en los rankings de subgrupos. Los equilibrados tienen ranking propio y pueden aparecer en ambos grupos, siempre conservando su score equilibrado. La tabla reúne los ejes de los perfiles presentes y muestra qué perfil produce cada score; no toma los ejes del primer MED de la captura.

No se infiere una posición táctica real a partir de estadísticas. Álex Baena sigue MED por acuerdo ESPN/FotMob frente a DEL Understat, con esa discrepancia visible. Su perfil ofensivo selecciona un radar ofensivo: con las capturas actuales, score 0,751949 frente al anterior 0,174481. No se han descargado cifras nuevas para obtener ese cambio. Los centros del campo de equipos muestran además el número de MED sin perfil verificable.

Los filtros de puesto publicado —centrales, laterales, pivotes, interiores y otros— usan evidencia explícita de FotMob, conservan la posición canónica y no alteran el score. [Definiciones, cobertura y límites](ROLES_METRICS.md).

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

`scores.build` calcula índices, perfil y score en ese orden; `scores.value`, `scores.eligible` y `scores.rankingAxes` resuelven rankings y columnas. `squads.js` produce los promedios y sus contribuciones con el perfil del score utilizado. `withScores` añade `playerScore`, `scorePosition`, `scoreProfile`, `scoreProfileLabel`, `midfieldProfile` y scores/ledgers de equipo al JSON combinado. El modelo se identifica como `role_radar_area_v3` en `metadata.derived_metrics.playerScore`.

El generador lee las capturas verificadas de las ligas disponibles para compartir referencia. En una importación por etapas, `--reference-dir` aporta las otras ligas, y `import_leagues.py` recalcula todos los derivados tras completar las fuentes. No actualiza las fechas originales por recalcular scores. Todas las ligas descarta derivados anteriores y usa el modelo común. En el navegador, el modelo se invalida al cambiar una captura, no al cambiar de vista.

```sh
node scripts/build_combined.cjs --league laliga
python scripts/build_worker.py
node --test tests/*.test.cjs
```

El Worker empaqueta HTML con hashes en las URLs de scripts y CSS para que cada publicación cargue módulos de una misma versión. Las capturas iniciales se solicitan sin reutilizar la caché del navegador; los refrescos conservan su validación y respaldo. No se añaden secretos, permisos ni escrituras públicas. Las capturas, JSON/SQLite y Worker generado siguen fuera de GitHub.

La auditoría de la revisión de nombres y posiciones, sus jugadores recuperados y los pendientes reales están en [SCORE_REVIEW.md](SCORE_REVIEW.md).
