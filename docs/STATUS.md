# Estado comprobado de GRADA

## Actualización verificada · 6 de noviembre de 2026

- Web pública: [GRADA](https://grada-futbol-analitica.ivanmatema2.chatgpt.site), versión **6**, despliegue nativo `succeeded` a las 15:54 UTC. Incorpora FotMob a LaLiga y el área relativa del radar (0–1) en las tablas de jugadores, ordenable, filtrable y exportable.
- Código integrado mediante [PR #9](https://github.com/estadisticasfutbolxg/grada-futbol/pull/9), commit GitHub `19eece583d6051b88734938ee3d740057fee14cb`. Fuente desplegada en el repositorio Sites: `292cc182ef9c0b3d949f66fd0e22a7f046ad2c6f`; son repositorios distintos. Despliegue `appgdep_6aedf82aacd881918982fbf2aa7ed099`, versión `appgprj_6ae0b8b2eb1881918601230d00603255~appgver_cf3848c26a08819181f1e0bc5495490a`.
- FotMob: descarga real de 28 rankings HTML el 6 de noviembre, 20 equipos y 488 registros con minutos. Añade pase, defensa, tiros a puerta, regates, ocasiones, disciplina y portería, con cobertura distinta por ranking. [FOTMOB.md](FOTMOB.md) explica campos y unidades; no se fabrican totales a partir de tasas redondeadas ni ceros para ausencias.
- Combinado: catálogo Understat de 487 registros; 448 complementados, con 411 coincidencias ESPN y 429 FotMob. Prioridad Understat → ESPN → FotMob. Understat y ESPN conservan el 1 de noviembre; cada campo indica origen, PJ, minutos propios y fecha. StatsBomb mantiene sus 64 partidos reales del Mundial 2022.
- Los radares usan ejes comunes por posición, sin ataque para porteros. Cada gráfico muestra área respecto al polígono máximo. En la tabla solo se ofrece con todos los ejes comunes; se compara la misma posición y referencia, según [COMBINED.md](COMBINED.md). Los filtros no recalculan la referencia.
- Hosting estático: Python genera JSON/SQLite fuera de GitHub. Los botones ofrecen descargas; actualizar ESPN conserva las capturas publicadas de Understat y FotMob. No se ejecuta Python en Sites.
- Pruebas pasadas: sintaxis y pruebas JS, seis pruebas Python, integridad de 488 registros JSON/SQLite, validador StatsBomb, enlaces/skills y Chromium con métricas, área/orden/filtros/CSV, perfiles, actualización y fallos, vistas individuales y móvil. La descarga automática del enlace SQLite bajo el enrutamiento de QA se canceló; sus bytes se verificaron mediante fetch y Python. Las descargas Blob JSON/CSV se comprobaron.
- Acceso público conservado, sin invitaciones ni cambios de edición. Autocontrol sin revisión independiente del colaborador.

Evidencia en la [tarea de FotMob y área](../loop/tasks/20261106-codex-midfield-fotmob.md); las tareas [de porteros/Understat](../loop/tasks/20261101-codex-porteros-laliga.md), [tiros/ratios](../loop/tasks/20261106-codex-shots-ratios.md) y [combinado/radares/filtros](../loop/tasks/20261106-codex-combined-radars-filters.md) conservan el historial anterior.

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
