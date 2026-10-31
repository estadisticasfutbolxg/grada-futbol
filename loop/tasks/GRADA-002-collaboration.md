# GRADA-002 · Preparar colaboración, skills y loop

- Estado: `review`
- Responsable de la entrega: Codex, a petición de estadisticasfutbolxg
- Revisor: segundo colaborador por asignar
- Rama de entrega: `docs/colaboracion`
- Base local: `9954c63`; ya existían cambios de datos y documentación anteriores
- Issue: no creado; identificador local
- PR: consultar el pull request de la rama `docs/colaboracion` en GitHub
- Objetivo de entrega: archivos y paquete local revisable

## Objetivo

Dar a dos personas y sus asistentes un procedimiento común para cambiar GRADA sin pisarse y con evidencia al entregar.

## Alcance

AGENTS, CONTRIBUTING, tres skills, documentación de arquitectura/datos/estado, loop y plantillas de tarea/relevo/PR/issue. Añadir validadores reutilizables sin cambiar las estadísticas del producto.

## Aceptación

- [x] Existen tres skills con disparadores y límites claros.
- [x] El loop define estados, responsable, revisor, validación y salida.
- [x] Hay documentación de arquitectura y contrato de datos.
- [x] Los hechos locales y remotos están diferenciados.
- [x] Los validadores y enlaces locales se han comprobado.
- [ ] El segundo colaborador ha revisado el procedimiento.

## Evidencia

Comprobaciones locales completadas: `python scripts/check_collaboration_docs.py` (3 skills, 3 tareas, 22 documentos), `python scripts/validate_data.py` (64 partidos, 32 equipos, 681 registros de jugadores, 234.637 eventos), compilación de los dos validadores y `git diff --check`.

En copias temporales se comprobó que se rechazan un JS desincronizado, un porcentaje incorrecto, una cobertura falsa y un enlace local roto. No se modificaron los datos reales del producto. El PR se prepara desde la rama `docs/colaboracion`; no se ha configurado protección de ramas. La revisión de otra persona sigue pendiente.

Entrega de colaboración preparada para GitHub en `docs/colaboracion`. El código y los datos grandes de la web continúan pendientes en GRADA-001. La existencia de esta rama no acredita merge ni despliegue.

## Siguiente paso

Revisar los archivos del paquete y completar GRADA-001. Después asignar responsables reales y tomar tareas independientes.
