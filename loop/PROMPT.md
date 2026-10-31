# Prompt para una iteración

Copia el bloque en Codex desde la raíz del repositorio y sustituye la ruta de tarea por una ficha real.

```text
Usa $grada-loop para trabajar en loop/tasks/ID-de-tarea.md.
Lee AGENTS.md y la ficha antes de editar. Comprueba rama, remotos y cambios previos.

Elige el siguiente criterio pendiente dentro del alcance acordado. Registra un plan
corto, conserva el trabajo ajeno e implementa un incremento revisable.

Si cambias datos, usa $grada-data. Valida el resultado con los checks pertinentes;
no descargues todos los datos por una tarea de documentación. Haz el autocontrol
con $grada-review y deja preparada la entrega.

Actualiza la ficha con evidencia, resultado y siguiente paso. No inventes resultados
ni enlaces de GitHub. Distingue cambios locales, push, PR, revisión, merge y despliegue.
Respeta las autorizaciones vigentes; no añadas confirmaciones de rutina ya concedidas.

Termina al cumplir el objetivo de esta vuelta o al registrar un bloqueo real.
No inicies tareas ajenas, procesos infinitos ni subagentes por este prompt.
```

Si el asistente no reconoce skills locales, abre los tres `SKILL.md` pertinentes desde `.agents/skills/` y aplica el mismo procedimiento. La carga de una skill no es una instalación de servicios ni un permiso para publicar.
