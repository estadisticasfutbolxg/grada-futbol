# Puestos publicados, perfiles y medidas · 14 de noviembre de 2026

> Actualización del 18 de noviembre: los DEF con puesto de lateral/carrilero publicado usan un único radar mixto, con referencia de laterales. El score final aplica juego limpio cuando está verificado. [Fórmulas, muestras y casos polivalentes](SCORES.md) sustituyen las referencias anteriores a mantener el radar DEF general.

> Corrección del 17 de noviembre: el perfil estadístico MED ahora selecciona también los ejes de su único score. La descripción anterior de «solo filtra candidatos» queda sustituida por [SCORES.md](SCORES.md). Los puestos publicados siguen siendo evidencia táctica separada y no se deducen del rendimiento.

## Puesto táctico y perfil estadístico

Se conservan las posiciones canónicas POR/DEF/MED/DEL y un único score por jugador, con referencia común de las cinco ligas. La separación adicional sirve para elegir candidatos; no recalcula ese score al cambiar de tabla.

FotMob publica `positionIdsDesc` en sus plantillas. `roles.js` importa únicamente IDs y puestos, comprobando club, competición y temporada 2026/27. La evidencia incluye URL y fecha propias. Una ficha individual posterior con puesto explícito y verificado tiene prioridad. Los puestos se recuperan al cargar una captura agregada posterior que no los contiene, siempre para la misma identidad y club; una fecha nueva por sí sola no cuenta como cambio de jugador.

| Posición canónica | Grupos publicados disponibles |
| --- | --- |
| POR | Porteros |
| DEF | Centrales; laterales y carrileros |
| MED | Pivotes; mediocentros/interiores; mediapuntas; medios de banda |
| DEL | Extremos; delanteros centro |

La fuente puede publicar varios puestos: no se supone un orden principal ni minutos en cada uno. Un jugador polivalente puede entrar en varios filtros, con el mismo score. Una etiqueta incompatible con su posición canónica se muestra como evidencia, pero no acredita pertenecer a otro grupo. Los candidatos sin evidencia siguen en la tabla general y se pueden filtrar como «Sin puesto compatible verificado». Hay rankings específicos de centrales y laterales, ordenados por el score DEF existente.

Se comprobaron **96 plantillas**, todas de la competición y temporada esperadas. Se enriquecieron **2.136 registros FotMob**: 450 LaLiga, 445 Premier, 476 Serie A, 387 Bundesliga y 378 Ligue 1. El combinado contiene **2.126/2.284 fichas con puesto publicado**, de las que 2.113 tienen un grupo compatible. Trece presentan discrepancias de posición amplia; no se fuerzan. Las 158 restantes carecen de puesto detallado verificado. No cambian las posiciones canónicas ni las cifras de juego.

Los perfiles MED ofensivo/defensivo describen acciones, no puestos. Cada índice auxiliar se convierte en percentil dentro de su propia distribución MED de referencia. Una diferencia de hasta **10 puntos percentiles** se considera equilibrada; por encima, domina el perfil con percentil mayor. Sin ambos índices completos el perfil es desconocido. Los equilibrados tienen ranking propio y también participan en los grupos ofensivo y defensivo, sin duplicarse dentro de un promedio. El orden sigue usando el score MED. El umbral de 10 puntos es una decisión descriptiva de GRADA, no un intervalo de confianza ni una clasificación táctica de la fuente.

## Medidas y muestras

| Medida | Fórmula y alcance |
| --- | --- |
| xG por tiro | xG / tiros; calidad media previa al remate, no acierto del rematador |
| Goles + asistencias /90 | (goles + asistencias) × 90 / minutos propios |
| xG + xA /90 | (xG + xA) × 90 / minutos propios; conserva el modelo del proveedor |
| Goles evitados /90 | Goles evitados publicados × 90 / minutos propios; admite negativos |

Las sumas y cocientes requieren componentes de la misma fuente, competición/temporada y muestra declarada (minutos y PJ; también `sample_id` cuando existe). Las fechas de consulta se conservan por componente: consultar dos veces el mismo agregado no acredita una muestra diferente. Si las muestras declaradas difieren, no se fabrica el cociente. Los ceros publicados son válidos; un denominador cero o componente ausente da `—`. Las tasas ya publicadas no se normalizan dos veces.

Cobertura actual: xG/tiro en 1.660 fichas; G+A/90 en 2.141; xG+xA/90 en 1.925; goles evitados/90 en 132. Son coberturas por medida, sin asumir que todos los jugadores tengan datos o minutos suficientes para score. Se retiran de las columnas iniciales los pases intentados y progresivos sin cobertura; los pases rompelíneas permanecen separados y no se renombran como progresivos.

`audit_metrics.cjs` comprueba 82 medidas y 390.320 lecturas en modo total/90 sobre 2.284 jugadores y 96 equipos. Verifica finitud, porcentajes, componentes, denominadores y tasas publicadas. No acredita por sí solo que los modelos de xG de proveedores distintos sean equivalentes.

## Clubes y temporadas multiclub

El selector parte del catálogo de equipos por ID. Los agregados Understat de Giménez (Atlético Madrid + Deportivo La Coruña) y Pablo García (Racing Santander + Real Betis) no se convierten en equipos ni se asignan a uno de sus clubes. Se muestran como «Varios clubes (2)», con explicación y filtro propio. Se conservan los nombres originales en los datos de procedencia. Sin desglose por etapa no se dividen minutos, goles o scores entre clubes.

## Reproducir

Las plantillas son capturas HTML reales guardadas fuera de Git como `<team-id>.html`; se preserva su fecha de captura en el mtime. El importador no descarga páginas por su cuenta ni cambia estadísticas numéricas. Prepara JSON y SQLite antes de promoverlos; los dos renombrados no son una transacción de sistema de archivos. Se valida el conjunto antes de construir/publicar.

```sh
python scripts/enrich_tactical_positions.py --league laliga --input-dir /ruta/capturas/laliga
node scripts/build_combined.cjs --league laliga
node scripts/audit_metrics.cjs --output /tmp/grada-metric-audit.json
node scripts/audit_scores.cjs --output /tmp/grada-score-audit.json
python scripts/build_worker.py
```

Repetir la importación y generación para las cinco ligas del catálogo. El botón protegido de actualización mantiene la evidencia verificada y acepta puestos de fichas individuales posteriores; no se añade un rastreo completo de plantillas por cada clic. Capturas, bases y Worker generado quedan fuera de GitHub. El Site conserva acceso exclusivo de su propietario. Las solicitudes de permiso a proveedores no equivalen a licencias concedidas.

## Mejoras siguientes con datos adecuados

- Comparar volumen, calidad de ocasiones y eficacia por separado: xG/tiro, tiros/90 y goles/xG responden a preguntas diferentes.
- Mostrar la muestra junto al rendimiento; un mínimo de minutos no garantiza estabilidad estadística.
- Revisar las 13 discrepancias de puesto sin resolverlas mediante el score. Para comparar centrales y laterales con modelos distintos haría falta definir y validar una nueva versión del score; esta entrega conserva el contrato único vigente.
- Las tendencias y minutos por puesto necesitan registros por encuentro y alineaciones con cobertura comparable. Los agregados actuales no permiten reconstruirlos para todas las ligas.
