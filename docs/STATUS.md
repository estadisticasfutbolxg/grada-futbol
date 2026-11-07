# Estado comprobado de GRADA

## Actualización verificada · 7 de noviembre de 2026

- Web pública [GRADA](https://grada-futbol-analitica.ivanmatema2.chatgpt.site), versión **8**, despliegue nativo `succeeded` a las 09:15 Madrid. Selector solo combinado de LaLiga, Premier League, Serie A, Bundesliga, Ligue 1 y Todas las ligas.
- [PR #12](https://github.com/estadisticasfutbolxg/grada-futbol/pull/12) integrado: `867df8e4641ca0b0cfd567ce19058f1cbff8ec6b`. Fuente Sites desplegada: `081749294f53c387bf906d77e9b86168e764f5c2`; son repositorios distintos. Versión `appgprj_6ae0b8b2eb1881918601230d00603255~appgver_10df7db920308191886227fe0b4152b1`; despliegue `appgdep_6aeede2d698481919de2255a99750f2c`.
- 2.284 fichas jugador/liga y 96 equipos: LaLiga 487, Premier 454, Serie A 496, Bundesliga 417 y Ligue 1 430. Se verifican 30 familias/campos de jugadores y 9 de equipos antes de habilitar una liga. Cobertura parcial por temporada y ranking; ausencias como `null`.
- Understat conserva LaLiga del 1 de noviembre y su prioridad sobre ESPN/FotMob. Durante esta tarea respondió mantenimiento. Las nuevas ligas usan xG/xA FotMob y complemento ESPN, consultados el 7 de noviembre. FotMob LaLiga conserva jugadores del 6 y añade equipos del 7; ESPN LaLiga se actualizó el 7. Fechas y denominadores propios por campo, sin inferir recuentos redondeados.
- Rankings por área (0–1): delanteros, porteros, defensas, perfiles MED defensivo/ofensivo, y equipos por ataque, defensa y rendimiento global. Todos los ejes comunes, mínimos iniciales 450/180 min o 5 PJ, y referencia fija por perfil/ámbito. Los perfiles MED describen acciones y pueden solaparse. Todas recalcula percentiles sobre el conjunto; no ordena áreas locales. Modelos xG/xA por proveedor, con ese límite visible.
- El [PR #11](https://github.com/estadisticasfutbolxg/grada-futbol/pull/11), `7412a018578b8a1aba186bd0ff5e432798f19ed6`, corrigió Mbappé mediante IDs/nombres/club verificados y se publicó primero en versión 7. El área de la tabla ya dispone de seis ejes.
- Pruebas: seis archivos Node, seis pruebas Python, sintaxis, enlaces/skills y concordancia íntegra de los cinco JSON/SQLite FotMob en jugadores y equipos. Pipeline reproducido desde caché real. Chromium verificó 48 cruces (ocho rankings × seis ámbitos), candidatos/orden/unidades, muestras y filtros, CSV/JSON, bytes SQLite, móvil sin desbordamiento, refresco válido/fallido y parcial 4/5, exclusión de una liga sin fuente y rechazo de caché cruzada. No se publican respuestas de QA como datos nuevos.
- Hosting estático: Python genera artefactos fuera de GitHub. El refresco ESPN actualiza el navegador para una liga o todas y conserva las capturas fallidas y las de otros proveedores. Los originales son descargables por liga; Todas ofrece CSV/JSON con Liga y procedencia.
- Acceso público y permisos de edición conservados; sin nuevas invitaciones. Autocontrol sin revisión independiente del colaborador.

Definiciones y reproducción: [LEAGUES.md](LEAGUES.md). Evidencia en las tareas [de ligas/rankings](../loop/tasks/20261107-codex-european-leagues.md), [identidad de Mbappé](../loop/tasks/20261107-codex-player-identity.md), [FotMob](../loop/tasks/20261106-codex-midfield-fotmob.md) y [combinado inicial](../loop/tasks/20261106-codex-combined-radars-filters.md).

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
