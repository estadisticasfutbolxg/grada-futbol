# Calidad y rendimiento

## Verificación de ligas y torneos

`competition-totals.test.cjs` cubre identidad, transferencias, ceros/ausencias, minutos propios, muestras incompatibles, tarjetas emparejadas, un score y posición entre vistas, fechas y regeneración idempotente. Selección de 18 competiciones, ámbito de quince ligas en selecciones y mínimo /90 de 200 para torneos cortos tienen pruebas propias; la elección explícita de mínimo del usuario se conserva.

Auditoría con datos reales: 8.302 equivalencias de score, 6.766 perfiles, 2.645 medias de equipo y 13.974 contribuciones. Auditoría de métricas: 1.156.528 lecturas de 82 medidas. Treinta fuentes previas intactas y dieciocho SQLite contrastados. La medición del 48,2 % descrita abajo corresponde al primer incremento con entradas idénticas, no a una comparación de carga de 15 frente a 18 competiciones. No hay medición visual de navegador disponible; VM/DOM y HTTP no sustituyen esa comprobación.

Requiere Node 24 y Python 3.11+. Las herramientas son solo de desarrollo; el Site no carga dependencias npm.

```sh
npm ci
python -m pip install -r requirements-dev.txt -r requirements-analysis.txt
npm run lint
ruff check scripts tests
npm test
python -m unittest discover -s tests -p 'test_*.py'
```

ESLint 10 aplica reglas recomendadas, variables globales explícitas del navegador y cero avisos; Ruff comprueba errores semánticos Python, importaciones y variables sin uso. La configuración conserva expresiones de seguridad contra caracteres de control con excepciones locales justificadas. El workflow Calidad y pruebas ejecuta estas comprobaciones en PR y main, con permisos de solo lectura. Los lockfiles fijan dependencias; las pruebas aisladas no publican datos.

El 25 de noviembre se retiraron variables y una función sin uso y se extrajo el paso común de xG de equipos del importador FotMob. El enriquecimiento parcial conserva jugadores y sus fechas: exige clasificación e IDs completos para xG/xGA, admite filas omitidas de otras métricas como desconocidas y rechaza muestras que retroceden. JSON y SQLite se preparan antes de sustituir archivos; no se afirma una transacción de dos archivos.

La selección de capturas conserva también los equipos de una captura posterior con igual o mayor cobertura, independientemente de la fecha de los agregados de jugadores. Esta regla se aplica en navegador y Worker para evitar que una caché oculte xG recién publicados.

La navegación deja de renderizar tablas y radares ocultos: secuencia Glosario → Jugadores con capturas reales, mediana local 168,85 → 87,44 ms (48,2 % menos), con HTML de tabla y cabecera idéntico. Cinco rondas, primera descartada; VM/DOM local, sin medir red ni layout. No se atribuye esa mejora a toda la carga o descarga de proveedores.

Los análisis Fantasy usan numpy/scipy, scikit-learn y statsmodels versionados en requirements-analysis.txt. Las pruebas comprueban cruces ambiguos, no reutilización de fichas, extracción de recuentos, ceros frente a ausencias, captura/muestra, regresión conocida, exclusiones, validación por clubes y render seguro. Estas herramientas no se instalan en el Worker: la web consume informes fechados precomputados.
