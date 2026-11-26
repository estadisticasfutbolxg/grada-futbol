# Regresiones Fantasy para LaLiga

- Estado: `review`
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

Evidencias privadas `/workspace/scratch/grada-fantasy-regression/`: cruce, captura analítica, fichas, modelos, auditoría y pruebas/runtime. Entregas `/workspace/entregas/fantasy-regression-laliga-2026-27.*` y `fantasy-regression-input-laliga-2026-27.json`. Cero jugadores/partidos actualizados en los rankings principales. La captura analítica tiene cobertura de 129 partidos agregados; no se descargaron encuentros individuales. Pendientes PR, merge y publicación privada.
