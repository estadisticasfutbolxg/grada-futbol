# 20261109 · Portada sin selector de unidades

- Estado: `review`
- Responsable: Codex, a petición del usuario
- Revisor: autocontrol; sin revisión independiente
- Rama: `fix/home-unit-selector`
- Base GitHub: `846b96030bf3f511b596b11a96182a789ce0e36b`
- Base Sites: `db7b1c0a01528102ba89d36d48070cd1476ad42d`
- Entrega: PR, merge y publicación

## Objetivo y alcance

Retirar el selector Totales/Por 90 minutos de Vista general, con su separador, sin alterar medidas, datos ni unidades de las tarjetas. Conservar el control en tablas y comparador, así como el salto desde tarjetas a su ranking y su unidad. Oculto también en el HTML inicial para evitar un destello antes de cargar JavaScript. Se conserva el comportamiento previo de rankings por score y glosario.

Archivos: `dist/app.js`, `dist/index.html`, `docs/REFRESH.md` y esta tarea. No hay tareas activas solapadas ni cambios previos. Aplicadas Sites, grada-loop y grada-review, con autorización vigente de Git/merge/publicación y audiencia pública conservada. Helper Sites no disponible; se reutiliza el procedimiento verificado con credencial efímera por stdin. Sin estadísticas nuevas ni cambios de acceso.

## Aceptación

- [x] Selector y separador ocultos en portada inicial y al volver de otra vista.
- [x] Disponible donde se cambia la unidad; enlaces de líderes conservan medida y unidad.
- [x] Comprobación funcional y móvil, sintaxis y documentación.
- [ ] Código subido, PR integrado y publicación confirmada.

## Evidencia

Sintaxis JavaScript, diff y enlaces de 44 documentos correctos. Chromium sobre el Worker exacto, con Cache API denegada y solo las capturas reales ya publicadas: cinco ligas/Todas, carga inicial y vuelta a portada desde Por 90, selector/separador ocultos, tarjetas idénticas, enlaces de goleadores y goles/90 con unidad/orden correctos, selector operativo en equipos/jugadores/comparador, rankings/glosario conservan visibilidad previa. Comprobados vacío por filtro y limpieza, móvil sin desbordamiento y sin errores JS. Inspección visual de escritorio y móvil. No se añaden tests unitarios que repitan una condición de visibilidad.

Worker SHA256 `0bba8a00d44a34fb0e51ba39305dc69494e8fe77c61a6c457790da50abd3d543`, 9 módulos/31 assets/1.566.824 bytes. No cambian cálculos, capturas, fuentes, contraseñas o audiencia. 0 jugadores y 0 partidos descargados. Autocontrol sin hallazgos ni revisión independiente. Pendiente integración y publicación.
