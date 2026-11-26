# Regresiones Fantasy · LaLiga

La sección Análisis Fantasy y su informe descargable estudian los puntos acumulados de LaLiga Fantasy 2026/27. No cambian posiciones, referencias, scores ni rankings de GRADA. El selector de perfil usa los mismos grupos canónicos que el score vigente: POR, DEF, DEF_FB, MED, MED_DEF, MED_ATT, MED_BALANCED y DEL.

## Cruce e inputs

`export_fantasy_regression.cjs` cruza nombres publicados y club con el resolvedor conservador de GRADA. Los IDs de Analítica Fantasy no se interpretan como IDs FotMob/ESPN. Dos alias explícitos de club: Deportivo Alavés/Alaves y Deportivo A Coruña/Deportivo La Coruna. Se exige mejor coincidencia única en ambos sentidos y compatibilidad de portería; nunca se reutiliza una ficha. Se conservan método, nombres, IDs de ambos proveedores y no cruzados. Con las capturas actuales: 474 de 488 jugadores GRADA cruzados contra 618 filas Fantasy; 14 quedan apartados, siete de los cruzados carecen de perfil canónico utilizable.

Los predictores son los ejes no ofensivos y, en jugadores de campo, las cuatro métricas del bloque ofensivo, una vez cada uno y en sus unidades reales (/90, /PJ o porcentaje). No son percentiles ni el score. La pertenencia al perfil es la misma que en GRADA, pero las estadísticas explicativas se restringen a LaLiga: no se suman torneos. Para evitar desfasar puntos de una captura reciente con métricas antiguas, se obtiene una captura analítica FotMob independiente (492 filas y 29 fichas de porteros verificadas) y se conservan fechas/hash y fuente por campo. Esa captura no sustituye los datos del resto de vistas.

Se añaden recuentos Fantasy de la misma captura que los puntos: `yellowCard`, `redCard + secondYellowCard` (expulsiones directas y por doble amarilla) y `penaltyWon`, cada uno por sus propios 90 minutos. Ninguna columna `*Pts`, valor de mercado o componente de puntuación entra como predictor. Los puntos asignados a acciones no son recuentos. El tiempo de exposición se controla con `minsPlayed` de Fantasy. Un jugador aporta una observación; no se pondera para duplicar la exposición.

## Muestra y periodos

Se exigen 200 minutos propios, casos completos y valores finitos. Cada métrica conserva su denominador: no se rellenan ausencias con cero ni se toman minutos de otro proveedor para calcular una tasa. Un cero publicado sí es válido. Las capturas de cada eje deben estar a menos de 24 horas de Fantasy y sus minutos diferir como máximo en 5 minutos o 1 %, el mayor. Esta compatibilidad aproximada no concilia eventos individuales.

Los campos de PJ no son homologables sin un calendario de eventos: se observan minutos idénticos con PJ distintos. La diferencia se informa, pero no se usa para inferir que se trata de partidos diferentes. Se publica la cobertura y cada exclusión por perfil. Los datos originales y los motivos quedan en los archivos del cruce; ser excluido del modelo no quita el score del jugador.

## Modelos e interpretación

Modelo principal: regresión lineal Ridge de puntos acumulados, con control de minutos. Se estandarizan los predictores dentro de cada entrenamiento. Alfa se elige entre 0,1/1/10/100/1000 mediante tres particiones internas por equipo, optimizando MAE. Cinco particiones externas por equipo producen predicciones de jugadores de equipos no vistos: ninguna fila ni escalado del conjunto de prueba participa en seleccionar alfa. Se compara contra media de entrenamiento y un modelo que usa solo minutos. MAE, RMSE y R² de validación se distinguen del ajuste de entrenamiento.

Cada perfil necesita al menos 20 casos completos, seis más que variables, cinco equipos y variación de minutos. Las variables constantes se declaran no estimables. Ridge permite tratar predictores correlacionados, pero sus pesos se reparten y pueden cambiar de signo. Se muestran coeficientes en puntos por una desviación estándar y por una unidad original, además de la estabilidad del signo entre cinco entrenamientos. Son asociaciones condicionadas, no efectos causales ni reglas exactas del juego Fantasy. No calibran automáticamente el score GRADA.

OLS auxiliar solo si hay rango completo y n ≥ máx(30, 3 × número de parámetros incluido intercepto), con al menos ocho equipos. Sus intervalos usan covarianza CR1 agrupada por equipo y distribución t con equipos menos uno grados de libertad. Se publica VIF/condición para colinealidad y q de Benjamini-Hochberg sobre todos los coeficientes no de control contrastados. Los intervalos OLS no son intervalos de Ridge; sin muestra suficiente quedan desconocidos. Las comparaciones son exploratorias y condicionadas al filtro de casos completos.

## Reproducir

Herramientas de análisis separadas del runtime: `python -m pip install -r requirements-analysis.txt`.

- Exportar el cruce desde las capturas: `node scripts/export_fantasy_regression.cjs --fantasy <json-Fantasy> --analysis-fotmob <captura-FotMob-reciente-enriquecida> --output <cruce.json>`.
- Ajustar modelos: `python scripts/analyze_fantasy_regression.py --input <cruce.json> --output <informe.json>`.
- Empaquetar informe HTML completo, JSON y CSV: `node scripts/package_fantasy_regression.cjs --report <informe.json> --input <cruce.json>`.

La captura analítica se genera con `import_fotmob.py --league laliga --output-dir <directorio>` y se enriquece desde fichas recientes con `enrich_profiles.cjs`; cada ficha valida ID, club, temporada y torneo. El archivo de cruce completo descargable permite repetir el ajuste sin volver a consultar proveedores. No se presume permiso nuevo de redistribución. Sitio solo propietario; archivos generados, capturas y modelos fuera de GitHub. El Worker sirve un informe fechado y validado; actualizar estadísticas de otras vistas no reentrena estas regresiones ni cambia su captura. El código y las pruebas quedan versionados.
