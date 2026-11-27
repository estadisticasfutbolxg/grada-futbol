# Rendimiento de carga y actualización

## Carga fiable y actualización · 27 de noviembre de 2026

Se conserva score v11, pesos Fantasy congelados, captura/fecha por campo, muestras y acceso privado. El catálogo activo tiene 18 competiciones; las cifras de cinco ligas más abajo son históricas.

- Indicador accesible visible antes del JavaScript, con contador, porcentaje y fase de preparación de rankings. Refresco con progreso por fuentes y detalle de fichas. No se muestra un éxito completo si quedan ligas pendientes; se conserva aviso y botón de reintento.
- Carga inicial con tres ligas/seis fuentes en vuelo, tiempo de espera de 30 s por intento y un solo reintento ante red/timeout/HTTP transitorio. Los errores de esquema no se reintentan. Si falta una fuente publicada, se admite un respaldo local únicamente después de validar identidad, competición, temporada, fecha y contrato combinado; `datos=publicados` excluye esa recuperación. Las fechas del respaldo no se renuevan. Una caché inválida no oculta la captura publicada válida.
- Se combinan las fuentes una sola vez en el caso común tras seleccionar respaldos, en lugar de reconstruir el combinado por cada candidato. Los estados se incorporan juntos al completar la carga; evita usar referencias de score cambiantes a mitad de la inicialización. Reintento y actualización tienen exclusión mutua. La espera de un frame para pintar el indicador tiene límite para no detener una pestaña en segundo plano.
- Rankings FotMob: cuatro consultas simultáneas por captura frente a dos; siguen siendo exactamente 43 páginas y las mismas validaciones. Un fallo impide publicar una captura parcial y detiene trabajos pendientes.
- Fichas: lote inicial de compatibilidad, después hasta dos lotes de seis en vuelo por liga; cada lote mantiene tres consultas internas. Dos ligas por actualización, como antes. Respaldo individual con un único grupo de tres peticiones; no duplica su concurrencia si fallan ambos lotes. 401/403/429 detienen peticiones pendientes; conservan campos anteriores. Los resultados mantienen orden original y progreso monotónico. Sin cambios a TTL, permisos, cuotas de tamaño, IDs o métricas.

Medición local con cuatro rondas, primera descartada, mediana de tres. Con latencia **simulada** fija de 12 ms: 43 rankings, 271,6 → 137,3 ms (49,5 % menos); 96 fichas en 16 lotes, 203,4 → 113,0 ms (44,4 % menos). El procesamiento de cinco ligas reales con las mismas capturas guardadas, sin red, pasa de 1.859,2 → 1.423,2 ms (23,5 % menos). Se comprueba equivalencia completa de los resultados. Estas cifras no miden carga visual, latencia real de proveedores ni tiempo total del usuario.

Reproducción: preparar una copia de la base con sus `dist/app.js`, `dist/refresh.js` y `worker/providers.cjs`; ejecutar `node scripts/benchmark_loading.cjs --baseline-root <base> --output <resultado.json>`. El benchmark usa fixtures aisladas para la red simulada y capturas locales para comparar la carga con respaldos. Nunca consulta proveedores ni modifica las capturas de la web.

> Ampliación del 24 de noviembre: la caché de JSON descomprimidos del Worker conserva como máximo dos capturas, compartidas entre peticiones simultáneas y con expulsión de la menos reciente y máximo dos descompresiones en curso. Las solicitudes de otras ligas esperan antes de analizar sus cuerpos actualizados. Evita retener todos los objetos completos de las nuevas temporadas a medida que se consultan más ligas. Las plantillas mantienen mapas ligeros de ID/club/nombre y los bytes gzip locales conservan su caché. No cambia concurrencia, datos, TTL ni autenticación. Prueba funcional: lectura concurrente compartida, tres ligas, expulsión, cinco lecturas simultáneas y nueva lectura con el mismo resultado. Las cifras de cinco ligas que siguen son históricas.

Las tablas muestran como máximo 100 filas por página, con Anterior/Siguiente y rango visible. Ordenación, búsqueda, filtros y recuentos se calculan sobre todo el conjunto antes de paginar; los puestos continúan entre páginas y los scores usan siempre la población completa. Al cambiar el conjunto o el criterio de orden se vuelve a la primera página. La paginación evita crear miles de filas de HTML al abrir Todas y no limita jugadores accesibles. Prueba de 245 resultados: tres páginas, orden global, vuelta, filtro, score estable y score primero. Las cifras de rendimiento iniciales que siguen corresponden a cinco ligas.


Revisión del 21 de noviembre de 2026. Se conservan el modelo de score v6, los datos, sus fechas, las muestras, las prioridades de fuentes y el acceso privado del propietario. La revisión posterior de acceso del mismo día retira la contraseña adicional; los lotes siguen exigiendo al propietario identificado.

## Cambios

- El Worker agrupa los **25 scripts** del HTML en un archivo con el mismo orden y una URL versionada por hash: 69.322 bytes gzip en la medición inicial, reducidos a 68.629 tras retirar el formulario de contraseña. Los módulos individuales siguen disponibles. El código versionado permite caché inmutable; el HTML y las capturas conservan sus reglas de actualización.
- Las cinco ligas comienzan a cargar en paralelo. El selector y los scores se activan cuando termina esa carga, conservando la referencia común. Las lecturas independientes de IndexedDB también se agrupan; la selección, validación y recuperación de cada fuente mantienen su orden.
- Los percentiles ordenan sus referencias una vez por plan y cuentan con búsqueda binaria. La fórmula, empates, inversión de ejes y área no cambian. La API pública de percentiles sigue admitiendo arrays mutables.
- El cruce prepara nombres, tokens, alias y claves una vez por pasada. La caché se descarta al terminar; conserva unicidad mutua, clubes y compatibilidad de portería.
- El informe compara valores sin crear y serializar dos árboles ordenados por jugador. Sigue ignorando fechas/URLs de consulta, respeta orden en arrays y detecta cambios de cifras, denominadores y cobertura.
- Las fichas FotMob usan lotes de **hasta seis** jugadores. Con las plantillas guardadas son 2.285 fichas y 383 peticiones normales al Site, frente a 2.285 peticiones individuales. El servidor mantiene tres trabajos simultáneos por lote; se mantiene un lote por liga y dos ligas durante el refresco. No se omiten jugadores ni se aumentan las descargas simultáneas al proveedor. Las fichas mantienen su caché de una hora, fallos de dos minutos y deduplicación. Si un lote falla, las fichas válidas y los campos anteriores se conservan; existe respaldo por la ruta individual y no se reintenta por ella ante 401/403.
- Los assets ya comprimidos pueden servirse directamente cuando el cliente acepta gzip. `Vary`, ETags por representación, HEAD y 304 mantienen una respuesta coherente. Las plantillas de servidor comparten una sola decodificación por captura.

La ruta de lotes es GET, exige la identidad del propietario, mismo origen, liga admitida y todos los IDs en su plantilla verificada. Rechaza duplicados, parámetros adicionales y más de seis jugadores antes de consultar al proveedor. No añade escrituras públicas ni cambia permisos.

## Medición y equivalencia

Prueba local en Node con las once capturas existentes, cuatro rondas por versión y mediana de las tres últimas. Cada informe compara objetos independientes, como dos respuestas distintas sin cambios de fútbol. La medición excluye red, servidores externos y layout del navegador.

| Operación en las cinco ligas | Antes | Después |
| --- | ---: | ---: |
| Combinación y cruce | 615 ms | 267 ms |
| Referencia conjunta | 64 ms | 52 ms |
| Scores | 430 ms | 93 ms |
| Informes | 447 ms | 193 ms |
| Total de cada ronda, mediana | 1.603 ms | 600 ms |

La reducción del total local es **62,6 %**. La mediana del total no es la suma de las medianas de cada operación. Los resultados varían según máquina y carga. No se presenta este porcentaje como una reducción medida del tiempo completo de actualización: una consulta nueva sigue dependiendo de la respuesta de los proveedores.

Las cinco salidas completas generadas coinciden por SHA256 con el código anterior, incluidos cruces, posiciones, muestras, nulos, tarjetas, 1.502 scores y contribuciones de 96 equipos. También coinciden los informes. Los 2.284 perfiles y ejes se contrastaron por separado. Once capturas intactas, sin descargas estadísticas nuevas ni cambios de SQLite.

El Worker se comprobó con carga normal, capturas publicadas, una liga solicitada, una liga fallida y una captura guardada más reciente. Se iniciaron las once solicitudes antes de completar ninguna; la recuperación conserva las demás ligas. Son comprobaciones en VM con dobles DOM, sin afirmar QA visual.

## Reproducción

La versión anterior debe estar en otro checkout con sus módulos `dist/` y catálogo, mientras que las mismas capturas se leen desde `--data-dir`. El benchmark no consulta proveedores ni escribe datos de la web:

```sh
node scripts/benchmark_performance.cjs --baseline-root /ruta/grada-antes --data-dir dist/downloads --rounds 4 --output /tmp/grada-benchmark.json
node --test tests/*.test.cjs
python scripts/build_worker.py
```

Sin `--baseline-root` mide solo el código actual. Si se aporta una base, una diferencia en salidas, informes o capturas hace fallar la comprobación. [Evidencia y entrega](../loop/tasks/20261121-codex-loading-refresh-performance.md).
