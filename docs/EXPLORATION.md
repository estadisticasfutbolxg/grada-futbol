# Explorar y comparar equipos

El score es la primera columna real de las tablas, antes del puesto (#) y del nombre. Permanece fijo al desplazar la tabla horizontalmente. Jugadores, portada y posiciones empiezan por score; los enlaces a rankings de goles, asistencias u otro KPI conservan el orden de esa métrica. Los rankings por líneas de equipo muestran primero su score específico, junto al general. No cambia ninguna fórmula ni referencia de [SCORES.md](SCORES.md).

La ayuda se abre desde ⓘ, al pasar, enfocar o pulsar. Usa una descripción de hasta 170 caracteres y no captura eventos del puntero. Ordenar, desplazar la página o pulsar Escape la cierra. El glosario contiene las definiciones completas de las columnas de jugadores y equipos, además de los conceptos generales.

El filtro de equipos permite marcar varios clubes y buscar sin distinguir tildes o mayúsculas. La selección funciona como O: incluye cualquiera de los equipos elegidos. Los filtros numéricos mantienen su combinación Y. Se usan IDs, con prefijo de liga en Todas. «Varios clubes» conserva sus agregados separados y nunca los asigna a uno de los clubes. Cambiar de competición limpia la selección; actualizar la misma competición conserva los IDs válidos.

En **Equipos** puedes elegir dos clubes distintos o usar los dos marcados en el filtro. La comparación muestra el mismo score general y las medias por minutos de portería, defensa, mediocampo y delantera. Incluye jugadores con score, tamaño de plantilla y minutos ponderados, con acceso a la ficha del equipo. Los perfiles ofensivo y defensivo del mediocampo se despliegan aparte. Los filtros de tabla no alteran las medias ni sus referencias.

El bloque de contexto ofrece, cuando existen:

- Goles y goles recibidos por 90; xG y xG recibidos por 90; balance xG por partido.
- Tiros a puerta y grandes ocasiones por partido; puntos por partido; goles/xG; porcentaje de porterías a cero.
- Amarillas y rojas como **suma conocida de jugadores asignados**, con fuente FotMob y cobertura. No son totales oficiales de equipo, no incluyen agregados sin desglose por club y no se dividen por minutos de otra muestra. La cobertura parcial se declara incluso cuando la suma conocida es cero.

Las tasas de equipo usan los PJ o minutos nominales de su propia fuente; 90 minutos nominales por partido no incluyen el añadido. xG conserva el modelo de cada proveedor, que puede diferir entre ligas. Los valores ausentes siguen siendo —; una métrica se omite solo si falta en ambos equipos. No se inventan ceros ni se declaran ganadores con un score ausente. Las comparaciones por score empatan cuando coinciden a los tres decimales mostrados.

`dist/explore.js` separa selección, ayudas y presentación de los cálculos del modelo. `app.js` conecta los controles sin filtrar los jugadores de referencia ni recalcular scores desde las filas visibles. Las pruebas de controlador usan dobles DOM y HTML real generado; comprueban eventos y resultados, **no layout ni interacción visual de navegador**. El empaquetador incluye el módulo después de sus dependencias.
