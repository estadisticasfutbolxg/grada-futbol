# Onces ideales de ligas

La sección **Onces ideales** propone el mejor encaje por score para cada una de las quince primeras divisiones configuradas y uno global de todas esas ligas. No representa al mejor club real: mezcla jugadores de distintos clubes en un once teórico. No exige nacionalidad publicada. Los tres torneos UEFA no aportan candidatos exclusivos, pero el score individual sigue usando la temporada completa disponible con torneos, igual que en Selecciones.

## Modelo común

Se reutiliza `formations.propose`, con siete sistemas: 4-3-3, 4-2-3-1, 4-4-2, 4-3-1-2, 3-5-2, 3-4-2-1 y 4-2-2-2. Los puestos y bandas deben tener evidencia FotMob compatible. Los apoyos por perfil estadístico se etiquetan como encaje teórico; no inventan posición publicada. Cada sistema necesita portero, defensa, contención, creación y delantera. Un algoritmo de asignación maximiza la suma de scores con puestos compatibles y una persona por plaza; entre onces completos se elige la media simple mayor. El orden fijo de sistemas resuelve empates.

`score del once = suma de los once scores canónicos / 11`

Todos los titulares pesan 1/11. Los minutos solo verifican el mínimo de 200 de temporada y eligen la ficha doméstica representativa en duplicados; no ponderan el score ni deciden qué once completo es mejor. Las líneas usan también media simple de sus integrantes. Un score válido cero participa. Sin once completo, el score global queda desconocido; los huecos no son ceros.

## Identidad y ámbitos

Los candidatos se toman de los conjuntos domésticos originales y se enlazan con el modelo común mediante ID FotMob verificado, sin unir nombres. Así se conserva la liga y el club de cada registro, aunque la ficha de temporada reúna varias competiciones. Cada liga se calcula con sus candidatos; el conjunto global deduplica personas y conserva una ficha doméstica de forma determinista, sin escoger el score más alto. Identidades incompatibles de portero/jugador de campo se excluyen.

Cada jugador mantiene el mismo score de temporada, perfil y mínimo que su ficha; no se recalcula con referencia exclusiva de su liga o del XI. El ranking usa score primero. Las fichas muestran escudo del club, puesto propuesto y score; se puede abrir el detalle del jugador. Una liga ausente o sin suficientes puestos se declara explícitamente. El global indica cuántas de las quince ligas están disponibles y sigue siendo parcial si faltan capturas.

## Actualización y límites

Los onces se calculan al abrir la sección y se memorizan para el modelo/conjuntos de datos vigentes. Una actualización válida de capturas cambia el modelo y obliga a recalcular; cambiar de selector solo cambia el once visible. No se descargan fuentes ni se recalibran pesos al abrir la sección.

No se añaden suplentes ni se consideran lesiones, sanciones, química entre jugadores o convocatorias. Los scores no ajustan dificultad entre ligas. El resultado es una selección estadística sobre la cobertura disponible, no una predicción de resultados deportivos.

## Reproducción

El módulo `dist/ideal.js` adapta las candidaturas y reutiliza el asignador de `dist/formations.js` y el dibujo compartido de `dist/nations.js`. La interfaz vive en `dist/app.js`; el build incluye el módulo después de Nations. Pruebas de identidad, puestos, ámbitos, medias y navegación en `tests/ideal.test.cjs` y `tests/ideal-view.test.cjs`. El enlace de la sección es `?vista=ideal`; `once=laliga` selecciona una liga y `once=leagues` el global.
