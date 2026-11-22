# 20261122-codex · Nacionalidades y selecciones 4-4-2

- Estado: `done`
- Responsable: Codex
- Revisor: autocontrol, sin revisión independiente solicitada
- Rama: `feat/nationalities-and-national-teams`
- Base Sites: `7d7d95cbbba1764b3076a61ca0204f6d6441c588`
- Base GitHub: `6f7397bd51ea9690f7d6a066e753b87281e96a5f`
- Issue/PR: [#53](https://github.com/estadisticasfutbolxg/grada-futbol/pull/53), integrado
- Entrega: merge y publicación privada, autorización vigente

## Objetivo y alcance

Mostrar el país deportivo publicado de cada jugador y un apartado Selecciones con once sugerido 4-4-2 y score teórico. Reutilizar las 96 plantillas FotMob guardadas el 14 de noviembre, con ID/club/liga/temporada y fecha original comprobados. No deducir nacionalidad de nombres, nacimiento o liga, ni afirmar elegibilidad FIFA o convocatoria oficial.

Conservar el único score individual, mínimo de 200 min y referencia común. Seleccionar 1 POR, laterales y dos centrales DEF con puestos publicados, 4 MED y 2 DEL. No recolocar un jugador en otra posición canónica ni recalcular su score. Promedio del once ponderado por sus minutos de club, coherente con equipos. Sin once completo, score pendiente. Deduplicar por ID FotMob, nunca por nombre ni sumando estadísticas entre ligas.

Archivos compartidos: módulos de país/selecciones, adaptadores y recuperación FotMob, combinado, HTML/app/CSS, generador y pruebas. Sin otra tarea activa reservando estos archivos. Fuera de alcance: nuevas consultas estadísticas, licencias, fórmulas de jugador, audiencia o contraseña.

## Aceptación

- [x] País con procedencia, cobertura y valores ausentes explícitos; actualización futura conserva/enriquece este dato.
- [x] Selecciones por país publicado, once único válido, sin duplicados y score ponderado comprobable; incompletos pendientes.
- [x] Score primero; nacionalidad en tablas/fichas y selección en navegación con dibujo 4-4-2 y ranking.
- [x] Regeneración por etapas desde caché; estadísticas, scores y fechas originales sin cambios indebidos.
- [x] Pruebas, GitHub, merge y publicación privada confirmados.

## Plan y evidencia

1. Extraer países verificados de capturas y actualizar adaptadores/contrato.
2. Crear modelo del once y UI con cobertura y límites.
3. Validar equivalencia, integrar y publicar.

Exploración: 2.544 miembros en 96 plantillas, 106 códigos de país y cero conflictos entre código e ID de selección. 2.144 fichas FotMob emparejan por ID y club (450 LaLiga, 445 Premier, 479 Serie A, 388 Bundesliga, 382 Ligue 1). Hay 20 IDs FotMob repetidos entre capturas de liga: evitar doble selección. No se han consultado proveedores.

## Resultado y autocontrol

- Nacionalidad en tabla, ficha y glosario, con código y contexto FotMob verificables. Recuperación por identidad/club y fecha; la actualización aprovecha la ficha que ya consulta, sin peticiones adicionales.
- Nueva vista Selecciones, enlace `?vista=selecciones&pais=ESP`, ranking con score primero y dibujo 4-4-2. Asignación de defensas polivalentes por puestos publicados, deduplicación por ID, 200 minutos inclusive y score cero admitido. Onces y bloques incompletos quedan pendientes.
- 2.144 registros FotMob enriquecidos; 2.134 fichas combinadas con país sobre 2.284. Por liga: LaLiga 450/440, Premier 445/445, Serie A 479/479, Bundesliga 388/388, Ligue 1 382/382 (proveedor/combinado). 104 países, 16 onces completos; 150 fichas sin país verificable. Diez fichas de complemento LaLiga no se fuerzan al catálogo principal.
- Comparación contra las once capturas previas: los seis JSON ajenos a FotMob permanecen idénticos. En los cinco FotMob y cinco combinados se eliminan únicamente los nuevos campos de nacionalidad para comparar; fútbol, posiciones, fechas y valores anteriores son idénticos. 2.284 scores/perfiles y medias de club conservados. JSON/SQLite preparados por etapas y país comprobado por ID en cada base.
- **0 jugadores nuevos, 2.134 fichas visibles enriquecidas con nacionalidad, 0 estadísticas de juego y 0 partidos actualizados**. Capturas originales del 14 de noviembre; cero consultas nuevas a proveedores. No se cuentan coberturas acumuladas como partidos modificados.

## Validación

- `node --test tests/*.test.cjs`: 26 archivos correctos, incluidos nueve casos nuevos de país y once (identidad, ámbito, ausencia, recuperación, duplicados, conflictos, versatilidad, 200 min, score cero y HTML seguro).
- Diez tests Python y compilación de importadores correctos. Cinco SQLite regenerados con nacionalidad en `stats_json` y correspondencia exacta por ID.
- Auditoría de scores: 2.284 equivalencias, 1.484 ajustes por tarjetas, 741 medias y 3.809 contribuciones. 1.502 scores válidos, 76 pendientes sobre el mínimo; recuperación de posiciones sin cambios. Auditoría de 82 métricas: 390.320 lecturas correctas.
- Worker compilado: 144 assets, 12 módulos y un bundle de 75.616 bytes gzip. SHA256 `4d8108e6778e6cc942a50df46a9acad57b5033ba0fc95bff91492ef3ec738634`. 106 cuerpos de assets idénticos; seis arranques reales del bundle en VM/DOM dobles incluyen el enlace a Francia y carga de las cinco ligas. Controlador comprobado: 104 opciones/16 completos, cambio España-Francia, tabla/ficha con país y score primero. No equivale a QA visual de navegador; falta `cua_repl.js` en el entorno managed.
- `check_collaboration_docs.py`, sintaxis y `git diff --check` correctos. `validate_data.py` sigue limitado por ausencia de la captura histórica `dist/downloads/statsbomb.json`, ajena a estos cinco conjuntos actuales; no se inventa ni se descarga para pasar ese check.
- Autocontrol sin hallazgos funcionales pendientes; no representa revisión independiente. Metadatos y países no acreditan permiso de reutilización ni elegibilidad definitiva.
- Evidencia local fuera de GitHub: `/workspace/scratch/grada-national-teams/verification.json`, `runtime.json`, `audit-scores.json`, `audit-metrics.json` y `node-tests-final.log`. Capturas/bases/Worker y secretos no se suben a GitHub.

## Integración y publicación

- [PR #53](https://github.com/estadisticasfutbolxg/grada-futbol/pull/53) integrado por squash; main GitHub verificado en `8607e174bb9a406b3df718778c49a38b8f8b6c89`. Base y blobs contrastados antes de aplicar los 22 archivos, sin sustituir cambios del colaborador. Sin checks/protecciones requeridos; autocontrol declarado, sin aprobar en nombre de otra persona.
- Push nativo confirmado por SHA remoto: `7a27e3ff55d8052e2e721690a22e60088a3298a5`. Archivo exacto `.openai/hosting.json` + Worker; código/generadores/documentación en GitHub, datos y bases excluidos.
- [Selecciones en GRADA privada](https://grada-futbol-analitica.ivanmatema2.chatgpt.site/?vista=selecciones), versión **29**, despliegue `appgdep_6b02b05ca4388191bdd02c6c83244d4e` en `succeeded` el 22 de noviembre de 2026, 10:05 Madrid. Versión `appgprj_6ae0b8b2eb1881918601230d00603255~appgver_c31067dc07188191847eea9228c4961a`; procedencia nativa exacta comprobada.
- HTTP posterior con autorización de servicio: HTML/bundle gzip exactos y cinco JSON FotMob con las nacionalidades y SHA256 esperados (450/445/479/388/382); no se consultan proveedores. Fuente sin identidad de visitante denegada 401, login antiguo 404 y `password_required:false`. Prueba positiva de propietario en tests, sin suplantar identidad. Evidencia `live.json`, sin guardar credenciales.
- Audiencia posterior owner-only `custom`, revisión **3**, un owner, cero editores/grupos/visitantes; variables runtime revisión **1** intactas. Sin contraseña adicional. El cierre documental posterior no cambia el Worker publicado.
