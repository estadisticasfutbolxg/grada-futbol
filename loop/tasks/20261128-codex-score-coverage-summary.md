# Cobertura del score en portada

- Estado: `done`
- Responsable: Codex
- Revisión: autocontrol y pruebas, sin revisión humana independiente
- Rama: `feat/score-coverage-summary`
- Base nativa: `781780d79cb1d644bab00ca8b070e49d9cec0f58`
- Base GitHub: `28a76c77f9617c599b04def64ea88d6800fc6c33` (PR #90 integrado, publicación pendiente)

## Alcance

Añadir resumen en página principal de jugadores con/sin score y razones. Usar perfiles canónicos de temporada completa para candidatos de competiciones seleccionadas. Recuento exclusivo por jugador, ceros válidos, separar minutos ausentes/bajo mínimo, identidad, posición, métricas y muestras de ejes. Desplegable de métricas ausentes con recuentos no aditivos. Sin recalcular ni cambiar pesos, sin nuevas descargas de estadísticas. Integrar y publicar junto a las correcciones #90 manteniendo acceso solo propietario.

## Criterios

Resumen visible y responsive en portada, actualizado con selección/capturas; total = con + sin, motivos = sin. Tasas y minutos propios sin mezclar competiciones. Pruebas del dominio y controlador, lint, build/Worker, PR y publicación privada verificadas.

## Implementación y comprobaciones

Resumen debajo de los totales de portada, con tres recuentos, barra con etiqueta accesible, motivos exclusivos y desplegable de ejes ausentes. Una pasada por perfiles ya calculados, sin reconstruir el modelo ni más peticiones; cambia al seleccionar competiciones o actualizar capturas. Mínimo200, score cero válido y muestra canónica liga+torneos. Diseño de dos columnas y una en móvil.

Auditoría real de todas las competiciones: 6.766 jugadores, 4.234 con score y 2.532 sin score: 2.149 por menos de200min, 12 por posición sin verificar, 277 por métricas ausentes, 73 por muestra de ejes y 21 por ambas. Suma de motivos2.532; no hay conflictos ni minutos desconocidos en esta captura. Es recálculo de cobertura, no nuevas estadísticas.

47 archivos Node correctos, ESLint y documentación correctos; pruebas de cero explícito, suma exclusiva, motivos combinados, vacío, minutos/posición de temporada frente a aparición aislada, cambio de captura, ubicación en portada y render seguro. El conjunto Python de28 casos y Ruff ya pasó en #90, sin cambios Python posteriores. No hay QA visual disponible; se verifica el Worker con VM/DOM.

## Publicación comprobada · 28 de noviembre de 2026

[PR #90](https://github.com/estadisticasfutbolxg/grada-futbol/pull/90) integrado con CI quality correcto (`28a76c77f9617c599b04def64ea88d6800fc6c33`). [PR #91](https://github.com/estadisticasfutbolxg/grada-futbol/pull/91) añade el resumen y está integrado con CI correcto (`acc3e98cc86f417aafe50ac09e322431ed8b4af1`).

Ambos publicados en **v48**, fuente nativa `6a989d3f06eec4644bc5d61fe3d88985572a81e2`, despliegue `appgdep_6b0a18f23354819184d281a3406a351e` succeeded. Worker SHA256 `c30582349fabb898314ff00b025ab61d0139d40f8713fa569648acab8b35c436`; bundle SHA256 `14afe1ff4e3a65491e3cd58e31bdcd62bbbb9f150bb2efd70c4393dc308bb584`, gzip108.668 bytes, 379 assets/12 módulos. Cuatro arranques VM/DOM del artefacto exacto comprueban también total6.766/con4.234/sin2.532 y suma de motivos, además de filtros y fallo de fuente. Sin QA visual disponible.

HTTP publicado: HTML y bundle coinciden con el artefacto local; resumen y cálculo presentes; cuatro informes y36 capturas originales iguales por hash,42 rutas retiradas400/404, actualización sin identidad401. Solo propietario, política revisión3 y entorno revisión1, sin editores ni visitantes. Ningún jugador ni partido descargado/actualizado; diez scores recuperados y referencias derivadas recalculadas, con fechas y pesos intactos.

Consulta del usuario sobre los12 pendientes de posición: en todos, la captura FotMob carece de posición/puesto detallado y no existe un registro ESPN enlazado con seguridad. No es un conflicto entre dos posiciones. No se asigna perfil por nombre o por score; las futuras fichas verificadas conservan el mecanismo de enriquecimiento existente.

Siguiente acción del usuario solo si el porcentaje fue borrado de su caché antes del arreglo: pulsar Actualizar datos una vez para recuperar la observación original. Cierre documental posterior sin reconstruir ni volver a publicar el mismo Worker.
