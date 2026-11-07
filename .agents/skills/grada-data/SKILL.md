---
name: grada-data
description: Importa, modifica o verifica datos de StatsBomb Open Data, métricas y artefactos SQLite/JSON/JS de GRADA. Úsala para cambios de cálculo, cobertura, importación o descargas; no es necesaria para retoques de estilo o documentación sin cambios de datos.
---

# Integridad de datos en GRADA

1. Lee `AGENTS.md`, `docs/DATA.md`, `docs/ARCHITECTURE.md` y la ficha de tarea.
2. Identifica fuente, competición, temporada, cobertura y definición exacta del cambio. Busca los campos reales en el importador y en una captura del origen; no inventes métricas porque resulten convenientes para la UI.
3. Conserva las reglas de tandas, autogoles, porteros presentes, xA derivada, minutos nominales y valores ausentes. Si cambia una definición, actualiza el contrato, los consumidores y el glosario de la web dentro de la misma tarea.
4. Cambia el importador de la fuente afectada (`import_statsbomb.py`, `import_fotmob.py`, `import_laliga.py` o `import_understat.py`); no edites cifras generadas a mano. Revisa primero los archivos existentes y preserva la versión válida si la descarga o el cálculo falla. El importador actual no publica todas las salidas de forma atómica: evita mezclar una regeneración parcial con un conjunto anterior.
5. Para las ligas actuales, regenera con `python scripts/import_leagues.py --league <id>` o los importadores individuales; usa `import_statsbomb.py` solo si cambia ese archivo de datos. Reutiliza una caché real comprobada cuando corresponda. `--limit` es una importación parcial y debe seguir declarada como tal. Si el entorno bloquea la red, registra el bloqueo sin sustituirlo por datos de prueba.
6. Ejecuta las pruebas de métricas y fuentes afectadas y comprueba los JSON/SQLite generados. Usa `python scripts/validate_data.py` para los artefactos históricos StatsBomb cuando corresponda. Añade evidencia del caso concreto de la fórmula modificada: tiro, pase, sustitución o partido que demuestre el resultado esperado. Los checks de sumas no validan por sí solos una definición estadística.
7. Revisa juntos `dist/data.js`, `dist/downloads/statsbomb.json`, `statsbomb.sqlite.gz` y `SHA256SUMS`. Si existe `source-manifest.json`, comprueba que corresponda a esta captura; la importación HTTP actual no lo regenera.
8. En la entrega indica fuente, cobertura, ficheros generados, comprobaciones y diferencias de métricas. No subas la caché `data/raw/` ni presupongas que todos los eventos aparecen íntegros en el SQLite normalizado.

No presentes xG previo al tiro como PSxG ni calcules goles evitados sin la fuente adecuada. Un dato desconocido se conserva como `null` y se muestra como `—`. Las fixtures mínimas de una prueba automatizada nunca se sirven como estadísticas del producto.

Para ligas y rankings, aplica [LEAGUES.md](../../../docs/LEAGUES.md) desde la raíz documental del repositorio. Comprueba 18/20 equipos y 306/380 partidos según el catálogo, fuente por campo, modelos xG/xA, mínimos y referencia del área por perfil/ámbito. No infieras posiciones detalladas de centrocampistas: los perfiles defensivo/ofensivo son estadísticos.
