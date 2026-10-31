# Colaborar en GRADA

## Empezar entre dos personas

Cada persona usa su propia cuenta de GitHub. El propietario añade al colaborador desde la configuración del repositorio; esta documentación no ha enviado invitaciones ni cambiado permisos. Completad los campos de responsable y revisor con vuestros usuarios al tomar una tarea.

Leed [AGENTS.md](AGENTS.md), [el estado](docs/STATUS.md) y [el loop](loop/README.md). Para revisar datos o definiciones, consultad [DATA.md](docs/DATA.md).

## Reparto recomendado

| Área | Responsable de cada tarea | Revisión |
| --- | --- | --- |
| Interfaz, tablas, filtros y accesibilidad | Una persona | La otra comprueba el caso de uso |
| Importador, SQLite y métricas | Una persona | La otra contrasta cálculos y cobertura |
| Cambios que cruzan interfaz y datos | Una persona coordina el contrato | La otra revisa antes de integrar la parte dependiente |

El reparto es por tarea, no una asignación permanente. El responsable modifica el archivo de su tarea; el revisor deja sus observaciones en el PR. No mantengáis dos tableros contradictorios con estados editados a mano.

## Ramas y commits

Para un repositorio remoto que ya contenga el proyecto, con el árbol de trabajo limpio:

```sh
git switch main
git fetch origin
git pull --ff-only origin main
git switch -c feat/GRADA-123-filtro-jugadores
```

Usad `feat/`, `fix/`, `docs/` o `data/`, identificador de tarea y un nombre corto. Una rama por resultado revisable. Antes de cambiar de rama, revisad el estado y conservad el trabajo pendiente; los comandos anteriores no son una receta para un checkout con cambios ajenos.

Los commits describen el cambio y su propósito. Preparad solo los archivos de vuestra tarea: evitad un `git add .` cuando hay cambios de otra persona o una importación que no pertenece a la tarea.

## Trabajo simultáneo

La opción más sencilla es un clon por persona. En una misma máquina, un worktree por tarea evita compartir el árbol de trabajo:

```sh
git worktree add ../grada-GRADA-123 -b feat/GRADA-123-filtro-jugadores origin/main
```

Este comando presupone una rama base sincronizada, un directorio libre y una rama nueva. Acordad el orden cuando dos tareas necesiten `dist/app.js`, `scripts/import_statsbomb.py` o los datos generados. Un archivo de tarea es una declaración de coordinación, no un bloqueo técnico de archivos.

Para actualizar una rama compartida, preferid fusionar `origin/main` sin reescribir su historial. El rebase queda para ramas personales acordadas. Tras resolver un conflicto, ejecutad otra vez los checks afectados.

## Pull request y revisión

Abrir el PR no integra ni publica el cambio. Usad [la plantilla](.github/pull_request_template.md): problema, resultado, validación y límites. Pedid revisión a la otra persona una vez disponible. Una revisión del mismo asistente sirve de autocontrol, pero no cuenta como la revisión del colaborador.

El revisor señala problemas con evidencia y una propuesta concreta. Resueltos los bloqueos, una persona integra el PR según la configuración real de GitHub y la autorización del equipo. Recomendamos squash para un cambio acotado; no se ha activado ninguna protección de rama desde estos archivos.

## Cuándo se considera terminado

- El alcance y los criterios de aceptación se cumplen.
- Los checks pertinentes están registrados con resultado y limitaciones.
- Las definiciones de datos o decisiones que cambian quedan documentadas.
- La revisión y el estado de integración constan en la tarea.
- La publicación se verifica por separado si forma parte del alcance.

Si el objetivo era preparar un parche o documentación local, esa entrega puede terminar sin merge: indicadlo explícitamente. No marquéis un cambio integrado si solo existe en un ZIP.

## Fuentes del flujo

Basado en [GitHub flow](https://docs.github.com/en/get-started/using-github/github-flow), adaptado al tamaño de GRADA. Las [skills de Codex](https://developers.openai.com/codex/skills/) y [AGENTS.md](https://developers.openai.com/codex/guides/agents-md/) aportan instrucciones al asistente; Git y los permisos de GitHub siguen siendo los mecanismos reales de colaboración.
