# 20261107 · Ligas combinadas con cobertura equivalente

- Estado: `done`
- Responsable: Codex a petición del usuario
- Revisor: autocontrol; sin revisión independiente
- Rama: `feat/european-combined-leagues`
- Base GitHub: `7412a018578b8a1aba186bd0ff5e432798f19ed6` (PR #11)
- Base Sites: `444b5241622c81834cadbc7d933498037536db8b`, versión 7

## Alcance y criterios

- [x] Añadir solo ligas con el conjunto de rankings y familias de métricas de LaLiga, con descargas reales de temporada 2026/27.
- [x] Verificar Premier League, Serie A, Bundesliga y Ligue 1; soportar 20/18 equipos y 380/306 partidos sin mezclar ligas ni temporadas.
- [x] Usar un catálogo compartido por Python y JavaScript, validación por competición y denominadores de origen.
- [x] Selector exclusivamente de vistas combinadas por liga; preservar descargas originales, refresco seguro, fichas, tablas, filtros, área y CSV.
- [x] Referencias del radar exclusivamente de la liga seleccionada; no mezclar modelos ni poblaciones.
- [x] Pruebas con datos reales, GitHub/PR/merge y Sites públicos verificados.

## Fuentes y decisiones comprobadas

FotMob ofrece los 28 rankings usados en LaLiga en las cuatro ligas, además de goles, asistencias, xG y xA. Las 132 páginas iniciales se descargaron y validaron sin fallos. Los identificadores de temporada se obtuvieron de páginas que confirman 2026/2027: Premier 47/36781, Serie A 55/36072, Bundesliga 54/40040 y Ligue 1 53/37298.

Understat responde mantenimiento («We will come back soon») también para LaLiga y temporadas previas; no se afirma cobertura nueva de ese proveedor. Las nuevas ligas usarán xG/xA FotMob y ESPN como complemento, si pasan el control de métricas. LaLiga conserva su captura y prioridad Understat → ESPN → FotMob. Las definiciones, fuentes y coberturas se mostrarán explícitas.

No se infieren totales de tasas redondeadas, no se añaden ceros para jugadores omitidos ni se renombran las ocasiones FotMob como pases clave Understat. Los datos y bases no se suben a GitHub.

## Ampliaciones expresas del usuario

Se añadieron Todas las ligas, los cinco rankings de jugadores (DEL, POR, DEF y perfiles MED defensivo/ofensivo) y tres de equipos (ataque, defensa y global). El ámbito conjunto recalcula percentiles; no ordena percentiles locales. Perfiles MED estadísticos, sin inventar posiciones. Mínimos iniciales 450 min, 180 para POR y 5 PJ para equipos; todos los ejes completos y muestras de origen.

## Evidencia local

- Capturas FotMob reales: 35 páginas del complemento LaLiga y 42 por cada nueva liga; las cuatro nuevas ofrecen las 30 familias/campos de jugador y 9 de equipo exigidos. Understat conserva 1 de noviembre; FotMob LaLiga jugadores 6 de noviembre/equipos 7; ESPN y nuevas ligas 7 de noviembre.
- Catálogos combinados: LaLiga 487, Premier 454, Serie A 496, Bundesliga 417, Ligue 1 430. Total: 2.284 fichas y 96 clubes. Coincidencias únicas con ESPN: 411/417/450/379/368; FotMob complementa 430 fichas LaLiga. Se corrigieron alias de clubes verificados (Inter/Internazionale, Bayern München/Munich, etc.) manteniendo unicidad y rol.
- Los cinco JSON FotMob coinciden íntegramente con sus SQLite en jugadores y equipos; integrity_check correcto; no hay totales de pase inferidos de redondeos. El pipeline se reprodujo sin red para Premier desde las capturas originales.
- Pruebas Node de ligas 18/20, modelos, prioridad, contextos, identidad/IDs, ámbitos sin mutación, perfiles, mínimos y equipos con valores invertidos/signed. Seis pruebas Python y comprobación documental. Validador histórico StatsBomb correcto, sin reimportarlo.
- Chromium: los 48 cruces de 8 rankings × 6 ámbitos comprueban candidatos, orden, área y unidades; Mbappé seis ejes; Todas 2.284 jugadores y 96 clubes, muestras y filtros, CSV/JSON, bytes SQLite, móvil 390×844 sin desbordamiento, éxito/fallo/actualización parcial 4/5, liga sin fuente excluida y caché de otra liga rechazada. Las respuestas de refresco de QA son capturas reales aisladas y no se publican como capturas nuevas.
- Autocontrol sin revisión independiente. Integración y despliegue confirmados abajo.

## Integración y publicación verificadas

- PR [#12](https://github.com/estadisticasfutbolxg/grada-futbol/pull/12), cabeza `e5c5572c5ab29641012c82f56a51abe165c02aa9`, integrada con cabeza esperada: `867df8e4641ca0b0cfd567ce19058f1cbff8ec6b`. GitHub indicó mergeable y clean; no había checks requeridos pendientes.
- Fuente local/Sites `081749294f53c387bf906d77e9b86168e764f5c2`, subida a main confirmada por ls-remote. Paquete de 21.665.435 bytes: 16 archivos de código cotejados byte a byte con el commit y cinco combinados verificados. Datos generados solo en el paquete Sites, no en el PR GitHub.
- Versión Sites **8**, `appgprj_6ae0b8b2eb1881918601230d00603255~appgver_10df7db920308191886227fe0b4152b1`.
- Despliegue `appgdep_6aeede2d698481919de2255a99750f2c`, resultado nativo **succeeded**, 7 de noviembre de 2026 a las 09:15 Madrid.
- URL: https://grada-futbol-analitica.ivanmatema2.chatgpt.site. Audiencia pública conservada, sin invitaciones ni cambios de permisos. No se repitió el sondeo tras el éxito.
- Este cierre no cambia los archivos servidos. Se limita el workflow opcional a rutas de código/generadores para evitar reimportar datos por futuros cambios solo documentales; sigue disponible la ejecución manual.
