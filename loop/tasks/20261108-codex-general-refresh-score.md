# 20261108 · Actualización general, scores y orden de rankings

- Estado: `done`
- Responsable: Codex, a petición del usuario
- Revisor: autocontrol; sin revisión independiente
- Rama: `feat/general-refresh-score`
- Base GitHub comprobada: `ee155f96174dc636a57a230714c8c3e5836e4004`
- Base local/Sites sincronizada: `b2d1d7971e0976b03f6afe083816665556e070d3`

## Objetivo y alcance

Quitar los enlaces SQLite, ampliar el botón a todas las fuentes usadas (ESPN, Understat y FotMob), llamar Score de jugador al área individual y Score de equipo al promedio ponderado por minutos, y ordenar los rankings de jugadores antes que los de equipos tanto en inicio como en selector. Conservar la fórmula individual, datos reales, prioridad, ámbitos y permisos. El usuario sustituyó las sumas de equipos por promedios ponderados, pidió Mejor delantera y aprobó añadir xGOT al score del portero. No hay cambios previos sin guardar ni otras tareas activas sobre este incremento.

Para consultar Understat/FotMob sin restricciones CORS del navegador se prepara un Worker en el mismo Site. Solo permite consultas de lectura a rutas y ligas fijas, con validación, límites, caché y conservación de la última captura válida. El cliente no recibe credenciales ni acceso de escritura a GitHub. El generador y los artefactos de datos permanecen fuera de GitHub.

## Plan y criterios

1. Retirar descargas de la UI y cambiar etiquetas sin cambiar fórmulas; agrupar jugadores antes que equipos.
2. Reutilizar contratos de proveedores para consultas de lectura en servidor y actualización parcial segura del navegador.
3. Verificar equivalencia con capturas reales y casos de fallo, seguridad, navegador y móvil.
4. Subir/PR/integrar/publicar y registrar los identificadores reales.

- [x] Sin enlaces de descarga; Score de jugador y promedios de equipo/delantera/centrocampo ponderados por minutos.
- [x] Rankings de jugadores seguidos de equipos en inicio y selector; KPI por su métrica y rankings generales por score, conservando el orden al actualizar.
- [x] Botón general consulta las fuentes aplicables, conserva fallos y fechas y recalcula combinaciones y scores.
- [x] Consultas limitadas a fuentes/ligas/plantillas fijas, sin secretos ni escrituras públicas de datos del visitante.
- [x] xGOT recibido y eficacia vs xGOT en score POR; revisión de guiones, pases y posiciones con datos reales.
- [x] Pruebas, GitHub/merge y publicación confirmados.

## Evidencia y siguiente paso

Preparación: Site público v10 y entorno listo. Se aplican Sites, grada-loop, grada-data y grada-review.

- Descargadas realmente 2.285 fichas FotMob el 8 de noviembre; 2.194 aceptadas por los contratos de ID/club/temporada, con posiciones explícitas como único dato cuando la competición numérica no coincide. No se publican fixtures ni respuestas de QA como datos nuevos.
- Combinado: 2.284 registros y 96 equipos, 1.829 con pases completados publicados y 128 porteros con xGOT atribuido. Quedan 58 posiciones desconocidas y valores sin respaldo; no se inventan. Bajo demanda, todas las fichas aplicables se vuelven a consultar con caché y límites.
- Cinco importaciones ampliadas JSON/SQLite exactas en stats_json e integrity_check; derivados de promedios, minutos y contribuciones comprobados en todos los equipos. La suma ponderada de contribuciones reproduce cada promedio.
- Lectores de servidor reproducen exactamente los cinco conjuntos FotMob originales y Understat guardado; suma compensada conserva los totales de Python. Understat respondió mantenimiento; FotMob HTML y fichas respondieron con datos. ESPN conserva su adaptador.
- Nueve archivos Node y seis pruebas Python correctos. Casos de minutos/ceros/desconocidos, xGOT emparejado, score POR sin duplicar goles evitados, identidad/temporada, métodos/origen/SSRF, caché/deduplicación, fallo conservando captura válida y assets Worker. Sintaxis y documentación correctas.
- Chromium sobre el Worker compilado: 66 cruces (11 rankings × seis ámbitos), agrupación 5 jugadores/6 equipos, KPI por métrica y roles por score, delantera ponderada, contribuciones/pesos, PSxG/eficacia en radar POR, ausencia de descargas, móvil sin desbordamiento, actualización de todas las fuentes (10/11 con Understat en mantenimiento) y fallos conservando datos/orden. Inspección visual de fichas móvil y agrupación. Sin errores de JS. Las consultas de QA usan cachés reales aisladas y no alteran los paquetes de datos publicados.
- Autocontrol sin revisión independiente. [PR #18](https://github.com/estadisticasfutbolxg/grada-futbol/pull/18) integrado en `d02de01d596b09ebf748dacf4daacf58fc54548b`. Fuente Sites `f4255b529e29e7b1a0ace9d9a7663d65f799e932`, versión 11 `appgprj_6ae0b8b2eb1881918601230d00603255~appgver_d1fff02fa06c8191a9afffa179df46ea`, despliegue `appgdep_6af0c7ace7f08191b32c84ce1800fcda`, succeeded a las 20:04 Madrid del 8 de noviembre. El incremento incluye código y generadores; no datos ni bases en GitHub.

## Corrección tras publicación: selector solo con Ligue 1

El usuario comunicó que solo aparecía la liga francesa. Los logs nativos de producción mostraron «This Worker is not permitted to access the default cache» al cargar las capturas de otras ligas. El acceso a caches.default interrumpía esas peticiones.

- Se elimina todo acceso a la caché por defecto. La caché con nombre es opcional; cualquier denegación se resuelve con memoria acotada (16 MiB/256 entradas, caducidad y descarte de las más antiguas). Se guardan cuerpos y cabeceras como valores, sin reutilizar streams entre peticiones. Las capturas incluidas se sirven aunque no exista Cache API.
- Regresión: caches.default y caches.open lanzan errores, y las cinco capturas devuelven 200; un fallo de actualización devuelve 503 controlado, sin consultar la caché por defecto. Chromium sobre el Worker compilado confirma las seis opciones, rankings 5/6, ausencia de descargas y defensas por score en ese mismo entorno de denegación.
- [PR #19](https://github.com/estadisticasfutbolxg/grada-futbol/pull/19) integrado en `75e9862567c651ffba1c9081e225bcec02a4296c`; main comprobado. Fuente Sites subida y verificada: `6a95dd7ffc998d1c55e4428142ac4c6943b6d52e`. Worker SHA256 `a32d0e17418e4950f309cb9b613f4756728ceff223572286e6410d2cda69ed44`; archivo de publicación comprobado con solo manifiesto y Worker.
- Versión 12 `appgprj_6ae0b8b2eb1881918601230d00603255~appgver_d59b78eb94808191847c8da5ea89e336`, despliegue `appgdep_6af0ca68f4588191b8ff3ccb64115ec9`, succeeded a las 20:16 Madrid del 8 de noviembre. [Web pública](https://grada-futbol-analitica.ivanmatema2.chatgpt.site); audiencia e invitaciones conservadas.
- Límite de comprobación externa: el cliente HTTP de este entorno recibe un bloqueo 1010 del borde y Chromium rechaza la CA del proxy antes de cargar la aplicación. No se desactiva TLS. Los logs consultados después de publicar no contenían peticiones nuevas: no se presenta ese resultado como una prueba visual de producción. Sí están comprobados el estado nativo de publicación y el comportamiento del artefacto exacto con la caché denegada.

Resultado: criterios entregados y publicación confirmada. No queda un paso de aprobación pendiente. Una nueva incidencia se retoma con sus logs y versión; Understat conserva su última captura válida mientras responde mantenimiento.

## Petición sobre otras competiciones

FotMob/ESPN ofrecen también competiciones europeas y copas; las fichas verificadas mostraron LaLiga y Champions. No se han importado nuevas competiciones: hay que verificar sus mismas métricas/cobertura antes de habilitarlas. La consulta del usuario se respondió sin inventar datos ni añadir torneos parcialmente comparables.
