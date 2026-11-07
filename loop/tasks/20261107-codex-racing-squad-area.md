# 20261107 · Racing visible y área general de plantilla

- Estado: `active`
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
- [ ] Pruebas, GitHub/PR/merge y actualización pública verificadas.

## Comprobaciones locales

- Suma Racing LaLiga 4,185619726674771, 16/25 válidos y 9 pendientes; Todas 3,941190924696183. clean permanece null y los índices defensivo/global pendientes, sin ocultar al club.
- Las cinco salidas combinadas se regeneraron con el generador y cotejaron contra sus contribuciones exactas; no se volvieron a consultar fuentes ni cambiaron fechas. Los JSON de origen/SQLite permanecen intactos.
- Pruebas Node (siete archivos): suma sin ponderar/mínimos, ceros reales, áreas ausentes, duplicados, IDs por ámbito, ausencia de mutación y búsquedas.
- Chromium: Racing por alias en equipos y los tres rankings; suma/cobertura/contribuciones; bloques iniciales y acceso MED; regresión de 48 cruces de ranking/ámbito, unidades/muestras/filtros, CSV/JSON, originales/bytes SQLite, actualización/fallos/cachés y móvil. Todos correctos. Comprobación visual de las nuevas tarjetas y ficha móvil; acceso completo limpiando filtros y retorno al inicio después de cambiar de liga correctos. La descarga nativa de SQLite no se verificó en el navegador enrutado; se comprobaron sus bytes sin modificarlos.
- `python scripts/validate_data.py`: 64 partidos StatsBomb, 32 equipos, 681 registros, 234637 eventos; artefactos coherentes. `node --check dist/app.js`, `git diff --check` y comprobador de documentación correctos (3 skills, 11 tareas, 36 documentos).
- Autocontrol, sin revisión independiente. Pendiente GitHub/merge y publicación, con identificadores reales por registrar.
