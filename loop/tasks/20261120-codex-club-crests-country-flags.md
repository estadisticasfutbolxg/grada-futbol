# 20261120-codex · Escudos de clubes y banderas de competiciones

- Estado: `review`
- Responsable: Codex
- Revisor: autocontrol; sin revisión independiente
- Rama: `feat/club-crests-country-flags`
- Base Sites: `adc4f0a50d57d5bda1e4a75660a918e1ed0b3d07`
- Base GitHub: `d6c14be81f72150e758b05c65a7e027933f911db`
- PR: pendiente
- Objetivo: añadir imágenes coherentes de clubes y países, validar y publicar privado

## Alcance

Escudos reales por ID FotMob verificado en los registros de equipo existentes; sin nuevo matching de nombres. Banderas de España, Inglaterra, Italia, Alemania y Francia para las competiciones; no inferir nacionalidades de jugadores ni confundir país de liga con país del club. Mostrar en selector/identidad de liga, tablas, filtros de equipos, fichas, rankings y comparativas manteniendo score primero y controles existentes.

Servir imágenes locales, sin nuevas peticiones de imágenes a terceros desde el navegador ni ampliar CSP. Texto accesible acompaña iconos decorativos. Fallback neutro al faltar ID, recurso o conexión, sin escudo erróneo en agregados de varios clubes. Descargar solo imágenes, conservar estadísticas/fuentes/scores intactos. Script reproducible para escudos; archivos generados fuera de GitHub, código y banderas con procedencia/licencia incluidos. Sin cambios de acceso, contraseña o configuración.

## Aceptación

- [x] Escudos por identidad real y país de competición verificado, con cobertura de los 96 clubes y cinco ligas comprobada.
- [x] Iconos integrados con legibilidad, controles accesibles, fallback y tamaños móviles; score primero y filtros intactos.
- [x] Imágenes empaquetadas y servidas localmente, sin rutas externas arbitrarias, scripts SVG o relajación de CSP.
- [x] Pruebas proporcionadas, estadísticas/modelo intactos y límites de revisión visual registrados.
- [ ] GitHub integrado y Sites publicado con owner-only revisión 3.

## Plan

1. Descargar/validar imágenes, preparar módulo de presentación por IDs y banderas locales.
2. Integrar en UI y empaquetado, verificar casos reales/controles y conservar fuentes/modelo.
3. Autocontrol, PR/merge/publicación privada y cierre con evidencia.

## Evidencia inicial

Árbol limpio, remoto Sites sincronizado y main GitHub comprobado. Site v24, owner-only revisión 3, un owner y cero grupos/visitantes. Modo managed sin cua_repl disponible: no iniciar navegador alternativo; comprobar lógica, HTML y artefacto sin afirmar QA visual. FotMob sirve PNG real de Barcelona (ID 8634), 192×192. Las capturas no incluyen nacionalidad de jugadores.


## Validación del incremento

- 96 PNG descargados y validados, sin fallos; Barcelona 8634, Racing Santander 8696 y Arsenal 9825 conservan sus IDs de proveedor. Cinco banderas locales de flag-icons v7.5.0, licencia MIT incluida. Un PNG de Barcelona inspeccionado; sin edición/generación de escudos ni atribución de nacionalidad.
- 22 archivos Node y 10 tests Python correctos. Casos de IDs originales/prefijados, rechazo de IDs de jugador y rutas externas, agregados multiclub, Inglaterra, ausencia de nacionalidades, HTML escapado, carga/fallo de imagen, selector múltiple, orden por KPI y score primero. Sintaxis de módulos y compilación de scripts, documentación/enlaces y diff correctos.
- Datos reales: 192 comprobaciones de identidad de equipos (liga/Todas), 4.564 referencias de club en jugadores, 2.284 scores idénticos a los combinados publicados. Once capturas conservan hashes; bases, datos, scores y referencias intactos. Las pruebas previas de 84 tablas en seis ámbitos, 4.568 igualdades y 1.344 medias siguen correctas.
- Worker: 140 assets, 11 módulos, SHA256 `61ce490a082fa4ae3cf19b2eb001a7af143a3c4b6e0ebae7a89f07b237a55aed`. GET de 96 PNG, cinco SVG, licencia, branding/app/CSS: 105 contenidos y MIME exactos; orden de scripts correcto y CSP sin dominios añadidos. PNG acotados, CRC y dimensiones; SVG pasivos sin referencias externas. Cache/logo fallback y texto accesible conservan controles.
- **0 jugadores, 0 estadísticas de origen, 0 partidos y 0 scores actualizados**. Solo imágenes descargadas, sin consultas de estadísticas, regeneración de combinados/SQLite o cambios de permisos/contraseña/bindings. Los PNG/manifiesto y Worker quedan fuera de GitHub; generador, banderas/licencia y código sí se versionan.
- Modo Sites managed sin cua_repl disponible: sin nueva revisión visual de navegador/móvil o producción autenticada. Sí lógica, controladores con dobles DOM, HTML real generado y artefacto servido. Autocontrol sin revisión independiente.
- Pendientes: push/PR/merge y publicación privada, con lectura posterior de fuente, versión y audiencia.
