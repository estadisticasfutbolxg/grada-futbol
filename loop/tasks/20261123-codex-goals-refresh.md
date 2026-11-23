# 20261123-codex · Actualización de goles y frescura por campo

- Estado: `review`
- Responsable: Codex
- Revisor: autocontrol, sin revisión independiente solicitada
- Rama: `fix/refresh-goals-freshness`
- Base Sites: `ac6dc0d77294dce0224417b161dd7e005b8f091d`
- Base GitHub: `420e7da5b9d1236cc8da78b052f5e1bebbdff0f7`
- PR: no creado
- Entrega: corregir, integrar y publicar en privado, autorización vigente

## Objetivo y alcance

Revisar y reparar los goles que quedan antiguos después de actualizar. Caso del usuario: Budimir. Capturas publicadas: Understat 7 goles/10 PJ del 1 de noviembre; ESPN 8/11 del 7; ficha FotMob verificada 8/12 del 8. El combinado conserva 7 por prioridad fija, aun con coincidencia única y datos posteriores.

Corregir elección de goles por cobertura de PJ y después fecha propia, manteniendo prioridad ante duda, fuentes originales y denominadores propios. Cubrir carga, actualización, tabla/ficha/portada, derivados y muestras. No modificar manualmente cifras, inventar goles, escoger el máximo histórico ni alterar identidad/posición. Reutilizar capturas verificadas y distinguir corrección del combinado de descargar partidos nuevos.

Áreas: combinación, procedencia/explicaciones, pruebas y regeneración de cinco combinados. No hay otra tarea activa sobre los archivos. Fuera de alcance: nuevas fuentes, cambios de fórmula individual/club/selección, audiencia, permisos o contraseña.

## Aceptación

- [x] Budimir y casos equivalentes usan una muestra con más PJ verificados o, con iguales PJ, fecha posterior; empates/incertidumbre conservan prioridad.
- [x] Tasas/derivados no mezclan muestras; ceros y correcciones válidas no se sustituyen por máximos históricos.
- [x] Carga/actualización no reintroducen el valor anterior; fuente, fecha y cobertura visibles.
- [ ] Regeneración por etapas, pruebas, recuento de jugadores/partidos, PR/merge y publicación privada comprobados.

## Plan

1. Reproducir con las capturas reales y revisar caché/combinar.
2. Reparar selección por campo con pruebas de frescura, identidad, ceros y muestras propias.
3. Regenerar/auditar, integrar y publicar con límites y recuentos reales.

## Resultado y autocontrol

- Causa reproducida con las capturas publicadas y las leídas del propio Site: el combinado conservaba Understat 7/10 PJ (1 de noviembre) aun con ESPN 8/11 (7) y ficha FotMob 8/12, 930 min (8). Coincidencias por ID/club/nombre inequívocas; no era un cruce de Budimir.
- Regla genérica `goal_sample_freshness_v1`: mayor muestra conocida de PJ y después fecha propia del campo; valores iguales conservan prioridad. Una consulta reciente de una muestra más corta no hace retroceder el recuento. Empates, muestras desconocidas/menores, fechas futuras, otra liga o identidades ambiguas no fuerzan la sustitución. Admite correcciones a la baja y cero; no escoge máximos históricos.
- Los derivados recuperan ambos componentes de la ficha original del proveedor de los goles solo con muestra compatible. Fuente, fecha, valores y muestra visibles en procedencia; no se cambian las columnas de xG/tiros/asistencias. Si falta el par, el valor queda desconocido. Conversión incoherente por más goles que tiros no se calcula. Solo equipos pueden usar 90 minutos nominales por PJ propio, con etiqueta explícita; nunca se infieren minutos de jugadores.
- En seis equipos quedan desconocidos delta y goles/xG porque el proveedor del recuento más completo no aporta xG compatible; no se mezclan con el xG de otra captura. Las tasas goles/90 de equipo se conservan con su propio denominador nominal.
- Cinco combinados preparados en staging y validados antes de promover. Once fuentes originales por SHA256 intactas, IDs, posiciones, nacionalidades, xG/xA, minutos y muestras ajenas a goles conservados. SQLite sin regenerar. Raw/procedencia original preservados, sin cambiar fechas al día de la corrección.
- **21 jugadores con recuento de goles corregido, seis equipos con goles corregidos, cero jugadores nuevos y cero partidos actualizados o descargados**. Todos son de LaLiga; las otras cuatro ligas no cambian goles. Incluye correcciones a la baja (Aubameyang 6→5 y Luismi Cruz 2→1), además de Budimir 7→8. Lista completa privada local: `/workspace/scratch/grada-goals-review/report.md`; no se suben capturas/listados de estadísticas a GitHub.
- Se recalculan 310 scores por la referencia común; cambia un perfil estadístico MED, ninguna posición canónica. Siguen 1.502 scores válidos y 76 pendientes sobre el mínimo; ningún score válido desaparece. Se conservan 104 países y 17 onces completos, con media simple de sus once scores. Clubes ponderados por minutos, sin cambios de fórmula.

## Validación real

- 27 archivos Node correctos. Nueve casos nuevos de combinación (muestras, fechas de campo/agregado, ceros/correcciones, consulta reciente de muestra antigua, ambigüedad, no mezclar muestras, actualización/caché, porcentajes y minutos nominales solo de equipo) y uno de procedencia.
- Auditoría de 82 medidas: 390.320 lecturas y 111 pares originales verificados contra los valores y muestras de las fichas. 2.284 equivalencias de score/perfil, 1.484 ajustes de disciplina, 741 medias y 3.807 contribuciones. Recuperación de carga/actualización conserva exactamente posiciones y scores. Cinco JSON calculados con referencia común de las cinco ligas.
- Worker SHA256 `806259e3d5163780b3e70216ca1bbd6f957c8af1d2cf1d76398620c15bce5c09`, 145 assets/12 módulos y bundle gzip 79.551 bytes. 108 assets exactos y siete arranques VM/DOM del bundle: normal, publicados, liga solicitada, liga fallida, caché FotMob posterior, selecciones y simulación de Understat recién consultado con muestra corta. Budimir conserva 8, FotMob, 12 PJ, 930 min, 0,7741935484 goles/90; tabla/ficha y componentes propios correctos. Sin QA visual de navegador.
- Documentación/enlaces, sintaxis y diff correctos. `validate_data.py` sigue sin la captura histórica `dist/downloads/statsbomb.json`, ajena a estas fuentes. Las comprobaciones actuales pasan; no se inventa ni descarga un histórico para ese check.
- Se consultaron capturas ya alojadas del propio Site y logs de error recientes, sin peticiones nuevas a proveedores ni suplantar identidad del propietario. Los logs consultados no mostraron un error de API de actualización relacionado; no constituyen una comprobación en vivo de ESPN/FotMob/Understat. El recuento corregido procede de la captura del 8 de noviembre, no se afirma que sea el total del 23.
- Autocontrol sin hallazgos funcionales pendientes, sin revisión independiente. Evidencia local: `verification.json`, `audit-metrics.json`, `audit-scores.json`, `runtime.json`, `node-tests.log`, `report.md` en `/workspace/scratch/grada-goals-review/`, fuera de GitHub.

## Integración y publicación

Pendientes: PR, merge, push nativo y publicación privada. Mantener owner-only revisión 3, runtime revisión 1 y actualización sin contraseña adicional.
