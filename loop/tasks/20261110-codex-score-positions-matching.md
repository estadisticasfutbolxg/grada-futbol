# 20261110 · Scores completos, posiciones y cruce genérico

- Estado: `done`
- Responsable: Codex, a petición del usuario
- Revisor: autocontrol; sin revisión independiente
- Rama: `fix/score-positions-matching`
- Base GitHub: `33c1cdeab73494bff52b8d5ad8e83e1664c566e5`
- Base Sites: `84891da4107e3cbc90102f98b27cf8b1176703c6`
- Entrega: PR, merge y publicación

## Objetivo

Revisar todos los jugadores con minutos suficientes y score pendiente. Los ceros publicados deben contar como valores válidos, conservando la distinción con null. Revisar posiciones por evidencias de los proveedores e implementar cruce genérico de nombres con club, compatibilidad y unicidad; no completar ausencias inventando cero. Mantener un único score por posición y promedios coherentes de equipo.

## Alcance y coordinación

Combinación/identidades/posiciones, lectores y cálculo si la auditoría encuentra un defecto, explicaciones de score pendiente, pruebas y documentación. No hay cambios previos ni tareas activas solapadas. Aplicadas grada-loop, grada-data, grada-review y Sites; autorizaciones vigentes de Git/merge/publicación, audiencia pública conservada. El usuario solicita mantener las capturas actuales mientras gestiona permisos: se reutilizan las once capturas JSON del Site v16, sin consultas nuevas a proveedores. Entorno reabierto; fuente restaurada desde el repositorio nativo con credencial efímera por stdin. Las capturas, bases y secretos permanecen fuera de GitHub.

## Auditoría inicial

2.284 registros; 967 scores válidos. 79 jugadores con los minutos mínimos (450 campo/180 porteros) siguen sin score: 76 por métricas faltantes y 3 por muestra de un eje de otro proveedor insuficiente. Existen 281 discrepancias de posición entre proveedores, no equivalentes todas a errores. Vinícius (Understat 7008, ESPN 86:252107, FotMob 846033) está bien unido, pero MED por Understat frente a DEL de ambas fuentes restantes; como MED falta intercepciones, con 592 minutos principales y 585 de FotMob.

## Plan y aceptación

1. Auditar minutos propios, ceros, ausencias, posiciones y cruces; registrar criterios verificables.
2. Resolver variantes genéricas inequívocas y posiciones con evidencia y procedencia, conservando conflictos dudosos.
3. Probar ceros/duplicados/roles/coberturas y coherencia entre vistas; regenerar derivados con originales intactos.
4. Subir incrementos, integrar y publicar; comunicar jugadores/partidos afectados y pendientes reales.

- [x] Ceros publicados producen score válido cuando la muestra y los ejes son suficientes; null sigue desconocido.
- [x] Posiciones revisadas de forma general, con evidencia y procedencia; Vinícius calculado con el perfil adecuado.
- [x] Nombres compuestos, acentos e iniciales se unen solo con candidatos únicos en el mismo club y sin reutilizar una ficha.
- [x] Datos originales intactos; referencias y equipos usan los mismos scores por posición.
- [x] Pruebas, GitHub y publicación confirmados; recuento final y límites documentados.

## Incremento 1 · unión y posiciones

Implementados módulos puros identity/positions, cruce mutual único de tokens/iniciales/contracciones/alias publicados, barrera de IDs revisados y clasificación por consenso o ficha, independiente de los valores. Los nuevos importadores conservan posiciones Understat completas, alias ESPN y evidencia de posición/nombres FotMob. Añadida serialización JSON de posiciones en SQLite. Corregido el lector de posiciones Understat del Worker para compartir el parser (su regex anterior conservaba la cadena mixta entera).

La auditoría con originales intactos pasa de 967 a 994 scores: 27 recuperados; quedan 52 registros por encima del mínimo, 49 por ejes ausentes y 3 por minutos insuficientes en un proveedor de eje. Vinícius DEL ya tiene score (aprox. 0,396 con la referencia provisional actual). LaLiga une 481/487 filas; otras ligas mejoran sus enlaces ESPN. Se revisan las parejas genéricas recuperadas; no se permiten homónimos ni uniones por apellido con nombres completos incompatibles. Reglas especiales solo a nivel de diminutivos/transliteración general, sin nuevas excepciones de jugador.

Trece archivos Node pasan, incluidas pruebas de score cero, aportación ponderada cero, nulos, alias, acentos, orden asiático, iniciales, colisiones, permutación de plantillas, clubes/roles, posición y conservación de ceros de ficha. Pruebas Python y de SQLite verifican posiciones estructuradas y ceros. La primera prueba de claves señaló que keeper_long debía normalizarse a keeperlong: corregido y repetido. El validador histórico StatsBomb no puede ejecutarse en este entorno restaurado porque no contiene statsbomb.json/SQLite históricos; no se han cambiado sus importadores ni datos, ni se descargan partidas nuevas para un chequeo ajeno. Se validan las once capturas actuales con sus lectores originales y sus SHA256. Pendientes explicación de posición/muestras en UI, auditoría final, navegador y publicación.

## Incremento 2 · motivos, auditoría y QA

La ficha, comparador y columna Posición muestran proveedor, acuerdo y etiquetas alternativas. El guion del score y el radar indican la métrica ausente o los minutos exactos insuficientes de su fuente. El parser de posiciones acepta claves equivalentes sin depender de mayúsculas/separadores y rechaza propiedades heredadas. Las etiquetas mixtas no se cuentan como votos de una sola posición. Las pruebas de componentes confirman que un score exactamente cero se dibuja como 0,000, mientras una métrica ausente mantiene pendiente.

Auditoría detallada en [SCORE_REVIEW.md](../../docs/SCORE_REVIEW.md): 28 jugadores recuperan score y Alberto Moleiro pasa a pendiente al corregirse de DEL a MED por consenso ESPN/FotMob (falta intercepciones); balance +27, 967→994. Se revisan 65 posiciones frente a v16: 54 etiquetas conocidas cambian y 11 antes desconocidas se completan. Hay enlaces de proveedor mejorados en 147 registros. Los 52 pendientes incluyen 49 con ejes no verificados y tres con minutos propios de alguna métrica insuficientes. Todos los scores existentes y los equipos se recalculan con la misma fórmula y referencia común; las 11 capturas originales conservan SHA256, fechas y cifras. El recuento anterior de 27 recuperados describía el balance neto; el informe distingue altas y baja.

Chromium del Worker empaquetado verifica 30 combinaciones de ranking/ámbito, cinco ligas y Todas, posición/score de Vinícius iguales en tabla y ficha, dato recuperado de Pape Gueye, motivos de Moleiro y Gerard Moreno (434 min de FotMob), portada sin selector de unidades, enlaces /90, móvil y ausencia de errores JS. Auditoría de 1.406 promedios y 4.962 contribuciones, con igualdad de scores entre liga/Todas, generador y navegador. Una primera comparación de QA incluía la etiqueta GRADA debajo del valor: se corrigió el selector de lectura del test; no era un fallo de cifras. Se repite QA sobre el artefacto final tras endurecer posiciones mixtas. Revisión visual de escritorio/móvil, sin desbordamiento.

Primer incremento subido al [PR #29](https://github.com/estadisticasfutbolxg/grada-futbol/pull/29), head `f9a071a6ac30b11b671cf30448603f4f8f119c84`. Pendiente añadir esta revisión final, integrar y publicar. No hay revisión independiente. No se cambia el acceso público ni la contraseña/secretos de actualización.

Comprobación final de contratos: 14 archivos Node y siete pruebas Python correctos. Añadido el puente genérico de alias publicados desde una unión ESPN exacta/revisada hacia FotMob, con evidencia de nombres/IDs y sin propagar una coincidencia ambigua. Esto permite resolver apellidos alternativos cuando el nombre completo viene en la tercera fuente; no descarga alias nuevos ni inventa equivalencias. Los IDs revisados siguen fijados. Se comprueba que un alias de perfil con posición desconocida no borre una posición anterior verificada.

Artefacto final SHA256 `a157215e7ef25533b83fd92ddd116a76d30274036d4c7f083919238ae4e72db0`, 10 módulos, 33 assets, 1.577.346 bytes. Sin cambios posteriores de código; QA final del mismo Worker en curso, incluyendo comparador. Las capturas originales se conservan y los cinco derivados se regeneran con el modelo común. El informe identifica también el caso que pasa a pendiente, sin ocultar esa consecuencia de revisar posiciones.

## Entrega confirmada

El QA final del Worker `a157215e7ef25533b83fd92ddd116a76d30274036d4c7f083919238ae4e72db0` pasa 30 cruces de ranking/ámbito, 1.406 promedios, 4.962 contribuciones, comparador, motivos de pendientes y móvil; sin errores JS. Se mantiene la igualdad de scores entre generador, liga/Todas y vistas. Verificados también por HTTPS los SHA256 de los módulos identity/positions/radar/app realmente publicados. Sin descargas nuevas de fuentes; once originales intactos.

PR #29, head final `705d4dba5ac56cb7123ea4467bdb41f616554883`, integrado en `9fd9887f7ce71fe6b4f6a2275c5d96096e3e5324`, main verificado. GitHub mergeable clean, sin checks registrados; no se omiten protecciones. Fuente Sites `e530f649c79c5c8ef7dc3b1c150274c1b965b1d8`, versión **17** `appgprj_6ae0b8b2eb1881918601230d00603255~appgver_3d392a6796788191b81c487093442b4c`, despliegue `appgdep_6af35e0fa3148191a4b98a30589db9a0`, `succeeded` el 10 de noviembre a las 18:10:40 UTC (19:10 Madrid), revisión de entorno 1 y misma audiencia pública. URL: https://grada-futbol-analitica.ivanmatema2.chatgpt.site.

El informe lista los 28 scores recuperados, Moleiro pendiente y los 52 motivos pendientes; añade las 147 fichas con enlaces mejorados (sin sustituciones de IDs ni retiradas de enlaces anteriores). Se distinguen revisiones y datos nuevos: 0 jugadores/partidos nuevos descargados; se preservan las capturas mientras el propietario gestiona permisos. Cierre documental posterior sin volver a publicar un Worker idéntico.
