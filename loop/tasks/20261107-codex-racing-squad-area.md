# 20261107 · Racing visible y área general de plantilla

- Estado: `done`
- Responsable: Codex a petición del usuario
- Revisor: autocontrol; sin revisión independiente
- Rama: `fix/racing-squad-area`
- Base GitHub: `ce552830adb7596f778452a56a48c5abb1aa5260`
- Base local/Sites: `20676269997ca7846e8723d2f41ca554755915a9`

## Objetivo y diagnóstico

Racing Santander aparece unido en Understat (293), ESPN (87) y FotMob (8696), con 25 fichas asignadas por team_id. Falta clean en el ranking FotMob; los índices global/defensivo exigen todos los ejes y ocultaban al equipo en esos rankings. No es un error de matching entre fuentes. La búsqueda también debe aceptar Racing de Santander.

El usuario pide área general de equipo = suma de las áreas de todos sus jugadores, y elige conservar índices específicos de ataque/defensa por separado. La suma usa las áreas válidas de posición de toda la plantilla asignada, sin umbrales adicionales, medias o ponderaciones. Se informa cobertura y se conservan desconocidos; la suma no está limitada a 1. Debe ser estable al cambiar perfil/filtros y recalcularse por ámbito.

Nueva petición: mostrar bloques visibles en el panel principal para mejores defensas de equipos y centrocampistas ofensivos/defensivos, además del ataque, con accesos a los rankings.

## Criterios

- [x] Suma verificable por ID de equipo y ámbito; detalle de contribuciones y cobertura, sin duplicados ni datos inventados.
- [x] Racing visible en equipos y rankings aunque tenga índice pendiente; búsqueda con su nombre completo.
- [x] Área general e índices específicos separados en tabla, ficha, filtros, ordenación y CSV/JSON.
- [x] Bloques visibles en inicio para defensa y ambos perfiles MED, con muestras y unidades propias.
- [x] Pruebas, GitHub/PR/merge y actualización pública verificadas.

## Comprobaciones locales

- Suma Racing LaLiga 4,185619726674771, 16/25 válidos y 9 pendientes; Todas 3,941190924696183. clean permanece null y los índices defensivo/global pendientes, sin ocultar al club.
- Las cinco salidas combinadas se regeneraron con el generador y cotejaron contra sus contribuciones exactas; no se volvieron a consultar fuentes ni cambiaron fechas. Los JSON de origen/SQLite permanecen intactos.
- Pruebas Node (siete archivos): suma sin ponderar/mínimos, ceros reales, áreas ausentes, duplicados, IDs por ámbito, ausencia de mutación y búsquedas.
- Chromium: Racing por alias en equipos y los tres rankings; suma/cobertura/contribuciones; bloques iniciales y acceso MED; regresión de 48 cruces de ranking/ámbito, unidades/muestras/filtros, CSV/JSON, originales/bytes SQLite, actualización/fallos/cachés y móvil. Todos correctos. Comprobación visual de las nuevas tarjetas y ficha móvil; acceso completo limpiando filtros y retorno al inicio después de cambiar de liga correctos. La descarga nativa de SQLite no se verificó en el navegador enrutado; se comprobaron sus bytes sin modificarlos.
- `python scripts/validate_data.py`: 64 partidos StatsBomb, 32 equipos, 681 registros, 234637 eventos; artefactos coherentes. `node --check dist/app.js`, `git diff --check` y comprobador de documentación correctos (3 skills, 11 tareas, 36 documentos).
- Autocontrol, sin revisión independiente. No se detectaron problemas funcionales pendientes en el alcance revisado.

## Integración y publicación confirmadas

- Commit local funcional/Sites: `0342ab03e63319a0a4e612269b5ebb1071ffec98`, subido y confirmado en la rama fuente de Sites. Archivo de despliegue cotejado byte a byte contra ese commit en sus 17 archivos fuente/manifiesto, con cinco conjuntos combinados reales.
- [PR #14](https://github.com/estadisticasfutbolxg/grada-futbol/pull/14), cabeza `f912cfbe3e0bd19cc6a604b89a41bbf0798b59e2`, integrado mediante squash `6523afcc433db5d51deb9226c2652d36e6664446`; main verificado. Solo código, generador, pruebas y documentación; sin datos ni BBDD en GitHub. GitHub no presentó checks remotos; se ejecutaron los locales indicados.
- [GRADA pública](https://grada-futbol-analitica.ivanmatema2.chatgpt.site), versión 9: `appgprj_6ae0b8b2eb1881918601230d00603255~appgver_739dd3f83bf08191a0b517c9adf1f97f`. Despliegue `appgdep_6aef65d866548191bb6e2d8e7e009b1b`, nativo `succeeded` a `2026-11-07T17:54:59.991496+00:00` (18:54 Madrid). Audiencia y permisos conservados.
- El cierre documental posterior no modifica dist ni requiere otro despliegue. No hay tarea funcional pendiente; las nueve áreas y el índice defensivo/global ausentes del Racing siguen explícitamente pendientes de sus fuentes.
