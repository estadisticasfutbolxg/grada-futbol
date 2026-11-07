# 20261107 · Defensas individuales y centros del campo por equipo

- Estado: `done`
- Responsable: Codex, a petición del usuario
- Revisor: autocontrol; sin revisión independiente
- Rama: `feat/defenders-team-midfield`
- Base GitHub comprobada: `628dab63c78cec34db8d74073c148c6bd656df75`
- Base local/Sites sincronizada: `20353ff5f089cfde668facb1b335525c77ae5ac2`

## Objetivo y alcance

Añadir al inicio los mejores defensas individuales y los mejores centros del campo de equipos, separados en ofensivo y defensivo, con acceso a sus rankings completos. Mantener el área general de plantilla y los índices de ataque/defensa existentes. Nueva petición en la misma tarea: quitar todos los botones CSV/JSON de la web, conservando SQLite y los datos necesarios para cargarla.

Los centros del campo se comparan por la suma de áreas válidas del perfil MED_ATT o MED_DEF de sus jugadores clasificados MED y asignados por ID. No se infiere una posición detallada ni se incluyen defensas/delanteros. Se informa cobertura/contribuciones; sin áreas válidas queda null, un cero real cuenta. Sin ponderación ni límite 1; referencia fija por ámbito, con 450 min por eje para las muestras de jugadores. El mínimo inicial de la tabla de equipos es 5 PJ; no cambia la suma ni aplica mínimos adicionales a las contribuciones.

Archivos compartidos: dist/app.js, index.html, squads.js, radar.js, components.js, scopes.js, documentación y pruebas. No hay otra tarea activa sobre este incremento ni cambios previos sin guardar. Las fichas review antiguas son entregas históricas; se conservan.

## Plan y criterios

1. Extender la agregación verificable y añadir dos rankings de equipos con sus métricas propias.
2. Añadir las tres tarjetas y retirar controles/handlers CSV/JSON.
3. Probar sumas, ausencia/cobertura, filtros, ámbitos, ficha, enlaces, refresco y móvil; regenerar solo derivados combinados.
4. Subir código/generador mediante PR, integrar y publicar en Sites; registrar IDs reales y cerrar documentación.

- [x] Tarjeta DEF individual y tarjetas de centros del campo ofensivo/defensivo por equipo.
- [x] Rankings/tablas/fichas/filtros coherentes con sumas por perfil y contribuciones.
- [x] Sin controles CSV/JSON ni referencias JavaScript a elementos eliminados; SQLite y actualización conservados.
- [x] Comprobaciones y derivados coherentes, sin datos de prueba publicados.
- [x] GitHub/PR/merge y publicación confirmados.

## Evidencia y siguiente paso

Preparación: árbol limpio y bases comprobadas; Site público v9. Se aplican Sites, grada-loop, grada-data y grada-review, conservando accesos.

- Siete archivos de pruebas Node correctos. Caso aislado de perfiles idénticos: cada área completa P50 = 0,25; ofensivo con dato ausente se excluye mientras el defensivo sigue válido; DEF y fichas sin equipo no inflan el centro del campo. Se conserva null en plantillas vacías e inmutabilidad del origen.
- Cinco JSON combinados regenerados mediante scripts/build_combined.cjs (que utiliza withTeamAreas); sumas, coberturas y contribuciones verificadas en 96 equipos y ambos perfiles, referencia Todas recalculada. No se modifican cifras/capturas de proveedores ni SQLite. Racing: ofensivo 1,2393231175179527, 3/11 MED válidos; defensivo 1,9148108865210762, 8/11.
- Chromium: 60 cruces (10 rankings × 6 ámbitos), nuevas tarjetas y sus enlaces, filtros numéricos, sumas estables, contribuciones, detalle sin confundir suma con radar de equipo, Racing y Mbappé, porteros, refresco ESPN válido/fallido/parcial, liga incompleta y caché cruzada. Sin errores de JavaScript. Ausencia de todos los controles CSV/JSON comprobada; SQLite conserva bytes válidos y enlaces correctos. No se verifica la descarga nativa SQLite en el navegador enrutado.
- Inspección visual del inicio en escritorio y ficha de centro del campo a 390 px, sin desbordamiento. Syntax check, diff check y documentación correctos (3 skills, 12 tareas, 37 documentos). Validador StatsBomb: 64 partidos, 32 equipos, 681 registros, 234637 eventos coherentes.
- Autocontrol sin revisión independiente; no se detectaron problemas funcionales pendientes en el alcance.

## Integración y publicación confirmadas

- Commit funcional local/Sites `3040b887c1524e84984f83d88217cb83265baa64`, push a main fuente confirmado, árbol limpio y archivo de despliegue cotejado con los 17 archivos fuente/manifiesto y cinco combinados regenerados.
- [PR #16](https://github.com/estadisticasfutbolxg/grada-futbol/pull/16), cabeza `21436ae29e8eeba4bd764c50b4edfc565d56acdf`, integrado mediante squash `14b4d197cb4550817d186eed3796ccbb6ac8c5f9`; main comprobado. GitHub no presentó checks remotos; constan los locales. Solo código, pruebas y documentación, sin bases/datos en GitHub.
- [GRADA pública](https://grada-futbol-analitica.ivanmatema2.chatgpt.site), versión 10: `appgprj_6ae0b8b2eb1881918601230d00603255~appgver_6bff5edcae648191a2ac20c761cb82b5`. Despliegue `appgdep_6aef7bd9069c819189750642f11cd281`, nativo `succeeded` a `2026-11-07T19:28:41.607313+00:00` (20:28 Madrid). Acceso público y permisos conservados, sin invitaciones.
- El cierre documental posterior no modifica dist ni necesita otro despliegue. No hay siguiente paso funcional pendiente; las áreas ausentes siguen pendientes de las fuentes y las sumas dependen de la cobertura y tamaño de la plantilla.
