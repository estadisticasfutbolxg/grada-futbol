# Penaltis cometidos y descarga de Analítica Fantasy

- Estado: `done`
- Responsable: Codex
- Revisor: autocontrol, sin revisión independiente
- Rama: `feat/penalties-conceded`
- Base nativa: `4c8af09648d4d292cb09194db94337b82c9b0f2b`
- Base GitHub: `a96a916922e61386675cc4bcac077714efde381d`

## Objetivo

Comprobar y añadir penaltis cometidos de FotMob en las dieciocho competiciones con identidad/temporada/muestra propia. Mostrar en tablas/filtros/glosario y conservarlos en actualización y SQLite. Petición posterior: penalizar penaltis cometidos como tarjetas, con muestra propia; peso manual cinco amarillas, sin hacer perder scores por ausencias. Comprobar y descargar datos públicos de Analítica Fantasy como fuente separada, sin confundir puntos fantasy con score GRADA.

## Plan y criterios

1. Verificar páginas y temporadas; no inferir cero para jugadores ausentes ni minutos de otro ranking.
2. Extender importadores, servicio, aplicación y recuperación de cachés; generar JSON/SQLite coherentes preservando otras métricas.
3. Descargar y extraer tablas públicas de Analítica Fantasy, con archivo/generador reproducible y sin credenciales.
4. Probar aislamiento del score, identidad, fuentes, fechas y actualización; PR/merge y publicación privada.

Sin cambios previos ajenos. Se aplican las skills de datos/revisión/loop y Sites ya leídas. Capturas y entregas fuera de GitHub.


## Evidencia local

FotMob publica el ranking en 18 competiciones: 466 filas con ID y club verificados, ninguna sin cruce. Se descarga también el ranking de minutos propio en la misma tanda: 466 contextos con minutos/apariciones coincidentes. Bundesliga/Ligue 1 requieren IDs por ranking 1000001451/1000001834 para confirmar 2026/27; no se cambian los IDs ni cifras de las capturas anteriores. Tabla, ficha, comparador, filtros, glosario, importador completo, enriquecimiento independiente y Worker incluyen el dato. Ausencias siguen desconocidas; el caché recupera el campo posterior sin sustituir otras estadísticas.

Petición posterior del usuario: penalizar como tarjetas. Peso cinco amarillas/media roja; `0,50 × penaltis × 90 / minutos propios`, sumado al componente de tarjetas de su propia muestra y limitado al mínimo de score 0. Solo se agregan contribuciones con minutos conocidos. Sin muestra suficiente no se retira score. Se declara que los totales no permiten identificar penalti y tarjeta en una misma acción. Modelo v9; método lineal de tarjetas conservado cuando no hay muestra de penaltis.

Auditoría real: 8.302 registros de otras estadísticas idénticos, base de score y posiciones intactas, 4.224 scores válidos; 403 personas reducen score por penaltis y ninguna pierde score. 8.302 equivalencias entre vistas, 2.645 medias, 13.998 contribuciones y 1.170.632 lecturas de 83 métricas. Dieciocho SQLite/8.302 jugadores contrastados con JSON. Dieciocho combinados regenerados. ESPN y archivo Understat intactos. Cero jugadores nuevos y cero encuentros individuales actualizados; cobertura agregada de partidos anterior conservada.

Analítica Fantasy: descarga real de 618 filas de LaLiga Fantasy 2026/27, con goles, asistencias, minutos, tiros, regates, recuperaciones, pérdidas, despejes, portería, tarjetas, penaltis/autogoles, valor de mercado y puntos fantasy separados. Se extrae el payload público completo; la tabla visual solo muestra veinte filas. Generador reproducible y validado sin ejecutar JavaScript. Datos sin mezclar con GRADA ni servir en el Site. Archivos JSON/CSV atribuidos en `/workspace/entregas/analitica-fantasy-laliga-2026-27.*`; CSV de 466 fichas en `/workspace/entregas/grada-penaltis-cometidos-2026-11-26.csv`. No se presume permiso nuevo de reutilización.

Pruebas: 36 archivos Node y 22 casos Python, incluidas identidad/temporada, ceros/ausencias, minutos propios, muestras parciales entre competiciones, reparto de penalizaciones, caché/Worker y parser/CSV Fantasy. ESLint/Ruff, enlaces y diff correctos. Autocontrol sin revisión independiente. Sin QA visual disponible; se comprueba el Worker exacto con VM/DOM y HTTP al publicar. Evidencias privadas bajo `/workspace/scratch/grada-penalties/`. PR, integración y publicación privada verificados abajo.

El validador histórico StatsBomb sigue sin su JSON local; no valida estas capturas activas FotMob/ESPN ni se presenta como aprobado.


## Entrega verificada

[PR #78](https://github.com/estadisticasfutbolxg/grada-futbol/pull/78) integrado en `0a866494aeade93fd490b39368f2fa61219ff257`. Quality success en head `6735eb23da1e94fa2b5667d646cbcd5740945e76`, job 139740516066. Los 27 archivos subidos se comprobaron por SHA de blob. 36 archivos Node y 22 casos Python correctos. Tres arranques VM/DOM del Worker exacto cubren columna visible, tasas con minutos propios, penalización real positiva, radar, comparaciones, selecciones y fallo de una fuente. Sin QA visual ni revisión independiente.

[GRADA privada](https://grada-futbol-analitica.ivanmatema2.chatgpt.site), **v42**, fuente nativa `211cd46f5aa42ba7830800e4ad6eb6135bef04b1`, despliegue `appgdep_6b07d5479dc48191950a1b77f2cb668a` succeeded. Worker SHA256 `9390d9f75c3a0781517778d64b51831d91b75c097f0c1fd2837c8b97dfd629ce`, 373 assets, 12 módulos. HTTP confirma HTML y bundle exactos (94.558 bytes gzip), 36 capturas fuente por hash, 42 rutas retiradas 400/404 y actualización sin identidad 401. Los datos Fantasy no se sirven (404). Política custom revisión 3 con solo propietario, cero editores/grupos/visitantes y runtime revisión 1 conservados.

Fuente FotMob: 466 registros jugador/competición con la nueva métrica y minutos propios en dieciocho competiciones, ningún cruce dudoso. 403 scores reducidos, cero perdidos, 4.224 válidos; 393 pendientes anteriores sobre 200 minutos por métricas obligatorias siguen sin imputarse. Cero jugadores nuevos y cero partidos individuales actualizados. Cobertura agregada previa de 1.572 partidos por proveedor conservada; no se consultaron encuentros individuales. Analítica Fantasy: 618 filas descargadas en archivos separados, fuera de GitHub y del Site. Capturas/bases/CSV privados, con generadores versionados. Evidencias `audit.json`, `enrichment.json`, `runtime-cups.json`, `live.json`, auditorías de score/métricas y extracción Fantasy bajo `/workspace/scratch/grada-penalties/`.
