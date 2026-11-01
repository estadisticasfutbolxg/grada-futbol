# Instrucciones para trabajar en GRADA

## Contexto

GRADA es una web de estadísticas de fútbol en español. Usa HTML/CSS/JavaScript en `dist/`, Python de biblioteca estándar para importar StatsBomb y SQLite como descarga. Consulta [README.md](README.md), [la arquitectura](docs/ARCHITECTURE.md) y [el estado](docs/STATUS.md) antes de cambiar supuestos del proyecto.

## Colaboración

- Aplica [CONTRIBUTING.md](CONTRIBUTING.md) y el [loop de trabajo](loop/README.md).
- Trabaja una tarea acotada en una rama. Identifica responsable, revisor, alcance y archivos compartidos en `loop/tasks/`.
- Al comenzar, inspecciona `git status --short`, la rama y los remotos. Conserva los cambios que ya existan y no los atribuyas a tu tarea.
- Sincroniza con el remoto disponible antes de empezar; si no hay conexión, registra la base local y la sincronización pendiente. No hagas pasar una copia local por el estado de GitHub.
- Usa clones separados o worktrees si compartís máquina. Evita dos tareas activas sobre los mismos archivos; acuerda el orden de integración.
- Si hay conflicto, conserva las dos intenciones y vuelve a validar. No uses `reset --hard`, limpieza destructiva ni un push forzado como solución rutinaria.
- Reutiliza las autorizaciones vigentes del usuario. Preparar un PR no exige pedir permiso adicional. No cambies permisos, audiencia ni protecciones del repositorio como efecto secundario.
- No lances un proceso autónomo infinito ni subagentes solo porque existan estas skills. El loop describe un procedimiento de trabajo.

## Datos y producto

- Los datos visibles deben proceder de StatsBomb Open Data o de la integración de ESPN autorizada para LaLiga 2026/27; declarar fuente, competición, temporada y cobertura. No mezclar métricas entre proveedores.
- Nunca inventes cifras, extrapoles una temporada con un multiplicador ni completes métricas ausentes con cero. Conserva `null` y muestra `—`.
- Excluye las tandas de las métricas; conserva la distinción entre goles de jugadores y marcadores con autogoles.
- Mantén explícitas las definiciones de xA derivada, minutos y paradas. PSxG y goles evitados siguen no disponibles hasta que exista una fuente adecuada.
- `dist/data.js` y los archivos de datos en `dist/downloads/` son generados. Cambia el importador y regenera el conjunto coherente; no edites cifras a mano.
- La caché `data/raw/`, las credenciales y los archivos `.env` quedan fuera de Git. `dist/` contiene también el código fuente de la web: no lo borres como si todo fuese una salida de build.

## Skills del repositorio

- `.agents/skills/grada-loop/SKILL.md`: ejecutar una tarea y dejar un relevo claro.
- `.agents/skills/grada-data/SKILL.md`: importar, calcular o revisar estadísticas de StatsBomb.
- `.agents/skills/grada-review/SKILL.md`: revisar un diff y preparar una entrega verificable.

En Codex se pueden invocar como `$grada-loop`, `$grada-data` y `$grada-review`. En otros asistentes, abre el `SKILL.md` y aplica sus instrucciones. Estos archivos no instalan herramientas ni conceden acceso a GitHub.

## Validación proporcional

| Cambio | Comprobación |
| --- | --- |
| Solo documentación | `git diff --check` y revisar rutas/enlaces locales modificados |
| JavaScript | `node --check dist/app.js` y comprobar el comportamiento afectado en navegador si está disponible |
| Python | `python -m py_compile scripts/import_statsbomb.py scripts/validate_data.py` |
| Datos, métricas, importación o descargas | `python scripts/validate_data.py`; regenerar si cambia el cálculo |
| Interfaz | Comprobar filtros, vacío, búsqueda, tabla, ficha, comparador y CSV afectados; móvil si cambia el layout |

No importes de nuevo todos los partidos por cambiar Markdown. No añadas pruebas que solo repitan el código; comprueba resultados e invariantes de interés. Distingue un fallo de código de una comprobación bloqueada por el entorno.

## Code Review Rules

Señala errores reproducibles de cifras, denominadores, cobertura, periodos, asignación de porteros y coherencia entre JSON/JS/SQLite. Revisa que los valores ausentes no se conviertan en rankings con cero, y que una importación parcial no parezca una competición completa. Cita archivo, efecto y evidencia. El formato no sustituye a una revisión funcional.

## Entrega

Documenta resultado, comprobaciones reales, límites y siguiente paso en la tarea. Distingue: cambio local, commit local, push confirmado, PR, merge y despliegue confirmado. Un ZIP o un commit local no demuestra una subida. No repitas indefinidamente una escritura que queda pendiente; registra el bloqueo y entrega los archivos revisables.
