# Recuperar ejes y scores tras el bloque ofensivo

- Estado: `review`
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

Evidencia privada `/workspace/scratch/grada-restore-axes/`: auditorías, comparaciones v39/v40, tests y hashes. CSV con los 193 nombres en `/workspace/entregas/grada-scores-recuperados-2026-11-26.csv`, fuera de GitHub. Sin revisión independiente ni QA visual: helper de navegador no disponible. Pendientes PR, merge y publicación privada.
