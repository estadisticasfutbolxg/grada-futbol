# Ligas combinadas, ámbito conjunto y rankings

> Definición vigente desde el 9 de noviembre: [score único por posición, referencia común, promedios de equipo y totales con cobertura](SCORES.md). Las definiciones anteriores de subperfiles, índices independientes, referencias por liga o sumas que aparezcan en el registro histórico quedan sustituidas por ese modelo.


> Actualización del 8 de noviembre: la interfaz usa Score de jugador; los scores de equipo/delantera/centrocampo son promedios ponderados por minutos. Se añade xGOT al score del portero y se retiran todos los enlaces de descarga. [Fórmulas, actualización general y fuentes actuales](REFRESH.md). Las descripciones de sumas y descargas de versiones anteriores que siguen abajo son históricas.


El selector ofrece únicamente **LaLiga, Premier League, Serie A, Bundesliga y Ligue 1 combinadas**, más **Todas las ligas**. Las opciones se habilitan al cargar y validar sus fuentes y comprobar cobertura en las mismas familias de métricas de jugadores y equipos. Una competición que no pase ese control no aparece como disponible.

## Capturas reales y modelos

Temporada fijada: 2026/27. Los identificadores de FotMob se obtuvieron de páginas públicas que confirman `2026/2027`; no se eligieron por aproximación a otra temporada.

| Liga | Equipos / calendario | FotMob liga / temporada | Fuente principal | Catálogo visible |
| --- | --- | --- | --- | --- |
| LaLiga | 20 / 380 | 87 / 38843 | Understat; ESPN y FotMob complementan | 487 |
| Premier League | 20 / 380 | 47 / 36781 | FotMob; ESPN complementa | 454 |
| Serie A | 20 / 380 | 55 / 36072 | FotMob; ESPN complementa | 496 |
| Bundesliga | 18 / 306 | 54 / 40040 | FotMob; ESPN complementa | 417 |
| Ligue 1 | 18 / 306 | 53 / 37298 | FotMob; ESPN complementa | 430 |

La suma es **2.284 fichas jugador/liga y 96 equipos**. La cobertura es parcial de temporada y de cada ranking; no todos los jugadores tienen todas las métricas. Understat conserva su captura real del 1 de noviembre. FotMob LaLiga reutiliza páginas de jugadores del 6 de noviembre y añade rankings de equipos consultados el 7; las otras ligas y ESPN se consultaron el 7 de noviembre. Cada campo guarda fecha y denominadores de origen. La fecha general conserva la consulta más antigua del conjunto, sin renovarla al calcular un área.

Understat devolvió mantenimiento («We will come back soon») durante las comprobaciones, también en LaLiga y temporadas anteriores. Por eso no se afirma una nueva descarga Understat para las otras ligas: sus xG/xA proceden de FotMob. Los modelos se mantienen identificados. Las ocasiones creadas FotMob permanecen separadas de los pases clave Understat; no se inventa una equivalencia entre definiciones. Los pases progresivos de StatsBomb tampoco se renombran desde los rompelíneas.

Se descargaron los 28 rankings de pase, defensa, ataque, disciplina y portería que se utilizaban en LaLiga, junto con xG/xA, goles/asistencias, tiros/90, clasificación y métricas de equipos. El importador procesa 42 páginas por cada nueva liga y 35 para el complemento FotMob de LaLiga. Los tiros totales y tiros a puerta totales se completan desde ESPN mediante coincidencias inequívocas; las tasas FotMob se conservan aparte, sin reconstruir recuentos redondeados.

`GradaCombined.coverage` comprueba 30 campos/familias de jugadores y 9 de equipos antes de habilitar una liga. Esto confirma disponibilidad de las métricas, no cobertura completa de cada ficha. Un jugador omitido en un ranking sigue con `null`, incluso en tarjetas o acciones cuyo valor podría ser cero; solo se añade cero si un proveedor lo publica.

## Todas las ligas

Se concatenan las fichas de las ligas disponibles, sin unir por nombre a jugadores de competiciones distintas. IDs de jugadores/equipos se prefijan por liga y se añade una columna **Liga**. Las fuentes y fechas de cada campo se copian desde su liga, incluidos los campos ESPN; una fecha global no sustituye a su procedencia.

Los percentiles se recalculan con la población conjunta seleccionada. No se ordenan áreas calculadas por separado en cinco ligas. Al volver a una liga, vuelve a calcularse su referencia local. Los filtros de tabla y el mínimo del ranking no cambian los percentiles: filtran candidatos de una referencia fija por perfil y ámbito.

Los modelos xG/xA pueden diferir por proveedor, especialmente entre LaLiga y las demás. El área es un índice estadístico relativo al conjunto, perfil y ejes, no una probabilidad o una valoración universal. Un jugador transferido puede tener más de una ficha de liga; no se mezclan sus periodos ni se atribuyen sus minutos de una competición a otra.

## Ocho rankings por área

La pestaña **Rankings por área** muestra inicialmente el área descendente, con los valores de los ejes en sus unidades exactas (/90, /PJ, porcentaje o ratio). La unidad de los ejes se conserva en tabla, ficha y CSV. Se puede buscar, filtrar, cambiar el mínimo y ordenar por otras columnas.

| Perfil | Ejes prioritarios | Mínimo inicial |
| --- | --- | --- |
| Delanteros | Goles/90, xG/90, tiros a puerta/90, xA/90, regates/90, conversión | 450 min |
| Porteros | Paradas %, paradas/PJ, goles recibidos/PJ (invertido), goles evitados/90, balones aéreos/90, acciones de líbero/90 | 180 min |
| Defensas | Entradas/90, intercepciones/90, despejes/90, bloqueos/90, recuperaciones/90, pase preciso/90 | 450 min |
| Centrocampistas: perfil defensivo | Pase preciso/90, acierto, recuperaciones/90, entradas/90, intercepciones/90, pases rompelíneas/90 | 450 min |
| Centrocampistas: perfil ofensivo | xA/90, ocasiones creadas/90, grandes ocasiones creadas/90, tiros a puerta/90, regates/90, goles/90 | 450 min |
| Equipos: ataque | Goles/PJ, xG/PJ, tiros a puerta/PJ, grandes ocasiones/PJ, goles/xG | 5 PJ |
| Equipos: defensa | Goles recibidos/PJ y xG recibidos/PJ (invertidos), porterías a cero/PJ | 5 PJ |
| Equipos: rendimiento global | Puntos/PJ, diferencia de goles/PJ, diferencia de xG/PJ, goles/PJ, goles recibidos/PJ (invertido), porterías a cero/PJ | 5 PJ |

Los dos perfiles de centrocampistas evalúan las acciones de los jugadores clasificados como MED. No inventan una posición detallada: un centrocampista puede aparecer en ambos. La posición amplia procede del proveedor; si falta en la fuente principal, se completa con ESPN solo cuando la identidad y el club coinciden de forma única y el rol portero/campo es coherente.

Se requieren al menos cinco referencias por eje y tres ejes. Los ejes se fijan por perfil y ámbito; los rankings de jugadores solo admiten candidatos con todos los ejes comunes. En equipos se mantienen visibles los índices pendientes, sin puesto al ordenar por ese índice. Las muestras mínimas se comprueban también en los denominadores de origen de los ejes. Cuando una fuente de portero no ofrece minutos, exige al menos dos PJ propios. Los índices incompletos pueden verse en una ficha como radar parcial; la tabla los muestra pendientes y el equipo conserva su área general de plantilla.

El área relativa es `sum(r[i] * r[(i+1) % n]) / n`, con `r = percentil / 100`. Su máximo es 1; todos los radios en P50 dan 0,25. Depende del orden y número de ejes. Los rangos de empate usan media; la ordenación utiliza precisión completa y muestra tres decimales.

Las tasas de equipos usan sus propios PJ. Las diferencias de goles y xG conservan el signo y exigen proveedor y cobertura compatibles en ambos términos. No se asigna xG del equipo a un portero.

## Actualización y descargas

- «Actualizar ESPN y combinar» consulta la liga seleccionada y valida todas sus plantillas, competición y temporada antes de sustituirla.
- «Actualizar ESPN · todas» consulta como máximo dos ligas simultáneamente, con tres plantillas por liga. Las ligas fallidas conservan sus capturas; se informa cuántas se actualizaron. Understat/FotMob conservan sus fechas.
- Las cachés ESPN se separan por liga; una respuesta de otra competición se rechaza aunque su temporada y número de equipos coincidan.
- Por liga se ofrecen JSON originales, combinado JSON, CSV filtrado y SQLite de FotMob; LaLiga conserva JSON/SQLite Understat. En Todas se ofrecen combinado JSON y CSV con la columna Liga y procedencia por campo. Las descargas originales se consultan eligiendo una liga.

El alojamiento es estático: el botón consulta ESPN desde el navegador, no ejecuta Python en Sites ni publica datos para otros visitantes. Regenerar y publicar una versión renueva las capturas de la web compartida.

## Código generador

Python 3.11+ y Node 18+, sin paquetes adicionales. El catálogo único es `dist/leagues.json`, consumido por JavaScript y los importadores.

```sh
python scripts/import_leagues.py --all
python scripts/import_leagues.py --league bundesliga
```

El proceso prepara cada liga en un directorio temporal, genera JSON/SQLite y valida el combinado y su cobertura antes de reemplazar cada archivo individualmente. Hay que publicar el conjunto después de que finalice; no se afirma una transacción de todos los archivos. Una fuente no disponible no se sustituye por fixtures. En modo `--all` se informa de ligas no disponibles y se continúa con las que pasan. Si ninguna pasa, el proceso falla. Una captura Understat existente se reutiliza con su fecha original durante el mantenimiento.

Se puede repetir una descarga real sin red mediante `--input-root /ruta/capturas`: cada subdirectorio `<liga>/` contiene los HTML con los nombres de `SPECS`, `CORE` y `TEAM_SPECS`; `<liga>/espn/` contiene `standings.json` y `roster-<id>.json`. Deben conservarse los tiempos originales de consulta. También se pueden ejecutar los importadores por separado con `--league`; el constructor `scripts/build_combined.cjs` admite `--league` y `--data-dir`.

Los datos y las bases están ignorados por GitHub. El repositorio distribuye su generador, validadores y pruebas. [FOTMOB.md](FOTMOB.md) y [COMBINED.md](COMBINED.md) detallan el origen y la unión inicial.

## Área general de equipo: suma de jugadores

Por petición expresa del usuario, **Área equipo (suma)** es la suma, a precisión completa, de las áreas válidas de posición (POR/DEF/MED/DEL) de todos los jugadores asignados al equipo por ID. No se promedian ni ponderan por minutos, ni se aplican los mínimos del ranking a esta suma. Cada área individual sigue entre 0 y 1; la suma de plantilla puede superar 1. La referencia corresponde a la liga o Todas seleccionadas. Cambiar de perfil, búsqueda o filtros no cambia la suma.

Se informa **Jugadores con área** como válidos/plantilla asignada y se conservan los pendientes. Un equipo sin ninguna área válida queda desconocido, no cero. Un área individual realmente cero sí se suma y cuenta como válida. No se asignan fichas agregadas de traspasos a un club por su nombre; los IDs duplicados se rechazan. La ficha y el JSON combinado incluyen las contribuciones exactas y su cobertura. El CSV conserva los valores y el origen derivado GRADA.

El usuario eligió mantener los índices específicos de ataque y defensa separados de la suma general. El ranking global y la tabla Equipos se ordenan inicialmente por la suma de plantilla; ataque y defensa se ordenan por su índice 0–1. Los equipos con índice incompleto permanecen visibles con — y el motivo, sin puesto al ordenar por ese índice. El radar de equipos llama **Índice del perfil** a su área normalizada.

Diagnóstico real: Racing Santander está unido entre Understat 293, ESPN 87 y FotMob 8696. Su ausencia en los antiguos rankings defensivo/global se debía a clean ausente, no a un nombre de equipo distinto. Se mantiene ese dato desconocido. LaLiga: suma 4,185619726674771 (4,186 visible), 16/25 áreas válidas y 9 pendientes. En Todas: 3,941190924696183, por recalcular la referencia conjunta. La búsqueda acepta «Racing de Santander» además del nombre publicado.

El inicio muestra bloques independientes de equipos ofensivos, mejores defensas de equipos y ambos perfiles de centrocampistas, con cinco candidatos válidos y accesos a cada ranking completo. Esos accesos limpian filtros anteriores para mostrar la clasificación completa del ámbito seleccionado.

## Defensas individuales y centros del campo por equipo

El inicio añade los mejores defensas individuales según DEF, área entre 0 y 1 y mínimo inicial 450 minutos, y dos bloques de equipos por centro del campo ofensivo y defensivo. Los rankings TEAM_MED_ATT/TEAM_MED_DEF suman las áreas válidas de MED_ATT/MED_DEF de todos los jugadores clasificados MED asignados al club por ID. No se incluyen DEF/DEL, no se infiere una posición táctica más detallada y un MED puede contribuir a ambos perfiles.

Las sumas pueden superar 1, no se ponderan ni limitan a titulares y muestran válidos/total MED, pendientes y contribuciones. Sin ninguna área válida el resultado es null; un área cero real cuenta. La referencia de cada perfil usa MED con 450 minutos propios por eje; el ranking de equipos empieza con 5 PJ y ese filtro no modifica la suma. Cambiar de liga a Todas recalcula los percentiles antes de sumar. Las áreas ofensiva/defensiva y sus coberturas aparecen también en la tabla Equipos y sus fichas; los índices de ataque/defensa/global se conservan.

Por nueva petición del usuario se retiran los controles CSV y JSON, tanto globales como por proveedor/combinado. Los JSON siguen generándose para cargar la web y reproducir los cálculos; no se han borrado datos. La interfaz conserva las descargas SQLite por liga. Las referencias a exportaciones CSV/JSON en secciones históricas describen las versiones anteriores.
