# 20261106 · Métricas FotMob de LaLiga y área de radar por posición

- Estado: `done`
- Responsable: Codex, a petición de Ivan
- Revisor: autocontrol; colaborador no asignado
- Rama: `feat/laliga-midfield-fotmob`
- Base GitHub: `8e7beb044c76321276193da7ea0818017389f5f9`
- Base Sites: `6542817f74ba5e817ff95feaca1e28fcf22b552d`
- PR: [#9 integrado](https://github.com/estadisticasfutbolxg/grada-futbol/pull/9)
- Entrega: descarga real, código generador, integración y publicación pública

## Alcance y aceptación

- [x] Obtener datos reales de LaLiga 2026/27 sobre pases, entradas, intercepciones y recuperaciones, probando otras fuentes públicas.
- [x] Extraer y validar temporada, identidad, unidades y cobertura; no derivar totales de tasas redondeadas ni inventar ausencias.
- [x] Añadir FotMob al combinado con prioridad Understat/ESPN ya vigente y coincidencias inequívocas de nombre y club.
- [x] Mostrar métricas en centrocampistas, filtros, fichas, CSV y radar, con denominadores de origen y tasas publicadas identificadas.
- [x] Checks, prueba real de navegador, PR/merge y despliegue confirmados.

Ampliaciones expresas del usuario: añadir más métricas reales de otras fuentes, entre ellas tiros a puerta y progresión de pase; escoger prioridad en conflictos; adaptar radares a la posición y mostrar un área relativa máxima 1 **en las tablas de jugadores**, ordenable y filtrable.

## Investigación

Se consultaron páginas públicas de FotMob, AS, LaLiga y Fichajes: todas respondieron 200 con temporada verificable; el endpoint genérico de API FotMob devolvió 404. Se usa el JSON incluido en el HTML público de los rankings FotMob, sin autenticación ni elusión de controles.

FotMob temporada 38843, LaLiga 87, 2026/2027: 488 registros con minutos; 366 con pases precisos/90 y porcentaje de éxito; 342 con entradas; 314 con intercepciones; 366 con recuperaciones. Los totales defensivos aparecen en `substatValue` y sus tasas en `statValue`. Los pases solo aportan tasa y porcentaje; el total permanece ausente.

## Plan y evidencia

1. Importador HTML/JSON y SQLite con validación; conservar captura real y metadatos por página.
2. Combinador y métricas con origen por campo, columnas y radar de centrocampistas.
3. Comprobar con capturas reales, integrar y publicar, conservando acceso público.

## Resultado local validado

- Descarga real de 28 páginas públicas FotMob: 20 clubes, 488 registros con minutos. Pases precisos/90, precisión, pases rompelíneas (separados de progresivos), pases largos, entradas, intercepciones, recuperaciones, tiros a puerta/90, regates, ocasiones, despejes, bloqueos, zonas de recuperación, tarjetas y portería. Coberturas y definiciones en `docs/FOTMOB.md`.
- JSON y SQLite gzip generados desde el mismo objeto; 488 registros íntegros cotejados, `PRAGMA integrity_check = ok`, sin totales de pase reconstruidos. Consultas con parámetros, HTML sin ejecución JS y límites de red/volumen. Los datos siguen fuera de GitHub.
- Combinado: 448/487 jugadores complementados; 411 por ESPN, 429 por FotMob, 39 solo Understat. Prioridad Understat → ESPN → FotMob, incluidos ceros; sin uniones difusas. Cada campo guarda fuente, fecha, PJ y minutos propios o tasa /90 publicada. Actualizar ESPN conserva las otras capturas.
- Radares con referencias y ejes comunes por posición. Porteros sin métricas ofensivas; centrocampistas con pase, creación y defensa. Área = media de productos de radios adyacentes, con máximo 1. Tabla ordenable/filtrable/CSV: área solo cuando están todos los ejes comunes; referencias no cambian con filtros. Perfiles derivados en memoria sin mutar capturas.
- Captura comprobada de Rodri: 105,9 pases precisos/90, 94,4 % de acierto, 20 entradas, 12 intercepciones, 46 recuperaciones y 138 pases rompelíneas; la tasa de entradas publicada es 2,6/90 con 697 minutos FotMob, frente a 705 minutos Understat. Área MED: 0,834 redondeada (6 ejes), sin mezclar denominadores.
- Checks pasados: sintaxis JS, `node --test tests/*.test.cjs`, seis pruebas Python, validador histórico StatsBomb (64 partidos/234.637 eventos), comprobación de enlaces/skills y `git diff --check`.
- Navegador Chromium con capturas reales: tabla MED, unidades, fechas/minutos de origen, JSON FotMob y combinado, CSV con área y procedencia, orden/filtro de área, ficha/comparador, radar POR sin goles/xG/xA, vistas históricas, actualización ESPN válida/fallida y ausencia de FotMob, móvil 390×844 sin desbordamiento de página. Los datos de SQLite se verificaron mediante fetch desde su enlace en el navegador y con Python; la descarga automática de ese enlace bajo el enrutamiento de QA se canceló, aunque las descargas Blob JSON/CSV funcionaron. No se atribuye ese límite de QA a una prueba de descarga nativa completada.
- Autocontrol sin revisión independiente del colaborador. Los rasgos físicos o capacidades sin datos no se estiman.

## Integración y publicación confirmadas

- Commit local y fuente Sites: `292cc182ef9c0b3d949f66fd0e22a7f046ad2c6f`.
- Fuente subida a GitHub en `feat/laliga-midfield-fotmob`, commit `92d8b79cdba03f2ef3aac775f3aae01b45878669`; PR #9 comprobado sin conflictos y fusionado con cabeza esperada. Commit integrado: `19eece583d6051b88734938ee3d740057fee14cb`.
- Push a la rama fuente Sites confirmado por `ls-remote`; 13 archivos de código del archivo de publicación cotejados byte a byte con el commit. El paquete incluye los datos reales generados, sin datos en el PR de GitHub.
- Versión Sites **6**, `appgprj_6ae0b8b2eb1881918601230d00603255~appgver_cf3848c26a08819181f1e0bc5495490a`.
- Despliegue `appgdep_6aedf82aacd881918982fbf2aa7ed099`, estado nativo **succeeded**, 6 de noviembre de 2026, 15:54 UTC.
- URL pública: https://grada-futbol-analitica.ivanmatema2.chatgpt.site. Audiencia pública conservada, sin invitaciones ni cambios de permisos de edición. No se repitió una comprobación de estado después del éxito nativo.
- Este cierre modifica solo documentación; los archivos servidos son los de la versión 6 verificada.
