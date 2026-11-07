# Estado comprobado de GRADA

## Actualización verificada · 7 de noviembre de 2026

- Web pública [GRADA](https://grada-futbol-analitica.ivanmatema2.chatgpt.site), versión **10**, despliegue nativo `succeeded` a las 20:28 Madrid. Selector solo combinado de LaLiga, Premier League, Serie A, Bundesliga, Ligue 1 y Todas las ligas.
- [PR #16](https://github.com/estadisticasfutbolxg/grada-futbol/pull/16) integrado: `14b4d197cb4550817d186eed3796ccbb6ac8c5f9`. Fuente Sites desplegada: `3040b887c1524e84984f83d88217cb83265baa64`; son repositorios distintos. Versión `appgprj_6ae0b8b2eb1881918601230d00603255~appgver_6bff5edcae648191a2ac20c761cb82b5`; despliegue `appgdep_6aef7bd9069c819189750642f11cd281`. El PR #12 amplió ligas en v8; el PR #14 añadió Racing/sumas y tarjetas en v9.
- 2.284 fichas jugador/liga y 96 equipos: LaLiga 487, Premier 454, Serie A 496, Bundesliga 417 y Ligue 1 430. Se verifican 30 familias/campos de jugadores y 9 de equipos antes de habilitar una liga. Cobertura parcial por temporada y ranking; ausencias como `null`.
- Understat conserva LaLiga del 1 de noviembre y su prioridad sobre ESPN/FotMob. Durante la ampliación de ligas v8 respondió mantenimiento. Las nuevas ligas usan xG/xA FotMob y complemento ESPN, consultados el 7 de noviembre. FotMob LaLiga conserva jugadores del 6 y añade equipos del 7; ESPN LaLiga se actualizó el 7. V10 reutiliza estas capturas y fechas. Cada campo mantiene sus denominadores, sin inferir recuentos redondeados.
- Rankings individuales y perfiles específicos de equipos entre 0 y 1; mínimos iniciales 450/180 min o 5 PJ y referencia fija por perfil/ámbito. Los perfiles MED describen acciones y pueden solaparse. Todas recalcula percentiles sobre el conjunto; no ordena áreas locales. Modelos xG/xA por proveedor, con ese límite visible.
- Área general de equipo = suma de las áreas válidas de posición de todos sus jugadores asignados por ID, sin ponderación ni mínimos adicionales. Puede superar 1 y mantiene cobertura/contribuciones en ficha, CSV y JSON. Global ordena por esta suma; ataque y defensa mantienen sus índices específicos. Los equipos con índices pendientes siguen visibles. Racing estaba bien unido pero faltaba clean; ahora aparece también al buscar «Racing de Santander»: 4,186, 16/25 áreas válidas y 9 pendientes en LaLiga.
- Inicio con equipos más ofensivos, mejores defensas de equipos, centrocampistas ofensivos/defensivos, defensas individuales y centros del campo ofensivos/defensivos por equipo. Cinco líderes válidos y acceso a cada ranking completo. Las tarjetas respetan la liga seleccionada incluso al regresar desde otro ranking.
- Dos nuevos rankings de equipos suman áreas MED_ATT/MED_DEF solo de sus MED asignados por ID. Sin ponderación ni mínimo adicional por contribución; pueden superar 1 y muestran válidos/total, pendientes y contribuciones. Referencia MED de 450 min por eje, mínimo inicial de equipos 5 PJ; los filtros no cambian las sumas. Todas recalcula antes de sumar. Se conservan área general e índices de ataque/defensa/global.
- Retirados todos los botones y handlers CSV/JSON por petición del usuario. Los JSON internos y el generador permanecen; las descargas SQLite por liga y la actualización ESPN siguen disponibles.
- El [PR #11](https://github.com/estadisticasfutbolxg/grada-futbol/pull/11), `7412a018578b8a1aba186bd0ff5e432798f19ed6`, corrigió Mbappé mediante IDs/nombres/club verificados y se publicó primero en versión 7. El área de la tabla ya dispone de seis ejes.
- Versión 10: siete archivos Node, sintaxis, enlaces/skills y validador StatsBomb correctos. Cinco JSON combinados regenerados y sumas de ambos perfiles verificadas en 96 equipos, con las mismas capturas originales. Chromium verificó 60 cruces (10 rankings × seis ámbitos), tarjetas/enlaces, contribuciones, filtros/muestras, Racing/Mbappé/porteros, ausencia de controles CSV/JSON, SQLite, móvil, refresco válido/fallido y parcial 4/5, liga sin fuente y caché cruzada. La descarga nativa de SQLite no se comprobó en el navegador enrutado, sí sus bytes. V8 ya había validado seis pruebas Python y la concordancia completa de JSON/SQLite FotMob; los originales no cambian. No se publican respuestas de QA como datos nuevos.
- Hosting estático: Python genera artefactos fuera de GitHub. El refresco ESPN actualiza el navegador para una liga o todas y conserva las capturas fallidas y las de otros proveedores. Las bases SQLite se descargan por liga; Todas conserva Liga y procedencia en sus registros.
- Acceso público y permisos de edición conservados; sin nuevas invitaciones. Autocontrol sin revisión independiente del colaborador.

Definiciones y reproducción: [LEAGUES.md](LEAGUES.md). Evidencia en las tareas [defensas/centros del campo y descargas](../loop/tasks/20261107-codex-defenders-team-midfield.md), [Racing/áreas y tarjetas](../loop/tasks/20261107-codex-racing-squad-area.md), [ligas/rankings](../loop/tasks/20261107-codex-european-leagues.md), [identidad de Mbappé](../loop/tasks/20261107-codex-player-identity.md), [FotMob](../loop/tasks/20261106-codex-midfield-fotmob.md) y [combinado inicial](../loop/tasks/20261106-codex-combined-radars-filters.md).

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
