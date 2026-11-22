# Instrucciones para trabajar en GRADA

## Contexto

GRADA es una web de estadísticas de fútbol en español. Usa HTML/CSS/JavaScript en `dist/`, Python estándar para importar datos y generar SQLite, y un Worker de lectura para actualización general. Consulta también docs/REFRESH.md. Consulta [README.md](README.md), [la arquitectura](docs/ARCHITECTURE.md) y [el estado](docs/STATUS.md) antes de cambiar supuestos del proyecto.

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

- Los datos visibles deben proceder de StatsBomb Open Data o de las integraciones de ESPN, Understat y FotMob para las ligas 2026/27 de `dist/leagues.json`; declarar fuente, competición, temporada y cobertura. LaLiga da prioridad a Understat → ESPN → FotMob; las otras ligas a FotMob → ESPN. Solo se unen coincidencias inequívocas o identidades revisadas por ID, nombre y club. Todas las ligas concatena fichas con IDs propios y recalcula referencias; no une personas por nombre entre competiciones. Conservar la fuente y cobertura de cada campo; no calcular tasas con denominadores de otra fuente.
- El usuario elige conservar las capturas actuales mientras gestiona permisos (9 de noviembre de 2026). Esa instrucción no acredita una licencia de redistribución de ESPN, FotMob o Understat; no des permisos por obtenidos. Consulta [REFRESH.md](docs/REFRESH.md) para las fuentes oficiales revisadas.
- Nunca inventes cifras, extrapoles una temporada con un multiplicador ni completes métricas ausentes con cero. Conserva `null` y muestra `—`. La excepción documentada de xG cero requiere cero tiros y cero goles explícitos, verificados y de la misma muestra; conserva los originales y etiqueta la derivación.
- Las posiciones se resuelven en `dist/positions.js`: consenso de etiquetas inequívocas entre proveedores y, sin acuerdo, ficha FotMob con respaldo de las otras fuentes. Las etiquetas mixtas no votan como si fueran una sola. Conserva alternativas, método y procedencia; no elijas posición por el score o datos disponibles. El cruce genérico en `dist/identity.js` exige mejor coincidencia única en ambos sentidos, mismo club y compatibilidad de portería; conserva los IDs revisados y no reutilices una ficha. Las cifras mantienen su prioridad original por liga.
- Usa el modelo común de `dist/scores.js` y [SCORES.md](docs/SCORES.md): un score por jugador y referencia de todas las ligas cargadas para cualquier vista. El mínimo común es 200 minutos inclusive en todas las posiciones (`dist/sampling.js`), tanto del jugador como de cada eje; solo los ejes de portero sin minutos propios conservan la alternativa de 2 PJ tras verificar los 200 minutos del jugador. Resuelve POR/DEF/MED/DEL con las fuentes; en MED resuelve primero su perfil estadístico. Los DEF con puesto de lateral/carrilero publicado usan un radar mixto de ataque y defensa y referencia de laterales, incluidos los polivalentes. `fairplay.js` ajusta el área base con tarjetas emparejadas y minutos propios, con descuento relativo lineal `0,10 × (amarillas + 10 × rojas) × 90 / minutos propios`, limitado solo por el score mínimo 0. Los pesos manuales no equivalen a sanciones cumplidas, minutos en inferioridad ni un ciclo universal de cinco amarillas; sin datos/muestra, conserva base y declara sin ajuste, sin inventar ceros. Los índices MED de clasificación no reciben este ajuste. Nunca elijas el score más alto ni lo cambies al abrir otro ranking. Todos los scores de equipo son promedios de esos mismos scores finales ponderados por minutos; no añadas un índice independiente bajo la misma etiqueta.
- En totales, muestra sumas conocidas con cobertura y etiqueta parcial cuando falten registros. Un valor ausente no oculta cifras conocidas ni se imputa como cero.
- La nacionalidad es el país deportivo explícito de FotMob con identidad y club verificados, no una inferencia por nombre, nacimiento o liga. Conserva fecha y URL y no afirmes elegibilidad o convocatoria oficial. Selecciones usa el score canónico y siete sistemas con puestos compatibles, contención y creación. Cada sistema maximiza la suma de scores; entre esos onces se elige la mayor media ponderada por minutos de club. Deduplica por ID de proveedor sin unir muestras y conserva evidencia del puesto, distinta del perfil del score. Sin once completo, score desconocido. Consulta [NATIONS.md](docs/NATIONS.md).
- Excluye las tandas de las métricas; conserva la distinción entre goles de jugadores y marcadores con autogoles.
- Mantén explícitas las definiciones de xA derivada, minutos y paradas. PSxG/xGOT recibido usa únicamente muestras de FotMob verificadas: goles evitados + goles sin autogoles comprobados o mapa completo. La eficacia vs xGOT del score utiliza goles emparejados de esa misma ficha; nunca el dato de equipo ni goles de otro proveedor.
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

Al terminar cualquier actualización de datos, comunica los jugadores y partidos actualizados. Distingue jugadores nuevos/modificados de una nueva fecha de captura, y partidos individuales cambiados de la cobertura agregada de temporada. Incluye liga, fuente y fallos conservados; si una fuente no permite identificar partidos concretos, indícalo sin inventar un recuento.
