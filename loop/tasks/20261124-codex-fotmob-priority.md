# 20261124-codex-fotmob-priority · Sustituir métricas Understat por FotMob

- Estado: `review`
- Responsable: Codex
- Revisor: autocontrol; sin revisión independiente
- Rama: `feat/fotmob-priority`
- Base Sites: `1160d5ac4e88ce3a622d115036a0a2e3c0234486`
- Base GitHub: `ef8ab3c6e2dfa19c8a9faf18bd667b8a240fa80a`, main comprobado
- PR: pendiente
- Entrega: merge y publicación privada

## Objetivo

Priorizar las métricas disponibles de FotMob en LaLiga, conservando Understat para huecos y su código para una futura reactivación. Mantener catálogo/IDs, cruces inequívocos, fechas y denominadores propios; no confundir pases clave con ocasiones creadas.

## Alcance y coordinación

Política de ligas, combinación, actualización general, generador, textos de fuentes, pruebas y documentación. No hay otra tarea activa sobre estos archivos. Las otras cuatro ligas ya priorizan FotMob. No se consultan proveedores ni se cambian permisos, fórmulas o mínimos de score; se reutilizan capturas reales.

## Aceptación

- [x] FotMob sustituye los valores disponibles; ceros válidos respetados y huecos conservan Understat/ESPN con procedencia.
- [x] Capturas y código originales intactos; consultas generales Understat pausadas y reactivación documentada.
- [x] Scores, equipos y selecciones recalculados con muestras coherentes; cobertura y cambios contados, sin cifras inventadas.
- [ ] Pruebas y artefacto comprobados, GitHub integrado y Sites privado actualizado.

## Plan

1. Separar prioridad de métricas del catálogo y pausar la consulta general de Understat mediante configuración.
2. Regenerar combinados desde las capturas actuales y contrastar procedencia, huecos, scores y fechas.
3. Validar, revisar el diff, integrar y publicar; registrar jugadores/partidos realmente cambiados.

## Evidencia y revisión

- 28 archivos Node correctos; 22 casos de combinación, con regresiones de prioridad FotMob, ceros, respaldo con muestra propia, conservación de totales frente a tasas publicadas, pausa y reactivación de Understat. Se conserva un caso explícito de configuración Understat-first para comprobar sus derivados y reactivación.
- Once fuentes originales/fechas por hash intactas; 2.380 identidades/fichas originales verificadas. 56.978 campos con valor/fecha/minutos/PJ propios y 57.247 campos de las otras ligas intactos. Cinco combinados regenerados por etapas, SQLite sin cambios.
- 477 fichas de LaLiga cambian fuente o valor; 473 cambian cifras. Cero jugadores nuevos, cero partidos modificados/descargados y cero consultas nuevas a proveedores. CSV privado con nombres y medidas en `/workspace/entregas/prioridad-fotmob-20261124/`.
- 1.498 scores cambian al sustituir métricas y recalcular la referencia común; cinco perfiles MED estadísticos cambian, ninguna posición canónica. 1.511 scores válidos (nueve nuevos, ninguno perdido); 104 países y 17 onces completos conservan media simple. Auditoría: 2.284 equivalencias, 742 medias y 3.834 contribuciones; recuperación de carga y actualización correcta.
- Siete arranques VM/DOM del Worker exacto, con cinco ligas, Todas/Selecciones, fallo de liga, caché local y captura Understat recién consultada pero más corta. Budimir 8/12 PJ/930 min, xG 7,02 FotMob; panel de fechas, fichas y tabla coherentes. Once capturas paralelas de arranque; el refresco general de LaLiga solo consulta ESPN/FotMob.
- 146 assets/12 módulos, 109 igualdades de assets. Worker SHA256 `250741cfe8ac0feb2b11694b4da65e412a34238503d6cf6de35acb82785333c0`; bundle gzip 83070 bytes. Sintaxis JS/Python, docs/enlaces y diff correctos. Validador histórico StatsBomb bloqueado por ausencia de su JSON local, ajeno a estas ligas; las once fuentes se validan mediante sus adaptadores y auditoría. Sin QA visual disponible.

Autocontrol del diff y contratos realizado. Fuente, modelos y muestras se mantienen explícitos; no se equiparan pases clave y ocasiones creadas. Una conversión de respaldo conserva ambos componentes originales; no oculta conflictos entre muestras FotMob publicadas. No hay revisión ni aprobación independiente.

## Resultado y relevo

Validado localmente; publicación e integración pendientes.
