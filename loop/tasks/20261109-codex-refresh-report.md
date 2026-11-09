# 20261109 · Resumen de jugadores y partidos al actualizar

- Estado: `done`
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
- [x] Código subido, PR integrado y publicación nativa confirmada, conservando acceso público.

## Plan y evidencia

1. Comparar datos aceptados antes/después y separar cambios de cobertura.
2. Mostrar resumen y listas accesibles conservando el estado parcial.
3. Validar y subir/PR/integrar/publicar con identificadores reales.

Preparación: sin cambios previos; main GitHub consultado, Site público v12 y origen Sites sincronizado por fast-forward. Diez archivos Node correctos, incluidos cuatro casos del nuevo resumen: cambios reales/nuevos/cero, fechas/orden de claves sin cambios, denominadores, partidos por ID, cobertura desconocida y fallos. Validador StatsBomb correcto (64 partidos, 32 equipos, 681 registros y 234.637 eventos; sin regenerar datos). Sintaxis, diff y enlaces de 40 documentos correctos.

Chromium sobre el Worker exacto, con ambas cachés denegadas: liga individual y Todas, éxito 3/3, parcial 2/3 y fallo 0/11, cobertura por fuente, nombres de jugadores con cambios, repetición de idénticos datos con cero cambios, fichas fallidas conservadas, limpieza al cambiar liga, móvil sin desbordamiento y texto hostil escapado. Solo se enrutan capturas reales aisladas; no se publican datos ni resultados de QA. La primera consulta de las capturas ESPN de QA difiere de la captura inicial publicada y se informa como cambio real; la repetición demuestra cero modificaciones aunque cambie la fecha. Ningún error de JavaScript. Inspección visual de escritorio y móvil.

El navegador requirió el permiso de red del sandbox para arrancar Chromium (setsockopt denegado sin ese permiso); no es un error de la web. Autocontrol sin hallazgos pendientes ni revisión independiente. [PR #21](https://github.com/estadisticasfutbolxg/grada-futbol/pull/21) integrado mediante squash en `c16380b11b13e1b6b6a6fdad500d489e0215ce61`; main comprobado. Commit de la rama GitHub `0a9be630c2e477d7809f88da91adb4bdd8a9b8e6`. Sin checks remotos configurados para este commit; mergeable clean y SHA esperado comprobados. Fuente Sites subida y confirmada `113a7bd7fdbbbc27c6738f1b52d485aad707436d`.

Versión 13 `appgprj_6ae0b8b2eb1881918601230d00603255~appgver_23190f5aa6708191992b8db348574be3`; despliegue `appgdep_6af1918c14d481919c16112135340565`, succeeded el 9 de noviembre a las 10:25 Madrid. [GRADA pública](https://grada-futbol-analitica.ivanmatema2.chatgpt.site), acceso conservado. Artefacto con solo manifiesto y Worker, SHA256 de Worker `89fdc943a0be3cb819d316421e5d7bef9d970c0c0a758234b1d1cfd85caf946d`, exactamente el probado en Chromium.

No se ha ejecutado una importación nueva: siguen las capturas publicadas de los días 1/6/7/8, 2.284 registros jugador/liga y 96 equipos. Los cambios comunicados por las pruebas pertenecen exclusivamente al navegador aislado de QA. El flujo completo se verificó localmente y Sites confirmó la publicación; no se afirma haber ejecutado una actualización de datos en producción. Criterios terminados, sin aprobación pendiente ni procesos en segundo plano.
