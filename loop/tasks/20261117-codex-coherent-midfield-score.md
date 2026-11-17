# 20261117-codex · Perfil y score de mediocampo coherentes

- Estado: `active`
- Responsable: Codex
- Revisor: autocontrol; sin revisión independiente
- Rama: `fix/coherent-midfield-score`
- Base Sites: `f4f3228e6d8e029be41b9852c26a8635f6e04e48`
- Base GitHub: `f85e80667026097be727c97f5e2b51046ea28328`
- PR: pendiente
- Objetivo: corregir el score de Baena y casos equivalentes, integrar y publicar conservando acceso privado

## Evidencia y alcance

Álex Baena conserva posición MED por consenso ESPN/FotMob frente a DEL Understat. Se le asigna perfil estadístico MED_ATT, pero su score 0,174481 usa completedPer90, accuracy, xa, recoveries, tackles e interceptions: el perfil no elegía sus ejes. No se cambia la posición para mejorar el score ni se oculta la discrepancia.

La petición del propietario cambia el contrato anterior: se mantiene un solo score por jugador, pero en MED el perfil ofensivo/defensivo/equilibrado selecciona los ejes de ese score. El perfil se decide antes, con índices auxiliares y referencia fija; no se elige la puntuación más alta. Tablas, fichas, comparador, rankings y equipos consumen el mismo resultado. Sin perfil verificable, score general explícito y sin pertenencia inventada a los subgrupos.

Archivos compartidos: radar.js, scores.js, squads.js, app.js, components.js, auditoría/pruebas y documentación. No hay cambios previos locales; Sites sincronizado y main GitHub comprobado. Audiencia nativa owner-only `custom`, revisión 3, sin grupos ni visitantes. No descargar nuevas estadísticas ni modificar capturas fuente.

## Aceptación

- [x] Baena y todos los MED usan ejes coherentes con su perfil declarado; posición y alternativas siguen visibles.
- [x] Perfil/score/reference se calculan una vez con referencia común y no cambian según vista, filtro o ranking.
- [x] Balanced y desconocidos tienen tratamiento explícito, sin elegir scores alternativos por disponibilidad ni convertir ausentes en cero.
- [x] Equipos reutilizan exactamente el score y los minutos de sus contribuyentes.
- [ ] Auditar los 2.284 registros, regresiones de ceros/muestras/caché, artefactos derivados y casos de otras ligas; integrar/publicar privado y registrar recuentos.

## Plan

1. Reproducir Baena y guardar scores/ejes de referencia.
2. Resolver perfiles antes de construir el score, alinear ejes/etiquetas y actualizar el contrato.
3. Validar casos, referencias y medias, regenerar derivados; subir, integrar y publicar en Sites privado.

## Validación y entrega

- 18 archivos Node y 7 tests Python correctos; sintaxis y diff correctos. Se añaden cinco regresiones de selección de ejes/perfil, referencias entre ámbitos, contribuciones, muestras, ceros/ausentes, HTML del radar y descarte de metadatos derivados antiguos.
- `node scripts/audit_scores.cjs`: 2.284 scores iguales entre ámbitos y 2.284 perfiles coherentes, 714 medias y 2.514 contribuciones verificadas. Matriz de recuperación de posiciones al cargar/actualizar sin cambiar posiciones, scores o referencia; pérdida deliberada sin recuperación reproduce el escenario histórico (simulación, no sesiones de usuario).
- `node scripts/audit_metrics.cjs`: 82 medidas, 390.320 lecturas total/90 correctas. Cinco combinados regenerados: 2.284 playerScore/scoreProfile/scoreProfileLabel iguales al modelo y medias de equipo exactas. Las once capturas fuente conservan hashes, fechas y cifras.
- Baena 0,174481 → 0,751949, perfil MED_ATT y seis ejes ofensivos; misma cifra en ranking y contribución al centro del campo ofensivo. Raphinha y Olise conservan sus scores DEL; Kimmich y Valverde pasan a ejes MED_DEF. No cambia ninguna posición ni clasificación estadística. Los desconocidos conservan su score general explícito, sin figurar como ofensivos/defensivos; no se sustituyen datos ausentes.
- Se detectó que las columnas de rankings heredaban ejes del primer MED: se reemplaza por la unión estable de ejes de candidatos. Cada fila conserva su perfil y los valores se muestran con unidades del eje, aunque ese eje no forme parte de su propio radar. Se comprueban el orden inverso de entrada y candidatos equilibrados dentro del ranking ofensivo.
- Navegador no disponible: `SITES_MANAGED_LINUX_CONTAINER=1`, sin herramienta `cua_repl.js`. Según la referencia managed de Sites no se inicia otro servidor/navegador ni se improvisa una ruta alternativa. No se afirma revisión visual; HTML del componente real y lógica de vistas/modelos comprobados mediante pruebas. `python scripts/validate_data.py` bloqueado por falta de la captura histórica StatsBomb, sin cambios en ese importador.
- Source helper de Sites no está instalado en la imagen; se reutiliza el flujo Git ordinario existente con credencial efímera por stdin, sin persistir tokens. Apertura de origin/main confirmada antes de editar. No se cambian permisos ni audiencia.

## Jugadores y partidos

0 jugadores nuevos, 0 cifras de origen sustituidas, 0 partidos modificados y ninguna consulta a proveedores. **188 scores MED corregidos**: LaLiga 39; Premier 40; Serie A 47; Bundesliga 29; Ligue 1 33. Se mantienen los 995 scores completos y 51 pendientes sobre el mínimo; ningún score ganado/perdido, ninguna posición o perfil estadístico cambia. Cambian 93 promedios generales de equipo por el uso de las puntuaciones corregidas. Cinco combinados y Worker regenerados, capturas y SQLite fuente intactos. El listado completo de cambios se entrega fuera de Git como informe; no se suben bases/datos de jugadores.

## Integración

Pendientes commit/push, PR, merge y despliegue privado. Autocontrol sin revisión independiente. Actualizar con identificadores y resultados reales al completarlos.
