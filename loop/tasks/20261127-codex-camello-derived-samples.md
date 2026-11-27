# Camello y métricas publicadas borradas al recuperar fichas

- Estado: `done`
- Responsable: Codex
- Revisión: agentes y autocontrol, sin revisión humana independiente
- Rama: `fix/reported-conversion-refresh`
- Base nativa: `7a291aa2ae7d46b4f7d35d5ebc98586c23f96418`
- Base GitHub: `7e2ebe1849b6bdd904f52a858f3375ce4fb2eb16`

## Diagnóstico reproducido

El usuario ve a Sergio Camello sin score tras actualizar. Captura publicada: DEL, ID FotMob980422, 771min y score0,529455. En la captura analítica reciente real de LaLiga tiene861min y conversión26,9% publicada; al recuperar tiros26 de una ficha anterior con771min/12PJ, deriveCounts borra la conversión porque goles y tiros no tienen la misma muestra. No hay colisión de ID ni partidos de copas para esta identidad.

## Alcance

Preservar métricas publicadas independientes con su propia procedencia/muestra; mantener invalidación de derivados obsoletos y prohibir cocientes de muestras mezcladas. Corregir genéricamente restore/apply, no poner cifras a mano ni relajar mínimos/perfiles. Auditar otros jugadores, cuantificar sobre capturas reales disponibles y separar simulaciones. Conservar fuentes y datos/capturas actuales; no importar estadísticas nuevas por un arreglo de código. Pruebas, PR/merge y publicación privada.

## Reparto

Agente dominio: profiles.js y nueva prueba profile-derived-preservation.test.cjs. Coordinador: auditoría de casos/score, pruebas integradas, revisión y publicación. Ninguna otra tarea activa.

## Ampliación expresa y auditoría general

El usuario pide revisar todos los scores pendientes con minutos suficientes. Auditoría de dieciocho competiciones y los 4.617 jugadores con al menos 200 minutos: 4.224 con score y 393 pendientes antes del cambio. Segundo fallo localizado en agregación: el cociente de recuentos con minutos desconocidos sustituía el porcentaje parcial válido y ocultaba su muestra. Se preserva el porcentaje con minutos/ cobertura propios; se recuperan 10 scores publicados sin perder ninguno (4.234 válidos, 383 pendientes). Nombres y razones completos en auditoría local; casos nuevos: Kang-In Lee, Kubo, De Cuyper, Chukwueze, Beste, Duranville, Flávio Gonçalves, Ioannidis, Serra y Camara.

Pendientes legítimos restantes: 277 con métricas ausentes, 73 con muestras insuficientes, 21 con ambas y 12 sin posición publicada. No se encontraron otras alternativas FotMob de eje válido con 200 minutos en los registros de origen. Dos porteros tienen porcentaje ESPN con PJ, pero siguen sin otros ejes necesarios; no se cambia la definición para forzar score.

Reproducción de refresco con capturas reales locales más recientes: la recuperación borraba 322 porcentajes de conversión en LaLiga y eliminaba 60 scores. Camello: 861 minutos, conversión publicada26,9% de861min; antesnull, tras corrección0,451232 en la referencia con ambas correcciones. Esta prueba no es una actualización de datos publicados ni afirma que esos 322 falten actualmente en cada navegador. Los 18 conjuntos publicados autorrecuperados sin cambios son iguales antes/después.

Además se corrigen dos etiquetas reales omitidas al extraer fichas: grandes ocasiones creadas (`big_chance_created_team_title`) y tiros a puerta (`ShotsOnTarget`), incluida la tasa /90 explícita sin depender del mapa de tiros. Análisis local: 2.494 perfiles aceptados de 2.618 archivos revisados, 96 solo posición por competición distinta y 28 rechazados; 1.365 ítems de grandes ocasiones y 16 de tiros a puerta antes omitidos. Son mejoras de cobertura del parser para futuras consultas verificadas, no 1.381 scores nuevos ni una importación. Se mantienen comprobaciones de ID/club/temporada y se rechazan inferencias de cero por ausencia.

## Validación final

- `npm test`: 46 archivos, 46 correctos; incluye preservación de porcentajes/cero explícito, invalidación de derivados, alias de ficha y conversión entre competiciones con muestras parciales.
- `npm run lint`, Ruff, 28 pruebas Python, documentación y `git diff --check`: correctos.
- Dieciocho combinados regenerados desde las mismas capturas, método `role_fairplay_radar_v12`. Pesos, calibración y fórmulas de radar intactos. Auditoría: 6.766 identidades, 4.234 scores, 383 pendientes sobre mínimo; 8.302 comprobaciones de score, 6.766 perfiles, 3.881 ajustes de disciplina, 2.626 promedios y 13.816 contribuciones correctas.
- Capturas publicadas: 4.224→4.234 scores, diez recuperados, cero perdidos; 198 contextos de conversión corregidos y 1.068 scores cambian al recalcular las referencias. No implica actualización de partidos o estadísticas de origen.
- Reproducción conjunta con capturas reales locales: 4.173→4.241 scores, 68 recuperados y cero perdidos; 322 porcentajes preservados. Es simulación offline de refresco, no importación publicada. El caso Camello conserva26,9%/861min y score0,451232 con esa referencia.
- Revisión técnica cruzada sin hallazgos bloqueantes, sin revisión humana independiente. No se relajan identidad, posición, mínimos ni cobertura.
- El validador histórico `validate_data.py` no aplica al catálogo actual y falla por ausencia previa de `dist/downloads/statsbomb.json`; ninguna captura StatsBomb se ha modificado. La auditoría de competiciones actuales y sus pruebas sí pasan.
- No se han descargado jugadores ni partidos nuevos; las 36 capturas originales y sus fechas se conservan. Si un refresco previo borró el porcentaje de la caché local, se requiere un refresco del propietario para consultar de nuevo el valor publicado: no se reconstruye con muestras mezcladas.

Worker exacto: cuatro arranques VM/DOM (ideal, Fantasy, selecciones y fallo de fuente), selectores/detalles/equipos y score canónico liga/copa correctos. Referencia completa6.766, 36 consultas de fuente, máximo6 simultáneas; fallo controlado17/18. SHA256 `7f32bc87dc23b58c2b242f7adb1978bc8c842df456115d7c5a5d005976ba9d44`, 379 assets/12 módulos, 9.832.261 bytes; bundle gzip107.544. Sin QA visual disponible.

## Publicación comprobada · 28 de noviembre de 2026

[PR #90](https://github.com/estadisticasfutbolxg/grada-futbol/pull/90) integrado con CI quality correcto (`28a76c77f9617c599b04def64ea88d6800fc6c33`). [PR #91](https://github.com/estadisticasfutbolxg/grada-futbol/pull/91) añade el resumen y está integrado con CI correcto (`acc3e98cc86f417aafe50ac09e322431ed8b4af1`).

Ambos publicados en **v48**, fuente nativa `6a989d3f06eec4644bc5d61fe3d88985572a81e2`, despliegue `appgdep_6b0a18f23354819184d281a3406a351e` succeeded. Worker SHA256 `c30582349fabb898314ff00b025ab61d0139d40f8713fa569648acab8b35c436`; bundle SHA256 `14afe1ff4e3a65491e3cd58e31bdcd62bbbb9f150bb2efd70c4393dc308bb584`, gzip108.668 bytes, 379 assets/12 módulos. Cuatro arranques VM/DOM del artefacto exacto comprueban también total6.766/con4.234/sin2.532 y suma de motivos, además de filtros y fallo de fuente. Sin QA visual disponible.

HTTP publicado: HTML y bundle coinciden con el artefacto local; resumen y cálculo presentes; cuatro informes y36 capturas originales iguales por hash,42 rutas retiradas400/404, actualización sin identidad401. Solo propietario, política revisión3 y entorno revisión1, sin editores ni visitantes. Ningún jugador ni partido descargado/actualizado; diez scores recuperados y referencias derivadas recalculadas, con fechas y pesos intactos.

Consulta del usuario sobre los12 pendientes de posición: en todos, la captura FotMob carece de posición/puesto detallado y no existe un registro ESPN enlazado con seguridad. No es un conflicto entre dos posiciones. No se asigna perfil por nombre o por score; las futuras fichas verificadas conservan el mecanismo de enriquecimiento existente.

Siguiente acción del usuario solo si el porcentaje fue borrado de su caché antes del arreglo: pulsar Actualizar datos una vez para recuperar la observación original. Cierre documental posterior sin reconstruir ni volver a publicar el mismo Worker.
