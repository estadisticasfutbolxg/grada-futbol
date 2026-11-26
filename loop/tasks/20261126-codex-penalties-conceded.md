# Penaltis cometidos y descarga de Analítica Fantasy

- Estado: `review`
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

Pruebas: 36 archivos Node y 22 casos Python, incluidas identidad/temporada, ceros/ausencias, minutos propios, muestras parciales entre competiciones, reparto de penalizaciones, caché/Worker y parser/CSV Fantasy. ESLint/Ruff, enlaces y diff correctos. Autocontrol sin revisión independiente. Sin QA visual disponible; se comprueba el Worker exacto con VM/DOM y HTTP al publicar. Evidencias privadas bajo `/workspace/scratch/grada-penalties/`. Pendientes PR, integración y publicación privada.

El validador histórico StatsBomb sigue sin su JSON local; no valida estas capturas activas FotMob/ESPN ni se presenta como aprobado.
