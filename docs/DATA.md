# Contrato de datos y métricas

## Fuente y cobertura

Fuente: [StatsBomb Open Data](https://github.com/hudl/open-data). Consulta la [licencia](https://github.com/hudl/open-data/blob/master/LICENSE.pdf). La importación actual usa competición `43`, temporada `106`: Mundial masculino 2022.

El payload tiene cuatro claves: `metadata`, `players`, `teams`, `matches`. La web no sustituye una carga ausente por datos de prueba.

`metadata` declara `source`, `url`, `competition`, `season`, `competition_id`, `season_id`, `imported_matches`, `available_matches`, `complete`, `imported_at` y `notes`. Si `complete` es falso, el visitante debe ver la cobertura parcial.

## Campos consumidos

| Entidad | Identidad | Métricas principales |
| --- | --- | --- |
| Jugador | `id`, `name`, `team_id`, `team`, `pos` | `matches`, `minutes`, `goals`, `assists`, `xg`, `xa`, `shots`, `passes`, `completed`, `accuracy`, `conversion`, `delta`, `saves`, `conceded`, `xga`, `savepct`, `clean`, `tackles`, `interceptions`, `keypasses`, `progressive`, `psxg`, `prevented` |
| Equipo | `id`, `name` | `matches`, `minutes`, `goals`, `conceded`, `xg`, `xga`, `shots`, `passes`, `completed`, `accuracy`, `delta`, `possession`, `assists` |
| Partido | `id`, `date`, `home`, `away`, `home_id`, `away_id` | `home_goals`, `away_goals`, `home_xg`, `away_xg`, `minutes` |

Identificadores y contadores son enteros; minutos, xG y derivados son números finitos. Las métricas no disponibles o sin denominador válido son `null`, nunca el texto `"null"`, un cero añadido ni `NaN`. La UI muestra `—`. `pos` usa `POR`, `DEF`, `MED`, `DEL` o `—` si falta información.

## Definiciones que deben mantenerse

- **Goles:** tiros `Goal` del jugador. Los marcadores de equipos incluyen autogoles; por tanto el total de goles de jugadores puede ser menor que el de equipos.
- **Tandas:** los periodos 1–4 alimentan las métricas. El periodo 5 puede conservarse en SQLite para consulta y se excluye de rankings.
- **xG:** suma de `shot.statsbomb_xg` de esos tiros. Los autogoles no aportan xG.
- **xA derivada:** suma del xG de los tiros enlazados por `pass.assisted_shot_id`. No equivale a un modelo independiente de valor esperado de todos los pases.
- **Pases:** todos los intentos; completados si falta `pass.outcome`. `goal_assist` y `shot_assist` proporcionan asistencias y pases clave.
- **Progresivos:** pases completados con al menos 10 metros de avance longitudinal, convirtiendo 120 unidades de StatsBomb a 105 metros. Es una definición propia de GRADA.
- **Porteros:** alineación, cambios y eventos en orden identifican al portero presente; se le atribuyen tiros rivales y autogoles encajados. Evitar asignarlos usando solo un reloj nominal, especialmente en el tiempo añadido.
- **Paradas:** resultados `Saved`, `Saved to Post` o `Saved Off Target`. Porcentaje: paradas / (paradas + goles encajados), incluidos autogoles.
- **Minutos:** intervalos de posición, limitados a 90 o 120 minutos, sin añadido. Un jugador que entra solo en el añadido puede quedar con cero minutos nominales; no se calcula por 90 para él.
- **Portería a cero:** equipo sin encajar y portero con al menos 60 minutos en portería.
- **Por 90:** volumen × 90 / minutos. Los porcentajes conservan su denominador original.
- **PSxG, goles evitados y posesión:** no calculados en esta importación. No se obtienen cambiando el nombre del xG previo al tiro.

## Artefactos que deben cuadrar

`dist/data.js` debe contener el mismo payload que `dist/downloads/statsbomb.json`. La base descomprimida incluye `metadata`, `matches`, `events`, `lineups`, `players` y `teams`; los JSON de estadísticas de esas tablas deben coincidir con el payload. `SHA256SUMS` identifica el gzip servido.

El SQLite normaliza un subconjunto de los eventos. El JSON completo de eventos se conserva en la caché local; no se incluye `freeze_frame` ni 360 en la base descargable.

El `source-manifest.json` incluido identifica rutas y SHA de GitHub usados para esta captura. No certifica una importación posterior: hay que actualizar la procedencia o indicar que no está disponible.

## Validar

```sh
python scripts/validate_data.py
```

El validador trabaja sin red, comprueba integridad y concordancia de artefactos, cobertura, identificadores, sumas y denominadores. Un resultado correcto no demuestra que todos los modelos estadísticos sean adecuados: ante un cambio de fórmula, contrasta también eventos concretos y su significado.

## Datos de referencia, no constantes universales

La captura incluida contiene 64 partidos, 32 selecciones, 681 registros de jugadores, 234.637 eventos y 172 goles en marcadores. Los registros pueden incluir personas mencionadas en eventos sin minutos nominales. No uses estos números como reglas para otras competiciones o importaciones parciales.
