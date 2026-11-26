# Perfil MED defensivo y regresión con variables correlacionadas

- Estado: `done`
- Responsable: Codex
- Revisor: autocontrol, sin revisión independiente
- Rama: `feat/midfield-defensive-correlated-regressions`
- Base nativa: `691cef55a05a1c240edc4245cce4badfe3bbefdf`
- Base GitHub: `cf3dbd466ce5be9c8a6deca8f678b94e8fb74356`

## Objetivo y criterios

Incorporar MED equilibrados al perfil defensivo, retirando su categoría en scores, rankings, equipos, selecciones y regresiones. Auditar elegibilidad para evitar pérdidas de score por requisitos nuevos. En regresiones: diagnóstico de correlaciones por perfil, grupos de variables con |Pearson r| ≥ 0,80 y reparto algebraico del efecto del grupo. Solo minutos, ejes del score, amarillas, rojas y penaltis provocados; equipos únicamente para validación/errores agrupados, nunca predictores.

## Plan

1. Reclasificar con un criterio único y verificar scores/equipos/selecciones.
2. Aprender grupos dentro de cada entrenamiento, sin encadenar variables débilmente relacionadas; proteger minutos como control independiente.
3. Repartir el coeficiente sobre miembros estandarizados conservando la predicción, y contrastar incertidumbre por grupo.
4. Regenerar con las capturas existentes, pruebas/auditoría, PR/merge y publicación privada.

Se usan skills de datos, revisión, loop y Sites ya leídas. Sin cambios previos ajenos. No descargar nuevos proveedores por esta tarea.

## Ampliaciones expresas del usuario

- Coeficientes para orientar pesos de ejes distintos por perfil, no imponer igual peso a goles en DEF/DEL. Se presentan pesos orientativos positivos normalizados de ejes, sin minutos/extras, separados de scores actuales.
- Adaptar visualización: sectores de ángulo proporcional al peso y área exacta de aportación al score vigente; radar regular descriptivo desplegable. No sustituir automáticamente pesos por un modelo exploratorio.

## Resultado preparado y validación

- 95 antiguos equilibrados pasan a MED_DEF; sus 95 scores siguen válidos. Comparación de 6.766 identidades: cero scores perdidos y cero cambios en los demás jugadores. Se regeneran 18 combinados, sin modificar 36 capturas de origen.
- Auditoría: 4.224 scores válidos, 393 pendientes legítimos sobre mínimo; 8.302 comprobaciones entre vistas, 2.626 medias y 13.756 contribuciones de equipo coherentes. Recuperación de posiciones/capturas: sin pérdidas ni cambios.
- Sectores con pesos vigentes: 4.224 descomposiciones verificadas contra el score final con precisión 1e-12. Radar descriptivo disponible; equipos mantienen promedios.
- Siete modelos, 304 casos completos; muestras por perfil 21/41/59/44/34/22/83. Pearson umbral 0,80 con complete-link y signos compatibles; minutos separado. En el ajuste final se agrupan paradas/eficacia xGOT (POR), grandes ocasiones/xA (MED_ATT), conversión/goles (DEL). Los grupos de cada fold pueden diferir.
- Reparto firmado igualitario conserva predicciones e intercepto; OLS y q por grupo, no por miembro duplicado. Pesos orientativos solo de contribuciones positivas de ejes; no son pesos ya aplicados ni efectos causales.
- 37 archivos Node y 28 pruebas Python correctos; ESLint y Ruff correctos. Fixtures sintéticas aisladas para signo negativo, no encadenamiento, minutos protegido, predicción exacta y coeficientes específicos por perfil. Auditorías con capturas reales.
- Browser QA no disponible en este entorno; comprobación de Worker compilado con VM/DOM y HTTP, sin afirmar revisión visual.
- No se descargan jugadores ni partidos nuevos. Cambian perfiles/scores derivados, gráficos y modelos; las cifras/capturas originales permanecen.

Integración y publicación confirmadas: [PR #82](https://github.com/estadisticasfutbolxg/grada-futbol/pull/82), CI quality correcto, squash `549c3fa567f534c8305223caa2428cbdb34b7745`. Los 25 blobs enviados fueron contrastados con la base y verificados por hash. Fuente nativa `4ff3fdc68309e6ca5b810a61c6615c33aa47dd87`, push remoto confirmado.

**Sites v44**, despliegue `appgdep_6b0823c67bac8191ad7045b0278cacd9` succeeded; Worker SHA256 `697ab8b66f7c5efb3c1651c42b30053153a3f934f5d7191ae4fbca9aeef3cb35`, 378 assets/12 módulos y 9.808.137 bytes. [GRADA privada](https://grada-futbol-analitica.ivanmatema2.chatgpt.site). Política custom revisión 3, un propietario y cero editores/grupos/visitantes, runtime revisión 1, sin cambios.

HTTP publicado: HTML y bundle exactos (gzip 100.705 bytes), cuatro artefactos Fantasy correctos, siete modelos/304 casos, 36 capturas iguales por hash a v43, 42 rutas retiradas 400/404, actualización sin identidad 401. Cuatro arranques VM/DOM del Worker exacto correctos; no QA visual. Sin jugadores ni partidos descargados; solo 95 scores/perfiles derivados cambiados y recálculo de modelos/gráficos. Cierre documental posterior, sin necesidad de otro despliegue idéntico.
