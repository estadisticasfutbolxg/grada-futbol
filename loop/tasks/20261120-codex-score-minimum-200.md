# 20261120-codex · Scores desde 200 minutos

- Estado: `done`
- Responsable: Codex
- Revisor: autocontrol; sin revisión independiente solicitada
- Rama: `fix/score-minimum-200-minutes`
- Base Sites: `1108a0441d2f341a88f0612a54d1ddc6949de135`
- Base GitHub: `b14bdceef2c64397cc36f72abe61e0cd6383e3d1`
- Issue: no creado
- PR: [#47 integrado](https://github.com/estadisticasfutbolxg/grada-futbol/pull/47)
- Objetivo de entrega: merge y despliegue privado, autorización vigente

## Objetivo y alcance

Mostrar el score desde **200 minutos inclusive** en todas las posiciones. Unificar referencias, ajuste por tarjetas, rankings, metadatos y textos. Recalcular derivados de las cinco ligas desde las capturas existentes. Conservar los mínimos editables de rankings de KPI y los cinco partidos de equipos.

Archivos compartidos: radar, fairplay, scores, app, HTML, empaquetador, pruebas y contrato SCORES/DATA. No hay otra tarea activa reservando estos archivos. Fuera de alcance: descargas de proveedores, posiciones, fórmulas de rendimiento/penalización, audiencia y secretos.

## Aceptación

- [x] 199 minutos no dan score; 200 y 201 sí, con ejes válidos, para POR/DEF/MED/DEL y laterales.
- [x] Ceros reales válidos; faltantes o muestras insuficientes conservan `null` con explicación.
- [x] Misma puntuación en liga/Todas, tabla/ficha/ranking/equipos; tarjetas usan minutos propios.
- [x] Artefactos combinados regenerados y comprobados antes de promoción; fuentes intactas.
- [x] Push, PR, merge y publicación privada confirmados.

## Plan

1. Capturar base real y fijar un mínimo compartido de 200.
2. Ajustar consumidores y contrato; probar umbral y coherencia.
3. Regenerar derivados, validar, integrar y publicar.

## Evidencia y entrega

Base: 2.284 registros jugador/liga; 1.017 scores (110 POR, 399 DEF, 306 MED, 202 DEL). Resultado y límites pendientes de validación. Sin refrescos de estadísticas de origen.

### Resultado validado antes de integrar

- Modelo `role_fairplay_radar_v6`, regla compartida 200 min. Tarjetas conservan fórmula `linear_cards_v2`. Los minutos desconocidos del jugador no se estiman desde PJ. La alternativa de 2 PJ de ciertos ejes POR no sustituye el mínimo del jugador.
- **1.502 scores válidos**: 489 nuevos, 1.013 existentes recalculados con la referencia ampliada y cuatro POR de 180–199 min pendientes (Daniel Batz, Ewan Hatfout, Nicolas Lemaître y Arnaud Bodart). Cero scores por debajo de 200. Cambian 90 perfiles estadísticos MED por la nueva referencia, sin cambiar posiciones de las fuentes.
- Por liga: LaLiga 335 válidos (+114 nuevos); Premier 297 (+90); Serie A 331 (+110); Bundesliga 259 (+83, un POR excluido); Ligue 1 280 (+92, tres POR excluidos). 76 jugadores sobre el mínimo siguen pendientes por cobertura real de ejes. Disciplina: 1.484 ajustes verificados, 18 bases con aviso.
- **0 jugadores nuevos, 0 cifras de proveedor y 0 partidos actualizados**. Once capturas/fechas comprobadas por SHA256 intactas. Solo se regeneraron derivados, conservando originales; cinco combinados preparados por etapas y 2.284 score/base/factores/equipos contrastados antes de promoción. No se modifica SQLite.

| Comprobación | Resultado real | Límite |
| --- | --- | --- |
| `node --test tests/*.test.cjs` | 23 archivos correctos, incluidos cinco casos de umbral | Dobles DOM, sin layout de navegador |
| `python -m unittest discover -s tests -p 'test_*.py'` | 10 tests correctos | Sin consultas de proveedores |
| Auditoría scores | 2.284 scores/perfiles, 1.484 ajustes, 741 medias y 3.809 contribuciones correctos | Recuperación conserva posiciones y scores |
| Auditoría métricas | 390.320 lecturas, 82 métricas | Capturas existentes |
| Controladores reales | 4.568 equivalencias liga/Todas, 84 tablas, 1.344 bloques y 2.302 KPI de comparativa | Sin QA visual/móvil |
| Worker generado | 141 assets, 11 módulos; 110 contenidos/MIME exactos, 96 escudos y cinco banderas conservados | SHA256 `4412df90533b217ae8485aa8831b6b5aee93de008c066d6d612ee5627c520acf` |
| Sintaxis JS, Python y diff | Correctos | Regla/UI/glosario/empaquetador compartidos |
| `python scripts/validate_data.py` | Bloqueado: falta `dist/downloads/statsbomb.json` histórico | Ajeno a las cinco ligas; auditorías actuales correctas |

### Revisión

Autocontrol del diff, muestras propias, nulos/ceros, scores únicos, cobertura de referencias, umbral de disciplina, orden de módulos y audiencia. Sin hallazgos pendientes. No equivale a revisión independiente. Sin navegador disponible en este entorno managed; no se afirma QA visual.

### Entrega

Código subido por API nativa a GitHub en `d1213b427a4bbbc6102e6005f7e820cf1b62d302`. PR #47 integrado con squash en `63ac40077193d242e328648819c74b1ebdfe4551`, main verificado. Antes de integrar: head/base exactos, mergeable clean, sin checks/statuses configurados ni protecciones/rulesets; no se han cambiado. Las pruebas locales constan arriba.

Fuente Sites `0823e0f419885c65ac598c0bf02e9803af1043b0` subida y verificada. Archivo con solo hosting y Worker comprobado por SHA256. [GRADA privada](https://grada-futbol-analitica.ivanmatema2.chatgpt.site), versión **26**, despliegue `appgdep_6b00bd95ef5c8191b04a5d24493598e3` en `succeeded`, el 20 de noviembre a las 22:37 Madrid. Versión `appgprj_6ae0b8b2eb1881918601230d00603255~appgver_b378e5d904888191aa985d92ea83f6e0`; procedencia exacta confirmada con get_site_version. Variables runtime revisión 1, sin cambios.

Audiencia posterior confirmada: solo propietario, política revisión 3; un owner, cero editores/grupos/visitantes. No se han cambiado permisos. Este cierre documental es posterior al código publicado; no exige volver a desplegar un Worker idéntico. Objetivo completo; pendientes de cobertura son datos ausentes reales, no errores resueltos con ceros.
