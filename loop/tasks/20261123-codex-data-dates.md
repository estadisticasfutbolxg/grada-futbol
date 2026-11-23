# 20261123-codex-data-dates · Fechas de los datos en cada vista

- Estado: `review`
- Responsable: Codex
- Revisor: autocontrol; sin revisión independiente
- Rama: `feat/source-data-dates`
- Base Sites: `a5b6ab9c4985b1673b1d1ab1b6b58ada10c371fd`
- Base GitHub main: `a17082a582d1a30198ca04a1767a4f8c3dc7e8e5`, comprobada al comenzar
- PR: pendiente
- Objetivo de entrega: merge y despliegue privado

## Objetivo

Mostrar las fechas reales de las capturas cargadas en todas las vistas, por liga y fuente. Separar las estadísticas de las fichas de identidad y el último intento de actualización para que un fallo no parezca una captura nueva.

## Alcance y coordinación

- Módulo de fechas, panel compartido, fichas y comparador; integración con el resultado de actualización existente y empaquetador.
- Documentación y pruebas de los estados observables. No hay otra tarea activa solapada.
- Sin nuevas consultas a proveedores, regeneración de datos, cambios de métricas/scores o permisos.

## Aceptación

- [x] Resumen compacto y detalle por liga/fuente en todas las vistas, incluidas Selecciones y Todas las ligas.
- [x] Fechas estadísticas, de fichas y del último intento diferenciadas; fallos conservan la fecha real. Zona Europe/Madrid y desconocidos explícitos.
- [x] Actualización, navegación, caché, fichas y comparador coherentes; capturas y scores intactos.
- [ ] Código subido, PR integrado y publicación privada comprobada.

## Iteración actual

### Plan

1. Resolver fechas a partir de metadatos y contextos de los datos ya cargados.
2. Presentar el resumen y registrar intentos válidos/fallidos en este navegador.
3. Validar contratos, runtime empaquetado, GitHub y publicación conservando la audiencia.

### Evidencia

- 28 archivos Node correctos; ocho casos de fechas: ceros, ausentes, contextos originales/tasas, identidad separada, Todas, escape HTML, horario estacional, historial inválido/acotado y almacenamiento bloqueado, navegación y refresco aceptado/fallido.
- Siete arranques del Worker exacto en VM/DOM dobles: cinco ligas, Todas/Selecciones, selección inicial, fuente fallida, captura guardada y caché recientemente consultada con menor cobertura. Panel visible y filas 3/2/11 según ámbito, fichas y comparador sin regresiones.
- Once peticiones de capturas siguen arrancando en paralelo; un único bundle gzip de 82.273 bytes. 109 igualdades de assets, 146 assets/12 módulos. Worker SHA256 `887bb282edc33e167d7bc14e71e26c8e42ec9cc2fbf1e3b71836ade6cbad7c1f`.
- Once fuentes originales verificadas por hash; cinco combinados también intactos. Scores idénticos frente a v32 en los siete arranques; sin regenerar JSON/SQLite ni consultar proveedores. **0 jugadores y 0 partidos actualizados**.
- Sintaxis JS/Python, documentación/enlaces y `git diff --check` correctos. Sin navegador/QA visual disponible; pruebas de DOM no comprueban layout. Evidencia privada local en `/workspace/scratch/grada-data-dates/`.

### Revisión

Autocontrol del diff y estados de refresco realizado: fechas proceden del snapshot visible, identidad separada y datos conservados tras fallos. Texto dinámico escapado, historial acotado, sin endpoint ni permiso nuevo. Sin revisión ni aprobación independiente.

### Resultado y relevo

Validado localmente; GitHub y publicación pendientes. Sin nuevos datos descargados.
