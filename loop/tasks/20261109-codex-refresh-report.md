# 20261109 · Resumen de jugadores y partidos al actualizar

- Estado: `active`
- Responsable: Codex, a petición del usuario
- Revisor: autocontrol; sin revisión independiente
- Rama: `feat/refresh-completion-report`
- Base GitHub comprobada: `cf6afc2105499bd4b847957b42938a4cc284fa1b`
- Base local sincronizada con Sites: `b95862ab365b666525a458a91daf7a069201adff`
- Objetivo de entrega: merge y publicación

## Objetivo y alcance

Al terminar Actualizar datos, informar de jugadores y partidos actualizados, tanto en una liga como en Todas. Mostrar jugadores con cifras/contextos cambiados, nuevos y retirados, y sus nombres/equipos. Una fecha nueva sin cambios numéricos no es una modificación. Informar también en las entregas de futuras importaciones.

Los proveedores ESPN/FotMob entregan totales de temporada: se muestra su cobertura de partidos por separado, sin sumar proveedores ni afirmar que se actualizaron partidos individuales. Understat sí entrega registros por encuentro y permite listar nuevos/modificados. Se conservan fallos, fechas y datos anteriores. No se descargan nuevas estadísticas por esta tarea ni se modifican métricas, datos generados, permisos o audiencia.

Archivos: dist/refresh.js, app.js, index.html, style.css; pruebas, AGENTS.md y documentación del refresco. Ninguna otra tarea activa sobre estos archivos. Se aplica Sites y las skills locales grada-loop, grada-data y grada-review. El helper Sites no está instalado en esta imagen: se reutiliza el procedimiento Git documentado y credencial efímera por stdin, sin persistirla.

## Aceptación

- [x] Resumen visible al finalizar, con cifras por liga/fuente y listas de jugadores/partidos disponibles.
- [x] Sin duplicar jugadores entre fuentes, fechas solas no cuentan, fallos no cuentan como datos nuevos y desconocidos no son ceros.
- [x] Navegador, móvil, seguridad de texto externo y checks proporcionales correctos.
- [ ] Código subido, PR integrado y publicación nativa confirmada, conservando acceso público.

## Plan y evidencia

1. Comparar datos aceptados antes/después y separar cambios de cobertura.
2. Mostrar resumen y listas accesibles conservando el estado parcial.
3. Validar y subir/PR/integrar/publicar con identificadores reales.

Preparación: sin cambios previos; main GitHub consultado, Site público v12 y origen Sites sincronizado por fast-forward. Diez archivos Node correctos, incluidos cuatro casos del nuevo resumen: cambios reales/nuevos/cero, fechas/orden de claves sin cambios, denominadores, partidos por ID, cobertura desconocida y fallos. Validador StatsBomb correcto (64 partidos, 32 equipos, 681 registros y 234.637 eventos; sin regenerar datos). Sintaxis, diff y enlaces de 40 documentos correctos.

Chromium sobre el Worker exacto, con ambas cachés denegadas: liga individual y Todas, éxito 3/3, parcial 2/3 y fallo 0/11, cobertura por fuente, nombres de jugadores con cambios, repetición de idénticos datos con cero cambios, fichas fallidas conservadas, limpieza al cambiar liga, móvil sin desbordamiento y texto hostil escapado. Solo se enrutan capturas reales aisladas; no se publican datos ni resultados de QA. La primera consulta de las capturas ESPN de QA difiere de la captura inicial publicada y se informa como cambio real; la repetición demuestra cero modificaciones aunque cambie la fecha. Ningún error de JavaScript. Inspección visual de escritorio y móvil.

El navegador requirió el permiso de red del sandbox para arrancar Chromium (setsockopt denegado sin ese permiso); no es un error de la web. Autocontrol sin hallazgos pendientes ni revisión independiente. Pendiente registrar PR, merge y publicación.
