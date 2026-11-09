# 20261109 · Scores coherentes y totales por liga

- Estado: `active`
- Responsable: Codex, a petición del usuario
- Revisor: autocontrol; sin revisión independiente
- Rama: `fix/coherent-position-scores`
- Base GitHub: `b89103194514dabbc64188ed48d712f8db348ce6`
- Base local sincronizada con Sites: `285072efc7745042e42633d255e4ee3d5d746570`
- Entrega: PR, merge y publicación, con acceso público conservado

## Problema y criterio

El usuario observa scores distintos al pasar de vista y una defensa de Arsenal superior a la de sus defensores; pide revisar toda la lógica y los totales ausentes de asistencias/paradas.

Hallazgos: MED_ATT/MED_DEF sustituyen el score MED; los radares incompletos muestran un área como score aunque la tabla muestra guion; TEAM_DEFENSE usa un índice de estadísticas del equipo (Arsenal 0,931 en Premier) distinto del promedio de sus DEF (0,225). La referencia cambia al seleccionar liga. sumKnown oculta todo el total cuando falta un solo registro: en Todas hay 1.029 asistencias conocidas de 2.281/2.284 jugadores y 3.048 paradas de 131/136 porteros.

## Alcance y plan

1. Un modelo común calcula el score por POR/DEF/MED/DEL, con referencia de las ligas cargadas, muestra mínima y mismos ejes en todas las vistas. Seleccionar una liga filtra candidatos, sin recalcular referencias.
2. Los perfiles MED ofensivo/defensivo determinan únicamente un perfil estadístico dominante (equilibrados pueden aparecer en ambos). Conservan score MED; no se infiere una posición táctica. Sin ambos perfiles verificables, no se asigna subtipo.
3. Equipo general, defensa DEF, delantera DEL, medios y ataque (DEL + MED de perfil ofensivo) usan promedios de esos mismos scores por minutos. Radar de equipo muestra las medias por posición, sin un segundo índice independiente. Los promedios quedan entre mínimo y máximo de sus contribuyentes.
4. Mostrar sumas de asistencias y paradas publicadas aunque haya huecos, declarando subtotal/cobertura; conservar desconocidos y ceros reales.
5. Validar invariantes, casos citados, todas las ligas, tablas/fichas/comparador/rankings, móvil y refresco; regenerar derivados sin nuevas descargas. Subir, integrar y publicar.

Archivos compartidos: radar, squads, nuevo modelo scores, metrics, app/components/index, generadores, pruebas y definiciones. No hay otras tareas activas sobre estos archivos ni cambios previos. Se aplican Sites, grada-loop, grada-data y grada-review; helper Sites ausente, procedimiento Git conocido con credencial efímera por stdin. No se cambian prioridades de fuentes, permisos ni bases publicadas manualmente.

## Aceptación

- [x] Cada jugador conserva su score de posición en todas las vistas y selecciones de liga; muestras/ejes incompletos no generan un score público.
- [x] Todos los scores de equipos se reproducen con los scores/minutos mostrados; mismo valor en tarjeta, tabla, ficha y radar.
- [x] Asistencias/paradas visibles con cobertura, también en Todas y cuando haya valores ausentes.
- [x] Datos originales intactos, derivados reproducibles, pruebas y QA adecuados.
- [ ] PR integrado, publicación confirmada y resumen de jugadores/partidos afectados.

## Evidencia y relevo

Preparación: v13 pública confirmada; entorno listo, origen sincronizado y main GitHub comprobado. Capturas iniciales sitúan a Olise como DEL; las capturas del navegador del usuario pueden ser más recientes. Se corrige la lógica general sin afirmar haber reproducido esa misma captura privada.

Implementado el modelo común de SCORES.md. Referencia de ligas estable, caché de modelos invalidada por capturas, un score MED, perfiles estadísticos dominantes sin inferir posiciones y promedios con los mismos scores visibles. En porteros se conserva la alternativa de 2 PJ cuando no hay minutos; esa alternativa no acredita un filtro de 900 minutos ni se inventa un peso. Los MED sin perfil se declaran por separado. El HTML versiona módulos por hash para evitar mezclar código de dos publicaciones.

Evidencia del 9 de noviembre:

- Once archivos Node correctos, con seis pruebas específicas de invariantes del nuevo modelo; seis pruebas Python, sintaxis, py_compile, enlaces de 42 documentos y diff correctos. Validador StatsBomb: 64 partidos, 32 equipos, 681 registros y 234.637 eventos coherentes.
- Cinco JSON combinados regenerados con la misma referencia de cinco ligas; 22 ficheros originales JSON/SQLite conservan exactamente sus SHA256. No se descargan jugadores ni partidos nuevos. Se revisan 2.284 registros jugador/liga y 96 equipos, con 967 scores válidos y 1.317 pendientes por muestra/ejes. La referencia anterior y la actual difieren en 1.603 scores, contando los que ahora quedan pendientes por muestra insuficiente; no son modificaciones de estadísticas del proveedor.
- Auditoría real de 1.390 promedios con datos y 4.826 contribuciones a través de las seis vistas: pesos suman 1, cada contribución usa el score/minutos del jugador, el promedio queda entre mínimo y máximo, score local = score de Todas y los originales no mutan. Raphinha DEL 0,891945 y Olise DEL 0,754147, iguales en liga y Todas. Arsenal DEF 0,191576, frente al antiguo índice independiente 0,978555 en Todas.
- Totales por liga de asistencias/paradas: LaLiga 218/617; Premier 178/567; Serie A 240/725; Bundesliga 208/567; Ligue 1 185/572. Todas 1.029 asistencias (2.281/2.284 registros) y 3.048 paradas (131/136 registros elegibles). Las ausencias continúan desconocidas y la cobertura parcial queda visible.
- Chromium sobre el Worker exacto con ambas cachés denegadas: 66 cruces ranking/liga, orden/valores/conteos, asistencias/paradas con cobertura en las seis vistas, mismo MED en ranking/tabla/ficha/comparador, Raphinha/Olise en liga y Todas, Arsenal en ranking/contribuciones/radar, score parcial con guion, móvil sin desbordamiento y refrescos parcial 2/3 y fallido 0/11 sin cambios falsos. Sin errores de JS. Inspección visual de contribuciones, radar de equipo móvil y totales.
- Worker probado SHA256 `998f4e83d2ea118688597d7dfc80e551e148e8d6b7a058e96da382e70aa5decf`. Solo se enrutan capturas reales aisladas en QA; no se publican como una actualización de datos de hoy. No se ejecuta una actualización de estadísticas en producción. Autocontrol sin revisión independiente ni hallazgos pendientes. Falta registrar PR, merge y despliegue.
