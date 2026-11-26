# Regresiones Fantasy para LaLiga

- Estado: `done`
- Responsable: Codex
- Revisor: autocontrol, sin revisión independiente
- Rama: `feat/laliga-fantasy-regression`
- Base nativa: `3b9122bb9dc34f4e9bf31a9752844fd1bd764647`
- Base GitHub: `0e463b4854cc55087252976f4fc5bcce47d3d923`

## Objetivo

Cruzar puntos acumulados Fantasy con las métricas de los ejes del score de LaLiga, añadiendo amarillas, rojas y penaltis provocados. Un modelo por perfil del score, sección en GRADA e informe descargable. Solo participantes y estadísticas de la liga española: no sumar torneos ni otras ligas en la regresión. Mantener el score vigente.

## Plan y criterios

1. Cruce inequívoco por nombre publicado y club, auditable y sin duplicados.
2. Conservar fuente/fecha/minutos de cada eje; documentar desfases de partidos con Fantasy. Evitar puntos asignados a acciones como predictores de puntos totales.
3. Modelos por perfil con control de minutos, escalado y validación por equipos; coeficientes e incertidumbre, muestras insuficientes y colinealidad explícitos. Asociaciones, no causalidad.
4. Sección privada en GRADA e informe/archivos, pruebas, PR/merge y publicación verificada.

Se aplican skills de datos, loop, revisión y Sites. Sin cambios previos ajenos. Datos/modelos generados fuera de GitHub.


## Resultado local y metodología

Cruce conservador 474/488 con 618 filas Fantasy; 14 sin coincidencia única, sin forzar alias ni duplicar fichas. Siete cruzados no tienen perfil utilizable. Se obtiene una captura analítica FotMob independiente de 492 filas y 29 fichas de porteros verificadas para aproximar periodos; no se modifica el conjunto de estadísticas de GRADA. Las 36 capturas públicas de v42 conservan sus hashes y el score sigue en v9 sin cambios. La clasificación por perfil es la canónica de GRADA, pero los predictores y participantes son solo de LaLiga; no se suman copas ni otras ligas.

Puntos acumulados Fantasy como respuesta. Ejes en sus unidades reales, amarillas, expulsiones (roja directa + doble amarilla) y penaltis provocados de la misma captura Fantasy, por sus propios 90 minutos; nunca columnas *Pts. Control de minutos de exposición. Casos completos con ≥200 min, fechas ≤24 h y minutos a máx(5 min,1 %) de Fantasy; ceros publicados válidos, sin imputación. Los PJ se informan, no se equiparan porque hay mismos minutos con diferente PJ entre fuentes.

Siete modelos Ridge con 299 observaciones: POR 21, DEF 41, DEF_FB 59, MED 44, MED_DEF 29, MED_ATT 22, DEL 83. MED_BALANCED tiene 5: muestra insuficiente, sin coeficientes inventados. Cinco particiones externas por equipo y tres internas por equipo para alfa, con escalado dentro del entrenamiento. Comparación contra media y solo minutos, coeficientes estándar/originales, estabilidad de signo y colinealidad. OLS auxiliar con CR1 por equipo, t por equipos y q BH, solo cuando muestra/rango permiten estimarlo. Asociaciones condicionadas, no causalidad ni ajuste automático del score.

La web incorpora Análisis Fantasy, fijado a LaLiga, con gráficos de coeficientes/predicciones, valores, cobertura y exclusiones. Informe HTML completo sin dependencias ni scripts, JSON de resultados, CSV y JSON del cruce reproducible. Datos/modelos/capturas fuera de GitHub; generadores y requisitos versionados. `docs/FANTASY_REGRESSION.md` documenta fuentes, periodos, validación e interpretación. La sección representa capturas fechadas, no un reentrenamiento automático al refrescar otras vistas.

## Comprobaciones

37 archivos Node y 25 casos Python correctos; ESLint/Ruff, enlaces y diff correctos. Pruebas de identidad/club, cruces ambiguos, recuentos frente a puntos, casos completos, fechas/minutos, ceros, recuperación de relación estadística conocida, validación por clubes y muestras insuficientes. Requisitos de análisis fijados y añadidos al CI; no se incorporan dependencias científicas al Worker. Cuatro arranques VM/DOM del Worker exacto, incluido enlace `?vista=fantasy`, perfil ajustado/insuficiente, navegación y fallo de una fuente. Sin QA visual disponible ni revisión independiente. Auditoría de 299 predicciones, clubes de prueba disjuntos y hashes de 36 fuentes intactos.

Evidencias privadas `/workspace/scratch/grada-fantasy-regression/`: cruce, captura analítica, fichas, modelos, auditoría y pruebas/runtime. Entregas `/workspace/entregas/fantasy-regression-laliga-2026-27.*` y `fantasy-regression-input-laliga-2026-27.json`. Cero jugadores/partidos actualizados en los rankings principales. La captura analítica tiene cobertura de 129 partidos agregados; no se descargaron encuentros individuales. PR, merge y publicación privada verificados abajo.


## Publicación verificada

[PR #80](https://github.com/estadisticasfutbolxg/grada-futbol/pull/80) integrado en `96f266b161f4a97d8ea416faab2a8534e1c8f275`; quality success en head `81b1087068630473629c097b1851946aeeb8f9ba`, job 139755470818, con requisitos científicos instalados. Dieciocho archivos subidos por SHA de blob comprobado. 37 archivos Node y 25 casos Python correctos. El conjunto de entrada descargable coincide con `joined_sha256` del informe.

[GRADA privada](https://grada-futbol-analitica.ivanmatema2.chatgpt.site), **v43**, fuente nativa `e60e0a0679665e40929f774bcda3aa608efd842e`, despliegue `appgdep_6b07de9f74388191bd948196c6b55cf3` succeeded. Worker SHA256 `32028a1394f856e36e19dcb3dd51165f4f9c090631738a9921b1c104ca397e65`, 378 assets, 12 módulos. HTTP verifica HTML/bundle (98.454 bytes gzip), cuatro archivos analíticos exactos por hash, 36 fuentes principales intactas, 42 rutas retiradas 400/404 y actualización sin identidad 401. Política custom revisión 3 con solo propietario, cero editores/grupos/visitantes; runtime revisión 1. Cuatro arranques VM/DOM incluyen enlace directo `?vista=fantasy`. Sin QA visual ni revisión independiente.

MAE/R² de validación: POR 8,99/0,770; DEF 9,16/0,593; laterales 9,87/0,469; MED general 5,99/0,663; MED defensivo 5,64/0,848; MED ofensivo 14,68/0,546; DEL 8,77/0,839. Son resultados fuera de muestra por equipo, no ajuste de entrenamiento ni causalidad. Solo tres perfiles cumplen la regla de muestra para intervalos OLS; se declaran los otros. Ningún cambio en datos, partidos, scores o rankings principales. Captura analítica independiente de 492 fichas, 29 fichas de porteros y 129 partidos de cobertura agregada, sin archivos de encuentros individuales.
