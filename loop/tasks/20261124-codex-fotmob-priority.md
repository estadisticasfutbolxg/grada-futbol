# 20261124-codex-fotmob-priority · Sustituir métricas Understat por FotMob

- Estado: `done`
- Responsable: Codex
- Revisor: autocontrol; sin revisión independiente
- Rama: `feat/fotmob-priority`
- Base Sites: `1160d5ac4e88ce3a622d115036a0a2e3c0234486`
- Base GitHub: `ef8ab3c6e2dfa19c8a9faf18bd667b8a240fa80a`, main comprobado
- PR: [#63](https://github.com/estadisticasfutbolxg/grada-futbol/pull/63), integrado en `5c6212a78dc4f6fe66e284f5e44f46e0a92a8c75`; main comprobado
- Entrega: merge y publicación privada

## Objetivo

Priorizar las métricas disponibles de FotMob en LaLiga, conservando Understat para huecos y su código para una futura reactivación. Mantener catálogo/IDs, cruces inequívocos, fechas y denominadores propios; no confundir pases clave con ocasiones creadas.

## Alcance y coordinación

Política de ligas, combinación, actualización general, generador, textos de fuentes, pruebas y documentación. No hay otra tarea activa sobre estos archivos. Las otras cuatro ligas ya priorizan FotMob. No se consultan proveedores ni se cambian permisos, fórmulas o mínimos de score; se reutilizan capturas reales.

## Aceptación

- [x] FotMob sustituye los valores disponibles; ceros válidos respetados y huecos conservan Understat/ESPN con procedencia.
- [x] Capturas y código originales intactos; consultas generales Understat pausadas y reactivación documentada.
- [x] Scores, equipos y selecciones recalculados con muestras coherentes; cobertura y cambios contados, sin cifras inventadas.
- [x] Pruebas y artefacto comprobados, GitHub integrado y Sites privado actualizado.

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

[GRADA privada](https://grada-futbol-analitica.ivanmatema2.chatgpt.site) publicada como versión **34**, verificada el 24 de noviembre de 2026 a las 08:07 Madrid. Fuente Sites `dfa3ebd32df5a51b4708d16c04dd2204aaded3c5`, versión `appgprj_6ae0b8b2eb1881918601230d00603255~appgver_9ae6b260b5508191ba226d57936dbb6a`, despliegue `appgdep_6b05375d4b9881919335fb6e335a4e57` en `succeeded`.

HTTP de producción confirma HTML y bundle exactos, configuración FotMob → Understat → ESPN y pausa de Understat, cinco capturas FotMob intactas y API sin identidad denegada 401. Estado sin contraseña adicional y login antiguo 404. El token de servicio no es identidad del propietario; no se ejecuta una descarga real de proveedores.

Audiencia owner-only custom revisión 3: un propietario y cero editores, grupos o visitantes; runtime revisión 1 sin cambios. PR #63 fusionado tras verificar head/base, mergeable clean y ausencia de checks/protecciones configurados. Autocontrol, sin aprobación independiente.

Código, integración y publicación completados. La documentación final se sincroniza aparte sin republicar el mismo Worker. Lista de 477 jugadores y medidas afectadas entregada como CSV privado; **0 jugadores nuevos y 0 partidos descargados/modificados**. No quedan criterios pendientes.
