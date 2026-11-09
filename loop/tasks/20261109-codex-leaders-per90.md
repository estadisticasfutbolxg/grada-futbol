# 20261109 · Líderes de portada por 90 minutos

- Estado: `done`
- Responsable: Codex, a petición del usuario
- Revisor: autocontrol; sin revisión independiente
- Rama: `feat/leaders-per90`
- Base GitHub: `f88a7167fdc5876a6d19a582ad16f601806e21b2`
- Base local sincronizada con Sites: `a45f6b2939d77c29393f9c88736ea3ef79654b96`
- Entrega: PR, merge y publicación

## Objetivo y alcance

Sustituir los líderes de pases completados y paradas por sus tasas por 90 minutos. Añadir líderes de goles/90 y asistencias/90 junto a los totales de goleadores/asistencias. Las unidades de cada tarjeta quedan fijas, también al cambiar el modo de la tabla. Ver ranking abre la misma medida, y la fuente/minutos propios quedan visibles. Los totales de liga y scores de v14 conservan su función.

Paradas de ESPN no tienen minutos: no se dividen por los minutos Understat/FotMob. Se deriva una métrica independiente savesPer90 del primer proveedor inequívocamente unido con recuento y minutos propios (o tasa publicada), conservando su procedencia; el total puede seguir siendo ESPN. Si no hay denominador verificable, la tasa permanece desconocida. La revisión visual mostró un líder con 90 goles/90 a partir de 1 minuto. Se aplican mínimos iniciales editables de 450 min para campo y 180 para paradas, consistentes con las muestras habituales del proyecto. Usan los minutos de la tasa, se comparten con el ranking completo y pueden ajustarse o ponerse a cero; los totales no reciben el corte.

Archivos: app, métricas, combinación y procedencia; pruebas, documentación y Worker generado. No hay tareas activas solapadas ni cambios previos. Se aplican Sites, grada-loop, grada-data y grada-review. Helper Sites ausente; se reutiliza el procedimiento Git conocido con credencial efímera por stdin. Acceso público y autorizaciones de Git/merge/publicación vigentes.

## Aceptación

- [x] Nueve tarjetas: pases/paradas por 90 y pares de goles/asistencias total + /90.
- [x] Mismos valores/orden al abrir ranking; unidades fijas y procedencia correcta, sin mezclar denominadores ni imputar ceros.
- [x] Verificación con datos reales en cinco ligas/Todas y móvil, conservando scores y totales.
- [x] Código subido, PR integrado y publicación confirmada; resumen de datos al acabar.

## Plan y evidencia

1. Añadir tasas con denominadores propios y tarjetas explícitas.
2. Validar orden, unidades, procedencia, datos ausentes y enlaces.
3. Subir, integrar, publicar y registrar los identificadores reales.

Preparación: main GitHub comprobado y Site público v14. Entorno listo; origen Sites sincronizado. Sin nuevas descargas de estadísticas.

Pruebas: once archivos Node correctos, incluida la tasa de paradas con total ESPN y minutos propios FotMob, tasa publicada, cero real, falta de coincidencia y aliases de goles/asistencias normalizados una sola vez. Validador StatsBomb correcto (64 partidos, 32 equipos, 681 registros, 234.637 eventos), sintaxis y enlaces de 43 documentos correctos. Se regeneraron cinco combinados con las mismas capturas; paradas/90 verificables en 24/24/28/24/28 porteros por liga (128 en total). Chromium sobre el Worker exacto con ambas cachés denegadas: 108 comprobaciones de tarjetas (9 × 6 ámbitos × 2 modos), 36 enlaces a ranking (6 medidas × 6 ámbitos), valores/orden/filtrado de porteros, limpieza de filtros y unidades, ficha con procedencia de paradas/90, totales de liga fijos y móvil sin desbordamiento. Sin errores de JavaScript; inspección visual de escritorio/móvil. Se verifican 256 tasas contando liga y Todas, los 22 originales JSON/SQLite conservan SHA256 y los 2.284 scores individuales/96 generales de equipo no cambian.

Worker probado SHA256 `cf7e6e86996f058858bad96e6acb0725314868bf1562c45318e7459dfa6c792a`. Sin estadísticas nuevas descargadas: 0 jugadores y 0 partidos. El primer test de comparación numérica necesitó tolerancia de punto flotante (14,850000000000001 vs 14,85); cálculo correcto, sin redondear la fuente. Autocontrol sin revisión independiente ni hallazgos pendientes. Pendiente registrar PR, merge y publicación.

Cambio tras inspección visual: añadido control de muestra para evitar que un solo minuto encabece automáticamente las tasas. Los cálculos originales eran correctos; el criterio de selección se hace explícito y configurable. Se repite QA del artefacto final con mínimos y sincronización portada/ranking.

QA final tras añadir mínimos: 108 tarjetas y 36 enlaces correctos, más ajustes 0/900 minutos sincronizados portada/ranking, salida de la selección al cambiar unidad y estado vacío con un mínimo alto. Worker final cf7e6e86996f058858bad96e6acb0725314868bf1562c45318e7459dfa6c792a. El usuario añade control de actualización discreto con contraseña exclusiva y rediseño sobrio de fútbol; se integra después de este incremento en la misma rama antes de publicar. También pregunta por derechos: se revisan fuentes oficiales ESPN/Disney y FotMob; Understat está en mantenimiento. Elige explícitamente conservar los datos mientras gestiona permisos. No se interpreta como licencia ni se cambian datos/audiencia por esa consulta.

## Incremento de propietario y diseño

Implementados `worker/owner.cjs`, `dist/owner.js` y formulario: identidad de Sites más contraseña elegida por el usuario en la web, inicialización privada en R2 y fijación del ID de Sites. PBKDF2 con sal, cookie firmada de 30 minutos y controles de origen/tamaño/6 intentos por 15 minutos; las tres consultas de proveedor y las fichas exigen ambos factores en servidor. ESPN pasa también por el Worker, con hosts y redirecciones acotados. Las capturas permanecen públicas y no se inician descargas al abrir o configurar el acceso. Variables del propietario/firma guardadas como secretos de Sites, revisión 1; ningún valor en código/Git. No se ha establecido la contraseña del usuario ni se conocerá en este chat. Vinculación R2 declarada, pendiente confirmar publicación nativa.

Cabecera verde oscuro, papel claro y geometría sutil del campo; icono compacto de actualización en cabecera, crest geométrico en SVG y selectores móviles legibles. Se conservan navegación, medidas, fuentes y scores.

61 pruebas Node pasan (12 archivos), incluidos propietario/otras cuentas, fijación de ID, cookie manipulada/caducada, carrera de inicialización, límite persistente, origen y denegación si falta almacenamiento. Regresión de caché mantiene todas las capturas disponibles. Chromium del Worker final comprueba anónimo, otra cuenta, primera configuración, confirmación diferente, contraseña incorrecta/correcta, cookie segura, bloqueo y actualización explícita con fuentes fallidas conservadas; contraseña ausente de localStorage/sessionStorage y campos vaciados. Sin errores JS ni desbordamiento móvil. La regresión per90 del nuevo aspecto confirma otra vez 108 tarjetas, 36 enlaces, 256 tasas y los originales/scores intactos. Las pruebas usan respuestas aisladas, sin descargar proveedores reales ni publicar datos ficticios.

Revisión propia: corregido el reloj de un test de caché que creaba cookie con la hora real y verificaba con una fecha anterior; no era un fallo de sesión. Ajustados el escudo SVG para evitar glifos ausentes y el selector de liga móvil al ver las capturas. Revisadas restricciones oficiales y documentada la decisión del usuario de conservar capturas mientras gestiona permisos. Pendiente guardar hash final, integración PR #25 y despliegue.

Artefacto final validado: Worker SHA256 `c15a8f6e3886bb105481c0bac5cca32f22bc3d4721235083d97e777e7e322c5f`, 9 módulos, 31 assets, 1.566.792 bytes. Doce archivos de pruebas correctos; verificación funcional de 61 casos. Enlaces/sintaxis/diff correctos. PR en borrador [#25](https://github.com/estadisticasfutbolxg/grada-futbol/pull/25), primer incremento remoto `657447a21f0aa7f480f0294a3f0fb2fc7340d252`.

Validación nativa del paquete: Sites especifica que `r2` debe ser una cadena. Se corrige la declaración lógica a `"r2": "BUCKET"` (la referencia de almacenamiento no precisaba la forma). El primer guardado fue rechazado antes de crear versión; no se intentó desplegar ese paquete. Sin cambios en estadísticas ni en el Worker probado.

## Entrega confirmada

PR #25 integrado en `5ac3cc343417dd146d897a8912bf5eae09233493`, main remoto comprobado. Rama final GitHub `e24804738f44edda73c743ffaa95902bfa69ea8a`; fuente Sites `59f17a73f904d6197e41a186d136c442f7c19a13`. GitHub informó mergeable clean, sin checks registrados ni protecciones que impidieran el merge; no se omiten checks pendientes requeridos.

Versión **15** `appgprj_6ae0b8b2eb1881918601230d00603255~appgver_a8a3c9d35d2c8191a47c5be2c7389e7d` y despliegue `appgdep_6af223c17a2481918b7370b0cf1b859e`, `succeeded` el 9 de noviembre a las 19:49:39 UTC (20:49 Madrid), revisión de secretos 1. URL: https://grada-futbol-analitica.ivanmatema2.chatgpt.site. Audiencia pública y propietario comprobados otra vez. El formato R2 corregido se valida al guardar/publicar nativamente. No se crean copias del Site ni se cambian roles.

Worker final conserva SHA256 `c15a8f6e3886bb105481c0bac5cca32f22bc3d4721235083d97e777e7e322c5f`. QA final de acceso vuelve a pasar tras los ajustes de errores/caché. R2/identidad simulados en pruebas, sin contraseña real establecida: el usuario deberá identificarse y elegirla desde el icono. No se puede realizar esa acción por él sin conocer su contraseña. El lector web externo no admite la ruta de estado de producción; publicación confirmada por Sites y comportamiento por QA del artefacto, sin desactivar TLS ni afirmar una prueba de login real. No es un bloqueo de publicación.

Datos: 0 jugadores y 0 partidos descargados; 22 originales intactos, scores de 2.284 registros y 96 equipos conservados. Se respetan las capturas solicitadas mientras tramita permisos. No se han enviado mensajes a proveedores ni cambiado licencias. Cierre documental posterior, sin republicar un Worker idéntico.
