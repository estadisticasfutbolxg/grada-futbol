# Auditoría de scores · 11 de noviembre de 2026

Publicada en Sites v19, a las 01:18 Madrid, con el [PR #33](https://github.com/estadisticasfutbolxg/grada-futbol/pull/33) integrado. [Cierre y versión exacta](../loop/tasks/20261111-codex-score-audit.md).

Se revisan computacionalmente los 2.284 registros de las cinco ligas y se contrastan 14 fichas actuales FotMob, dos biografías ESPN y una plantilla ESPN del Espanyol. La revisión distingue fallos reproducidos, discrepancias publicadas y métricas ausentes. No acredita la exactitud de todos los proveedores ni acceso al almacenamiento de un visitante.

## Resultado

- **995 scores completos**, antes 994. **51 pendientes sobre el mínimo general**, antes 52: 48 tienen ejes ausentes y tres una muestra insuficiente en la fuente de algún eje. Los demás registros sin score no superan el mínimo general o carecen de una posición válida.
- **Cala** recupera FotMob mediante el nombre publicado «Álex Calatrava» en `firstName + lastName` de ESPN. Score común **0,06496386471895332**, visible **0,065**. Mantiene MED por acuerdo Understat/ESPN; FotMob publica DEL. No se cambia el rol para facilitar el cálculo.
- **Rafael Bauza** cruza con **Rafel Bauzà** usando el nombre corto publicado por ESPN y coincidencia única del club. Conserva score pendiente por muestra: 163 minutos en Understat y 168 en FotMob, por debajo de 450.
- Se enriquecen **31 identidades ESPN** sin sustituir estadísticas ni sus fechas. Mejoran dos enlaces FotMob. Ninguna posición canónica cambia. Se recalculan 306 scores al completar la referencia MED; la fórmula permanece igual y ningún score válido pasa a pendiente.
- Una ficha antigua ya no puede sobrescribir la posición o un cero guardados en una ficha posterior. Se comparan fechas por campo y posición y se conserva la muestra propia. Conversión/goles menos xG requieren componentes emparejados.
- La carga de una copia ESPN más reciente conserva los alias del mismo ID, club, liga y temporada. El adaptador de futuras actualizaciones también extrae nombre + apellido, sin excepciones por jugador.

[Ver Cala con las capturas publicadas](https://grada-futbol-analitica.ivanmatema2.chatgpt.site/?datos=publicados&liga=laliga&jugador=combined%3A14700).

## Cobertura y pendientes

| Liga | Registros | Pendientes sobre el mínimo | Partidos de cobertura principal |
| --- | ---: | ---: | ---: |
| LaLiga | 487 | 11 | 105 |
| Premier League | 454 | 6 | 91 |
| Serie A | 496 | 17 | 101 |
| Bundesliga | 417 | 7 | 73 |
| Ligue 1 | 430 | 10 | 82 |

Las coberturas suman 452 partidos existentes; no son partidos descargados en esta revisión. Los mínimos de cada eje usan los minutos/partidos de su propia fuente, no los de otro proveedor.

## Pérdida y recuperación de posiciones

Se simula una respuesta agregada FotMob sin posiciones de campo, preservando las cifras. Sin recuperación se alteran 311 posiciones y 893 scores/referencias: 27 scores desaparecen y ocho aparecen al usar otro rol. No se interpreta una puntuación nueva con una posición errónea como mejora. Con recuperación, tanto al cargar como al actualizar, todas las posiciones y scores coinciden exactamente con el original: cero pérdidas y cero ganancias artificiales. Estas respuestas de prueba nunca se publican.

| Jugador afectado en la simulación | Liga | Posición conservada |
| --- | --- | --- |
| German Valera | LaLiga | MED |
| Vinícius Júnior | LaLiga | DEL |
| Tete Morente | LaLiga | MED |
| Hugo Álvarez | LaLiga | DEL |
| Maxim De Cuyper | Premier League | DEL |
| Charalampos Kostoulas | Premier League | DEL |
| Jair Cunha | Premier League | DEF |
| Yéremi Pino | Premier League | MED |
| Andrew Robertson | Premier League | DEF |
| Joseph Willock | Premier League | MED |
| Ferdi Kadıoğlu | Premier League | DEF |
| Abdul Fatawu | Premier League | DEL |
| Daniel Ballard | Premier League | DEF |
| Kike Pérez | Serie A | MED |
| Anastasios Douvikas | Serie A | DEL |
| Ardian Ismajli | Serie A | DEF |
| Rafik Belghali | Serie A | MED |
| Amar Fatah | Serie A | DEL |
| Joseph Scally | Bundesliga | DEF |
| Yannik Engelhardt | Bundesliga | MED |
| Maximilian Beier | Bundesliga | MED |
| Equi Fernández | Bundesliga | MED |
| Mohamed Abdelmonem | Ligue 1 | DEF |
| Merwan Ifnaou | Ligue 1 | DEL |
| Rayan Bamba | Ligue 1 | MED |
| Lucas Buadés | Ligue 1 | MED |
| Ilya Zabarnyi | Ligue 1 | DEF |

## Fichas contrastadas

Las catorce fichas coinciden con las posiciones FotMob ya guardadas. Se registran las discrepancias de ESPN/Understat sin sustituirlas por una opinión táctica. La captura no publica todos los ejes ausentes: una ausencia no demuestra cero.

| Nombre publicado en FotMob | Liga | Posición explícita | Ficha |
| --- | --- | --- | --- |
| Álex Calatrava | laliga | DEL · Striker | [FotMob 1300457](https://www.fotmob.com/players/1300457/player) |
| Rafel Bauzà | laliga | MED · Central Midfielder | [FotMob 1609364](https://www.fotmob.com/players/1609364/player) |
| Andrés Lopez | laliga | DEF · Center Back | [FotMob 1334767](https://www.fotmob.com/players/1334767/player) |
| Alberto Moleiro | laliga | MED · Left Midfielder | [FotMob 1184694](https://www.fotmob.com/players/1184694/player) |
| Dani Cárdenas | laliga | POR · Keeper | [FotMob 1041445](https://www.fotmob.com/players/1041445/player) |
| Enes Ünal | laliga | DEL · Striker | [FotMob 464486](https://www.fotmob.com/players/464486/player) |
| Trai Hume | premier-league | DEL · Right Winger | [FotMob 1067763](https://www.fotmob.com/players/1067763/player) |
| Matteo Politano | serie-a | DEF · Right Wing-Back | [FotMob 415539](https://www.fotmob.com/players/415539/player) |
| Jay Robinson | serie-a | MED · Attacking Midfielder | [FotMob 1453338](https://www.fotmob.com/players/1453338/player) |
| Konrad Laimer | bundesliga | DEF · Right Back | [FotMob 526827](https://www.fotmob.com/players/526827/player) |
| Manuel Neuer | bundesliga | POR · Keeper | [FotMob 27299](https://www.fotmob.com/players/27299/player) |
| Yassin Belkhdim | ligue-1 | DEL · Right Winger | [FotMob 1347791](https://www.fotmob.com/players/1347791/player) |
| Adama Camara | ligue-1 | DEF · Right Back | [FotMob 1513317](https://www.fotmob.com/players/1513317/player) |
| Achraf Hakimi | ligue-1 | DEF · Right Back | [FotMob 770881](https://www.fotmob.com/players/770881/player) |

Ejemplos que siguen pendientes: Moleiro y Jay Robinson (intercepciones), Politano y Hakimi (bloqueos), Neuer (balones aéreos atrapados), y Cárdenas (acciones de líbero). Gerard Moreno, Enzo Bardeli y Dumfries quedan por debajo de 450 minutos en algunos ejes FotMob aunque superen el mínimo en Understat.

Andrés Castrín y la ficha FotMob «Andrés Lopez» comparten club y fecha de nacimiento, pero las capturas normalizadas no conservan ese identificador secundario ni un alias completo común. Se mantienen separados hasta disponer de una regla de identidad verificable que lo cubra; compartir solo «Andrés» no basta. Giménez es un agregado Understat de varios clubes y no se atribuyen sus totales completos a un único equipo.

## Lista de pendientes sobre el mínimo

| Jugador | Liga | Posición | Motivo en la captura utilizada |
| --- | --- | --- | --- |
| Gerard Moreno | LaLiga | DEL | muestra propia insuficiente: FotMob 434 min |
| Enes Ünal | LaLiga | DEL | regates /90 |
| Alberto Moleiro | LaLiga | MED | intercepciones |
| Xavi Espart | LaLiga | DEF | bloqueos |
| Enzo Bardeli | LaLiga | MED | muestra propia insuficiente: FotMob 449 min |
| Giménez | LaLiga | DEF | entradas, intercepciones, despejes, bloqueos, recuperaciones, pases completados /90 |
| Daniel Cárdenas | LaLiga | POR | acciones de líbero |
| Denzel Dumfries | LaLiga | DEF | muestra propia insuficiente: FotMob 447 min |
| Sergi Cardona | LaLiga | DEF | bloqueos |
| Andrés García | LaLiga | DEF | bloqueos |
| Andrés Castrín | LaLiga | DEF | entradas, intercepciones, despejes, bloqueos, recuperaciones, pases completados /90 |
| Ryan Giles | Premier League | DEF | bloqueos |
| Lewie Coyle | Premier League | DEF | bloqueos |
| Gabriel Gudmundsson | Premier League | DEF | bloqueos |
| Daniel Muñoz | Premier League | DEF | bloqueos |
| Trai Hume | Premier League | DEL | regates /90 |
| Abdoul Ouattara | Premier League | DEF | bloqueos |
| Mërgim Vojvoda | Serie A | DEF | bloqueos |
| Ricardo Mangas | Serie A | DEF | bloqueos |
| Antonio Raimondo | Serie A | DEL | regates /90 |
| Yan Couto | Serie A | DEF | bloqueos |
| Lucas Perri | Serie A | POR | acciones de líbero |
| Álex Jiménez | Serie A | DEF | bloqueos |
| Nadir Zortea | Serie A | DEF | intercepciones |
| Matteo Politano | Serie A | DEF | bloqueos |
| Carlos Augusto | Serie A | DEF | bloqueos |
| Jay Robinson | Serie A | MED | intercepciones |
| Gvidas Gineitis | Serie A | MED | intercepciones |
| Vanja Milinković-Savić | Serie A | POR | acciones de líbero |
| Diego Mascardi | Serie A | POR | acciones de líbero |
| Giovanni Daffara | Serie A | POR | acciones de líbero |
| Ivan Provedel | Serie A | POR | balones aéreos atrapados, acciones de líbero |
| Massimo Pessina | Serie A | POR | acciones de líbero |
| Robert Sánchez | Serie A | POR | eficacia vs xGOT, balones aéreos atrapados, acciones de líbero |
| David Raum | Bundesliga | DEF | bloqueos |
| Joane Gadou | Bundesliga | DEF | bloqueos |
| Alexander Schwolow | Bundesliga | POR | acciones de líbero |
| Nathaniel Brown | Bundesliga | DEF | intercepciones |
| Konrad Laimer | Bundesliga | DEF | bloqueos |
| Bilal El Khannouss | Bundesliga | MED | intercepciones |
| Manuel Neuer | Bundesliga | POR | balones aéreos atrapados |
| Yassin Belkhdim | Ligue 1 | DEL | regates /90 |
| Adama Camara | Ligue 1 | DEF | bloqueos |
| Przemysław Frankowski | Ligue 1 | DEF | bloqueos |
| Achraf Hakimi | Ligue 1 | DEF | bloqueos |
| Lucas Calodat | Ligue 1 | DEF | bloqueos |
| Renaud Ripart | Ligue 1 | DEL | regates /90 |
| Tiago Santos | Ligue 1 | DEF | bloqueos |
| Gauthier Gallon | Ligue 1 | POR | balones aéreos atrapados |
| Paul Nardi | Ligue 1 | POR | balones aéreos atrapados |
| Rémy Descamps | Ligue 1 | POR | acciones de líbero |

## Identidades ESPN enriquecidas

Solo alias/contextos del Espanyol, capturados el 11 de noviembre a las 01:06 Madrid. Estadísticas de ESPN conservadas con su fecha del 7 de noviembre. No se incorporan resultados nuevos de la plantilla consultada.

| ID ESPN | Nombre visible | Alias publicados conservados |
| --- | --- | --- |
| 88:179211 | Marko Dmitrovic | Marko Dmitrovic, M. Dmitrovic |
| 88:307419 | Ángel Fortuño | Ángel Fortuño, Á. Fortuño |
| 88:381681 | Llorenç Serred | Llorenç Serred, L. Serred |
| 88:133259 | Leandro Cabrera | Leandro Cabrera, L. Cabrera |
| 88:245839 | Andoni Gorosabel | Andoni Gorosabel, A. Gorosabel |
| 88:260902 | Unai Núñez | Unai Núñez, U. Núñez |
| 88:277314 | Vanja Drkusic | Vanja Drkusic, V. Drkusic |
| 88:310682 | Omar El Hilali | Omar El Hilali, O. El Hilali |
| 88:323737 | Clemens Riedel | Clemens Riedel, C. Riedel |
| 88:346210 | Quilindschy Hartman | Quilindschy Hartman, Q. Hartman |
| 88:397289 | José Ángel López | José Ángel López, J. López |
| 88:401377 | Roger Hinojo | Roger Hinojo, R. Hinojo |
| 88:420443 | Adama Timera | Adama Timera, A. Timera |
| 88:196914 | Pere Milla | Pere Milla, P. Milla |
| 88:255272 | Edu Expósito | Edu Expósito, E. Expósito |
| 88:260242 | Pol Lozano | Pol Lozano, P. Lozano |
| 88:307915 | Urko Gonzalez | Urko Gonzalez, U. Gonzalez |
| 88:355902 | Cala | Cala, Álex Calatrava |
| 88:361468 | Gabriel Moscardo | Gabriel Moscardo, Gabriel Silva Moscardo De Salles |
| 88:367946 | Javi Hernandez | Javi Hernandez, J. Hernandez |
| 88:383900 | Rafael Bauza | Rafael Bauza, R. Bauza |
| 88:135422 | Enrique García | Enrique García, E. García |
| 88:260243 | Javier Puado | Javier Puado, J. Puado |
| 88:306520 | Tyrhys Dolan | Tyrhys Dolan, T. Dolan |
| 88:307270 | Jofre Carreras | Jofre Carreras, J. Carreras |
| 88:311571 | Bryan Zaragoza | Bryan Zaragoza, B. Zaragoza |
| 88:318773 | Roberto Fernández | Roberto Fernández, R. Fernández |
| 88:354621 | Marcos Fernández | Marcos Fernández, M. Fernández |
| 88:3111247 | Jan Peries Duran | Jan Peries Duran, J. Peries Duran |
| 88:3111255 | Alejandro Santiago Vargas | Alejandro Santiago Vargas, Alejandro Santiago, A. Santiago |
| 88:3139134 | Víctor Mullerat Tomas | Víctor Mullerat Tomas, V. Mullerat Tomas |

## Verificación y reproducción

- Quince archivos Node y siete pruebas Python correctos. Las regresiones cubren fichas antiguas, ceros, muestras distintas, alias publicados, colisiones, ámbito de identidad y lectura pública sin consultas externas.
- Auditoría: 2.284 scores iguales entre liga/Todas y 703 medias con 2.483 contribuciones ponderadas por minutos. Los promedios quedan dentro de los scores contribuyentes.
- Chromium del Worker: cinco actualizaciones simuladas con fichas antiguas/fallidas; tabla, ficha y comparador coherentes para Vinícius, Robertson, Kike Pérez, Scally y Zabarnyi. Cala conserva 0,065 con IndexedDB más reciente sin alias. Cero real, portada y móvil correctos; sin errores JS ni solicitudes a proveedores reales en QA.
- Diez JSON originales conservan su hash completo. En ESPN LaLiga cambian únicamente alias, contextos y metadato de identidad. Cifras, equipos, partidos y fechas originales de estadísticas idénticos. Se regeneran cinco combinados; no se suben capturas, bases ni secretos a GitHub.

```sh
node scripts/audit_scores.cjs --output /tmp/grada-score-audit.json
```

El comando valida capturas reales locales, no descarga datos ni las modifica. Los resultados completos están en el JSON de salida. El validador histórico StatsBomb requiere sus artefactos, ausentes en este entorno; no cambian esos importadores ni datos.

Autocontrol, sin revisión independiente. **0 jugadores nuevos, 0 estadísticas de jugador sustituidas y 0 partidos actualizados**. Se consultan catorce fichas FotMob, dos biografías ESPN y una plantilla, pero solo se incorporan 31 identidades, dos enlaces y un score recuperado. Persisten 219 discrepancias de posición sin consenso, declaradas como incertidumbre; no se consideran 219 errores confirmados. [Tarea y publicación](../loop/tasks/20261111-codex-score-audit.md).
