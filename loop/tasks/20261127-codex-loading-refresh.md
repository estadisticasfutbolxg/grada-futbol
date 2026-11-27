# Carga fiable, progreso y actualización más rápida

- Estado: `done`
- Responsable: Codex (coordinación y publicación)
- Revisor: autocontrol y agentes para áreas separadas; sin revisión humana independiente
- Rama: `perf/league-loading-refresh`
- Base nativa: `4da4682ecfef74b2de55870c7f484e2ddbc89255`
- Base GitHub: `dd804c22eaad716f309e6337e622292ba7601540`

## Alcance

Resolver ligas ausentes por fallos transitorios al abrir, mostrar barra de progreso y errores recuperables, acelerar carga y refresco conservando validación, cobertura, fuentes/capturas, scores y permisos privados. Medir mejoras con las mismas entradas; no afirmar tiempos reales de proveedor sin medición. No actualizar datos reales por optimizar código.

## Trabajo paralelo

- Agente carga: app.js/index.html/style.css y tests nuevos propios. Carga inicial/progreso/reintento; conservar hooks de refresco para barra.
- Agente refresco: refresh.js y tests propios. Planificar fichas por lotes con concurrencia acotada y preservar resultados/validación; no modificar app.js.
- Coordinador: Worker/proveedores, pruebas de integración/medidas, documentación, GitHub y Sites. Cambios de agentes revisados antes de integrar.

## Criterios

Progreso accesible de carga y actualización, catálogo completo al terminar correctamente; recuperación explícita de errores parciales sin ocultar ligas ni sobrescribir datos válidos. Reducir trabajo redundante/red sin relajar validaciones. Checks de fallo/transitorio/caché, scores/fuentes intactos, pruebas automáticas y Worker exacto. PR/merge y publicación privada verificadas.

## Diagnóstico y resultado preparado

El inicio lanzaba 36 peticiones simultáneas de 15 s, descartaba una liga cuando fallaba una fuente y no permitía recuperación sin recargar. Se añaden límite de seis fuentes, un reintento transitorio, respaldo local validado y reintento manual, sin habilitar datos incompletos como completos. Indicador accesible visible desde HTML, progreso real de carga/refresco, referencia común tras completar cada lote y espera de frame acotada en segundo plano.

Se elimina combinación repetida durante la selección de cachés. El refresco conserva todas las métricas y jugadores, con cuatro consultas de rankings por fuente y dos lotes de seis fichas por liga después de comprobar compatibilidad. Un grupo único de tres limita el respaldo individual. Fallos parciales preservan campos/fechas; acceso denegado o límite de peticiones detiene la cola. Tests cubren caída transitoria, 17/18→18, cachés inválidas, publicado estricto, exclusión mutua, progreso, IDs erróneos y concurrencia/fallos.

Medición reproducible sin proveedores: 43 páginas con latencia simulada 12 ms, 271,6→137,3 ms; 96 fichas/16 lotes, 203,4→113,0 ms; cinco capturas reales y respaldos equivalentes, 1.859,2→1.423,2 ms. No son tiempos de navegador ni de proveedor real.

Ninguna captura, jugador, partido, DB, regresión o peso actualizado por esta tarea. Código de métricas y score intacto. Publicación pendiente; verificar Worker exacto y conservar audiencia solo propietario.

## Verificación final preparada

41 archivos Node y 28 pruebas Python correctos; ESLint y Ruff sin avisos, documentación y diff correctos. Worker exacto: cuatro arranques VM/DOM con capturas reales (normal, Fantasy, selecciones y fallo permanente de una fuente), límite de seis lecturas iniciales, 18/18 en casos correctos y 17/18 con aviso ante fallo; una lectura fallida se repite exactamente una vez. Referencia común de 6.766 identidades y equipos/selecciones coherentes en las pruebas de navegación. Sin navegador disponible: no se afirma QA visual. Worker SHA256 `2ec79fbd24e6789b9e4f0a73c4fdb355fc2864dc67a9ed14cb65c7df36ac52cb`, 378 assets/12 módulos; bundle gzip 104.823 bytes.

La revisión técnica de agente es adicional al autocontrol, sin revisión humana independiente. [PR #86](https://github.com/estadisticasfutbolxg/grada-futbol/pull/86) integrado con CI quality correcto; merge `7031428fd54e5564975393eacfb01db99d61fca4`. Trece blobs verificados contra la base y por hash tras enviarlos. Fuente nativa `5078493aa35a268ee683addf800dfb2f0f2bb8f8` subida y comprobada en remoto.

**Sites v46**, despliegue `appgdep_6b09193ca9d48191b026ff9382a209f2` succeeded; Worker SHA256 `2ec79fbd24e6789b9e4f0a73c4fdb355fc2864dc67a9ed14cb65c7df36ac52cb`, 9.821.951 bytes y 378 assets/12 módulos. [GRADA privada](https://grada-futbol-analitica.ivanmatema2.chatgpt.site). Política custom revisión 3, propietario 1, editores/grupos/visitantes 0 y runtime revisión 1, sin cambios.

HTTP confirma HTML y bundle exactos (gzip 104.823 bytes), barra/reintento, cuatro informes analíticos y 36 capturas idénticas a v45, 42 rutas retiradas 400/404 y actualización sin identidad 401. No se han descargado ni actualizado jugadores ni partidos, ni modificado DB, scores, pesos o modelos. Cierre documental posterior sin nuevo despliegue idéntico.

La revisión adicional encontró un caso de recuperación que podía descartar una liga: fuente publicada ausente con respaldo válido y otra caché más reciente individualmente válida pero sin una familia de métricas. Se resuelve probando las alternativas validadas disponibles solo cuando falla la combinación preferida, con número acotado de candidatos. Reproducción con LaLiga real: ESPN publicado 404 y respaldo válido, FotMob publicado completo y caché nueva sin grandes ocasiones falladas; se recuperan los 488 jugadores con cobertura completa y fecha original. Prueba de regresión incluida. También se ajusta el mensaje de fin de comprobaciones y se excluyen errores del validador del reintento de red.
