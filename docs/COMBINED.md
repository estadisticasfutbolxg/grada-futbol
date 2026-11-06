# LaLiga combinada, radar y filtros

La vista **LaLiga · Combinado** usa el catálogo de jugadores de Understat y añade las métricas disponibles de ESPN. Es una combinación autorizada expresamente por el usuario y sustituye la regla anterior de mantener siempre los proveedores separados. Las vistas individuales se conservan.

## Identidad y prioridad

Se exige LaLiga 2026/27 validada en ambas fuentes. Se comparan nombres completos y clubes tras normalizar acentos, espacios y puntuación. «Deportivo» y «Deportivo La Coruna» son un alias explícito de club presente en ambas capturas. No hay aproximación por apellidos ni similitud difusa.

Un nombre y club deben aparecer una única vez en cada fuente. Los registros agregados de traspasos sin equipo único, homónimos y discrepancias de rol portero/campo se conservan solo como Understat. Los jugadores exclusivos de ESPN siguen en su vista y descarga; no amplían el catálogo combinado ni crean duplicados dudosos.

**Understat tiene prioridad**, incluidos sus ceros. ESPN solo completa campos desconocidos. Las discrepancias quedan en `combination.conflicting_fields`; los registros originales están en `sourceRecords`. `metadata.sources` conserva la captura de cada proveedor. El combinado usa como fecha general la más antigua, no la hora de calcular la unión.

La captura actual une 411 de los 487 registros Understat. Los demás conservan Understat, sin rellenarlos con cifras inventadas. Las capturas siguen siendo las del 1 de noviembre de 2026.

## Fuentes y denominadores por campo

Cada valor tiene `fieldSources` y `metricContexts`, con proveedor, PJ y minutos del registro de origen. Se muestran debajo del valor y, si los PJ difieren, se hacen explícitos. El detalle al pasar el cursor y el CSV conservan fecha y cobertura.

Las paradas y los goles recibidos pueden proceder de ESPN mientras que minutos, xG, xA, goles y tiros proceden de Understat. Las tasas usan **el denominador del proveedor del numerador**: las paradas por partido usan los PJ ESPN y las paradas por 90 quedan ausentes si ESPN no aporta minutos. No se usan minutos Understat para normalizar una cifra ESPN, ni basta una coincidencia de número de partidos para asumir que los conjuntos son idénticos.

Goles/xG y asistencias/xA requieren el mismo proveedor en ambos campos. Conversión, goles−xG, precisión de pase y porcentaje de paradas se calculan con valores de la misma procedencia. Ningún proveedor usado ofrece xG recibidos por portero en LaLiga: sigue `null`. No se atribuye a un portero la cifra de su equipo.

## Descargas

- **ESPN JSON** descarga el conjunto ESPN disponible, con su fecha.
- **Combinado JSON** descarga la combinación completa, fuentes, conflictos y registros originales.
- **CSV** respeta búsqueda, posición, equipo, filtros numéricos, orden y unidad. En la vista combinada añade fuente, PJ de origen y fecha por columna.
- Los SQLite originales permanecen en sus vistas individuales. No se ofrece un SQLite de Understat como si fuera combinado.

El botón «Actualizar ESPN y combinar» consulta ESPN y reconstruye la combinación usando la captura Understat existente; no renueva la fecha de Understat. Ante un fallo conserva los datos activos.

Para reproducir el JSON desde dos capturas locales reales, con Node 18+:

```sh
node scripts/build_combined.cjs
```

Los archivos generados quedan fuera de GitHub; se distribuyen el código y sus instrucciones.

## Radar por jugador

Se ofrece en ficha y comparador. Muestra entre tres y seis ejes con estadísticas disponibles y percentiles frente a la misma posición. Delanteros priorizan goles, xG, xA, tiros, pases clave y conversión; centrocampistas y defensas usan sus métricas disponibles de creación, pase y defensa. Los porteros usan paradas %, paradas/PJ y goles recibidos/PJ, además de distribución o porterías a cero cuando existen.

Se requieren al menos cinco referencias por eje y tres ejes válidos. La referencia exige 450 minutos en jugadores de campo y 180 en porteros; cuando no hay minutos de porteros se exigen 2 PJ. Los empates usan rango medio: `(menores + 0,5 × iguales) / referencias × 100`. En goles recibidos se invierte la escala, pues un menor valor es favorable. Las ausencias se omiten; no se dibujan como cero.

Los ejes indican su unidad (/90, /PJ o porcentaje), fuente y muestra. «Ver valores y procedencia» ofrece una alternativa textual accesible. El gráfico describe producción estadística y exposición al juego, no capacidades físicas ni una evaluación aislada del equipo o los rivales. El mínimo de minutos no se aplica al jugador consultado; puede compararse una muestra pequeña, cuyo tiempo de juego se muestra en la ficha.

## Filtros

Minutos mínimos y goles mínimos se combinan mediante Y con los filtros adicionales, hasta seis. Se permiten ≥, >, ≤ y < sobre otras métricas y ratios. Los umbrales se aplican a **totales**, aunque la tabla muestre volúmenes por 90; las métricas explícitas /90 o /partido conservan su denominador propio.

Los valores desconocidos no satisfacen un filtro, ni siquiera uno de «menor que». Cero sí es un valor válido. «Limpiar métricas» mantiene los filtros de búsqueda, equipo y posición. El radar compara contra la referencia de posición completa, sin alterar los percentiles por la búsqueda o los filtros de tabla.
