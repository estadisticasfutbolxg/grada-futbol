# Estado comprobado de GRADA

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
- Chromium sobre el Worker compilado verificó 66 cruces (11 rankings × seis ámbitos), KPI/score, delantera, contribuciones, porteros/xGOT, móvil, ausencia de descargas y actualización parcial 10/11 por mantenimiento de Understat. Otra comprobación del artefacto con caché denegada confirma la corrección. La prueba visual externa de producción queda limitada por el certificado del proxy en Chromium y el bloqueo 1010 del borde al cliente HTTP; no se desactiva TLS. El estado de publicación sí está confirmado por Sites. Los logs consultados tras v12 aún no contenían peticiones nuevas.
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
