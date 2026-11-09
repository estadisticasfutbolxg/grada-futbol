# Estado comprobado de GRADA

## Publicación verificada · 9 de noviembre de 2026 · 12:15 Madrid

- [GRADA pública](https://grada-futbol-analitica.ivanmatema2.chatgpt.site), versión **14**, despliegue nativo `succeeded`. Mismas cinco ligas y permisos. Modelo común de [SCORES.md](SCORES.md): un score por POR/DEF/MED/DEL con referencia de las ligas cargadas, compartido por tabla, ranking, ficha, comparador y equipos. Seleccionar una liga no cambia los scores.
- Los perfiles MED ofensivo/defensivo seleccionan candidatos por perfil estadístico dominante; conservan score MED y no infieren una posición táctica. Se declaran los perfiles desconocidos. Una muestra insuficiente o un radar parcial mantiene el score pendiente en todas las vistas.
- Todos los scores de equipo usan exactamente los scores de sus jugadores ponderados por minutos. Defensa incluye DEF; delantera DEL; ataque DEL + MED de perfil ofensivo; medios usan su grupo MED correspondiente. El radar muestra medias por posición y el mismo promedio general. Con las capturas publicadas, Arsenal DEF = 0,191576, sustituyendo el anterior índice independiente 0,978555 en Todas.
- Asistencias/paradas ya muestran sumas conocidas y cobertura parcial: Todas suma 1.029 asistencias (2.281/2.284 registros) y 3.048 paradas (131/136 registros elegibles). Los datos ausentes no se convierten en cero ni ocultan todos los valores conocidos. Los módulos se versionan por hash al empaquetar para evitar mezclar publicaciones.
- [PR #23](https://github.com/estadisticasfutbolxg/grada-futbol/pull/23) integrado en `92add6d01aaf71cc7488162a5690ac6cfbdc0e63`, main comprobado. Fuente Sites `560ef3f2805b2fa5d5c61d3492fca7e6a495e7f8`. Versión `appgprj_6ae0b8b2eb1881918601230d00603255~appgver_7de3ac93d0048191b0860cf949258c57`; despliegue `appgdep_6af1ab44745081919f28881053efce61`. Worker SHA256 `998f4e83d2ea118688597d7dfc80e551e148e8d6b7a058e96da382e70aa5decf`.
- Once archivos Node, seis pruebas Python, sintaxis, documentación y validador StatsBomb correctos. Auditoría real de 1.390 promedios y 4.826 contribuciones; todos los scores individuales son iguales entre liga y Todas y los promedios quedan entre los scores contribuyentes. Chromium del Worker exacto verifica 66 cruces ranking/liga, valores, orden, Raphinha/Olise, MED entre vistas, Arsenal/radar, subtotales/cobertura, móvil y refrescos parcial/fallido con cachés denegadas. Autocontrol sin revisión independiente.
- No se descargan estadísticas nuevas. Se revisan 2.284 registros y 96 equipos con 452 partidos cubiertos en sus fuentes principales; 22 originales JSON/SQLite conservan SHA256. Se regeneran derivados: 967 scores válidos y 1.317 pendientes por muestra/ejes. Los datos mantienen sus fechas originales; los resultados de QA no se publican como datos nuevos. Evidencia y cierre en la [tarea de coherencia](../loop/tasks/20261109-codex-coherent-scores.md).

## Actualización anterior · 9 de noviembre de 2026 · v13

- [GRADA pública](https://grada-futbol-analitica.ivanmatema2.chatgpt.site), versión **13**, despliegue nativo `succeeded` a las 10:25 Madrid. Mismas cinco ligas, capturas y permisos de v12.
- Actualizar datos termina con un resumen por liga de jugadores nuevos/modificados/retirados y sus nombres/equipos. No cuenta fechas de consulta nuevas como modificaciones ni duplica jugadores entre proveedores. Se muestra cobertura de partidos por fuente y, con los registros Understat, los encuentros nuevos/modificados. Los agregados ESPN/FotMob no se presentan como partidos individualmente actualizados. Se informa de fichas incompletas y fallos conservados. La preferencia de informar al terminar futuras importaciones consta en AGENTS.md.
- [PR #21](https://github.com/estadisticasfutbolxg/grada-futbol/pull/21) integrado en `c16380b11b13e1b6b6a6fdad500d489e0215ce61`, main comprobado. Fuente Sites `113a7bd7fdbbbc27c6738f1b52d485aad707436d`. Versión `appgprj_6ae0b8b2eb1881918601230d00603255~appgver_23190f5aa6708191992b8db348574be3`; despliegue `appgdep_6af1918c14d481919c16112135340565`.
- Diez archivos Node, sintaxis, documentación y validador StatsBomb correctos. Chromium sobre el artefacto exacto verifica éxito, datos idénticos sin cambios, actualización parcial, fallo de todas las ligas, listas, cobertura, fichas conservadas, texto externo escapado y móvil sin desbordamiento, con ambas cachés denegadas. Sin errores de JavaScript; autocontrol sin revisión independiente.
- Esta entrega cambia la interfaz y el cálculo del resumen, sin importar datos nuevos ni modificar bases. Permanecen 2.284 registros jugador/liga y 96 equipos de las capturas de noviembre descritas debajo. Las respuestas reales guardadas usadas en QA se mantienen aisladas y no se publican como una actualización del 9. Detalles e identificadores en la [tarea del resumen](../loop/tasks/20261109-codex-refresh-report.md) y definiciones en [REFRESH.md](REFRESH.md).

## Actualización verificada · 8 de noviembre de 2026

- Web pública [GRADA](https://grada-futbol-analitica.ivanmatema2.chatgpt.site), versión **12**, despliegue nativo `succeeded` a las 20:16 Madrid. Selector combinado: LaLiga, Premier League, Serie A, Bundesliga, Ligue 1 y Todas las ligas. Audiencia pública e invitaciones conservadas.
- [PR #18](https://github.com/estadisticasfutbolxg/grada-futbol/pull/18) integrado en `d02de01d596b09ebf748dacf4daacf58fc54548b`: actualización de todas las fuentes, scores ponderados y xGOT. [PR #19](https://github.com/estadisticasfutbolxg/grada-futbol/pull/19) integrado en `75e9862567c651ffba1c9081e225bcec02a4296c`: corrige el selector tras la denegación de caché de Sites. main comprobado; sin bases, capturas ni Worker generado en GitHub.
- Fuente Sites v12 subida y comprobada: `6a95dd7ffc998d1c55e4428142ac4c6943b6d52e`. Versión `appgprj_6ae0b8b2eb1881918601230d00603255~appgver_d59b78eb94808191847c8da5ea89e336`; despliegue `appgdep_6af0ca68f4588191b8ff3ccb64115ec9`. Worker SHA256 `a32d0e17418e4950f309cb9b613f4756728ceff223572286e6410d2cda69ed44`. Sites y GitHub son repositorios distintos con el mismo código de producto; la publicación incluye las capturas reales ignoradas por Git.
- 2.284 fichas jugador/liga y 96 equipos: LaLiga 487, Premier 454, Serie A 496, Bundesliga 417 y Ligue 1 430. 30 familias/campos de jugadores y 9 de equipos verificados antes de habilitar cada liga. Cobertura parcial por temporada/ranking; ausencias como `null`.
- Descargadas realmente 2.285 fichas FotMob el 8 de noviembre; 2.194 aceptadas con contrato de ID/club/temporada. El combinado tiene 1.829 registros con pases completados y 128 porteros con xGOT atribuido. Una ficha de otra competición solo puede aportar posición explícita. Quedan 58 posiciones desconocidas y métricas sin respaldo, con explicación al pasar sobre el guion.
- Understat conserva LaLiga del 1 de noviembre y prioridad sobre ESPN/FotMob; sigue respondiendo mantenimiento durante esta entrega. ESPN conserva la captura del 7; los rankings FotMob proceden del 6/7 y las fichas añadidas del 8. No se presentan todos los campos como capturados el mismo día: cada uno conserva fuente, fecha, minutos y PJ propios.
- Score de jugador renombra el área normalizada entre 0 y 1. Referencias fijas por perfil/ámbito, mínimos iniciales 450/180 min o 5 PJ. Todas recalcula percentiles sobre el conjunto. Las tarjetas/selector muestran primero cinco rankings de jugadores y después seis de equipos; KPI por su métrica y rankings generales de posición por score. La actualización conserva el orden elegido.
- Score de equipo = promedio ponderado de scores de sus jugadores por minutos positivos publicados. La misma fórmula se aplica a Mejor delantera y centros del campo ofensivo/defensivo, con asignación por ID y perfil; no se imputan minutos ni scores ausentes. La ficha muestra cobertura, pesos y contribuciones. Se conservan los índices específicos de ataque/defensa de equipos. Racing sigue visible aunque le falte un índice específico.
- xGOT/PSxG recibido procede de goles evitados + goles encajados sin autogoles comprobados o de un mapa completo verificado de FotMob. El eje Eficacia vs xGOT usa goles emparejados de esa misma ficha y sustituye el eje de goles evitados para evitar duplicidad. Se mantiene separado del xG previo de tiros a puerta recibidos; ninguno se presenta como xG de todos los tiros rivales atribuido al portero.
- Retirados los controles CSV, JSON y SQLite. Actualizar datos consulta ESPN, FotMob y Understat donde corresponde, además de fichas verificadas, con límites y validación. Los fallos conservan datos/fechas anteriores en el navegador; no se publican escrituras de visitantes. El Worker del mismo Site sirve capturas y consultas de lectura; Python genera JSON/SQLite y empaqueta los artefactos fuera de GitHub. No se han añadido otras competiciones.
- La v11 usó caches.default, denegada en Sites: los logs confirmaron excepciones en las capturas y el usuario solo veía Ligue 1. V12 elimina ese acceso; la caché con nombre es opcional y puede caer a memoria limitada a 16 MiB/256 entradas. Las capturas se sirven incluso sin Cache API. Regresión con ambas cachés denegadas: cinco capturas 200 y seis opciones del selector.
- Validación: nueve archivos Node y seis pruebas Python, sintaxis, documentación, concordancia JSON/SQLite e integrity_check. Los lectores reproducen las cinco capturas originales FotMob y Understat; promedios/contribuciones verificados en 96 equipos. Validador StatsBomb: 64 partidos, 32 selecciones, 681 registros y 234.637 eventos coherentes, sin cambiar originales.
- Chromium sobre el Worker compilado verificó 66 cruces (11 rankings × seis ámbitos), KPI/score, delantera, contribuciones, porteros/xGOT, móvil, ausencia de descargas y actualización parcial 10/11 por mantenimiento de Understat. Otra comprobación del artefacto con caché denegada confirma la corrección. La prueba visual externa de producción queda limitada por el certificado del proxy en Chromium y el bloqueo 1010 del borde al cliente HTTP; no se desactiva TLS. El estado de publicación sí está confirmado por Sites. Los logs nativos posteriores confirman respuestas 200 sin excepciones para las capturas de las cinco ligas y sus proveedores en v12 (19:17 UTC, script 561a1052-84e2-416c-a921-6a953fa1535b).
- Autocontrol sin revisión independiente del colaborador. Evidencia y cierre en la [tarea de actualización general](../loop/tasks/20261108-codex-general-refresh-score.md). Reproducción y definiciones: [REFRESH.md](REFRESH.md) y [LEAGUES.md](LEAGUES.md).

Los registros anteriores están en las tareas de [defensas y centros del campo](../loop/tasks/20261107-codex-defenders-team-midfield.md), [Racing y tarjetas](../loop/tasks/20261107-codex-racing-squad-area.md), [ligas y rankings](../loop/tasks/20261107-codex-european-leagues.md), [identidad de Mbappé](../loop/tasks/20261107-codex-player-identity.md), [FotMob](../loop/tasks/20261106-codex-midfield-fotmob.md) y [combinado inicial](../loop/tasks/20261106-codex-combined-radars-filters.md).

## Registro histórico · 31 de octubre

Las comprobaciones siguientes describen la preparación original y no sustituyen la actualización anterior.

Última comprobación de la entrega de colaboración: 31 de octubre de 2026. Los datos importados registran `2026-10-30T13:22:21Z` (UTC).

## Copia local

- Web funcional en código: líderes, tablas, filtros, perfiles, comparación y CSV.
- Captura real de StatsBomb: 64 partidos, 32 selecciones, 681 registros de jugadores y 234.637 eventos.
- Los marcadores suman 172 goles. SQLite, gzip, SHA256 y concordancia de goles de porteros se comprobaron durante la importación.
- La nueva documentación incluye skills, un loop de tareas y validación local reutilizable. Pasaron los checks de estructura/enlaces y concordancia de datos; se probaron rechazos de archivos desincronizados, cobertura falsa y porcentajes incorrectos. Consulta las fichas de [tareas](../loop/tasks/README.md) para su estado.
- La revisión visual en navegador no se ha ejecutado en esta preparación.
- No hay PSxG ni goles evitados calculados. Las métricas ausentes se muestran como `—`.

## Remoto y publicación

Repositorio previsto: [estadisticasfutbolxg/grada-futbol](https://github.com/estadisticasfutbolxg/grada-futbol).

La lectura de `main` el 31 de octubre de 2026 solo mostró `.gitignore`, en el commit `d73f0123d12fe33eb23cbc62cabff0c3760c8909`. La entrega en `docs/colaboracion` incluye ahora las skills, documentación, plantillas, validadores, el código de la web y los generadores de SQLite. El usuario ha indicado que la base no se suba a GitHub: `dist/data.js` arranca vacío y los datos se generan localmente o en el workflow. Las cifras anteriores describen la captura local real; no son bases versionadas en esta rama.

El PR de colaboración y su estado se consultan en GitHub. No consta revisión de otra persona, merge ni URL publicada en el momento de preparar esta entrega. La existencia del workflow de Pages no demuestra que se haya configurado o ejecutado. No se ha activado protección de ramas, CODEOWNERS ni invitado al segundo colaborador.

## Próximo paso

Verificar el commit y revisar la ampliación del PR #1 con el código y los generadores. Tras integrarlo, ambas personas pueden clonar la misma base y ejecutar el importador de StatsBomb. La [tarea actual](../loop/tasks/20261031-codex-web-fbref.md) recoge el nuevo alcance sin bases en Git. La integración de FBref en la web sigue pendiente.

Actualiza este documento solo al cambiar hechos compartidos del proyecto; el avance de cada iteración se registra en la ficha de su tarea. Los datos anteriores son una comprobación fechada, no una lectura continua de GitHub.

## FBref · 31 de octubre de 2026

Se ha descargado y procesado una captura pública atribuida a FBref para LaLiga 2025/26: 22 tablas, 20 equipos con 38 partidos declarados, 611 registros estándar y 39 de porteros. CSV y SQLite están preparados localmente. [FBREF.md](FBREF.md) documenta el snapshot, los SHA y los campos ausentes. El generador se incluye en el código; los resultados no se suben a GitHub.
