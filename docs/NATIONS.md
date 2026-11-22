# Nacionalidad publicada y selecciones teóricas

La vista **Selecciones** propone un once con jugadores de las ligas cargadas, comparando siete sistemas con puestos compatibles, contención y creación. Abre Todas las ligas y conserva la referencia común y el score individual de cada jugador. También admite `?vista=selecciones&pais=ESP` para abrir una selección directamente. No representa una convocatoria oficial, un ranking FIFA, una predicción de resultados ni toda la población de jugadores internacionales.

## País de cada jugador

La columna Nacionalidad muestra el **país deportivo publicado por FotMob**. Se conserva el código del proveedor, nombre original, identificador de selección, fuente, ID de jugador y club, liga, temporada, fecha y URL. No se deduce del nombre, nacimiento, equipo o país de la competición. Tampoco demuestra todas las ciudadanías ni elegibilidad internacional definitiva.

La primera incorporación reutiliza las 96 plantillas HTML guardadas el **14 de noviembre de 2026** y su manifiesto original. El parser comprueba club, liga, temporada, IDs únicos, formato del país y fecha; el generador comprueba tamaño y conserva SHA256 de cada captura. Se utiliza el cruce ya verificado con FotMob; un parecido de nombre no asigna un país. Los códigos FIFA/proveedor se traducen a etiquetas españolas mediante un mapa a ISO, sin usar ese mapa para decidir la nacionalidad de nadie. Inglaterra, Escocia, Gales e Irlanda del Norte se mantienen separados.

| Liga | Fichas FotMob enriquecidas | Fichas combinadas con país | Fichas combinadas |
| --- | ---: | ---: | ---: |
| LaLiga | 450 | 440 | 487 |
| Premier League | 445 | 445 | 454 |
| Serie A | 479 | 479 | 496 |
| Bundesliga | 388 | 388 | 417 |
| Ligue 1 | 382 | 382 | 430 |
| Total | 2.144 | 2.134 | 2.284 |

Diez fichas del complemento FotMob de LaLiga no tienen un cruce inequívoco con el catálogo principal: no se fuerza su unión. Hay 150 fichas combinadas sin país verificado y se muestran con guion. Con esta cobertura se agrupan **104 países**. La versión inicial 4-4-2 completaba 16 onces; el modelo de sistemas coherentes completa **17 onces** sin cambiar datos o scores de jugadores. La cobertura limitada puede impedir un once aunque esa selección real tenga muchos futbolistas fuera de estas ligas.

Las fichas individuales consultadas por la actualización general también extraen el país publicado, tras verificar ID y club. Se reutiliza la misma página, sin nuevas solicitudes. Un agregado nuevo que no lo publique conserva el dato anterior para el mismo ID, club, liga y temporada; un país de una ficha más reciente puede reemplazarlo. Fechas y fuentes de cada campo permanecen separadas de las estadísticas.

## Once y score teórico

Método `national_xi_balanced_minutes_v2`, en `dist/formations.js` y `dist/nations.js`:

1. Solo participan jugadores con país verificado, score conocido —incluido cero— y el mínimo común de 200 minutos. El score procede de `GradaScores`, con su posición/perfil, disciplina y muestras originales; no se recalcula frente a los jugadores de ese país.
2. Se comparan **4-3-3, 4-2-3-1, 4-4-2, 4-3-1-2, 3-5-2, 3-4-2-1 y 4-2-2-2**. Todos tienen un portero, centrales, cobertura de ambas bandas mediante extremos/medios o laterales/carriles, contención, creación y al menos un delantero centro. Los sistemas estrechos tienen laterales; los de tres centrales tienen dos carriles. No se completan onces desplazando un extremo RW al puesto ST.
3. Cada puesto exige evidencia compatible. La contención admite un MED con CDM publicado, o CM publicado y perfil estadístico defensivo. El interior exige CM. El interior creativo exige CM y CAM publicado o perfil ofensivo/equilibrado. El mediapunta admite CAM publicado en un MED/DEL, o un MED con CM y perfil ofensivo. Los apoyos por perfil se etiquetan como **encaje teórico**, no como posición observada. Un perfil sin puesto publicado no inventa una banda ni un lateral. El delantero centro exige posición canónica DEL y ST publicado. Izquierda/derecha se verifican en bandas/carriles; no se afirma un lado de los interiores o centrales.
4. Se elige la **mayor suma de scores individuales** compatible con cada sistema mediante asignación bipartita (algoritmo húngaro). Los puestos vacíos tienen un coste que prioriza completar el once; un jugador incompatible nunca sustituye un hueco. Una persona no puede ocupar dos puestos, aunque sea polivalente. Con las mismas personas elegidas se reasignan los puestos por afinidad: por ejemplo, priorizar perfil defensivo en contención y perfil ofensivo en creación. Esta segunda pasada no cambia personas, scores o minutos. Un empate entre posibles plantillas sigue orden estable por score, minutos, nombre e ID.
5. Cada uno de esos siete onces completos recibe su media ponderada por minutos de club y se elige el de **mayor score teórico**. En empate hasta 1e-12 se priorizan suma de scores, minutos y orden fijo de sistemas. No se optimiza directamente el promedio cambiando un titular por otro de menor score y pocos minutos: eso podría inflar el promedio reduciendo el peso de una posición débil. La optimización de jugadores y la elección entre los siete onces son pasos distintos y explícitos.
6. Cada ID FotMob aparece como máximo una vez. Si existe en varias ligas, se conserva la ficha de más minutos, sin sumar muestras ni elegir su mejor score. Si sus fichas declaran países diferentes, se excluye esa identidad y se informa del conflicto. La regla protege futuras actualizaciones; en las fichas actualmente enriquecidas no hay duplicados o conflictos.

`score teórico = Σ(score del titular × minutos de club) / Σ(minutos de club)`

Se promedia **solo el once elegido**, con el mismo criterio de minutos de los scores de equipo. Los minutos son los de sus fichas de club: no se presentan como minutos internacionales ni como los 90 de un partido imaginario. La selección del once, sus integrantes, prueba de encaje, perfil del score y sistemas alternativos se pueden consultar en el detalle desplegable.

El puesto propuesto no modifica la posición canónica ni el score. Un MED con LW publicado puede ser extremo, o un DEL con CAM publicado puede ser mediapunta, conservando su puntuación original; el detalle separa **puesto propuesto**, **encaje** y **perfil del score**. Las medias por líneas agrupan los puestos del sistema: los carriles se incluyen en defensa. El denominador y el número de puestos varían con el dibujo, y se muestran siempre.

Sin once completo, el score global queda desconocido. Se muestra la propuesta con más plazas cubiertas, después mayor suma de scores/minutos y orden estable, con sus huecos. No se rellena con ceros ni se compara una media parcial con once jugadores. Cada bloque completo muestra el promedio de sus titulares; un bloque incompleto queda pendiente.

Los escudos de las tarjetas son los **clubes de los jugadores**, resueltos por ID y ámbito con `GradaBranding.playerClub`, usando imágenes locales. Un club sin imagen o asignación inequívoca conserva su fallback; no se atribuye un escudo por nombre parecido. El nombre del club queda accesible y en el desglose.

El ranking muestra primero el score y inicialmente solo onces completos. Se pueden incluir los incompletos y abrir cualquier país. Las fichas de los titulares conservan el mismo score que las tablas y rankings de jugadores. Las lesiones, convocatorias, minutos por banda, química, calidad de los rivales y partidos internacionales no forman parte del modelo.

## Reproducir y validar

El manifiesto `results.json` contiene por captura `league`, `team`, `ok`, `bytes` y `captured_at`. Nunca se sustituye la fecha original por la del enriquecimiento. Preparar en un directorio con las once capturas de proveedores y validar antes de publicar:

```sh
python scripts/enrich_nationalities.py --input-root /ruta/plantillas-guardadas --data-dir /ruta/staging
node scripts/build_combined.cjs --league laliga --data-dir /ruta/staging
# Repetir build_combined para las otras cuatro ligas en ese mismo staging.
node --test tests/*.test.cjs
python scripts/build_worker.py
```

El wrapper prepara los cinco JSON y cinco SQLite gzip antes de promover archivos individualmente. No es una transacción de diez archivos: la publicación se hace después de comprobar todo el conjunto. SQLite conserva el país en `players.stats_json` y su procedencia en `metadata`; no modifica los valores de las columnas estadísticas. `enrich_nationalities.cjs` permite preparar únicamente JSON.

Se contrastaron las estadísticas anteriores con las nuevas eliminando solo los campos de nacionalidad: permanecen idénticos fútbol, posiciones, fechas, los 2.284 scores/perfiles y los promedios de equipo. No se descargaron partidos ni estadísticas nuevas. Código y generadores se versionan; capturas, datos y SQLite permanecen fuera de GitHub. [Incorporación de nacionalidades](../loop/tasks/20261122-codex-nationalities-and-national-teams.md) y [sistemas coherentes y escudos](../loop/tasks/20261122-codex-balanced-national-lineups.md).
