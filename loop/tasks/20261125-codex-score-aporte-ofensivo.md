# Goles, asistencias, xG y xA en el score de jugadores de campo

- Estado: `review`
- Responsable: Codex
- Revisor: por asignar
- Rama: `feat/20261125-codex-score-aporte-ofensivo`
- Base: `55a2efa724181f60fd4ee78972d26e8814a28e0a`
- Issue: no creado
- PR: no creado
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

## Validación

- 215 pruebas Node y 18 Python correctas. Cubren los cuatro pesos individuales, referencias de posición, portería, ceros, minutos propios, matriz de vistas, ponderación de clubes y alcance de temporada.
- Se verifican sintaxis JS, ESLint, documentación y diff. Revisión propia y pruebas de interfaz automatizadas, pendiente revisión independiente.
- La regeneración de LaLiga requiere las capturas privadas validadas de FotMob y ESPN. El clon carece de esas capturas. Cero jugadores nuevos, cero cifras de origen y cero partidos actualizados.
- El conector de Sites devuelve proyecto no encontrado para el ID de `.openai/hosting.json`. El sitio privado exige identidad. Pendiente verificación con capturas reales y publicación.

## Resultado

El modelo `role_fairplay_radar_v7` aplica el bloque antes de juego limpio. La ficha y el comparador muestran percentiles y pesos utilizados. El glosario y el contrato de datos recogen la fórmula.

El cambio está en un commit local. GitHub devuelve HTTP 403 al subir la rama con la cuenta conectada y la comprobación del entorno no pudo verificar acceso de escritura. La rama sigue pendiente de subida, PR e integración.
