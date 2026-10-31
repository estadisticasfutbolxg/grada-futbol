# Mapa del proyecto y de la documentación

Empieza por [README](../README.md), [CONTRIBUTING](../CONTRIBUTING.md) y [STATUS](STATUS.md).

```text
AGENTS.md                         Instrucciones para asistentes
CONTRIBUTING.md                   Acuerdos de trabajo entre dos personas
.agents/skills/
  grada-loop/SKILL.md              Ejecutar una tarea acotada
  grada-data/SKILL.md              Cambiar y comprobar datos de StatsBomb
  grada-review/SKILL.md            Revisar y entregar
loop/
  README.md                       Ciclo, estados y condiciones de salida
  PROMPT.md                       Prompt reutilizable de una iteración
  templates/task.md               Ficha de tarea
  templates/handoff.md            Relevo entre personas o sesiones
  tasks/                          Una ficha por tarea
.github/
  pull_request_template.md        Evidencia para revisar un PR
  ISSUE_TEMPLATE/                 Tarea y bug
  workflows/pages.yml             Flujo de publicación ya existente
scripts/
  import_statsbomb.py             Importación y generación de datos
  validate_data.py                Comprobaciones locales sin red
  check_collaboration_docs.py     Enlaces, skills y estructura del loop
docs/
  ARCHITECTURE.md                  Estructura y puntos de coordinación
  DATA.md                         Contrato, cálculos y límites
  STATUS.md                       Hechos comprobados, pendientes y siguientes pasos
  decisions/                      Decisiones duraderas
```

`dist/` incluye el código fuente de la web y las salidas de datos. `data/` es una caché local ignorada. Las tareas describen trabajo pendiente o entregado; no son datos del producto.

Consulta [la decisión del flujo](decisions/0001-collaboration-loop.md) para entender por qué se usa este sistema sin introducir un framework de automatización.
