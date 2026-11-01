# LaLiga 2026/27 · Actualización pública

La web ofrece LaLiga 2026/27 mediante la API pública de ESPN. El selector conserva el Mundial 2022 de StatsBomb como conjunto independiente. No se mezclan métricas entre proveedores ni se presentan los datos de FBref 2025/26 como otra temporada.

## Actualizar en la web

«Actualizar LaLiga 2026/27» consulta la clasificación y las plantillas de los 20 equipos mediante peticiones HTTPS con CORS, sin claves. Descarga tres plantillas simultáneamente y tiene un límite total de 75 segundos. Valida temporada, equipos, identidades y coherencia de clasificación antes de sustituir los datos. Si hay un error, conserva la captura activa y su fecha.

La copia actualizada se guarda en `localStorage` de ese navegador cuando está disponible. No cambia los datos de otros visitantes ni escribe en GitHub o en el servidor. El JSON descargable y el CSV corresponden a los datos activos. El CSV declara fuente, fecha, temporada, cobertura y unidad.

## Generar la captura que se publica

Requiere Python 3.10+ y Node 18+, sin dependencias externas:

```sh
python scripts/import_laliga.py
```

Produce `dist/downloads/laliga-2026-27.json`. La web usa esta captura inicial o una copia más reciente de su caché. El archivo generado no se sube a GitHub; se puede incluir en el paquete de Sites. El generador valida con el mismo adaptador JavaScript que usa el botón y publica el JSON con sustitución atómica. Una descarga fallida conserva la versión anterior.

Endpoints empleados:

- `https://site.api.espn.com/apis/v2/sports/soccer/esp.1/standings?season=2026`
- `https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/teams/{id}/roster?season=2026`

Son interfaces públicas sin garantía de estabilidad; pueden dejar de responder o cambiar de formato. La integración no implica permiso de redistribución comercial ni evita restricciones de otros sitios. FBref bloqueó las peticiones de este entorno: no se ha implementado una elusión de su bloqueo.

## Cobertura y definiciones

La clasificación cubre los 20 equipos hasta la fecha consultada. La temporada sigue en curso. Las estadísticas individuales cubren **las plantillas actuales**: pueden faltar contribuciones de jugadores que hayan salido del equipo. No se promete un censo histórico completo. El identificador de cada registro combina equipo y jugador para no fusionar etapas de equipos diferentes.

Se usan los campos de ESPN `appearances`, `totalGoals`, `goalAssists`, `totalShots`, `saves` y, solo para porteros, `goalsConceded`. Conversión = goles / tiros × 100. Porcentaje de paradas = paradas / (paradas + goles recibidos) × 100, definición de GRADA. Los ceros solo se conservan cuando la respuesta los proporciona.

Estos endpoints **no ofrecen minutos, xG, xA, PSxG, pases ni porterías a cero**. Se conservan como `null` y aparecen como `—`; por tanto, tampoco hay tasas por 90 de LaLiga. No se infieren minutos a partir de apariciones ni se trasladan xG de equipos a porteros. Los modelos y tasas del Mundial siguen disponibles en StatsBomb.

`metadata.imported_at` indica la fecha de consulta de GRADA en UTC; no se presenta como fecha de edición del proveedor. `provider_timestamps` conserva las fechas devueltas por las plantillas. La cobertura de partidos es la suma de partidos de los equipos / 2 sobre los 380 de la temporada. La serie de partidos individuales no se descarga y el gráfico acumulado lo explica.

## Comprobar

```sh
node --test tests/metrics.test.cjs tests/laliga.test.cjs
node --check dist/app.js
python scripts/validate_data.py
```

Las pruebas usan pequeñas respuestas aisladas para comprobar rechazos y cálculos; nunca se sirven como datos de la web. La captura publicada debe generarse desde la fuente real.
