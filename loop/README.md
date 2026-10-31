# Loop recomendado para dos personas

El ciclo es **definir → implementar → validar → revisar → integrar → registrar**. Una vuelta produce un cambio pequeño y verificable, no una nueva lista interminable de tareas. Una tarea puede necesitar varias vueltas: continúa dentro del alcance autorizado hasta cumplir el objetivo completo o encontrar un bloqueo real; no hace falta devolver el control al usuario tras cada incremento.

## Estados

| Estado | Significado | Siguiente paso |
| --- | --- | --- |
| `ready` | Objetivo, responsable, alcance y aceptación claros | Tomar la tarea y crear rama |
| `active` | Se está implementando | Validar el siguiente incremento |
| `review` | Cambio preparado con evidencia | La otra persona revisa |
| `done` | Se entregó el objetivo acordado y consta su resultado | Archivar el contexto útil |
| `blocked` | Falta algo necesario para continuar | Registrar causa y acción que desbloquea |

`blocked` puede salir de cualquier estado y vuelve al estado adecuado cuando cambia la evidencia. Un cambio solicitado en revisión vuelve a `active`. Un rechazo de una herramienta o una llamada pendiente no es un merge ni una publicación.

## Una vuelta, paso a paso

1. **Definir:** lee la ficha y el estado de Git. Escribe el criterio pendiente, plan de 3–5 pasos como máximo y archivos implicados. Si no existe ficha, copia [la plantilla](templates/task.md). No alteres tareas ajenas.
2. **Implementar:** trabaja en una rama de la tarea, conserva cambios previos y modifica lo necesario para ese criterio.
3. **Validar:** ejecuta checks relevantes, reproduce el caso de uso y registra comandos, salida resumida y límites. Para Markdown no descargues de nuevo StatsBomb.
4. **Revisar:** compara el diff con el alcance. La persona responsable hace autocontrol; la otra persona revisa el PR. Los hallazgos se resuelven y comprueban.
5. **Integrar:** prepara commit/push/PR cuando estén autorizados. El responsable de integración del equipo fusiona según la configuración real del repositorio. No se supone una protección o una aprobación inexistente.
6. **Registrar:** deja resultado, enlaces comprobados y siguiente acción en la ficha. Para un relevo usa [la plantilla de handoff](templates/handoff.md).

## Cómo evitar pisarse

Cada tarea tiene un responsable que edita su ficha. El revisor escribe en el PR y el responsable resume la resolución. Los cambios del archivo de tarea ayudan a coordinar, pero no bloquean técnicamente a otro proceso.

Antes de trabajar, compara los archivos afectados con las tareas `active`. Si se solapan, acordad un orden. Para cambios de datos, la versión del contrato y el código de agregación se integran antes de regenerar las salidas dependientes.

La referencia remota sirve para saber si una reserva de tarea ya llegó al repositorio. Si solo existe localmente, no asumas que el colaborador conoce la asignación.

## Identificadores

Con un issue real, usa `GRADA-<número-del-issue>`. Sin issue, usa una fecha, alias y nombre: `20261030-ivan-filtros`. Los primeros `GRADA-001` a `GRADA-003` de este paquete son identificadores locales de arranque, no issues ya creados en GitHub.

## Cuándo parar

Termina la vuelta al entregar el criterio acordado. Si un mismo fallo persiste tras dos intentos de reparación sin evidencia nueva, registra lo observado y el siguiente diagnóstico. Si falta acceso, una decisión del equipo o una dependencia, deja la tarea `blocked` y continúa solo trabajo independiente ya autorizado.

No hay reintentos indefinidos, bucle en segundo plano ni elección automática de la siguiente tarea sin un alcance acordado. El [prompt](PROMPT.md) y las skills ayudan a repetir este procedimiento desde una sesión nueva.

## Checks reutilizables

Para estructura, enlaces y skills:

```sh
python scripts/check_collaboration_docs.py
git diff --check
```

Para los datos incluidos:

```sh
python scripts/validate_data.py
```

Los demás checks dependen del cambio; están en [AGENTS.md](../AGENTS.md).
