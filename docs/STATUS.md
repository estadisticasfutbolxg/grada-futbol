# Estado comprobado de GRADA

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

La lectura de `main` el 31 de octubre de 2026 solo mostró `.gitignore`, en el commit `d73f0123d12fe33eb23cbc62cabff0c3760c8909`. Esta entrega se prepara en la rama `docs/colaboracion`, creada desde ese commit. Incluye las skills, documentación, plantillas y validadores. El código de la web y sus datos aún deben incorporarse mediante GRADA-001; las cifras de la sección anterior describen la copia local completa, no los archivos presentes en esta rama.

El PR de colaboración y su estado se consultan en GitHub. No consta revisión de otra persona, merge ni URL publicada en el momento de preparar esta entrega. La existencia del workflow de Pages no demuestra que se haya configurado o ejecutado. No se ha activado protección de ramas, CODEOWNERS ni invitado al segundo colaborador.

## Próximo paso

Primero [subir y verificar el proyecto](../loop/tasks/GRADA-001-bootstrap-repository.md). Después ambas personas pueden clonar la misma base, asignarse tareas diferentes y empezar el [loop](../loop/README.md). El paquete de entrega puede usarse para la carga manual cuando la conexión de escritura no funcione.

Actualiza este documento solo al cambiar hechos compartidos del proyecto; el avance de cada iteración se registra en la ficha de su tarea. Los datos anteriores son una comprobación fechada, no una lectura continua de GitHub.
