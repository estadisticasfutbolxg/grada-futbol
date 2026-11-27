# Cobertura del score en portada

- Estado: `review`
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
