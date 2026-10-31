---
name: grada-review
description: Revisa cambios de GRADA antes de entregarlos, con foco en errores funcionales, datos reales y evidencia de validación. Úsala para revisar un diff, preparar un PR o comprobar una corrección; el autocontrol no representa la aprobación del otro colaborador.
---

# Revisión y entrega de GRADA

## Alcance

Lee `AGENTS.md`, los criterios de la tarea y `docs/DATA.md` si se tocan métricas. Compara contra la base de la tarea o del PR. Revisa el diff y el código necesario para entenderlo; no conviertas una revisión pequeña en una auditoría de todo el repositorio.

## Prioridades

- Coherencia de goles, autogoles, tandas, xG, xA derivada, porteros, denominadores y cobertura.
- Ausencia de datos ficticios, métricas inventadas o valores nulos convertidos en cero.
- Filtros, orden, perfil, comparador, CSV y estados vacíos afectados por el cambio.
- Concordancia de los artefactos generados y de su procedencia.
- Conservación del trabajo del colaborador y de la audiencia/configuración existentes.

Ejecuta solo los checks pertinentes de `AGENTS.md`. Para datos, usa `python scripts/validate_data.py`. Si falta el navegador, una dependencia o la red, separa esa limitación de un fallo funcional y no afirmes haber comprobado lo que no pudiste ejecutar.

## Hallazgos

Ordena los problemas por impacto. Para cada uno, cita archivo/línea cuando sea posible, condición que lo provoca, efecto y cómo comprobar la corrección. Evita convertir preferencias de formato o hipótesis sin evidencia en bloqueos. Si no encuentras problemas, dilo y señala los límites de revisión.

## Salida

Usa `.github/pull_request_template.md` y actualiza la ficha de tarea. La entrega distingue estado local, push, PR, revisión, merge y publicación. Una autocorrección no es una aprobación del colaborador. Abrir un PR es un resultado revisable; integrarlo y desplegar son pasos separados con la autorización vigente del equipo.

No envíes menciones, comentarios ni solicitudes de revisión a otra persona por aplicar esta skill salvo que la tarea lo autorice. Puedes preparar su contenido localmente.
