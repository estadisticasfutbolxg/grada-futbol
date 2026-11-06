# 20261106 · Fuentes combinadas, descargas, radar y filtros numéricos

- Estado: `done`
- Responsable: Codex, a petición de Ivan
- Revisor: autocontrol; colaborador sin asignar
- Rama: `feat/combined-data-radars-filters`
- Base GitHub: `328d21c2e695a572f25342fa722a4a36a69995db`
- Base Sites: `a96c868911c3d07567826618b1874d8910068dfd`; remoto de Sites sincronizado
- PR: [#6](https://github.com/estadisticasfutbolxg/grada-futbol/pull/6) y [#7](https://github.com/estadisticasfutbolxg/grada-futbol/pull/7), fusionados
- Entrega: PR, integración y despliegue público, según autorización vigente

## Objetivo y aceptación

- [x] Vista combinada: catálogo y valores de Understat prioritarios, complementados con ESPN cuando coinciden nombre y equipo de forma inequívoca, en LaLiga 2026/27. Conservar fuentes, fechas y cobertura por campo.
- [x] En casos dudosos o discrepantes, conservar Understat. Evitar unir homónimos, traspasos agregados, otras temporadas o porteros con roles incompatibles.
- [x] Botones explícitos para descargar ESPN y el combinado; CSV con procedencia.
- [x] Radar por jugador en ficha y comparador: percentiles por posición, con denominadores y datos disponibles; nunca convertir ausencias en cero.
- [x] Filtros por minutos, goles y otras medidas, combinables y aplicados a totales explícitamente.
- [x] Checks, navegador con capturas reales, PR/merge y publicación verificados.

## Plan y alcance

1. Crear combinación pura con contexto por métrica; mantener capturas originales.
2. Integrar vistas/descargas, filtros y radar, con pruebas de casos límite y datos reales.
3. Revisar, subir, integrar y desplegar preservando el acceso público y los permisos de edición.

La petición explícita de combinar fuentes sustituye la regla anterior de mantenerlas separadas. No se infieren xG recibidos de porteros ni minutos ESPN. Las paradas por 90 no usan minutos de Understat: no se puede confirmar el mismo conjunto de partidos. Las fuentes individuales siguen accesibles.

## Evidencia y resultado

Pendiente. Capturas disponibles: Understat y ESPN del 1 de noviembre; no se presentan como una consulta reciente. Los casos sin identidad inequívoca conservan el registro Understat; los jugadores exclusivos de ESPN siguen en su vista y descarga.

## Comprobaciones del incremento

- Combinación real: 411/487 registros completados, 76 solo Understat, 1 coincidencia ambigua conservada como Understat; 77 discrepancias mantienen el valor Understat. Los 216 registros ESPN no unidos siguen en su vista y descarga.
- Caso real: Unai Simón conserva 9 PJ Understat y añade 26 paradas de ESPN con 10 PJ de origen. Paradas/PJ = 2,6 usando ESPN; /90 no se calcula con minutos Understat.
- Cinco archivos de pruebas Node correctos: métricas, proveedor, seguridad, unión, filtros y percentiles. Incluyen homónimos, rol de portero, equipo, temporada, prioridad de cero y denominadores de origen.
- Sintaxis JS, validador histórico StatsBomb, enlaces y `git diff --check` correctos. Los datos históricos y las capturas originales no se editan.
- Chromium con respuestas y capturas reales: combinado, procedencia, descarga ESPN/combinada y CSV; radar en ficha/comparador; filtros combinados y unidad; cambio a vistas individuales. Móvil 390 px sin desbordamiento ni errores JS. El radar se revisó visualmente y las etiquetas se adaptaron al móvil.

Pendientes de registrar: PR, integración y publicación. El botón de actualización se comprueba también con respuestas capturadas en la prueba local, sin afirmar una nueva consulta real a los proveedores.

También pasó la actualización del combinado en navegador: fallo simulado conserva la captura; respuestas reales previamente capturadas permiten probar una actualización satisfactoria que mantiene la vista combinada y conserva la fecha Understat. Esa simulación no modifica las capturas publicadas ni se presenta como descarga nueva.

## Integración y revisión del radar

PR [#6](https://github.com/estadisticasfutbolxg/grada-futbol/pull/6) fusionado: `7728c3447d7b0bd064068b63fcade0c7a9cce5a5`. La revisión adicional detectó que la elegibilidad de la referencia del radar debía usar el contexto de cada eje, no los minutos principales de la fila. Se corrige y prueba: un portero con 900 minutos Understat pero solo 1 PJ ESPN no entra como referencia del eje de paradas ESPN. No se modifican cifras ni coincidencias.

## Entrega confirmada

Corrección del radar integrada por PR #7: `192a5aa98cf3e85c89be4ecda50a26961e630568`. Fuente de Sites subida y verificada: `1aa73ca7ed1a48ec47f96f626ea6985197988be5`. El paquete se comprobó contra ese código y conserva las capturas reales.

Versión 5 de [GRADA](https://grada-futbol-analitica.ivanmatema2.chatgpt.site) desplegada con estado nativo `succeeded`. Deployment: `appgdep_6aede08cbdb88191a334c0cdc059aad0`. Audiencia pública conservada, sin cambios de permisos de edición. La combinación se calcula en el navegador y el generador permite reproducirla; no requiere backend ni claves.

Las fuentes conservan su fecha del 1 de noviembre. El radar no inventa habilidades ni datos ausentes. Las métricas de LaLiga sin respaldo, especialmente xG recibidos de porteros, siguen —. Registro posterior de documentación; no cambia el contenido web desplegado.
