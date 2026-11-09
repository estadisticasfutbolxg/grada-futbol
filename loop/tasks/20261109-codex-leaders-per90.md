# 20261109 · Líderes de portada por 90 minutos

- Estado: `review`
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
- [ ] Código subido, PR integrado y publicación confirmada; resumen de datos al acabar.

## Plan y evidencia

1. Añadir tasas con denominadores propios y tarjetas explícitas.
2. Validar orden, unidades, procedencia, datos ausentes y enlaces.
3. Subir, integrar, publicar y registrar los identificadores reales.

Preparación: main GitHub comprobado y Site público v14. Entorno listo; origen Sites sincronizado. Sin nuevas descargas de estadísticas.

Pruebas: once archivos Node correctos, incluida la tasa de paradas con total ESPN y minutos propios FotMob, tasa publicada, cero real, falta de coincidencia y aliases de goles/asistencias normalizados una sola vez. Validador StatsBomb correcto (64 partidos, 32 equipos, 681 registros, 234.637 eventos), sintaxis y enlaces de 43 documentos correctos. Se regeneraron cinco combinados con las mismas capturas; paradas/90 verificables en 24/24/28/24/28 porteros por liga (128 en total). Chromium sobre el Worker exacto con ambas cachés denegadas: 108 comprobaciones de tarjetas (9 × 6 ámbitos × 2 modos), 36 enlaces a ranking (6 medidas × 6 ámbitos), valores/orden/filtrado de porteros, limpieza de filtros y unidades, ficha con procedencia de paradas/90, totales de liga fijos y móvil sin desbordamiento. Sin errores de JavaScript; inspección visual de escritorio/móvil. Se verifican 256 tasas contando liga y Todas, los 22 originales JSON/SQLite conservan SHA256 y los 2.284 scores individuales/96 generales de equipo no cambian.

Worker probado SHA256 `cf7e6e86996f058858bad96e6acb0725314868bf1562c45318e7459dfa6c792a`. Sin estadísticas nuevas descargadas: 0 jugadores y 0 partidos. El primer test de comparación numérica necesitó tolerancia de punto flotante (14,850000000000001 vs 14,85); cálculo correcto, sin redondear la fuente. Autocontrol sin revisión independiente ni hallazgos pendientes. Pendiente registrar PR, merge y publicación.

Cambio tras inspección visual: añadido control de muestra para evitar que un solo minuto encabece automáticamente las tasas. Los cálculos originales eran correctos; el criterio de selección se hace explícito y configurable. Se repite QA del artefacto final con mínimos y sincronización portada/ranking.

QA final tras añadir mínimos: 108 tarjetas y 36 enlaces correctos, más ajustes 0/900 minutos sincronizados portada/ranking, salida de la selección al cambiar unidad y estado vacío con un mínimo alto. Worker final cf7e6e86996f058858bad96e6acb0725314868bf1562c45318e7459dfa6c792a. El usuario añade control de actualización discreto con contraseña exclusiva y rediseño sobrio de fútbol; se integra después de este incremento en la misma rama antes de publicar. También pregunta por derechos: se revisan fuentes oficiales ESPN/Disney y FotMob; Understat está en mantenimiento. Elige explícitamente conservar los datos mientras gestiona permisos. No se interpreta como licencia ni se cambian datos/audiencia por esa consulta.
