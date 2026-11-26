# Score único por jugador y perfil; promedios de equipo

## Score de temporada entre ligas y torneos

Desde el 25 de noviembre la referencia canónica contiene las quince ligas y los tres torneos UEFA cargados. `competitions.js` une exclusivamente el ID FotMob verificado, conserva posición original y elige una única posición publicada; `scores.js` usa esa misma ficha de temporada en todas las vistas. La tabla muestra las estadísticas del ámbito seleccionado y el score de temporada, con sus minutos y desglose en la ficha. Los clubes ponderan ese score por los minutos del jugador en el ámbito consultado. Selecciones conserva media simple del XI y candidatos de todas las ligas.

Recuentos: suma de valores conocidos, sin convertir ausencias en ceros. Tasas: minutos propios de cada contribución, con cobertura parcial visible. Porcentajes sin recuentos base: media ponderada por minutos, nunca cociente agregado presentado como exacto. Cocientes y diferencias requieren el mismo conjunto de contribuciones. El contexto `rateContext` permite conservar un total conocido de otra fuente sin prestarle minutos ajenos para /90. El mínimo sigue siendo 200 minutos propios, tanto del jugador de temporada como de cada eje.

Juego limpio mantiene la fórmula vigente. Solo usa contribuciones con ambas tarjetas y muestra compatible; si a un torneo le falta una, conserva el ajuste de la muestra emparejada de las otras competiciones y declara su cobertura. No supone cero ni elimina una penalización ya verificada. La regeneración debe preservar score, posición y perfil; las posiciones derivadas no se reutilizan como evidencia original.

Modelo vigente `role_fairplay_radar_v8`. El score de temporada incorpora un bloque de aporte ofensivo para los jugadores de campo. El modelo común es `dist/scores.js`; tablas, tarjetas, fichas, comparador, filtros y generador consumen sus resultados.

## Jugadores

Cada jugador tiene un único score. Primero se resuelve su posición con las fuentes: POR, DEF, MED o DEL. En MED se resuelve además su perfil estadístico; en DEF se comprueba si tiene puesto de lateral/carrilero publicado. Esos perfiles eligen los ejes antes de calcular el score. La posición usa consenso entre proveedores y, sin acuerdo, la ficha FotMob cuando existe; conserva alternativas y procedencia según [COMBINED.md](COMBINED.md). No se cambia la posición para obtener un score mejor. La referencia usa jugadores de la posición de todas las ligas cargadas; los laterales se comparan con laterales verificados. Se conservan fuente y denominadores por métrica. Seleccionar una liga o ranking solo filtra candidatos; no cambia perfil, ejes, ajuste o score. Una actualización de cifras o referencias sí puede cambiarlos.

`radar.js` selecciona primero los seis ejes originales comunes por posición/perfil. La extracción del bloque ofensivo ocurre después: no se promueven métricas de respaldo, como tiros, a requisitos nuevos. El radar visual conserva esos ejes y añade las cuatro métricas ofensivas con muestra válida; todos los jugadores de campo muestran goles y asistencias cuando hay datos, sin exigir esos datos para conservar el score. Cada eje requiere cinco referencias suficientes: todos los MED con muestra válida son referencia de los ejes MED; los DEF con puesto FB publicado son referencia del perfil de lateral. Los filtros visibles no alteran esas referencias. Los percentiles usan rango medio para empates y se invierten cuando menos es mejor. El **área no ofensiva** se calcula con los ejes originales ajenos al bloque: `media(r[i] × r[i+1])`, con `r = percentil / 100` y cierre del último eje con el primero. El **score final** aplica juego limpio a la base de rendimiento, que combina el área no ofensiva con el aporte ofensivo en los jugadores de campo. El área visual completa es descriptiva y no vuelve a entrar en la fórmula. Ambos están entre 0 y 1; describen rendimiento relativo según esos ejes, no una misma habilidad física ni una probabilidad.

Solo hay score cuando existen al menos tres ejes no ofensivos de cálculo (tres ejes ordinarios en portería), todos esos ejes tienen valor y tanto el jugador como cada métrica obligatoria cumplen la muestra fija: **200 minutos inclusive**, con minutos publicados del jugador. Para un eje de portero cuyo proveedor no publica minutos se mantiene la alternativa de 2 PJ, siempre después de verificar los 200 minutos del jugador; esos PJ no acreditan sus minutos ni un filtro adicional más exigente. El mínimo común está en `dist/sampling.js`. Al ampliar la referencia pueden cambiar percentiles, perfiles MED y promedios de equipo aunque no cambien las cifras de origen. Un radar visual parcial puede dibujarse. La falta de una métrica ofensiva opcional se declara y su peso vuelve a la parte no ofensiva; la falta de un eje obligatorio impide calcular el score y aportar a equipos. No se usa un área incompleta de los ejes obligatorios. La tabla y el radar explican si faltan métricas y qué fuente no cumple sus minutos propios. El modo total/90 y los filtros no cambian el score. Un valor publicado cero, incluido un score exactamente cero, es válido en tablas, rankings y ponderaciones. Un campo ausente o un cociente con denominador cero permanece desconocido y no se sustituye por cero.

Los ejes mantienen la definición y cobertura de `metrics.js`. Un xG ausente solo se deriva a cero cuando una ficha FotMob verificada publica explícitamente cero tiros y cero goles, de la misma muestra. Se conserva el registro de origen con xG ausente y se etiqueta `zero_shot_xg`: es la suma de un conjunto vacío de tiros, no una imputación por falta de datos. El cálculo combinado también conserva los denominadores propios de sus derivados; una diferencia no hereda la tasa /90 de goles. En porteros, Eficacia vs xGOT usa los goles emparejados con esa misma muestra y sustituye el eje de goles evitados para evitar duplicidad. No se atribuye xG de equipo a un portero.

## Aporte ofensivo

Goles, asistencias, xG y xA por 90 usan cada uno los minutos propios de su fuente y temporada. El percentil de cada métrica se calcula por separado con al menos cinco referencias de 200 minutos propios o más. Los delanteros se comparan con delanteros, los MED con otros MED y los defensas se dividen en laterales verificados y el resto de DEF. Entre los MED, el perfil determina el peso y mantiene la referencia de su posición. Los porteros tienen peso cero.

| Perfil | Peso máximo de las cuatro métricas |
| --- | ---: |
| Centrales y demás DEF generales | 5 % |
| MED defensivo | 5 % |
| MED general, sin clasificar | 10 % |
| Laterales y carrileros | 15 % |
| MED equilibrado | 15 % |
| MED ofensivo | 25 % |
| Delanteros | 35 % |

Cada métrica tiene una cuarta parte del peso máximo de su perfil. Aporta su percentil dividido entre 100 y elevado al cuadrado, en la misma escala cuadrática que el área del radar. Si falta una tasa válida o su muestra, ese peso lo conserva el radar y la ficha muestra el peso utilizado. El cero publicado participa en la comparación. Los pesos son decisiones de diseño de GRADA.

`base = área no ofensiva × (1 − suma de los pesos válidos) + Σ(peso válido × (percentil / 100)²)`

El polígono visual de los jugadores de campo conserva las métricas originales y el bloque ofensivo. `displayAxes`/`displayArea` describen ese gráfico; `axes`/`area` representan solo la parte no ofensiva del cálculo. Las métricas ofensivas tienen un peso explícito y se cuentan una vez, incluso cuando aparecen también dibujadas. Las métricas ofensivas ausentes se enumeran sin sustituirlas por cero ni invalidar un score con área no ofensiva válida. Los índices auxiliares de clasificación MED conservan sus ejes, incluido el uso de goles y xA en el índice ofensivo.

## Laterales y carrileros

Un DEF con LB, RB, LWB o RWB verificado por FotMob usa `DEF_FB`. Su radar contiene entradas, intercepciones y recuperaciones por 90. Su bloque de ataque comparte la referencia de laterales y carrileros. Si FotMob publica también CB, conserva ese perfil en ambos rankings. Los puestos publicados pueden ser múltiples y carecen de reparto de minutos.

## Juego limpio

El ajuste se aplica una sola vez a la base ponderada. Es una regla manual de GRADA para que la disciplina influya de forma apreciable en el score: una roja pesa **diez amarillas** y desaparece el límite indulgente del 10%. La frecuencia de amarillas recoge también el riesgo de indisponibilidad por acumulación, sin afirmar cuántas sanciones se han cumplido.

`intensidad = (amarillas + 10 × rojas) × 90 / minutos propios`

`descuento relativo = mínimo(1; 0,10 × intensidad)`

`score final = base × (1 − descuento relativo)`

Equivale a `descuento = 0,10 × amarillas/90 + 1,00 × rojas/90`, hasta el suelo natural de score 0. A igualdad de minutos, cada amarilla adicional añade la misma penalización y cada roja añade diez veces esa cantidad; no se reduce su efecto marginal al acumular tarjetas. Son porcentajes relativos de la base, no puntos absolutos de score. Jugar el doble de minutos con el doble de tarjetas conserva la penalización.

| Tarjetas en 900 minutos | Descuento | Base 0,800 → final |
| --- | --- | --- |
| 0 amarillas, 0 rojas | 0% | 0,800 |
| 5 amarillas, 0 rojas | 5% | 0,760 |
| 0 amarillas, 1 roja | 10% | 0,720 |
| 5 amarillas, 1 roja | 15% | 0,680 |
| 5 amarillas, 2 rojas | 25% | 0,600 |

Los coeficientes 0,10 y 1,00 son decisiones de diseño, pendientes de calibración estadística. Reflejan mayor gravedad disciplinaria; no miden el daño causal en goles o puntos. Las capturas agregadas no identifican el minuto/contexto de cada expulsión, una posible tarjeta en el banquillo, doble amarilla frente a roja directa, los ciclos por competición ni sanciones cumplidas. Por tanto **no se inventan minutos en inferioridad ni partidos perdidos**, ni se convierte cada cinco amarillas en una suspensión universal. Se conservan los recuentos publicados; no se reconstruyen expulsiones adicionales desde las amarillas.

El límite de 100% solo impide scores negativos. La regla previa, v4, usaba roja de peso 4 y una curva saturada bajo el 10%; sus cifras quedan como historial. Cero tarjetas verificadas conservan la base y un score base cero sigue siendo cero.

Amarillas y rojas deben tener misma fuente, minutos, PJ y muestra declarada. Se respetan sus fechas individuales; dos consultas de un mismo agregado no implican distinta muestra. Se exigen minutos propios suficientes (200 para cualquier posición). No se usan minutos de otro proveedor ni se estiman minutos desde PJ para este ajuste. Los índices MED auxiliares no reciben el ajuste: la disciplina no decide si un jugador es ofensivo o defensivo.

Es un componente opcional con cobertura explícita. Si falta una tarjeta, la muestra difiere o sus minutos son insuficientes, `factor`, descuento e intensidad permanecen desconocidos; se conserva el score base y se muestra **Juego limpio · sin ajuste**. No se etiqueta al jugador como limpio ni se rellenan tarjetas con cero. Con las capturas existentes y el mínimo de 200 minutos, 1.484 de los 1.502 jugadores con score admiten ajuste verificado; 18 conservan base con aviso. Hay 489 nuevos scores válidos; cuatro porteros de 180–199 minutos dejan de cumplir el nuevo mínimo. Esa cobertura desigual es un límite de comparación declarado, no una ausencia subsanada.

La ficha y el comparador muestran base, factor, descuento, tarjetas y procedencia; el valor principal y todas las tablas usan el mismo score final. Las cifras mostradas están redondeadas; los cálculos, referencias y contribuciones conservan precisión completa.

## Perfiles de centrocampistas

Desde el 14 de noviembre, los dos índices auxiliares de acciones ofensivas y defensivas se convierten en percentiles de sus respectivas distribuciones MED, con referencia común y mínimos fijos. Una diferencia de hasta 10 puntos percentiles se considera equilibrada; por encima, domina el percentil mayor. La regla de clasificación no cambia el 17 de noviembre. Este umbral descriptivo no es un intervalo de confianza.

La corrección del 17 de noviembre hace que ese perfil determine los ejes del score mostrado. No se calculan scores alternativos para elegir el mayor ni se sustituye el score al abrir otro ranking.

| Perfil MED | Ejes del score, en el orden del polígono |
| --- | --- |
| Ofensivo | ocasiones creadas/90, grandes ocasiones creadas/90, tiros a puerta/90, regates logrados/90 |
| Defensivo | pases completados/90, precisión de pase, recuperaciones/90, entradas/90, intercepciones/90, pases rompelíneas/90 |
| Equilibrado | pases completados/90, ocasiones creadas/90, recuperaciones/90, entradas/90, intercepciones/90 |
| Sin perfil verificable | pases completados/90, precisión, recuperaciones/90, entradas/90, intercepciones/90 y pases clave/90, según cobertura |

Sin ambos índices completos, el perfil es desconocido: no se atribuye ofensivo/defensivo por intuición. Puede tener un score general si sus propios ejes tienen muestra y datos suficientes, pero no entra en los rankings de subgrupos. Los equilibrados tienen ranking propio y pueden aparecer en ambos grupos, siempre conservando su score equilibrado. La tabla reúne los ejes de los perfiles presentes y muestra qué perfil produce cada score; no toma los ejes del primer MED de la captura.

No se infiere una posición táctica real a partir de estadísticas. Álex Baena sigue MED por acuerdo ESPN/FotMob frente a DEL Understat, con esa discrepancia visible. Su perfil ofensivo selecciona un radar ofensivo: el 17 de noviembre pasó a una base 0,751949 frente al anterior 0,174481. Desde el 18 se le aplica también juego limpio cuando está verificado. No se descargan cifras nuevas para estos cambios. Los centros del campo de equipos muestran además el número de MED sin perfil verificable.

Los filtros de puesto publicado —centrales, laterales, pivotes, interiores y otros— usan evidencia explícita de FotMob, conservan la posición canónica y no alteran el score. [Definiciones, cobertura y límites](ROLES_METRICS.md).

## Equipos

Todos los scores de equipo se calculan con los mismos scores individuales finales, incluido el ajuste de juego limpio aplicado y el perfil mixto de lateral:

`score del bloque = Σ(score de jugador × minutos publicados) / Σ(minutos publicados)`

Solo participan scores válidos con minutos positivos y asignación al equipo por ID. Un cero publicado válido participa. Un score o unos minutos ausentes no se sustituyen por cero. La cobertura y la ficha muestran pendientes, minutos, pesos y contribuciones con precisión completa.

| Score | Jugadores incluidos |
| --- | --- |
| General | Toda la plantilla con score y minutos válidos |
| Portería | POR |
| Defensa | DEF |
| Centro del campo | MED |
| Delantera | DEL |
| Ataque | DEL y MED de perfil ofensivo o equilibrado |
| Centro del campo ofensivo | MED de perfil ofensivo o equilibrado |
| Centro del campo defensivo | MED de perfil defensivo o equilibrado |

Un jugador se cuenta una sola vez en cada promedio. El score de un bloque está entre el mínimo y máximo de sus contribuyentes. El radar de equipo dibuja las medias de POR/DEF/MED/DEL; la cifra central es el mismo promedio general mostrado en la tabla. Ya no existe un segundo score de defensa/ataque calculado con estadísticas agregadas del equipo. Goles, xG, porterías a cero y otras estadísticas de equipo siguen disponibles como KPI, con sus propias fuentes.

Los rankings de equipo requieren inicialmente 5 PJ. Cambiar ese filtro no cambia los scores ni los pesos. Los equipos sin score siguen visibles en las tablas con guion y sin puesto; las tarjetas de líderes requieren un score conocido.

## Totales de liga

Los [onces teóricos de selecciones](NATIONS.md) reutilizan estos mismos scores y la media simple de los once titulares elegidos (cada uno pesa 1/11). Las líneas también usan media simple. El mínimo sigue siendo 200 minutos; los clubes conservan sus promedios ponderados. Solo hay score global cuando están cubiertos sus once puestos; no son partidos ni resultados internacionales.

Los paneles suman únicamente valores publicados finitos. Una ausencia ya no oculta todos los valores conocidos: se muestra el subtotal parcial y `con dato / registros`. Si no hay ningún valor conocido, se conserva el guion; un cero real sí se muestra. Las paradas incluyen los registros POR y cualquier otro registro con paradas publicadas. No se añaden las cifras de dos fuentes para el mismo jugador.

Con las capturas publicadas al preparar este cambio hay 1.029 asistencias conocidas (2.281/2.284 registros) y 3.048 paradas (131/136 registros elegibles) en Todas las ligas. Son sumas de la cobertura importada, no una declaración de temporada completa.

## Artefactos y reproducción

`scores.build` calcula índices MED, perfil, área del radar, aporte ofensivo y ajuste de juego limpio en ese orden; `scores.value`, `scores.eligible` y `scores.rankingAxes` resuelven rankings y columnas. `fairplay.js` conserva fuente/muestra de ambas tarjetas. `squads.js` produce promedios y contribuciones con el score final y el perfil utilizado. `withScores` añade `playerScore`, `playerBaseScore`, `fairPlay`, `scorePosition`, `scoreProfile`, `scoreProfileLabel`, `midfieldProfile` y scores/ledgers de equipo al combinado. El modelo se identifica como `role_fairplay_radar_v8` en `metadata.derived_metrics.playerScore`. Todas las ligas descarta derivados previos antes de recalcular.

El generador lee las capturas verificadas de las ligas disponibles para compartir referencia. En una importación por etapas, `--reference-dir` aporta las otras ligas, y `import_leagues.py` recalcula todos los derivados tras completar las fuentes. No actualiza las fechas originales por recalcular scores. Todas las ligas descarta derivados anteriores y usa el modelo común. En el navegador, el modelo se invalida al cambiar una captura, no al cambiar de vista.

```sh
node scripts/build_combined.cjs --league laliga
python scripts/build_worker.py
node --test tests/*.test.cjs
```

El Worker empaqueta HTML con hashes en las URLs de scripts y CSS para que cada publicación cargue módulos de una misma versión. Las capturas iniciales se solicitan sin reutilizar la caché del navegador; los refrescos conservan su validación y respaldo. No se añaden secretos, permisos ni escrituras públicas. Las capturas, JSON/SQLite y Worker generado siguen fuera de GitHub.

La auditoría de la revisión de nombres y posiciones, sus jugadores recuperados y los pendientes reales están en [SCORE_REVIEW.md](SCORE_REVIEW.md).

Selecciones compara siete sistemas con contención, creación y puestos publicados compatibles. Cada sistema maximiza la suma de scores canónicos; entre sus onces completos se elige la mayor media simple. El puesto propuesto y el perfil del score se muestran separados; no hay una nueva puntuación individual. [Asignación y límites](NATIONS.md).
