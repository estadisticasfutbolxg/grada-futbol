# 20261111-codex · Auditar otros scores y posiciones

- Estado: `active`
- Responsable: Codex
- Revisor: autocontrol, sin revisión independiente
- Rama: `fix/score-audit-five-leagues`
- Base Sites: `a2fcb0f9282786c07d53f4ebd0ddd9159ee4718d`
- Base GitHub: `c251aa4e05ae49341fba9c27c483f58908df8cef`
- PR: pendiente
- Objetivo: revisar las cinco ligas, corregir fallos reproducibles, integrar y publicar

## Alcance

Revisar scores pendientes sobre el mínimo, discrepancias de posición, cruces incompletos y recuperación de fichas. Contrastar identidades y posiciones con evidencia publicada; no elegir posiciones por el score ni convertir ausencias en ceros. Conservar fuentes, muestras, fechas, permisos y trabajo ajeno. Se parte de un checkout limpio y sincronizado con Sites, y del main GitHub comprobado.

## Aceptación

- [x] Auditar todos los registros de las cinco ligas y los pendientes sobre el mínimo, con motivos verificables.
- [x] Contrastar los casos dudosos por identidad, club y posición, sin unir homónimos ni muestras de otros clubes.
- [x] Comprobar las rutas de actualización y carga guardada; corregir solo fallos reproducidos.
- [ ] Validar ceros, posiciones, score único y promedios de equipo; publicar el resultado y registrar jugadores/partidos realmente actualizados.

## Plan

1. Auditar los 2.284 registros y reproducir fallos de recuperación.
2. Contrastar un conjunto acotado de fichas dudosas y corregir contratos/adaptadores si hay evidencia.
3. Validar, integrar y publicar; documentar límites y casos pendientes.

## Evidencia inicial

v18: 994 scores completos, 52 pendientes sobre el mínimo general. LaLiga 12, Premier 6, Serie A 17, Bundesliga 7, Ligue 1 10. Tres carecen de muestra suficiente en algún proveedor, aunque superen el mínimo en la fuente principal. Se examinan aparte los 49 con ejes ausentes. Estos recuentos no implican que todos sean errores de código.

## Revisión y entrega

- Se reproducen pérdidas en 27 jugadores al quitar las posiciones de FotMob: 311 cambios de rol y 893 cambios de score/referencia en la muestra final. También aparecen ocho scores que antes estaban pendientes: obtener más scores con un rol erróneo tampoco es una mejora. Carga y actualización recuperan exactamente los scores y posiciones originales, sin pérdidas ni ganancias artificiales. Escenarios aislados y marcados como simulaciones.
- Fallo nuevo reproducido: una ficha antigua MED con intercepciones 3 sustituía una ficha guardada posterior DEL con intercepciones 0. Se recupera la evidencia previa antes de aplicar respuestas y se compara por fecha de campo/posición. Se preservan los ceros. Los derivados exigen la misma captura y muestra.
- Se consultan 14 fichas reales de FotMob y dos biografías ESPN; las 14 posiciones FotMob coinciden con las capturas. Una plantilla ESPN del Espanyol confirma el alias Cala → Álex Calatrava mediante firstName/lastName. El adaptador y el enriquecimiento de identidad usan esos campos de forma genérica; no se añade una excepción por nombre. Se conservan alias al elegir capturas en cliente/Worker.
- Se enriquecen 31 identidades ESPN de LaLiga sin sustituir ninguna estadística, equipo, partido o fecha original de estadísticas. Mejoran dos enlaces FotMob: Cala y Rafael Bauza/Rafel Bauzà. Cala recupera score **0,06496386471895332** (0,065); Rafael conserva score pendiente por minutos. Ninguna posición canónica cambia. Se pasa de 994 a 995 scores y de 52 a 51 pendientes sobre el mínimo. Cambian 306 scores por la referencia MED completada; no se cambia la fórmula.
- `node --test tests/*.test.cjs`: quince archivos correctos. `python -m unittest discover -s tests -p 'test_*.py'`: siete pruebas correctas. Sintaxis de módulos, importadores CJS y Worker correcta. El validador histórico StatsBomb no corresponde a este cambio y sus artefactos siguen ausentes; las once capturas actuales se validan con sus lectores y se comprueba que todas las cifras/fechas originales permanecen iguales.
- Auditoría reproducible: 2.284 scores iguales entre liga/Todas; 703 medias y 2.483 contribuciones verificadas. 219 discrepancias de posición sin consenso, declaradas como incertidumbre, no como errores confirmados. 23 registros con muestra suficiente tienen solo la fuente principal; se conservan sin emparejar a la fuerza.
- Chromium del Worker final: actualización simulada en las cinco ligas con agregado sin posición, una ficha antigua y fallo del resto. Vinícius, Robertson, Kike Pérez, Scally y Zabarnyi conservan posición/score/cifras en tabla, ficha y comparador. Cala recupera 0,065 incluso con IndexedDB ESPN más reciente sin alias. Cero real de Robertson preservado; móvil y portada correctos; sin errores JS ni consultas reales de proveedores en QA.
- Diez capturas de proveedores conservan su hash completo. El JSON ESPN LaLiga cambia solo en alias/contextos de identidad y su metadato de enriquecimiento; todas sus cifras, equipos, partidos y fecha de estadísticas son idénticos. Se regeneran los cinco combinados con referencia común. Los datos/Worker generado permanecen ignorados por GitHub.

Autocontrol, sin revisión independiente. No se publican fixtures. Informe y listado de identidades: [SCORE_AUDIT.md](../../docs/SCORE_AUDIT.md). Pendiente subir/integrar/publicar. Cero jugadores nuevos y cero partidos actualizados; 31 identidades enriquecidas, dos enlaces recuperados y un score recuperado. Las consultas de fichas usadas para contraste no se anuncian como nuevas estadísticas incorporadas.
