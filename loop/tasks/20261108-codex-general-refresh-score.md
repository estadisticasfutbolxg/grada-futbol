# 20261108 · Actualización general, scores y orden de rankings

- Estado: `active`
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
- [ ] Pruebas, GitHub/merge y publicación confirmados.

## Evidencia y siguiente paso

Preparación: Site público v10 y entorno listo. Se aplican Sites, grada-loop, grada-data y grada-review.

- Descargadas realmente 2.285 fichas FotMob el 8 de noviembre; 2.194 aceptadas por los contratos de ID/club/temporada, con posiciones explícitas como único dato cuando la competición numérica no coincide. No se publican fixtures ni respuestas de QA como datos nuevos.
- Combinado: 2.284 registros y 96 equipos, 1.829 con pases completados publicados y 128 porteros con xGOT atribuido. Quedan 58 posiciones desconocidas y valores sin respaldo; no se inventan. Bajo demanda, todas las fichas aplicables se vuelven a consultar con caché y límites.
- Cinco importaciones ampliadas JSON/SQLite exactas en stats_json e integrity_check; derivados de promedios, minutos y contribuciones comprobados en todos los equipos. La suma ponderada de contribuciones reproduce cada promedio.
- Lectores de servidor reproducen exactamente los cinco conjuntos FotMob originales y Understat guardado; suma compensada conserva los totales de Python. Understat respondió mantenimiento; FotMob HTML y fichas respondieron con datos. ESPN conserva su adaptador.
- Nueve archivos Node y seis pruebas Python correctos. Casos de minutos/ceros/desconocidos, xGOT emparejado, score POR sin duplicar goles evitados, identidad/temporada, métodos/origen/SSRF, caché/deduplicación, fallo conservando captura válida y assets Worker. Sintaxis y documentación correctas.
- Chromium sobre el Worker compilado: 66 cruces (11 rankings × seis ámbitos), agrupación 5 jugadores/6 equipos, KPI por métrica y roles por score, delantera ponderada, contribuciones/pesos, PSxG/eficacia en radar POR, ausencia de descargas, móvil sin desbordamiento, actualización de todas las fuentes (10/11 con Understat en mantenimiento) y fallos conservando datos/orden. Inspección visual de fichas móvil y agrupación. Sin errores de JS. Las consultas de QA usan cachés reales aisladas y no alteran los paquetes de datos publicados.
- Autocontrol sin revisión independiente. Pendiente registrar subida/PR/merge y despliegue con IDs reales.

## Petición sobre otras competiciones

FotMob/ESPN ofrecen también competiciones europeas y copas; las fichas verificadas mostraron LaLiga y Champions. No se han importado nuevas competiciones: hay que verificar sus mismas métricas/cobertura antes de habilitarlas. La consulta del usuario se respondió sin inventar datos ni añadir torneos parcialmente comparables.
