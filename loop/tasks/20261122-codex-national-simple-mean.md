# 20261122-codex · Media simple en selecciones

- Estado: `done`
- Responsable: Codex
- Revisor: autocontrol, sin revisión independiente solicitada
- Rama: `fix/national-scores-simple-mean`
- Base Sites: `0665c1062fe317721780a65f4807e0975f565a2a`
- Base GitHub: `8cfd08eeef6bc7dbf36ccb106db7b5e75877ee74`
- PR: [#57](https://github.com/estadisticasfutbolxg/grada-futbol/pull/57), integrado
- Entrega: merge y publicación privada autorizados

## Objetivo y alcance

Por petición expresa, eliminar la ponderación por minutos de los scores de selecciones: once, líneas y sistemas alternativos. Cada titular pesa 1/11 en el score global; cada integrante de una línea pesa igual dentro de ella. Mantener 200 minutos, scores canónicos, posiciones compatibles y siete sistemas; los scores de clubes siguen ponderados. Minutos visibles solo como muestra, no como peso o desempate de onces; para identidades repetidas se conserva la regla de escoger la ficha de más minutos sin sumar ligas.

Áreas: formaciones/selecciones, textos y contratos, pruebas. Sin otra tarea activa sobre estos archivos. Fuera de alcance: datos, fuentes, nuevas descargas, fórmula individual/club, audiencia o contraseña.

## Aceptación

- [x] Score global = suma de los once scores / 11 y líneas con su media simple; huecos conservan desconocido.
- [x] Elección de sistema y ranking por esa misma media; minutos no alteran valor ni desempate si siguen siendo elegibles y la identidad/ficha es la misma.
- [x] Textos, glosario y documentación coherentes; mínimo 200 y clubes preservados.
- [x] Pruebas e invariantes, GitHub/merge y publicación privada comprobados.

## Plan y evidencia

1. Sustituir agregado y revisar consumidores/textos.
2. Probar independencia de minutos, ceros, ausencias y datos reales sin alterar scores de jugador/club.
3. Integrar, publicar y comprobar audiencia/procedencia.

## Resultado y autocontrol

- Método `national_xi_balanced_mean_v3`. Media aritmética para once, líneas y alternativas; el ranking y sistema elegido usan la misma media. Se elimina el desempate de onces por minutos. Se mantienen asignación compatible, siete sistemas, 200 min y deduplicación por ID (ficha de más minutos, sin sumar muestras).
- Textos de portada de Selecciones, cobertura, detalle, glosario y contratos actualizados. Cada titular pesa 1/11; el global no se obtiene promediando las cuatro medias de líneas. Clubes mantienen su ponderación por minutos.
- Cobertura conservada: 104 países, 2.134 fichas con país y 17 onces completos. Cambian los 17 scores de selección; los sistemas de los onces completos siguen iguales con estas capturas. España 0,69415254, Francia 0,65431770. Se mantiene score primero, escudos y encaje por función.
- **0 jugadores, estadísticas, nacionalidades y partidos actualizados; cero consultas nuevas a proveedores**. Capturas, combinados y SQLite sin regenerar; datos/bases/secretos fuera de GitHub. Se compila solo el Worker con el cálculo actualizado.

## Validación real

- 27 archivos Node correctos. Regresión con minutos desiguales, independencia de score/sistema/identidades al variar minutos elegibles, medias por líneas, mínimo 199/200, ceros y ausencias. La media global se contrasta con la suma /11 y difiere de la ponderada del caso aislado; asignación y siete sistemas siguen verificados.
- Auditoría real: 108 medias alternativas completas, 134 bloques completos y orden de 17 selecciones por media simple. 2.284 scores/perfiles individuales y 96 scores de club idénticos a la base; los 16 JSON locales (once fuentes y cinco combinados) mantienen SHA256. Modelo sin mutar los datos.
- Worker: 145 assets/12 módulos, un bundle gzip de 77.959 bytes; SHA256 `3bf8e918a28bf67c3de597277f9d0c9307211ea810f7e8b686edf6d2582ee89b`. 108 assets exactos y seis arranques del bundle con VM/DOM dobles; Francia/España, fórmula actual, once escudos y clic a ficha correctos. Sin QA visual de navegador; no cambia el layout.
- Sintaxis, enlaces/documentación y diff correctos. `validate_data.py` sigue limitado por ausencia del histórico `dist/downloads/statsbomb.json`, ajeno a las capturas actuales; no se descarga ni inventa para pasar el check.
- Autocontrol sin hallazgos funcionales pendientes, sin revisión independiente. Evidencia local fuera de GitHub: `/workspace/scratch/grada-national-mean/audit.json`, `runtime.json`, `node-tests.log` y `before.json`.

## Integración y publicación

- [PR #57](https://github.com/estadisticasfutbolxg/grada-futbol/pull/57) integrado por squash; main GitHub comprobado `dc8186357573cb1dc61cc2924ee2ff58de0b8034`. Blobs de base contrastados antes de escribir, sin reemplazar trabajo ajeno. PR limpio y sin checks/protecciones requeridos; autocontrol, sin aprobación independiente inventada.
- Push nativo confirmado por SHA remoto `c9b086d527d5b95a1780ef6a8f32e28c998baf36`. Manifiesto y Worker exactos empaquetados, datos/bases/secretos fuera de GitHub.
- [Selecciones en GRADA privada](https://grada-futbol-analitica.ivanmatema2.chatgpt.site/?vista=selecciones), versión **31**, despliegue `appgdep_6b033d3380388191ad6260ee2ec174b6` en `succeeded`, 22 de noviembre de 2026, 20:06 Madrid. Versión `appgprj_6ae0b8b2eb1881918601230d00603255~appgver_48d33831e5a88191a04d09279b0f9a09`; fuente nativa exacta comprobada.
- HTTP posterior con autorización de servicio comprueba HTML/bundle por SHA256, método v3 y fórmula suma /11, más cinco capturas FotMob idénticas. Actualización sin identidad de visitante denegada 401, login antiguo 404 y `password_required:false`. Sin consultas de proveedores; flujo positivo del propietario comprobado en tests, sin suplantarlo. Evidencia `live.json` sin credenciales.
- Acceso posterior owner-only `custom`, revisión **3**, un owner y cero editores/grupos/visitantes; variables runtime revisión **1** intactas. Sin contraseña adicional. Cierre documental posterior sin cambiar el Worker publicado.
