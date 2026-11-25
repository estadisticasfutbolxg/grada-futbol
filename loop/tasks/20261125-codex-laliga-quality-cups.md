# LaLiga, calidad, rendimiento y torneos europeos

- Estado: `active`
- Responsable: Codex
- Revisor: autocontrol, sin revisión independiente
- Rama: `fix/laliga-team-coverage-quality`
- Base Sites: `e857d53b63c2a79c5c94908deebc686f109716b9`, sincronizada
- Base GitHub: `1295d54f446236d961cd5e2f2d36563842cd9e88`, comprobada

## Objetivo y criterios

- [ ] Recuperar xG/xGA de equipos LaLiga con capturas FotMob verificadas, JSON y SQLite coherentes; explicar huecos de Real Madrid sin inventar ceros.
- [ ] ESLint y Ruff reproducibles, corregir problemas y refactorizar código afectado.
- [ ] Medir y optimizar rendimiento preservando resultados.
- [ ] Selecciones con candidatos de todas las ligas (sustituye la restricción de siete).
- [ ] Verificar torneos europeos FotMob/ESPN y añadir los equivalentes, agregando por identidad y muestras compatibles, con desglose.
- [ ] Tests, PR/merge y publicación privada verificados.

## Evidencia y coordinación

No hay cambios previos ajenos. Archivos compartidos: importadores, comparación, ámbitos, selecciones y calidad. Capturas previas privadas en `/workspace/scratch/grada-laliga-team-review/baseline/`. Las capturas actuales carecen de xG/xGA en los veinte equipos LaLiga; FotMob publica ahora veinte filas verificadas en cada ranking. Real Madrid tiene score válido en todas sus líneas; Rüdiger carece de intercepciones y otros cinco no alcanzan 200 minutos. Sin revisión visual disponible por ahora.

## Incremento 1

LaLiga recupera xG/xGA en veinte equipos. Real Madrid: 33,6 xG, 12,9 xGA, 13 PJ. FotMob pasa de 110 a 129 partidos cubiertos (+19 agregados; sin archivos de encuentros). Se consulta una ficha Rüdiger: una ficha modificada, cero nuevas; siguen ausentes sus intercepciones y no se imputan ceros. ESPN y otras ligas conservadas. Quince combinados regenerados con referencia común; equipos usan sus fechas propias y cachés recuperan la captura de equipo posterior.

ESLint 10, Ruff 0.17.6, lockfiles y CI de lectura incorporados. Cero errores/avisos; 33 archivos Node y 18 casos Python correctos. Se extrae la función común de xG; se elimina código muerto; se evitan renders ocultos. Mediana local de navegación 168,85 → 87,44 ms, tabla/cabecera idénticas (VM/DOM, sin red/layout). Selecciones incluye quince ligas: 135 países y 37 XI. Sin QA visual disponible. Publicación del incremento pendiente; torneos siguen en revisión.
