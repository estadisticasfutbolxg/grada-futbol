# Once ideal por liga y de todas las ligas

- Estado: `review`
- Responsable: Codex (coordinación/publicación)
- Revisión: autocontrol y revisión técnica de agentes, sin revisión humana independiente
- Rama: `feat/ideal-league-elevens`
- Base nativa: `ec76b0e48a25a017b8b1814c6245a97f45683745`
- Base GitHub: `e028519292d0be245fca48cd7e1ff7585184bcbc`

## Alcance

Nueva sección de onces ideales de las quince primeras divisiones disponibles y uno global de todas esas ligas. Misma lógica de Selecciones: siete sistemas, puestos publicados compatibles, contención y creación, maximizar suma/media simple de once scores canónicos, mínimo 200 minutos, sin ponderación de minutos. Score de temporada conserva torneos; candidatos solo ligas. Sin nacionalidad requerida ni jugadores duplicados por ID FotMob; vacantes y ligas ausentes explícitas. Club/escudo, formación, score primero, tabla y detalle de cada jugador. Mantener gráficos/estadísticas/pesos y privada la publicación.

## Reparto

Agente dominio: dist/ideal.js, adaptación compartida mínima de renderer nations.js y tests ideal.test.cjs. Agente interfaz: app.js/index.html y tests ideal-view.test.cjs. Coordinador: builder/fixtures harness, auditoría con datos reales, documentación, revisión, integración y publicación.

## Comprobaciones

Comparar media simple, once único, puestos válidos, ámbitos y exclusión de copas como candidatos, scores idénticos a fichas, fallback incompleto, caché invalidada tras nuevas capturas. Pruebas Node/Python/calidad y Worker exacto; no descargar nuevos datos para este cambio. PR/merge y publicación privada.

## Resultado preparado

Se completan quince onces de liga y el global, con la misma lógica/renderer de Selecciones y sin exigir nacionalidad. Candidatos por pertenencia doméstica original; score y mínimo desde el modelo canónico de todas las competiciones. Las 176 plazas se auditan contra fichas y contra el modelo de las dieciocho competiciones, sin duplicados, con puestos compatibles y media simple exacta. El global actual es 4-2-3-1, score 0,8144320138341214. Las líneas y tablas muestran score, puesto, club/escudo y explicación. Los quince ámbitos y ausencias son explícitos; candidatos exclusivos UEFA no entran.

Se mantiene el score v11 y todos los pesos/capturas. Nueva vista se calcula al abrir y se memoriza por modelo; actualizar fuentes incluidas las copas invalida la referencia y los onces. Selector no altera puntuaciones. Enlace `?vista=ideal&once=laliga` y global `once=leagues`.

43 archivos Node y 28 pruebas Python, ESLint/Ruff, documentación y diff correctos. Pruebas de mínimos canónicos con 150 minutos de liga/250 de temporada, identidad/transferencias, roles, ausencia de país, vacantes, clubes seguros, caché/navegación y media. Se sustituye el máximo con miles de argumentos por reducción equivalente para evitar límites del navegador; prueba de 8.000 candidatos. Revisión técnica cruzada sin bloqueos, sin revisión humana independiente.

Worker exacto probado en cuatro arranques VM/DOM con capturas reales, acceso directo a once LaLiga, cambios de selector, detalle con desglose y referencia de temporada, navegación a otras vistas y fallo de fuente. Sin QA visual disponible. Worker SHA256 `eb64a228a110b2d5758e9522e7f67f5f963bbe01b09cf1b51d49940dc0ba782b`, 379 assets/12 módulos y bundle gzip 107.090 bytes. Sin datos, jugadores o partidos descargados. Integración y publicación privada pendientes de confirmar.
