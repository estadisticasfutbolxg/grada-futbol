---
name: grada-loop
description: Ejecuta una tarea acotada en GRADA con coordinación entre dos personas, rama propia, validación y relevo. Úsala al implementar, reparar o retomar trabajo del repositorio; no activa procesos autónomos ni sustituye una revisión independiente.
---

# Loop de una tarea de GRADA

## Preparación

1. Lee `AGENTS.md`, `CONTRIBUTING.md`, `docs/STATUS.md` y `loop/README.md` desde la raíz del repositorio.
2. Localiza la ficha en `loop/tasks/`. Si no existe, crea una desde `loop/templates/task.md` para el objetivo autorizado. No amplíes el objetivo para llenar la plantilla.
3. Revisa rama, remotos, cambios locales y tareas que afecten a los mismos archivos. Conserva cualquier trabajo ajeno o previo.
4. Registra responsable, revisor, base, alcance y criterios verificables. Usa un identificador de issue si existe; sin issue, usa una fecha y alias que eviten colisiones. No inventes números ni enlaces de GitHub.

## Iteración

- Elige el siguiente criterio pendiente de la tarea y escribe un plan corto.
- Trabaja en su rama y limita los cambios al alcance. Si el remoto no está accesible, registra la limitación y continúa el trabajo local independiente.
- Si cambias datos o métricas, aplica `.agents/skills/grada-data/SKILL.md`.
- Ejecuta los checks proporcionales de `AGENTS.md`. Repara fallos de la tarea, no problemas ajenos sin relación.
- Compara el diff con los criterios. Aplica `.agents/skills/grada-review/SKILL.md` para el autocontrol y la entrega.
- Actualiza la ficha de la tarea con resultado, evidencia y siguiente paso; no marques `done` por haber terminado de editar.
- Por preferencia expresa del usuario, guarda cada incremento coherente en un commit y súbelo a la rama de la tarea en GitHub tras los checks relevantes, sin esperar a terminar toda la funcionalidad. No subas credenciales, bases ni capturas generadas. Usa un PR en borrador si quedan criterios pendientes y actualiza su estado al completar la revisión.
- Verifica el SHA remoto después de cada subida y registra el enlace comprobado. Si falla el push, conserva el commit y continúa solo el trabajo independiente. No confundas commit local, subida, merge y despliegue.

## Coordinación y salida

Una persona modifica la ficha; el revisor usa el PR. Si la otra persona cambia el mismo contrato o archivo, acordad orden o dividid la tarea. No deshagas sus cambios para acelerar la tuya.

Cierra cada incremento con evidencia y continúa las vueltas necesarias de la misma tarea hasta satisfacer el objetivo autorizado. Termina la tarea cuando el objetivo completo está entregado o hay un bloqueo real. Si dos intentos de reparación del mismo fallo no aportan nueva evidencia, cambia el diagnóstico o registra el bloqueo. En ese caso deja causa observada, intentos y acción siguiente; no repitas llamadas pendientes indefinidamente. Puedes retomar cuando haya nueva información.

Resume en la entrega: tarea, cambios, comprobaciones, estado real de Git, límites y siguiente acción. Usa `loop/templates/handoff.md` si cambia la persona o la sesión. La skill no autoriza por sí sola un merge, un despliegue ni cambios de acceso; respeta las autorizaciones que ya existan.
