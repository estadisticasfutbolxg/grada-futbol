# 20261123-codex-data-dates · Fechas de los datos en cada vista

- Estado: `done`
- Responsable: Codex
- Revisor: autocontrol; sin revisión independiente
- Rama: `feat/source-data-dates`
- Base Sites: `a5b6ab9c4985b1673b1d1ab1b6b58ada10c371fd`
- Base GitHub main: `a17082a582d1a30198ca04a1767a4f8c3dc7e8e5`, comprobada al comenzar
- PR: [#61](https://github.com/estadisticasfutbolxg/grada-futbol/pull/61), integrado en `72db1ee14e3b88896f16cbdffdcc62338b01ddcb`; main comprobado
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
- [x] Código subido, PR integrado y publicación privada comprobada.

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

Código subido y PR #61 integrado tras verificar head/base, mergeable clean y ausencia de checks/protecciones configurados. No se registra aprobación de otra persona.

Publicación **33** privada confirmada el 23 de noviembre de 2026, 15:42 Madrid. Fuente Sites `6cefee078c8dc02426a5a19a8ed06241e4754888`, versión `appgprj_6ae0b8b2eb1881918601230d00603255~appgver_70b9b2c994f08191beed03619604983d`, despliegue `appgdep_6b04509694788191b744015f907d2078` en `succeeded`. Worker SHA256 arriba.

HTTP sobre la publicación confirma HTML y bundle gzip exactos, panel y módulo nuevos, cinco capturas FotMob intactas y acceso a consulta de fuente sin identidad denegado 401. Estado sin contraseña adicional y ruta antigua de login 404. El token de servicio no representa identidad del propietario; no se realizó un refresco real de proveedores.

Audiencia owner-only custom revisión 3: un propietario, cero editores, grupos o visitantes; runtime revisión 1 sin cambios. Sin nuevos datos descargados: **0 jugadores y 0 partidos actualizados**. Documentación de cierre se sincroniza por separado sin republicar un Worker idéntico. No quedan criterios funcionales pendientes.
