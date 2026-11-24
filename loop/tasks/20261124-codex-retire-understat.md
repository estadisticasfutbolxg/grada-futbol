# 20261124-codex-retire-understat · Limpiar Understat de la aplicación activa

- Estado: `review`
- Responsable: Codex
- Revisor: autocontrol; sin revisión independiente
- Rama: `feat/retire-understat-from-app`
- Base Sites: `e8b449d8a3950ca3ee46c2abc26445144d7a869b`
- Base GitHub main: `5848490459baa949e5f4536e37a8b00a8c99570a`, comprobada
- PR: pendiente
- Entrega: merge y publicación privada

## Objetivo

Retirar Understat de las fuentes y datos activos de GRADA. LaLiga usa catálogo FotMob y complemento ESPN; no se oculta una fuente mientras se siguen mostrando sus cifras. Se conservan código, pruebas y capturas Understat en archivo para una reactivación futura.

## Alcance y aceptación

- [x] Sin enlaces, atribuciones, fechas, métricas o referencias activas Understat en las vistas, fichas, glosario y comparadores.
- [x] LaLiga sigue disponible con FotMob/ESPN; los huecos permanecen desconocidos y su cobertura parcial explícita. Cambios de catálogo, IDs y scores medidos.
- [x] Código y capturas originales conservados; no se consulta ni sirve la captura Understat en la publicación.
- [ ] Fórmula, mínimos de score, medias, acceso privado y datos de otras ligas coherentes; validación, merge y despliegue comprobados.

## Plan

1. Separar configuración activa y archivada; activar catálogo FotMob para LaLiga y declarar sus huecos de xG de equipo.
2. Limpiar interfaz y procedencia, regenerar desde capturas reales y auditar diferencias y cálculos.
3. Validar, revisar, integrar y publicar conservando la audiencia. Entregar recuento y lista privada de cambios.

## Evidencia y revisión

- 29 archivos Node correctos, incluida la configuración archivada y tres casos de fuentes activas: catálogo solo FotMob/ESPN, huecos de xG de equipo acotados y rutas archivadas rechazadas sin red. Sintaxis JS/Python, documentación y diff correctos. Histórico StatsBomb sin su JSON local, ajeno a estas ligas.
- Once capturas originales conservadas, incluida Understat fuera de la publicación. Diez fuentes activas; 57.247 campos de otras ligas intactos. 11.551 ejes contrastados: solo FotMob/ESPN. Los modelos y sus referencias nunca reciben la captura archivada.
- Catálogo combinado de 2.285 fichas: LaLiga pasa de 487 a 488, con 11 incorporadas desde la captura FotMob existente y 10 retiradas sin esa ficha. Cuatro jugadores compartidos pierden score por datos insuficientes y dos lo obtienen; el nuevo catálogo suma 1.517 scores válidos. 1.407 scores de fichas compartidas y 22 posiciones cambian al retirar la evidencia archivada; se declaran los conflictos, sin elegir posición por score. 104 países y 17 onces completos con media simple.
- Cero consultas nuevas a proveedores y cero partidos descargados/modificados para esta limpieza. La cobertura agregada de LaLiga pasa a los 110 partidos de la clasificación FotMob ya guardada; no es una descarga de cinco partidos nuevos. CSV de cambios/lista de catálogo privados en `/workspace/entregas/sin-understat-20261124/`.
- Cuatro arranques VM/DOM del Worker exacto: carga normal/publicada, liga fallida y enlace antiguo de Yan Diomande. Diez capturas en paralelo, todas las vistas/fichas/fechas/comparador/glosario sin atribución Understat. 477 alias de IDs preservan enlaces sin incluir estadísticas archivadas. Ruta de captura archivada 404 y API archivada 400.
- Worker SHA256 `77a62a6c4a9229d8336769d26a5e5083b0ac3e73a1a4a30af27b66f8e39fb0ab`, 146 assets/12 módulos, bundle gzip 83.551 bytes. Sin QA visual; pruebas DOM no verifican layout. Autocontrol, sin revisión independiente.

La ampliación a nuevas ligas solicitada durante el trabajo se ejecutará como incremento posterior, con capturas y validación separadas; sus consultas no se atribuyen a esta limpieza.

## Resultado y relevo

En curso.
