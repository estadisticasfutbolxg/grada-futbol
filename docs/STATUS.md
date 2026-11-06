# Estado comprobado de GRADA

## Actualización verificada · 6 de noviembre de 2026

- Web pública: [GRADA](https://grada-futbol-analitica.ivanmatema2.chatgpt.site), versión 4 desplegada con estado `succeeded`. Incluye tiros, goles/xG, asistencias/xA y xG recibidos por partido de portero cuando la fuente los aporta.
- Código integrado en GitHub mediante PR #1, #2, #3 y #4. El incremento de ratios está en el squash `e3fa04e18b2bc1fb4b324013bb0f6da870b297d9`. Su código desplegado en el repositorio de Sites corresponde a `b4541ec3efa022c20a7fdc13cda5263720240f8b`; son repositorios distintos.
- StatsBomb mantiene la captura real del Mundial 2022. Understat añade una captura del 1 de noviembre de LaLiga 2026/27: 105 partidos, 20 equipos y 487 jugadores. ESPN es un conjunto separado con su botón de consulta directa. Las fuentes y fechas aparecen en la web.
- La web es estática. Python se usa para generar los archivos, con código en GitHub y datos fuera de su historial. El botón de Understat recarga la captura publicada; no ejecuta Python en Sites.
- Las pruebas de métricas y navegador del incremento, incluida la vista móvil, pasaron. No se ha invitado a otra persona ni modificado permisos de edición. No consta una revisión independiente del colaborador.

Consulta las tareas [de porteros y Understat](../loop/tasks/20261101-codex-porteros-laliga.md) y [de tiros y ratios](../loop/tasks/20261106-codex-shots-ratios.md) para la evidencia.

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
