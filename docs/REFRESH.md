# Actualización general y scores

La web se sirve en el mismo proyecto Sites mediante un Worker. El generador `scripts/build_worker.py` empaqueta los archivos HTML/CSS/JS y las capturas reales comprimidas en `dist/server/index.js`. Ese archivo incluye datos y está ignorado por Git. El manifiesto conserva project_id y no declara static. No se añaden bases alojadas, credenciales, permisos ni cuentas externas.

## Botón Actualizar datos

El botón consulta ESPN, FotMob y, en LaLiga, Understat. Todas las ligas procesa las cinco competiciones con concurrencia limitada. ESPN conserva su adaptador de clasificación/plantillas. El servidor consulta los rankings HTML y las fichas de FotMob y los datos públicos de Understat, sin ejecutar JavaScript de las fuentes.

Solo se aceptan rutas, competiciones y jugadores de plantillas verificadas. Las consultas son GET de lectura, no admiten URLs arbitrarias, rechazan orígenes cruzados y métodos de escritura, limitan tamaño/tiempo y permiten redirecciones únicamente dentro del mismo host HTTPS. Caché: 5 minutos para consultas de fuente, 1 hora para fichas y 2 minutos para fallos, con deduplicación. La última respuesta válida se conserva separada de los fallos.

La caché de servidor con nombre es opcional; Sites puede denegar Cache API. No se consulta caches.default. Ante una denegación se usa memoria por instancia, limitada a 16 MiB/256 entradas, con caducidad y descarte de entradas antiguas. Una instancia nueva puede perder esa memoria y volver a las capturas publicadas. La lectura de esas capturas no depende de disponer de caché.

El navegador valida fuente, ID, club, temporada, fechas y cobertura antes de combinar. Guarda capturas válidas en IndexedDB; conserva los datos de las fuentes y fichas que fallen, con sus fechas y denominadores originales. La clasificación y los filtros siguen utilizables durante la consulta. Los datos individuales publicados permanecen como capturas de respaldo. La copia de cada navegador puede contener una actualización más reciente que la del paquete inicial.

Al finalizar se abre un resumen por liga: jugadores con cambios, nuevos y retirados, con lista de nombres/equipos, y cobertura de partidos por proveedor. Cada jugador combinado cuenta una vez en su liga aunque lo consulten varias fuentes. Se comparan valores y contextos estadísticos; una fecha de captura o URL nueva no cuenta por sí sola. El resumen indica las fichas verificadas y las que conservan datos anteriores. Las fuentes fallidas no se cuentan como actualizadas.

ESPN/FotMob no proporcionan una lista de partidos en estos adaptadores: se informa de su recuento de temporada y variación de cobertura, que no equivale a partidos individualmente modificados. Understat permite comparar encuentros por ID y listar nuevos/modificados, incluidos cambios de marcador o xG. Un recuento no disponible permanece desconocido. Las fuentes no se suman entre sí para contar partidos. El resumen corresponde a la última actualización de esa sesión y se limpia al cambiar de liga.

## Score de jugador y de equipo

Score de jugador es el área normalizada del radar de su posición POR/DEF/MED/DEL, entre 0 y 1. Usa una referencia común de las ligas cargadas; no cambia al seleccionar una liga, ranking, tabla o ficha. Requiere todos los ejes y muestra suficiente del propio jugador y cada métrica. La fórmula geométrica no cambia. Los rankings KPI se ordenan por esa métrica; los demás por su score de posición. La actualización conserva la columna y dirección seleccionadas. [Definiciones completas](SCORES.md).

El score de equipo es `Σ(score_i × minutos_i) / Σ(minutos_i)`. Solo participan jugadores asignados al equipo por ID con score válido y minutos positivos publicados. No se imputan minutos ni scores ausentes. Se muestran jugadores ponderados/total, minutos utilizados, pesos y contribuciones. Un score cero válido participa; cero minutos no añade peso; sin participantes el resultado es null.

La misma ponderación se usa para cada bloque, incluidos defensa (DEF), delantera (DEL), ataque (DEL + MED de perfil ofensivo) y centros del campo ofensivo/defensivo. Los perfiles MED seleccionan candidatos mediante sus índices estadísticos; todos conservan su score MED. El radar de equipo representa las medias por posición y el mismo promedio general. Se eliminan los índices de equipo independientes de sus jugadores. Los KPI de equipo conservan sus estadísticas originales; los filtros no cambian pesos ni referencias.

Los totales de asistencias y paradas muestran la suma publicada y su cobertura aunque falten algunos registros. Un subtotal parcial no se presenta como cobertura completa ni se completa con ceros.

## Líderes de portada por 90 minutos

La portada ofrece nueve tarjetas con unidades fijas: goles totales, goles/90, pases completados/90, asistencias totales, asistencias/90, xG, xA, precisión de pase y paradas/90. El modo de la tabla no transforma estas tarjetas. La portada no muestra el selector Totales/Por 90 ni su separador; permanece disponible en jugadores, equipos y comparador. Ver ranking abre su misma medida y unidad, orden descendente y filtros limpios; la columna de la tasa queda junto al nombre. Los totales de liga conservan sus sumas y los scores de posición no cambian.

Goles/90 y asistencias/90 usan el recuento y los minutos de su propia fuente. Pases completados/90 conserva la tasa publicada o un total verificado con sus minutos. Paradas/90 es una métrica independiente: recorre los proveedores inequívocamente unidos en el orden de prioridad y usa el primero que tiene tasa publicada o recuento y minutos propios. Por ello, un total ESPN puede acompañarse de una tasa FotMob, con procedencia y muestra separadas. Nunca se dividen paradas ESPN por minutos Understat/FotMob.

Cada fila de una tasa muestra los minutos de su muestra. Los mínimos iniciales editables son 450 minutos para las tasas de juego de campo y 180 para paradas. Se aplican a los minutos propios de esa tasa y se comparten entre portada y su ranking completo; los totales no reciben este corte. Pueden ajustarse desde la portada y el ranking, o ponerse a cero para ver todas las muestras. La tabla indica el criterio activo; navegar a otra vista, posición o unidad sale de esa selección de líderes. Sin minutos positivos ni tasa publicada, la tasa queda desconocida y no entra en el ranking; un cero real se conserva. No se imputan minutos de otra fuente ni se reconstruyen totales a partir de tasas redondeadas.

## Fichas FotMob y valores ausentes

Al abrir la web se elige el agregado validado más reciente de cada fuente. En FotMob se recuperan además posiciones conocidas y campos de fichas verificadas de la otra captura, siempre para el mismo ID, club, competición y temporada. Una respuesta agregada sin posición no borra la posición conocida de una ficha. Los campos conservan su fecha, minutos y partidos originales; un cero publicado sigue siendo válido. Un perfil verificado posterior puede actualizar un campo aunque el agregado que lo contiene sea anterior. No se recuperan valores numéricos sin verificación de ficha ni se mezclan porteros con jugadores de campo conocidos.

La actualización del propietario recupera esa evidencia antes de aplicar fichas nuevas. Una respuesta de ficha antigua no puede sobrescribir una posición ni un campo de una ficha posterior; las fechas se comparan por campo, no solo por el agregado. Conversión y goles menos xG se recalculan cuando cambian sus componentes y estos comparten captura, minutos y partidos propios; sin esa correspondencia quedan ausentes.

Esta recuperación se aplica tanto a IndexedDB al iniciar el cliente como a la lectura pública de un agregado FotMob guardado en el servidor. La lectura pública usa la captura embebida como respaldo y no consulta proveedores ni permite escrituras. La ficha y la ayuda de posición indican cuándo se conserva una posición de otra captura.

En ESPN también se conservan los alias publicados del mismo ID/club/liga/temporada al elegir capturas en navegador o servidor. El adaptador incluye nombre visible, nombre completo, nombre corto y `firstName + lastName`: por ejemplo, Cala publica «Álex Calatrava» en esos dos últimos campos de identidad. Sirven de puente hacia FotMob después de una coincidencia ESPN inequívoca. Los cruces siguen exigiendo mejor coincidencia única en ambos sentidos y compatibilidad de portería. No se une por compartir solo el nombre de pila.

`scripts/enrich_espn_identities.cjs` permite reutilizar plantillas originales `roster-<id>.json` para añadir solo alias, sin sustituir cifras ni su fecha de captura. Recibe por stdin un JSON con `source`, `folder` y `output`. Verifica temporada y equipo; registra fecha/procedencia de cada alias y escribe la salida de forma atómica. Las plantillas, opciones y JSON generados quedan fuera de GitHub.

Para una auditoría sin red ni cambios de datos: `node scripts/audit_scores.cjs --output /tmp/grada-score-audit.json`. Valida las once capturas, motivos de score pendiente, discrepancias de posición, score único entre ámbitos y medias de equipo. Simula por separado pérdida/recuperación de posiciones, con marcas de simulación y sin escribir en las capturas. Puede usarse `--data-dir` para otra carpeta de capturas reales y `--skip-recovery` para omitir esas simulaciones. [Resultados del 11 de noviembre](SCORE_AUDIT.md).

El enlace «Ver captura publicada» de la ficha abre `?datos=publicados&liga=<liga>&jugador=<id>`: solicita los JSON embebidos en esa publicación y omite las copias guardadas solo para esa navegación. Conserva IndexedDB; no elimina las actualizaciones del propietario. Liga y jugador se buscan en los datos cargados. Sirve para reproducir una ficha con las mismas capturas, no para afirmar que esos son los datos más recientes del proveedor. Por ejemplo, [Vinícius en la captura publicada](https://grada-futbol-analitica.ivanmatema2.chatgpt.site/?datos=publicados&liga=laliga&jugador=combined%3A7008).

Las fichas verificadas por ID y club añaden pases completados totales y otras cifras publicadas, además de posiciones amplias. Una ficha cuya competición/temporada no coincide puede aportar únicamente la posición explícita; sus estadísticas numéricas no se mezclan. Los intentos de pase no se reconstruyen de porcentajes redondeados. Los pases progresivos y rompelíneas siguen siendo conceptos distintos.

El mapa completo de tiros de un jugador puede completar los tiros a puerta cuando su recuento coincide con los tiros publicados. En porteros, el xG de tiros a puerta recibidos se suma únicamente cuando el mapa permite verificar la cobertura de paradas y goles sin autogoles. No equivale al xG previo de todos los tiros rivales ni al total de equipo.

## xGOT recibido y score del portero

Opta define goles evitados como xGOT recibido menos goles encajados, excluyendo autogoles. Véanse [la definición del modelo](https://www.statsperform.com/insights/introducing-expected-goals-on-target-xgot/) y [la explicación publicada en FotMob](https://www.fotmob.com/news/akm7eviorlg214sbuz28xtlp8/donnarumma-v-navas-are-psg-really-getting-a-goalkeeper-upgrade).

Se obtiene xGOT/PSxG como goles evitados publicados + goles encajados sin autogoles de la misma ficha. Los autogoles y la cobertura de todos los goles se verifican en el mapa. Si ese agregado no está disponible, se usa la suma por tiro únicamente cuando el recuento completo se comprueba. Se registra método, fecha, minutos, PJ, goles emparejados y autogoles excluidos. No se calcula a partir de cifras de ESPN ni del xG de equipo.

El eje Eficacia vs xGOT es `100 × (1 − goles_sin_autogoles / xGOT_recibido)`, con ambos componentes de esa misma muestra. Positivo significa menos goles recibidos que el modelo; cero coincide; negativo indica más. Se incorpora al score de porteros cuando hay cinco referencias suficientes y sustituye el eje de goles evitados para no contar dos veces el mismo componente. Con xGOT cero el cociente queda desconocido.

Los guiones de tablas y fichas explican su causa: dato ausente, definición diferente, minutos insuficientes, muestra xGOT no verificable o falta de ejes. Nunca se sustituyen automáticamente por cero.

## Acceso del propietario

El icono de actualización está en la cabecera. La primera vez, el propietario se identifica con ChatGPT y define en la web una contraseña de 12 a 128 caracteres. No debe enviarla por el chat. Se comprueba el correo verificado de la cuenta propietaria para la vinculación inicial y se fija después su ID estable de este Site; otra cuenta con el mismo correo no puede reemplazarlo. Las visitas públicas siguen consultando las capturas.

`worker/owner.cjs` guarda la configuración de acceso en el objeto privado `owner/config.json` de la vinculación R2 `BUCKET`. Conserva únicamente ID, sal aleatoria, hash PBKDF2-SHA256 (100.000 iteraciones, límite admitido por Workers), versión y fecha. La contraseña no se incluye en código, variables de entorno, respuestas ni almacenamiento del navegador. La configuración inicial es condicional para impedir sobrescrituras concurrentes. Los intentos de desbloqueo tienen límite persistente de 6 por 15 minutos. Si R2 o la configuración fallan, el acceso se deniega.

Sites aporta identidad mediante sus cabeceras autenticadas y gestiona las rutas de entrada/salida. El Worker exige además un desbloqueo de 30 minutos firmado por HMAC en cookie `Secure`, `HttpOnly`, `SameSite=Strict`; comprueba identidad y caducidad en cada consulta de actualización y ficha. Los formularios son POST JSON del mismo origen, de tamaño limitado. Bloquear elimina la cookie de este navegador. La interfaz no contiene una contraseña o hash compartido para autorizar peticiones.

ESPN también pasa ahora por el Worker del mismo origen; se retira su acceso directo del navegador y de la política de conexión. Las tres fuentes conservan restricciones de hosts, redirecciones, temporada, tamaño, validación y caché. La ruta pública de capturas nunca inicia una descarga de proveedor. Configurar `GRADA_OWNER_EMAIL` y `GRADA_OWNER_SESSION_SECRET` como secretos de Sites antes de desplegar; `.env.example` documenta solo los nombres. No se publica ningún valor ni contraseña en GitHub. La previsualización sin estos recursos mantiene lectura y deniega la actualización.

## Permisos de las fuentes · revisión del 9 de noviembre de 2026

El propietario solicita conservar los datos actuales y el Site público mientras gestiona los permisos. Esta decisión no equivale a obtenerlos. [ESPN remite a las condiciones de Disney](https://support.espn.com/hc/en-us/articles/360035445091-Terms-of-Use): [el texto en español](https://disneytermsofuse.com/spanish/) restringe extracción automatizada y reutilización pública sin autorización. [FotMob, condiciones de 22 de octubre de 2026](https://www.fotmob.com/tos.txt), exige consentimiento escrito para extracción, reproducción y redistribución de sus datos. Understat se encuentra en mantenimiento y no se ha podido verificar una licencia para redistribuirlos. Que un dato sea visible gratuitamente o se cite la fuente no concede por sí solo permiso. No se han enviado solicitudes a los proveedores ni confirmado licencias.

## Generación reproducible

```sh
python scripts/import_leagues.py --all --profiles
python scripts/build_worker.py
node scripts/serve.mjs 8000
```

Python 3.11+ y Node 22+; sin paquetes adicionales. Para acceso a Internet desde Node, conserva el proxy/CA configurados en tu entorno. Con Node 24 puede utilizarse `NODE_USE_ENV_PROXY=1`.

Para reutilizar HTML real, `--input-root` mantiene los rankings/ESPN y `--profiles-root` lee `<liga>/<id>.html`, conservando mtime como fecha de captura. `scripts/enrich_fotmob.py` también se ejecuta por liga y regenera JSON/SQLite coherentes. `scripts/build_combined.cjs` incorpora los scores ponderados y sus contribuciones. Los datos, caches, bases y Worker generado quedan fuera de GitHub.

El servidor estático de Python permite revisar las capturas y la interfaz; las rutas de actualización de FotMob/Understat requieren el Worker. GitHub Pages sirve capturas estáticas y no ejecuta estos endpoints. Sites es el alojamiento principal.
