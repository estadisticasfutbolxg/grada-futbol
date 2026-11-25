# LaLiga, calidad, rendimiento y torneos europeos

- Estado: `done`
- Responsable: Codex
- Revisor: autocontrol, sin revisión independiente
- Ramas: `fix/laliga-team-coverage-quality` (incremento 1), `feat/uefa-season-totals` (incremento 2)
- Base Sites: `e857d53b63c2a79c5c94908deebc686f109716b9`, sincronizada
- Base GitHub: `1295d54f446236d961cd5e2f2d36563842cd9e88`, comprobada

## Objetivo y criterios

- [x] Recuperar xG/xGA de equipos LaLiga con capturas FotMob verificadas, JSON y SQLite coherentes; explicar huecos de Real Madrid sin inventar ceros.
- [x] ESLint y Ruff reproducibles, corregir problemas y refactorizar código afectado.
- [x] Medir y optimizar rendimiento preservando resultados.
- [x] Selecciones con candidatos de todas las ligas (sustituye la restricción de siete).
- [x] Verificar torneos europeos FotMob/ESPN y añadir los equivalentes, agregando por identidad y muestras compatibles, con desglose.
- [x] Tests, PR/merge y publicación privada verificados.

## Evidencia y coordinación

No hay cambios previos ajenos. Archivos compartidos: importadores, comparación, ámbitos, selecciones y calidad. Capturas previas privadas en `/workspace/scratch/grada-laliga-team-review/baseline/`. Las capturas actuales carecen de xG/xGA en los veinte equipos LaLiga; FotMob publica ahora veinte filas verificadas en cada ranking. Real Madrid tiene score válido en todas sus líneas; Rüdiger carece de intercepciones y otros cinco no alcanzan 200 minutos. Sin revisión visual disponible por ahora.

## Incremento 1

LaLiga recupera xG/xGA en veinte equipos. Real Madrid: 33,6 xG, 12,9 xGA, 13 PJ. FotMob pasa de 110 a 129 partidos cubiertos (+19 agregados; sin archivos de encuentros). Se consulta una ficha Rüdiger: una ficha modificada, cero nuevas; siguen ausentes sus intercepciones y no se imputan ceros. ESPN y otras ligas conservadas. Quince combinados regenerados con referencia común; equipos usan sus fechas propias y cachés recuperan la captura de equipo posterior.

ESLint 10, Ruff 0.17.6, lockfiles y CI de lectura incorporados. Cero errores/avisos; 33 archivos Node y 18 casos Python correctos. Se extrae la función común de xG; se elimina código muerto; se evitan renders ocultos. Mediana local de navegación 168,85 → 87,44 ms, tabla/cabecera idénticas (VM/DOM, sin red/layout). Selecciones incluye quince ligas: 135 países y 37 XI. Sin QA visual disponible. Publicación del incremento pendiente; torneos siguen en revisión.

Incremento 1 publicado: PR #70 integrado en `b6e662904be9a457fd55b7abba37543b8bd8c5c5`. CI quality correcto en head `5fabadaab7d701d837a9d4fee20d1c3035aadc0a` (204 casos Node), 18 casos Python; la primera ejecución detectó un cambio de Worker omitido del commit y se corrigió antes de integrar/publicar. Sites v38, fuente `8bcc1425c26f428660516ee2b7b461f6c7110a9e`, despliegue `appgdep_6b06a29630608191ab28fab81090e561` succeeded. Worker SHA256 `5b830edfc0be16d2827af9bb5cddb6060ee3f17e8c13cb8ce0a19e6df6a01e39`; owner-only revisión 3 y runtime revisión 1 conservados. Tres arranques VM/DOM, treinta fuentes HTTP exactas y 42 rutas retiradas 400/404; sin identidad 401. Evidencia privada `live-v38.json`, `runtime.json`, `benchmark-ui.json` y `data-audit.json` en scratch. Sin QA visual; histórico StatsBomb sin su JSON local. No se presenta como aprobado.

## Incremento 2 publicado

Champions (FotMob 42/47760), Europa League (73/47759) y Conference League (10216/47761) confirman temporada 2026/27, 36 clubes y fase de liga: 8/8/6 PJ. ESPN confirma nombres/temporada y clasificación. Se han capturado y parseado rankings FotMob: 774/781/703 fichas y 81/72/54 partidos cubiertos. ESPN y 24 alias de clubes comprobados. Combinación por ID, muestras propias, posición/score canónicos y regeneración idempotente verificados; entrega verificada. La ruta FotMob 525 resultó ser AFC Champions League y se descartó por identidad explícita del torneo; no se reutiliza su captura.


## Cierre y límites

PR #71 integrado en `b9829516934a6773e79790ad593645b516862750`, CI quality success en head `076a78b8f0c11cb5f395fa7a3ed4315c48a7560a` (job 139129816570). 34 archivos Node, 18 casos Python, ESLint, Ruff, enlaces y diff correctos. 8.302 equivalencias de score, 6.766 perfiles, 2.645 medias de equipo, 13.974 contribuciones y 1.156.528 lecturas de métricas. Dieciocho SQLite contrastados con JSON: 8.658 filas, 108.032.000 bytes lógicos / 9.994.286 gzip. Treinta fuentes domésticas v38 intactas.

Sites v39 desde fuente `7d7ca1125a78a1d5df2a569bf2c47442e233d9bc`, despliegue `appgdep_6b06b46ffa448191ac98b1bfc3df6ba9` succeeded, Worker SHA256 `accd4c93dd9ab12aa8e5866f4df8c9c624f4d0cddfcef05a291eaa4286e2ef3b`. Owner-only revisión 3 y runtime revisión 1 conservados. Tres arranques VM/DOM del Worker exacto, enlace de selecciones y fallo de fuente cubiertos; HTTP confirma 36 capturas exactas, bundle gzip 91.726 bytes, 42 rutas retiradas 400/404 y actualización sin identidad 401. Sin QA visual disponible ni revisión independiente; no se presenta como aprobación externa.

Evidencia privada en `/workspace/scratch/grada-laliga-team-review/`: `cup-data-audit.json`, `sqlite-cups-audit.json`, `score-audit-cups-full.json`, `metric-audit-cups.json`, `runtime-cups.json`, `live-v39.json`. Listado de 2.258 filas incorporadas en `/workspace/entregas/grada-jugadores-incorporados-2026-11-25.csv`, fuera de GitHub. Son 798 IDs nuevos frente a ligas y 207 partidos de cobertura agregada por proveedor, no encuentros individuales. Se conserva desconocido donde falta evidencia; hay 400 jugadores de temporada sobre 200 minutos sin todos los ejes propios. Los torneos solo cubren fase de liga; no se incluyen previas/eliminatorias. La mejora medida del 48,2 % corresponde al primer incremento con entradas idénticas; no se extrapola a la carga ampliada. Capturas publicadas revalidadas por ETag, sin prometer una cifra de reducción de red no medida.
