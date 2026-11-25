# Goles, asistencias, xG y xA en el score de jugadores de campo

- Estado: `done`
- Responsable: Codex
- Revisor: autocontrol; sin revisión independiente
- Rama: `feat/20261125-codex-score-aporte-ofensivo`
- Base: `55a2efa724181f60fd4ee78972d26e8814a28e0a`
- Issue: no creado
- PR: [#73](https://github.com/estadisticasfutbolxg/grada-futbol/pull/73), integrado en `bcac92ff61262bc850cc6e6a9249c0b671845c66`
- Objetivo de entrega: cambio verificable del modelo y su presentación

## Alcance y coordinación

Modelo canónico de temporada, ficha, comparador, rankings, glosario, generador y pruebas relacionadas. Se usan las tasas de FotMob/ESPN ya disponibles con los minutos de cada métrica. Sin tareas activas con solapamiento en la base revisada.

## Aceptación

- [x] Goles, asistencias, xG y xA por 90 tienen el mismo peso entre sí dentro de cada perfil de campo. Los percentiles comparan con la posición correspondiente.
- [x] El bloque tiene un peso reducido en perfiles defensivos. Las métricas ausentes quedan explícitas, sin imputar ceros, y Portería conserva su fórmula.
- [x] El mismo score alimenta rankings, fichas, clubes y selecciones en todos los ámbitos.

## Plan

1. Incorporar el bloque al modelo y reflejar su cobertura en la interfaz.
2. Validar muestras, ponderación, referencias, disciplina y coherencia entre ámbitos.
3. Registrar resultado y entrega.

## Validación original (antes de la publicación)

- 215 pruebas Node y 18 Python correctas. Cubren los cuatro pesos individuales, referencias de posición, portería, ceros, minutos propios, matriz de vistas, ponderación de clubes y alcance de temporada.
- Se verifican sintaxis JS, ESLint, documentación y diff. Revisión propia y pruebas de interfaz automatizadas, pendiente revisión independiente.
- La regeneración de LaLiga requiere las capturas privadas validadas de FotMob y ESPN. El clon carece de esas capturas. Cero jugadores nuevos, cero cifras de origen y cero partidos actualizados.
- El conector de Sites devuelve proyecto no encontrado para el ID de `.openai/hosting.json`. El sitio privado exige identidad. Pendiente verificación con capturas reales y publicación.

## Resultado original (antes de la publicación)

El modelo `role_fairplay_radar_v7` aplica el bloque antes de juego limpio. La ficha y el comparador muestran percentiles y pesos utilizados. El glosario y el contrato de datos recogen la fórmula.

El cambio está en un commit local. GitHub devuelve HTTP 403 al subir la rama con la cuenta conectada y la comprobación del entorno no pudo verificar acceso de escritura. La rama sigue pendiente de subida, PR e integración.


## Publicación privada verificada · 25 de noviembre de 2026

Petición explícita de publicar PR #73 manteniendo el sitio privado. Se verificó que ya estaba integrado y que CI quality había pasado. Se sincronizaron los 17 archivos exactos de ese merge, comprobados por SHA de blob, sobre la fuente nativa `6a2aaaf2658d7c57a28d4453525ea10c49191903`. El archivo generado `dist/data.js` difiere del marcador vacío de GitHub y se conservó; los otros 209 blobs de la base coinciden. Rama nativa de publicación `deploy/pr73-offensive-score`.

Se regeneraron los dieciocho combinados desde FotMob/ESPN ya capturados. Cero jugadores nuevos, cero estadísticas de origen o partidos actualizados; 36 fuentes activas y el archivo archivado conservan sus hashes. Understat no participa. 35 archivos de pruebas Node, 18 casos Python, ESLint, Ruff, documentación y diff correctos. Auditoría real: 8.302 equivalencias de score entre vistas, 6.766 perfiles, 2.592 medias de equipo, 13.399 contribuciones y 1.156.528 lecturas de métricas. Recuperación de carga/refresco sin pérdidas ni cambios. Los 434 porteros conservan exactamente su score anterior. Los nuevos ejes dejan pendientes 193 jugadores antes puntuados y habilitan 7; quedan 4.031 scores válidos y 586 pendientes por datos/muestras entre los que superan 200 minutos. No se imputan ceros ni se modifica la fórmula integrada para evitar ese resultado.

Tres arranques VM/DOM del Worker exacto cubren navegación, selección múltiple, ficha, comparadores, selecciones, score de temporada y fallo de una fuente. Sin QA visual disponible; no se afirma revisión independiente. Evidencia privada en `/workspace/scratch/grada-pr73-publication/`: `score-audit.json`, `metric-audit.json`, `comparison.json`, `cup-data-audit.json`, `runtime-cups.json` y `live.json`.

Sites **v40**, fuente nativa `3f12bc8324e5557979b137870c6c7a7d6c0cd43e`, despliegue `appgdep_6b073f0a33708191a7d4beadf3d1cba0` succeeded. Worker SHA256 `fad3b62b27808036c8252f80ba19f83530e7a7a1a0244d23f674da4d9f8e5e73`, 373 assets, 12 módulos. HTTP confirma HTML y bundle exactos (92.460 bytes gzip), 36 capturas publicadas por hash, 42 rutas retiradas 400/404, Understat 404 y actualización sin identidad 401. Política custom revisión 3 con solo propietario y cero editores/grupos/visitantes; runtime revisión 1. [GRADA privada](https://grada-futbol-analitica.ivanmatema2.chatgpt.site).
