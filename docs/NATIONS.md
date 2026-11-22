# Nacionalidad publicada y selecciones teóricas

La vista **Selecciones** propone un once 4-4-2 con jugadores de las ligas cargadas. Abre Todas las ligas y conserva la referencia común y el score individual de cada jugador. También admite `?vista=selecciones&pais=ESP` para abrir una selección directamente. No representa una convocatoria oficial, un ranking FIFA, una predicción de resultados ni toda la población de jugadores internacionales.

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

Diez fichas del complemento FotMob de LaLiga no tienen un cruce inequívoco con el catálogo principal: no se fuerza su unión. Hay 150 fichas combinadas sin país verificado y se muestran con guion. Con esta cobertura se agrupan **104 países** y se pueden completar **16 onces**. La cobertura limitada puede impedir un once aunque esa selección real tenga muchos futbolistas fuera de estas ligas.

Las fichas individuales consultadas por la actualización general también extraen el país publicado, tras verificar ID y club. Se reutiliza la misma página, sin nuevas solicitudes. Un agregado nuevo que no lo publique conserva el dato anterior para el mismo ID, club, liga y temporada; un país de una ficha más reciente puede reemplazarlo. Fechas y fuentes de cada campo permanecen separadas de las estadísticas.

## Once y score teórico

Método `national_xi_442_minutes_v1`, en `dist/nations.js`:

1. Solo participan jugadores con país verificado, score conocido —incluido cero— y el mínimo común de 200 minutos. El score procede de `GradaScores`, con su posición/perfil, disciplina y muestras originales; no se recalcula frente a los jugadores de ese país.
2. Se elige un POR; cuatro DEF con puestos publicados: LB/LWB, dos CB y RB/RWB; cuatro MED y dos DEL. Los cuatro centrocampistas no reciben bandas o funciones tácticas inventadas. Un delantero no se recoloca como MED para completar el dibujo.
3. Los defensas polivalentes se asignan a puestos distintos con un emparejamiento que prioriza cubrirlos y después maximiza la suma de sus scores. Evita la selección voraz que podría dejar sin central al asignar un CB/LB al lateral. Los otros grupos eligen los scores más altos; empates usan minutos y orden estable.
4. Cada ID FotMob aparece como máximo una vez. Si existe en varias ligas, se conserva la ficha de más minutos, sin sumar muestras ni elegir su mejor score. Si sus fichas declaran países diferentes, se excluye esa identidad y se informa del conflicto. En las fichas actualmente enriquecidas no hay duplicados o conflictos; sí existen IDs repetidos entre los registros de proveedor y la regla protege futuras actualizaciones.

`score teórico = Σ(score del titular × minutos de club) / Σ(minutos de club)`

Se promedia **solo el once elegido**, con el mismo criterio de minutos de los scores de equipo. Elegir jugadores por score y puesto no implica maximizar matemáticamente ese promedio ponderado. Los minutos son los de sus fichas de club: no se presentan como minutos internacionales ni como los 90 de un partido imaginario. La selección del once, sus integrantes y el denominador se pueden consultar en el detalle desplegable.

Sin once completo, el score global queda desconocido; no se rellena con ceros ni se compara una media parcial con once jugadores. Los bloques completos de portería, defensa, centro del campo y delantera muestran su propio promedio de los titulares elegidos. Un bloque incompleto también queda pendiente.

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

Se contrastaron las estadísticas anteriores con las nuevas eliminando solo los campos de nacionalidad: permanecen idénticos fútbol, posiciones, fechas, los 2.284 scores/perfiles y los promedios de equipo. No se descargaron partidos ni estadísticas nuevas. Código y generadores se versionan; capturas, datos y SQLite permanecen fuera de GitHub. [Tarea y entrega](../loop/tasks/20261122-codex-nationalities-and-national-teams.md).
