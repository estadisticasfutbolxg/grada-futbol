# 20261114-codex · Clubes, coherencia de medidas y perfiles

- Estado: `done`
- Responsable: Codex
- Revisor: autocontrol; sin revisión independiente
- Rama: `fix/club-filters-and-metric-coherence`
- Base Sites: `438418a046989f3574930636af3562630f9842ca`
- Base GitHub: `4a22afb23ef7f9aa9ba42443656fec98fe0114a7`
- PR: [#35 integrado](https://github.com/estadisticasfutbolxg/grada-futbol/pull/35)
- Objetivo: corregir, revisar medidas y mejorar comparaciones, integrar y publicar en el Site privado

## Peticiones y alcance

El selector muestra «Atletico Madrid,Deportivo La Coruna» como un equipo. Revisar todas las medidas y proponer/aplicar mejoras con datos disponibles; valorar centrocampistas defensivos/ofensivos y centrales/laterales. Mantener un score canónico coherente y no atribuir posiciones detalladas sin evidencia.

El propietario ha restringido Sites a su cuenta el 14 de noviembre. Se ha verificado acceso `custom`, un único owner y sin grupos, editores ni visitantes. La nueva publicación debe conservar exactamente esta audiencia; no se vuelve a hacer pública.

## Aceptación

- [x] Selector basado en equipos reales por ID; las temporadas multiclub no crean equipos ni aportan sus totales a un solo club.
- [x] Auditar unidades, denominadores, muestras y valores ausentes; corregir incompatibilidades reproducibles.
- [x] Añadir medidas útiles solo con muestras válidas y distinguir posición táctica de perfil estadístico; declarar cobertura y límites.
- [x] Verificar score común, promedios, filtros, ficha, comparador, móvil y lectura privada; subir, integrar y publicar.

## Plan

1. Reproducir el filtro y auditar medidas/posiciones disponibles.
2. Corregir clubes y cohortes; implementar mejoras acotadas justificadas por los datos.
3. Validar, revisar, integrar y publicar conservando privacidad; registrar cambios de jugadores y partidos.

## Evidencia inicial

- Understat conserva dos agregados sin team_id: Giménez (Atlético Madrid + Deportivo La Coruña) y Pablo García (Racing Santander + Real Betis). No son equipos reales ni cifras por etapa; el filtro toma actualmente nombres de jugadores y los convierte en opciones.
- Las capturas FotMob antiguas conservan posiciones amplias, pero no positionContext detallado. Se investiga si la fuente ofrece un desglose explícito antes de separar centrales/laterales o posiciones de mediocampo.
- No hay cambios locales previos. Fuentes Sites sincronizadas; main GitHub comprobado mediante la cuenta del repositorio habitual.

## Resultado y validación

- `clubs.js` usa IDs y catálogo real; prueba de Giménez y Pablo García como temporadas multiclub sin atribuir sus cifras. Catálogo comprobado en los seis ámbitos.
- `metrics.js` añade xG/tiro, G+A/90, xG+xA/90 y goles evitados/90; conserva ceros y valida fuente, minutos, PJ y ámbito de componentes. Una fecha de consulta distinta con la misma muestra declarada no la invalida; se muestran ambas fechas. No se reconstruyen pases intentados ni progresivos ausentes.
- `roles.js` importa puestos explícitos de plantillas verificadas, sin nombres/edades/estadísticas adicionales. 96/96 páginas válidas; 2.136 registros FotMob enriquecidos y 2.126 fichas combinadas con puestos (2.113 compatibles, 13 discrepancias conservadas). Ranking de centrales y laterales por el mismo score DEF; filtros de pivotes, interiores y mediapuntas. Perfiles MED por percentiles, banda equilibrada de 10 puntos y score MED único. [Contrato](../../docs/ROLES_METRICS.md).
- `node --test tests/*.test.cjs`: 17 archivos correctos; `python -m unittest discover -s tests -p 'test_*.py'`: 7 tests correctos. Sintaxis JavaScript y Python modificados, `git diff --check` y documentación: correctos.
- `node scripts/audit_metrics.cjs`: 82 medidas y 390.320 comprobaciones correctas. `node scripts/audit_scores.cjs`: 2.284 igualdades por ámbito, 714 medias, 2.514 contribuciones; recuperación al cargar/actualizar sin alterar posiciones, scores ni referencias. Matriz de pérdida deliberada de posiciones reproduce el riesgo anterior; no representa sesiones reales del usuario.
- Cinco SQLite con `integrity_check` y concordancia exacta de `players.stats_json`. Comparación con v19: mismos 2.284 scores/posiciones individuales, 995 válidos y 51 pendientes sobre el mínimo. Cambian las cohortes MED y sus promedios; ninguna cifra de juego se sustituye.
- Chromium sobre el Worker compilado: 30 cruces de ranking/ámbito, catálogo de clubes, filtro multiclub y exclusión de agregados del Atlético, filtros de puestos, medidas y /90, score de Vinícius en ficha/comparador, recuperación de puestos desde una caché posterior sin ellos, portada y móvil 390px sin errores JS ni desbordamiento. Se detectó y corrigió la falta de contenedores de portada para los tres rankings nuevos; se repitió con el artefacto final.
- `python scripts/validate_data.py` no corresponde al conjunto actual: faltan aquí sus artefactos históricos StatsBomb, sin cambios en ese importador. Se validan las capturas actuales con sus lectores y las auditorías anteriores.

## Jugadores y partidos

0 jugadores nuevos, 0 cifras de juego sustituidas y 0 partidos modificados. Actualizados únicamente puestos/contextos de 2.136 registros FotMob: LaLiga 450; Premier 445; Serie A 476; Bundesliga 387; Ligue 1 378. No cambia ningún array de partidos ni fecha de captura de estadísticas. Fallos de plantilla: ninguno de 96; las identidades sin cruce inequívoco no se completan. Cinco JSON FotMob y cinco SQLite regenerados, cinco combinados recalculados. Las otras seis capturas mantienen sus contenidos.

## Revisión e integración

Autocontrol sin revisión independiente. GitHub: rama comprobada en `ad0a16f923764086fa3a0cc1bba26950942bf8c5`, PR #35 limpio, sin checks/statuses configurados ni protección de main; squash autorizado en `e16d1c27da544eb17ec137cfb3fe011c8d8e525e` y main verificado. Los 27 archivos de esta tarea parten de blobs iguales entre las bases GitHub y Sites; no se sobrescribe trabajo de terceros. Sites: fuente subida y verificada `4909164260d3c1e61877bcbb1f10333d6814c67c`, archivo con manifiesto y Worker, versión **20**, despliegue `appgdep_6af8da5af8608191925431c42eda5582` terminado en `succeeded`, entorno revisión 1. La audiencia sigue `custom`, owner único, cero grupos/visitantes, revisión 3; HTTPS sin sesión devuelve 401 y no sirve la aplicación. La lectura del contenido privado requiere sesión del propietario; no se afirma una comprobación externa de hashes de cliente. Chromium sí verificó el artefacto final, SHA256 `6dc12f65382ff848e6b6a770df164b45b8ab2c8bef2ab2a19f775bc661d9229a`. El cierre documental no modifica ese Worker ni necesita otra publicación idéntica. Las solicitudes de permiso por correo se han enviado en una acción independiente autorizada; su correspondencia y datos del remitente quedan fuera de Git. Envío no equivale a licencia concedida.
