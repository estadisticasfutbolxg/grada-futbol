# 20261119-codex · Score primero, ayudas breves y comparación de equipos

- Estado: `done`
- Responsable: Codex
- Revisor: autocontrol; sin revisión independiente
- Rama: `feat/score-first-team-comparison`
- Base Sites: `9290d260b25e99cee03b125a36faea2b06516d5e`
- Base GitHub: `b0ed688700daebe3bad6cb9e0796bf6e823b44c7`
- PR: [#41 integrado](https://github.com/estadisticasfutbolxg/grada-futbol/pull/41)
- Objetivo: entregar los cuatro cambios de interfaz y publicar privado

## Alcance

Score en la primera columna real (antes de # y nombre), con prioridad visual; ayuda breve que no interfiera con ordenar y definición completa en Glosario; selección de varios equipos; comparación de dos equipos por portería, defensa, mediocampo y delantera.

El propietario amplía la comparativa con goles/90 de equipo, tarjetas y otras métricas útiles disponibles. Usar estadísticas propias de equipo y sus denominadores; las tarjetas de plantilla se etiquetan como sumas conocidas con cobertura, sin presentarlas como total oficial ni dividirlas por minutos de otra muestra. Comparaciones y filtros consumen el modelo existente, sin cambiar scores, referencias, fuentes, partidos ni permisos.

Archivos compartidos: app.js, index.html, style.css, módulo de presentación y build_worker.py; pruebas y documentación asociadas. Árbol inicial limpio; fuente Sites sincronizada y main GitHub comprobado. Audiencia owner-only revisión 3. Sin subagentes ni revisión independiente.

## Aceptación

- [x] Score primero en jugadores, equipos y rankings; los KPI conservan su orden propio y el score permanece igual entre vistas.
- [x] Ayudas compactas solo desde información, sin capturar clics; ordenar cierra la ayuda. Glosario mantiene las definiciones completas.
- [x] Selección múltiple por IDs, combinación de equipos elegidos, búsqueda/limpieza y manejo de Varios clubes sin asignación falsa.
- [x] Dos equipos distintos comparan los mismos scores por líneas, pesos/cobertura y estadísticas reales disponibles; ceros y ausencias correctos.
- [x] Validar lógica/interacciones/componentes, conservar datos/modelo y publicar con GitHub integrado y acceso privado.

## Plan

1. Separar presentación y selección de los cálculos existentes; implementar tabla, ayuda y selector accesible.
2. Añadir comparación por líneas y KPI con fuentes/cobertura.
3. Verificar casos, revisar, integrar y publicar; registrar límites reales y recuentos.

## Validación y entrega

- `node --check dist/app.js dist/explore.js` (por archivo), compilación de `build_worker.py`, `git diff --check` y comprobador de documentación correctos.
- 21 archivos Node correctos, con 14 casos nuevos: tabla score primero, orden por KPI y cierre de ayuda, foco + clic/táctil, selección OR por ID, búsqueda/limpieza, cambios de liga, pares distintos, ceros/ausentes, cobertura, medias por minutos, escape HTML y barras sin estilos inline.
- Sobre capturas reales: 2.284 registros, 96 equipos, seis ámbitos, 84 tablas de rankings con su score primero, 4.568 igualdades individuales y 1.344 resúmenes de líneas exactos. Once hashes fuente iguales a v22; los cinco combinados publicados tampoco se regeneran. Modelo v4 intacto: 1.017 scores válidos, 29 pendientes sobre el mínimo; auditoría comprueba 714 medias, 2.558 contribuciones y 1.009 ajustes de disciplina.
- Worker recompilado: 37 assets, 11 módulos, SHA256 `424e6adc59cbdbf6d7db3cdd852ebb2fd89b445d69b0ac1e114618c8100b3aeb`. GET de módulo, app y CSS exactos; HTML exacto tras normalizar sus hashes de caché; dependencias en orden, HEAD correcto y ayuda sin captura del puntero.
- **0 jugadores/estadísticas de origen actualizados, 0 partidos modificados, 0 scores cambiados**. No se contacta a proveedores, no se regeneran bases, ni se cambian contraseña, bindings o audiencia.
- Entorno Sites managed sin `cua_repl.js`: comprobados lógica, controladores con dobles DOM y HTML generado; sin nueva revisión visual de navegador, móvil o producción autenticada. No se usa un navegador alternativo. Autocontrol, sin revisión independiente.
- Commit local/fuente Sites `123bdd39e97e807cbcdfc96f0181b32ba94b4b42` subido y verificado contra el remoto. [PR #41](https://github.com/estadisticasfutbolxg/grada-futbol/pull/41) con 13 archivos integrado por squash en main `1fe75f3b1bae2941b17a49bdb5f6f3244ed2a55d`, comprobado tras el merge. Head/base exactos, mergeable clean; sin checks/statuses configurados, main sin protección ni rulesets. No se cambian esas políticas.
- Publicación privada confirmada: versión **23**, despliegue `appgdep_6afe90c9b6f48191aeaa5f215bc681ec` en `succeeded`. Versión `appgprj_6ae0b8b2eb1881918601230d00603255~appgver_322d95dd36b88191b8e4394914aa7c60`, fuente exacta `123bdd39e97e807cbcdfc96f0181b32ba94b4b42`, paquete de dos archivos (manifiesto + Worker) y revisión de entorno 1. Worker SHA256 indicado arriba.
- Lectura posterior del Site: owner-only revisión **3**, un owner, cero grupos y visitantes; URL [GRADA privada](https://grada-futbol-analitica.ivanmatema2.chatgpt.site). El get_site_version confirma fuente y versión publicadas. No se afirma navegación de producción autenticada. Se cierra la documentación en un incremento posterior, sin redesplegar los mismos assets.
- Helper Sites ausente; se usa el flujo Git existente y credencial efímera por stdin, sin persistirla. El primer push con red por defecto falló en el proxy; el mismo flujo con permiso de red de la tarea completó fetch, push y verificación. No se modifica la configuración de red ni se solicita aprobación conversacional adicional.
