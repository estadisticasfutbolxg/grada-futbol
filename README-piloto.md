# GRADA · comparador de fuentes (piloto local)

Este paquete no cambia GRADA v39 ni contiene datos, contraseñas o una clave de API.
Selecciona un partido, cambia entre **Bzzoiro**, **FotMob + ESPN** y **Comparar ambas**.
En esta versión solo se comparan partidos del piloto. No hay ranking ni sustitución automática.

## Abrir

Requiere Python 3.11. Desde la raíz del repositorio (o del ZIP descomprimido), ejecuta:

```powershell
py -3 scripts/serve_source_pilot.py
```

Abre http://127.0.0.1:8011. La pantalla abre sin clave, pero la consulta real necesita
que un entorno de confianza proporcione al proceso la variable `BZZOIRO_API_TOKEN`
(no se solicita ni se recibe desde el navegador). No pegues la clave en el chat,
en la consola del navegador, ni la guardes en el proyecto o en Git. En un
despliegue futuro deberá configurarse como secreto de servidor. El servidor
local no debe exponerse en red.

## Una referencia para el mismo partido

Las capturas actuales de GRADA son agregados de temporada; no se pueden usar como
si fueran datos de un partido. Para probar una comparación exacta, carga en
el navegador un JSON local autorizado con valores de **ese mismo partido**.
No se sube al servidor ni se guarda de forma persistente.

```json
{
  "schema": "grada-source-pilot-v1",
  "fixture": 601024,
  "players": [],
  "teams": {}
}
```

Esqueleto, sin datos reales. En `players` añade filas con `id` (ID de Bzzoiro
revisado manualmente frente a la identidad original), `name` y, si se verificaron,
`goals`, `saves`, `xg`, `xa` o `minutes`. Cada valor es un objeto
`{"value": <número>, "source": "FotMob"}` o con fuente `"ESPN"`.
No se cruza por nombre. En `teams.home` y `teams.away` se admiten `saves`,
`shotsOnTarget` y `xg`, con el mismo formato. No registres un cero cuando
desconozcas si el proveedor publicó la métrica. Utiliza únicamente datos
con permiso para el uso propuesto. No incluye un descargador de FotMob ni ESPN.

## Alcance técnico y siguiente paso

El piloto usa cuatro lecturas de Bzzoiro por partido (estadísticas, jugadores,
incidencias y alineaciones), con un catálogo cerrado de seis partidos y una
caché en memoria. El mapa muestra cobertura de xGOT por equipo atacante,
no eficacia individual. Excluye autogoles y tandas del recuento diagnóstico
del mapa; si ve posibles duplicados, no produce una suma. Los ceros ambiguos
se dejan sin confirmar, los suplentes sin minutos no cuentan como apariciones
y las incidencias de tarjeta se conservan como señal separada. Se mantienen
los minutos de cada fuente, sin calcular tasas con muestras cruzadas.

Se validó el servidor local y la selección/cruce con casos de prueba.
No se verificó una respuesta autenticada de Bzzoiro, la equivalencia de
sus campos de jugador ni las cifras comparadas de FotMob/ESPN.
El paso siguiente es conectar la clave de servidor y contrastar Madrid–Inter
(601024), empezando por las paradas y los tiros a puerta. Después hay que
confirmar cobertura de xG/xA y el resto de ejes antes de llevar el selector
al dashboard de temporada. No se ha publicado ni actualizado la web actual.

```sh
node --test tests/compare-sources.test.cjs
python tests/test_source_pilot.py
```
