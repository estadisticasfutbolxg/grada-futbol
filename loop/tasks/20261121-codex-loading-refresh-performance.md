# 20261121-codex · Carga y actualización más rápidas

- Estado: `done`
- Responsable: Codex
- Revisor: autocontrol, sin revisión independiente solicitada
- Rama: `perf/loading-and-refresh`
- Base Sites: `2d506d8cec3a179135b2e12bf2f0816228c1aed6`
- Base GitHub: `d385ad7e1d3c07998e7d2491bd927c3ea509cd9a`
- Issue: no creado
- PR: [#49 integrado](https://github.com/estadisticasfutbolxg/grada-futbol/pull/49)
- Entrega: merge y publicación privada, autorización vigente

## Objetivo y coordinación

Reducir la espera de carga y actualización conservando datos, cálculos, cobertura, fuentes, informes, recuperación de fallos y acceso del propietario. Medir la base y verificar equivalencia con capturas existentes; no descargar estadísticas nuevas para medir rendimiento.

Archivos compartidos previstos: `dist/app.js`, módulos de cálculo si la medida lo justifica, `worker/app.cjs`, empaquetador y pruebas. No se observa otra tarea activa en esos archivos. Fuera de alcance: fórmulas de score, posiciones, permisos, secretos o nuevas fuentes.

## Aceptación

- [x] Mejora medible en CPU/solicitudes con comparación antes/después reproducible.
- [x] Mismos cruces, posiciones, scores, muestras, ausencias, ceros y promedios para los 2.284 registros y 96 equipos.
- [x] Refresco mantiene todas las fichas, autorización, límites y capturas válidas ante fallos.
- [x] Carga y caché respetan ligas, datos guardados, modo publicado e invalidación de código.
- [x] Pruebas, push/PR/merge y despliegue privado confirmados.

## Plan

1. Medir CPU y revisar dependencias de red y trabajo repetido.
2. Optimizar puntos comprobados y probar equivalencia/límites.
3. Validar capturas y Worker, integrar y publicar.

## Evidencia

Base publicada v26: 1.502 scores válidos, 2.284 registros jugador/liga, cinco ligas y 96 equipos. Once capturas originales se reutilizan, sin consultas de proveedores. Medición y entrega pendientes.

### Implementación y resultado comprobado

- Bundle con orden original: **25 scripts → uno**, 69.322 bytes gzip frente a 80.159 bytes gzip sumados antes. URL versionada inmutable; módulos individuales conservados. Once capturas solicitadas en paralelo, caché guardada leída sin bloquear por fuente, activación con referencia completa.
- Referencias ordenadas una vez, búsqueda binaria con percentiles exactos; nombres/alias/claves cacheados solo dentro de cada cruce. Comparación de informes sin clonado/serialización canónica. Sin modificar fórmulas ni versión v6.
- Fichas en lotes de seis: con estas plantillas, **2.285 → 383 peticiones normales al Site** para las mismas fichas. Máximo tres trabajos por lote, un lote por liga y dos ligas; no aumenta concurrencia al proveedor. Ruta individual preservada como respaldo. Autorización, origen, IDs/clubes/ligas, caché, TTL y datos anteriores ante fallos conservados. Gzip directo y deduplicación de plantillas en servidor.
- Benchmark reproducible `scripts/benchmark_performance.cjs`: medianas tras calentamiento **1.602,96 → 600,17 ms**, reducción CPU **62,56 %**, fuera de red/layout. Cinco salidas completas e informes idénticos por SHA256 entre código anterior y nuevo; también 2.284 perfiles/ejes idénticos. [Detalle y límites](../../docs/PERFORMANCE.md).
- **0 jugadores nuevos, 0 estadísticas o scores modificados y 0 partidos actualizados**. Once capturas originales/fechas intactas; no se consultaron proveedores ni se cambió SQLite.

| Comprobación | Resultado | Límite |
| --- | --- | --- |
| Node | 24 archivos correctos; nueve casos nuevos de caché, percentiles, transporte, autorización, fallos y gzip | Sin layout de navegador |
| Python | 10 tests correctos; empaquetador compila | Sin red a proveedores |
| Auditorías actuales | 2.284 scores/perfiles, 1.484 ajustes, 741 medias y 3.809 contribuciones; 390.320 lecturas de 82 métricas | 1.502 scores y 76 pendientes reales conservados |
| Controladores reales | 4.568 equivalencias, 84 tablas, 1.344 bloques y 2.302 KPI de comparativa | Seis ámbitos |
| Worker empaquetado | 142 assets/11 módulos; bundle ejecutado en VM, 106 assets exactos | SHA256 `a0b6ca616b245f9defa3eb9dce7702991004d9c7640d4ed28f47380b85a27de2` |
| Cinco arranques en VM | Normal, publicado, liga solicitada, LaLiga fallida y caché guardada más reciente correctos | Once peticiones iniciadas antes de completar ninguna |
| HTTP de producción anterior | v26 responde 200 con sesión de prueba; 25 scripts propios verificados | Medición aislada, no tiempo de navegador |
| Histórico StatsBomb | Falta `dist/downloads/statsbomb.json` | Ajeno a las cinco ligas, auditadas sin cambios |
| Docs/diff/sintaxis | Correctos antes de integrar | Sin navegador `cua_repl.js`; no se afirma revisión visual/móvil |

### Revisión y entrega

Autocontrol de equivalencia, límites, caché por origen/captura, memoria, identidad y fallos parciales. No equivale a revisión independiente. Audiencia anterior owner-only, revisión 3, cero editores/grupos/visitantes. Código subido a GitHub en `3bb7f2d950a40ad0627ed57644d9a8c891424fea`. [PR #49](https://github.com/estadisticasfutbolxg/grada-futbol/pull/49) integrado con squash en `100f0c47211a47e0a24690effad05feac34b7c02`, main verificado. PR limpio, head/base exactos, sin checks/statuses configurados ni protecciones/rulesets; sin modificar configuración. No se afirma aprobación independiente.

Fuente Sites `2a5cd6b134fd58fa8afb40744155ac678a7f1357` subida y verificada; archivo exacto con hosting y Worker. [GRADA privada](https://grada-futbol-analitica.ivanmatema2.chatgpt.site), versión **27**, despliegue `appgdep_6b021307c4d08191a00ca982bb7cbc39` en `succeeded`, 21 de noviembre a las **22:54 Madrid**. Versión `appgprj_6ae0b8b2eb1881918601230d00603255~appgver_1f1e0783f87881918d6dfffcb3d420cc`; procedencia confirmada. Runtime revisión 1 sin cambios.

HTTP autenticado posterior: HTML y bundle 200, gzip de una sola capa, un script propio, 69.322 bytes transmitidos, caché inmutable y SHA256 de ambos cuerpos exactamente iguales al Worker comprobado. Bundle `8613cd477b543971b0ec9e360c8e876f56f31c2329b75d7563092b1d9c191437`. No se ejecutó un refresco contra proveedores para comprobarlo. Audiencia posterior: owner-only revisión 3, un owner, cero editores/grupos/visitantes. Contraseña y permisos conservados.

Este cierre documental es posterior al código publicado y no requiere otro despliegue de un Worker idéntico. Objetivo completo. La latencia externa y la falta de QA visual siguen declaradas como límites.
