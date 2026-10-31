# GRADA-001 · Subir y verificar la base del repositorio

- Estado: `review`
- Responsable: estadisticasfutbolxg
- Revisor: por asignar
- Rama de entrega: `docs/colaboracion`
- Base remota observada: `d73f0123d12fe33eb23cbc62cabff0c3760c8909`
- Issue: no creado; identificador local
- PR: #1, ampliado con código y generadores
- Objetivo de entrega: repositorio remoto completo y clonable

## Objetivo

Que ambas personas puedan clonar la misma versión de GRADA con código, datos reales y documentación.

## Alcance y coordinación

La carga inicial incluye código de `dist/`, importadores, validadores, skills, documentación, loop y plantillas. El usuario ha indicado expresamente que no se suba la base: los datos de `dist/downloads/` y `data.js` se generan, no se versionan como payload. No se suben cachés, secretos ni estado interno de Sites.

## Aceptación

- [ ] La rama remota contiene el proyecto completo, no solo `.gitignore`.
- [ ] Un clon limpio abre la web vacía; tras ejecutar la importación, el validador comprueba los datos reales generados.
- [ ] Ambas personas tienen los accesos adecuados, comprobados por el propietario.
- [ ] Consta el commit remoto verificado y el siguiente paso para publicar, si se desea.

## Evidencia

Última lectura: 30 de octubre de 2026; `main` contenía solo `.gitignore`. La conexión de GitHub identificó al propietario, pero no se completaron las escrituras posteriores. Un ZIP local sí está preparado. No se afirma que falten permisos concretos sin una respuesta que lo demuestre.

## Siguiente paso

Verificar la ampliación de PR #1 con código y generadores; la base queda fuera por indicación del usuario. La revisión, el merge y el despliegue siguen siendo pasos separados.
