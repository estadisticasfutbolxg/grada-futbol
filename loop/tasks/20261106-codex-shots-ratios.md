# 20261106 · Tiros, ratios de ataque y xG recibidos por partido

- Estado: `done`
- Responsable: Codex, a petición de Ivan
- Revisor: autocontrol de Codex; colaborador no asignado
- Rama: `feat/shots-finishing-ratios`
- Base Sites: `467a86c0f131738ed19cb2e3bf6502110165dff2` (versión 3)
- Base GitHub: `32950eca3b408fd8b669d356ff564b70a701238e`
- Issue: no creado
- PR: [#4, fusionado](https://github.com/estadisticasfutbolxg/grada-futbol/pull/4)
- Objetivo de entrega: PR, merge y publicación del incremento, según autorización vigente

## Objetivo y alcance

Mostrar tiros en las tablas, goles/xG y asistencias/xA en jugadores, y xG recibidos por partido jugado en porteros. Se interpreta «xf» como xG por el contexto. La fuente activa y sus datos no cambian. Los campos se derivan al mostrar y exportar; no se editan los artefactos generados.

## Aceptación

- [x] Tiros visibles en tablas de jugadores; equipos cuando la fuente los proporciona.
- [x] Ratios de ataque en tabla, ficha, comparador y CSV, con descripciones e interpretación de 1×.
- [x] xG recibidos / PJ del portero, diferenciados de /90 y con PJ visible.
- [x] Ceros válidos, denominadores cero y valores ausentes correctos; ratios invariantes al cambiar la unidad.
- [x] Checks, subida, merge y publicación verificados por separado.

## Plan y coordinación

1. Revisar consumidor, fórmulas y fuentes reales.
2. Cambiar módulo de métricas, columnas y explicaciones; comprobar límites y exportaciones.
3. Subir el incremento, integrar el PR y publicar manteniendo el Site público.

Archivos compartidos: `dist/metrics.js`, `dist/app.js`, pruebas y contrato de datos. El incremento Understat anterior ya está integrado en PR #3. Base GitHub sincronizada mediante API; la base de Sites coincide con el checkout limpio y la versión 3. El intento de abrir/sincronizar por Git quedó sin resultado tras una interrupción de la herramienta; conservar trabajo y verificar el remoto antes del push.

## Evidencia y revisión

Pendiente. Understat y ESPN no aportan xG recibidos de porteros en las capturas usadas: se conserva `—`. StatsBomb sí atribuye xG a cada portero y permite la métrica. No se divide el xG de un equipo entre sus porteros. El autocontrol no es aprobación del colaborador.

### Comprobaciones realizadas

- `node --check dist/app.js` y `dist/metrics.js`: correctos.
- `node --test tests/metrics.test.cjs tests/laliga.test.cjs tests/security.test.cjs`: correcto, incluidos nulos, ceros, desbordamiento numérico, invariancia por 90 y partidos del portero.
- `python scripts/validate_data.py`: artefactos StatsBomb coherentes; no se regeneran por este cambio de presentación.
- `python scripts/check_collaboration_docs.py` y `git diff --check`: correctos.
- Chromium/Playwright con HTTP local y capturas reales: tiros de Understat, ratios y unidad, ayuda de columnas, ficha, comparador, CSV numérico, xG/PJ de porteros, ausencia en Understat y equipos; móvil de 390 px sin desbordamiento del documento y sin errores JS. No se hicieron peticiones externas en esa comprobación.
- Caso real: Raphinha, 35 tiros, 15/11,3324088156 = 1,3236373876 goles/xG y 3/2,8699574172 = 1,0453116767 asistencias/xA. Alireza Beiranvand: xG recibido / 2 PJ = 0,7013650205 frente a 1,1560961876 por 90 con 109,2 minutos.

Autocontrol funcional correcto. La versión 3 anterior está desplegada con estado `succeeded`; el Site sigue público. El resultado de publicación se registra debajo.

## Resultado verificado

PR #4 fusionado por squash: `e3fa04e18b2bc1fb4b324013bb0f6da870b297d9`; head revisado `064002753ba28e81e463b9090044580ef1ac3872`. Push del código de Sites confirmado por SHA remoto `b4541ec3efa022c20a7fdc13cda5263720240f8b`, con archivo de despliegue comprobado contra ese commit. Versión 4 desplegada con estado nativo `succeeded`: [GRADA](https://grada-futbol-analitica.ivanmatema2.chatgpt.site). Deployment: `appgdep_6aedb25ec8688191ae4d24f7e82b2aa0`.

Sin cambios de acceso: público para visitantes y permisos de edición conservados. Sin fuentes nuevas ni cambios en las capturas. Este registro posterior solo modifica documentación; no cambia los archivos servidos.
