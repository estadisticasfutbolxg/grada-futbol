# 20261124-codex-equivalent-leagues · Ligas con cobertura equivalente

- Estado: `review`
- Responsable: Codex
- Revisor: autocontrol; sin revisión independiente
- Rama: `feat/equivalent-fotmob-espn-leagues`
- Base Sites: `4997ce6412869811497dd5f45198b69ce228b377`, v35 publicada y HTTP verificado
- Base GitHub main: `8e7627f6108ce725cb979562d8fc15adc6fc1eb2`, PR #65 integrado
- PR y publicación: pendientes

## Objetivo y alcance

Añadir todas las ligas candidatas que superen las mismas familias de métricas con FotMob y ESPN, sin Understat. El usuario pidió todas las que tengan datos equivalentes, ampliando la comprobación inicial Portugal/Países Bajos. Datos reales 2026/27; no afirmar cobertura mundial exhaustiva ni inventar una fase posterior del calendario.

Archivos compartidos: catálogo/validadores, combinación de clubes, generadores, metadatos de plantilla/porteros, banderas, paginación y documentación. La limpieza previa de Understat ya está integrada y publicada; este incremento conserva ese contrato. No hay otra tarea concurrente sobre estos archivos.

## Criterios

- [x] Solo candidatas con clasificación y métricas reales equivalentes; rechazo de otra temporada/competición, grupos incompatibles y fuentes incompletas.
- [x] Calendarios de 12–24 clubes y fases regulares explícitas; alias de clubes revisados en su liga, sin cruces ambiguos.
- [x] Posiciones/nacionalidades verificadas y xGOT recibido sin mezclar equipo, portero o muestras. Ausencias siguen desconocidas.
- [x] Un score por jugador desde 200 min y referencia común; medias de clubes y XI nacionales coherentes. Fuentes anteriores intactas.
- [x] Filtros, selector, Todas, rankings, fichas, actualización general, caché, acceso privado y rendimiento validados.
- [ ] Código y generadores en GitHub, PR integrado y Sites actualizado; sin datos/SQLite/secretos en GitHub. Entrega de jugadores y cobertura de partidos por fuente.

## Plan y evidencia

1. Auditar candidatas con páginas oficiales de temporada, familias y calendario; descargar rankings y plantillas ESPN.
2. Validar cobertura en staging; enriquecer identidad y portería, revisar alias y generar salidas coherentes.
3. Comprobar fórmulas, generadores, navegación y fallos; integrar, publicar y verificar audiencia/HTTP.

Capturas y resultados originales en `/workspace/scratch/grada-more-leagues/`; quedan fuera de Git. El acceso a las fuentes no acredita nuevos permisos de reutilización. No se cambia la audiencia del Site.

- 26 candidatas adicionales auditadas; 17 pasan con fuentes reales, incluida Australia tras completar los penaltis parados desde fichas verificadas. Un ranking vacío no se transforma en ceros ni basta para habilitar una liga.
- 73 variantes de nombres de club revisadas y restringidas a su competición; 302 equipos nuevos con puestos/países verificados y escudos reales. Fichas desde 200 minutos y todos los porteros se consultan para completar recuentos, posición y disciplina sin imputación.
- Los nuevos calendarios incluyen 12–24 clubes y fases regulares explícitas. El Worker admite IDs con dígitos, comparte/limita a dos descompresiones y dos capturas completas retenidas; las otras solicitudes esperan antes de parsear sus cuerpos. No cambian concurrencia al proveedor, autenticación ni resultados.
- Tablas de 100 filas por página: ordenación/búsqueda/filtros sobre el universo completo, puestos continuos y score fijo. Evita generar miles de filas al cargar Todas.

- 30 archivos Node y 14 casos Python correctos; sintaxis, documentación y diff correctos. Se corrigió la configuración explícita de las pruebas históricas del complemento FotMob tras retirar Understat; no se rebaja el contrato activo. Sin QA visual disponible. El validador histórico StatsBomb carece de su JSON local; las auditorías actuales son independientes y correctas.
- 9.766 fichas, 398 clubes, 6.583 scores válidos, 6.454 ajustes de disciplina verificados. 9.766 equivalencias liga/Todas, 46.296 ejes solo FotMob/ESPN, 3.054 medias ponderadas y 16.875 contribuciones contrastadas. 150 países y 42 onces completos con media simple. Diez originales anteriores y 73.082 campos intactos; archivo Understat conservado y fuera de todas las referencias.
- 17 ligas incorporan 7.481 fichas y cobertura agregada de 1.949 partidos por proveedor; no se descargan archivos de encuentros individuales. Las cifras y fechas de las cinco ligas anteriores no cambian; 1.517 scores anteriores se recalculan por la referencia ampliada. Listas privadas de nuevos jugadores, scores recalculados y cobertura en `/workspace/entregas/nuevas-ligas-20261124/`.
- 714 hashes de rankings contrastados y 7.783 filas SQLite/JSON idénticas; integridad SQLite y metadatos correctos. De 5.423 fichas solicitadas por umbral/portería, 5.359 verificadas; las otras 64 conservan datos válidos de rankings, sin inventar lo ausente. Países/puestos de los 302 clubes nuevos y los 398 escudos reales disponibles.

- Cuatro arranques VM/DOM del Worker exacto: carga normal/publicada, una liga fallida y enlace antiguo de Yan Diomande. Selector de 22 ligas, 44 capturas paralelas, 477 alias y todas las vistas sin atribución Understat. Se comprobaron las 22 selecciones y páginas de 100 filas en Todas, con puestos continuos. Las comprobaciones despejan filtros explícitamente; no confunden el filtro de posición conservado al salir de Rankings con una pérdida de jugadores.
- Worker SHA256 `ff2746ab17d39cf72b96c87dceda23aacbe6d8b2c7821e4d1b4a3fca88494a9b`, 492 assets / 12 módulos, bundle gzip 84.707 bytes. No se afirma QA visual desde las pruebas DOM.

## Resultado y relevo

En curso.
