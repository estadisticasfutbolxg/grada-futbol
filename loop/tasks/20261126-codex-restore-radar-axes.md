# Recuperar ejes y scores tras el bloque ofensivo

- Estado: `done`
- Responsable: Codex
- Revisor: autocontrol, sin revisión independiente
- Rama: `fix/restore-radar-axes`
- Base nativa: `e087aee862d719cadd7a40291bc8fb13b1df7ea9`
- Base GitHub: `34c83ed72aa41eb5571d6ff5a2c0d7bceaa9ea23`

## Objetivo y aceptación

- Restaurar ejes originales visibles y evitar reemplazos obligatorios tras extraer el bloque ofensivo.
- Ataque contabilizado una sola vez, pesos vigentes, muestras propias y ceros reales.
- Contrastar los 193 jugadores que perdieron score entre v39/v40; porteros sin cambios.
- Tests, auditoría real, PR/merge y publicación solo propietario verificados.

## Plan y alcance

Seleccionar los seis ejes originales antes de separar las métricas ofensivas. Conservar los ejes de cálculo no ofensivos y añadir un radar de presentación con las métricas originales y el bloque ofensivo, sin contar esas métricas dos veces. Actualizar modelo, interfaz, documentación y pruebas. Regenerar combinados desde capturas actuales; ninguna nueva consulta de proveedores. Conservar datos, posiciones, disciplina y medias de equipos/selecciones. Separar área visual y área usada para cálculo explícitamente. No hay cambios previos ajenos.


## Validación local

Modelo v8. Primero selecciona los ejes originales y después extrae el bloque ofensivo: no exige tiros u otras métricas que solo eran alternativas. `displayAxes` conserva el perfil original y añade goles/asistencias/xG/xA con muestra válida; `axes` conserva la parte no ofensiva de cálculo. Área visual y área de cálculo diferenciadas en fórmula, ficha, comparador y glosario. El número de ejes en tablas corresponde al radar visible. Ataque se cuenta una vez, conserva pesos por perfil y devuelve el peso de una métrica opcional ausente al bloque no ofensivo. No se usa cero para suplir ausencias.

35 archivos Node, 18 casos Python, ESLint sin avisos, Ruff, enlaces y diff correctos. Pruebas nuevas: selección anterior al reparto, no exigencia de tiros de respaldo, representación mixta de laterales, goles/asistencias en todos los perfiles de campo, ceros y ausencia de ataque en porteros. Auditoría real de 6.766 personas: 4.224 scores válidos, 393 pendientes sobre 200 min por datos/muestras obligatorios. Frente a v40 recupera exactamente los 193 IDs afectados, sin pérdidas; frente a v39 no pierde ninguno y habilita 7. Los 434 porteros conservan su score. 8.302 equivalencias entre ámbitos, 2.645 medias y 13.998 contribuciones verificadas; recuperación de carga/refresco sin cambios. 1.156.528 lecturas de métricas correctas. Dieciocho combinados regenerados desde las capturas existentes; 36 fuentes activas y archivo archivado idénticos por hash. Cero jugadores nuevos, estadísticas de origen o partidos actualizados.

Evidencia privada `/workspace/scratch/grada-restore-axes/`: auditorías, comparaciones v39/v40, tests y hashes. CSV con los 193 nombres en `/workspace/entregas/grada-scores-recuperados-2026-11-26.csv`, fuera de GitHub. Sin revisión independiente ni QA visual: helper de navegador no disponible. PR, merge y publicación privada verificados abajo.


## Entrega verificada

[PR #76](https://github.com/estadisticasfutbolxg/grada-futbol/pull/76) integrado en `3323495c847fc78ca68f8376e26fc3522a72c3c9`; quality success para head `5cd3acd7df00d8935b4b07127e4d37f91ac75f3a`, job 139708804658. Los doce archivos se comprobaron por SHA de blob frente al commit local. Tres arranques VM/DOM del Worker exacto cubren siete ejes visibles de Mbappé, etiqueta de tabla, goles/asistencias, ficha, comparación, selecciones y fallo de fuente. No sustituyen QA visual.

[GRADA privada](https://grada-futbol-analitica.ivanmatema2.chatgpt.site), **v41**, fuente nativa `37505bfef9e91d2d640ffb616bb0122ce18d247c`, despliegue `appgdep_6b07c0c4b1b4819192c7834aa2f068e5` succeeded. Worker SHA256 `d7c01b62a55ea359064b9ac730b94689864de88b6564e9c8af957784fe6353ce`, 373 assets, 12 módulos. HTTP confirma HTML/bundle exactos, 93.138 bytes gzip de cliente, 36 capturas idénticas, 42 rutas retiradas 400/404 y actualización sin identidad 401. Política custom revisión 3, solo propietario, cero editores/grupos/visitantes; runtime revisión 1. Evidencias `runtime-cups.json`, `live.json` y `build.log` en scratch privado.

Resultados frente a v40: 193 recuperados, cero pérdidas, 1.610 scores modificados por retirar requisitos alternativos y recalcular el área no ofensiva original; 434 porteros idénticos. Se conservan 393 scores pendientes entre personas sobre 200 minutos porque siguen faltando ejes obligatorios o su muestra propia: no se inventan valores. Cero jugadores nuevos, estadísticas de origen o partidos actualizados. No se descargaron proveedores ni se cambió la base de origen.
