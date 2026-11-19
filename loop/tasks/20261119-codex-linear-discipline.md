# 20261119-codex · Disciplina lineal con mayor peso de las expulsiones

- Estado: `done`
- Responsable: Codex
- Revisor: autocontrol; sin revisión independiente
- Rama: `fix/linear-discipline-score`
- Base Sites: `8bc27bcba6e630ecf676853a75e5c1742812b76b`
- Base GitHub: `c5811eeceb9645c45d701d760c8504285deb78d3`
- PR: [#43 integrado](https://github.com/estadisticasfutbolxg/grada-futbol/pull/43)
- Objetivo: sustituir la penalización indulgente, validar efectos y publicar owner-private

## Alcance y decisión

El propietario solicita dar más importancia a la inferioridad causada por una expulsión y al riesgo de sanción por amarillas. Reemplazar la curva saturada bajo el 10% por un descuento lineal sobre la base: `0,10 × amarillas/90 + 1,00 × rojas/90`, factor mínimo 0. Una roja pesa diez amarillas en este modelo. Cada tarjeta adicional conserva su penalización marginal hasta agotar el score. Ejemplo aislado 5 A, 1 R, 900 min: 15%, base 0,8 → 0,68.

No hay registros verificados de sanciones cumplidas, ciclos de amarillas ni minuto/contexto de cada expulsión en las capturas agregadas actuales. Las amarillas/rojas sirven de indicador disciplinario y de riesgo de indisponibilidad; no inferir una sanción cada cinco amarillas ni partidos/minutos perdidos, y no inventar tarjetas o estimar el perjuicio causal. Parámetros manuales declarados, sin calibración causal.

Se conservan mínimo de muestra, denominadores emparejados, posiciones, perfiles MED, ejes/referencias y score base. Actualizar modelo/diagnóstico, UI/glosario, contrato, pruebas y auditoría; regenerar cinco combinados y Worker desde las once capturas intactas. Sin nuevas descargas, bases, credenciales en disco o cambios de acceso. Archivos compartidos: fairplay.js, scores.js, components.js, app.js, explore.js, pruebas/auditoría y documentación.

## Aceptación

- [x] Descuento lineal, roja más grave y sin saturación artificial al 10%; score final en [0,base], ceros y desconocidos correctos.
- [x] Mismos scores en tablas, fichas, comparadores, rankings y promedios de equipo; base, perfiles, posiciones y referencias intactos.
- [x] Explicación de fórmula, pesos manuales y límites de expulsiones/sanciones coherente en la web y documentación.
- [x] Pruebas, auditorías, combinados y Worker coherentes; cambios de scores y fuente conservada cuantificados.
- [x] GitHub integrado y Sites publicado con acceso exclusivo del propietario.

## Plan

1. Capturar base y contrastar sensibilidad; implementar regla y diagnóstico.
2. Actualizar contratos/consumidores, validar casos y datos reales, regenerar derivados.
3. Autocontrol, integración y despliegue; registrar recuentos, procedencia y límites.

## Evidencia y entrega

Árbol inicial limpio; remoto Sites sincronizado, main GitHub y política owner-only revisión 3 comprobados. Sensibilidad sobre 1.009 scores ajustables: roja peso 10 da mediana 1,44%, mediana con roja 15,18% (42 jugadores) y máximo 37,36%; ningún factor llega a cero. Alternativas 8/12 cambian especialmente las expulsiones. Selección manual por severidad e interpretación, sin afirmar optimización estadística. Modo managed sin cua_repl: no iniciar navegador alternativo; validar lógica/controladores/HTML y registrar límite visual.


## Validación del incremento

- Modelo `role_fairplay_radar_v5`, ajuste `linear_cards_v2`. Casos de 5 A + 1 R / 900 min = 15%, roja = diez amarillas, marginal constante, suelo 0, escalado por minutos, cero/ausentes/muestras incompatibles y datos derivados v4 descartados. No se aplica el descuento dos veces; MED no cambia clasificación.
- 21 archivos Node correctos, incluidos siete casos de disciplina/laterales y pruebas de controladores/HTML. Sintaxis de los módulos y diff correctos; documentación y enlaces comprobados. El validador histórico StatsBomb sigue sin `dist/downloads/statsbomb.json`; no valida las capturas actuales ni se modifica su fuente.
- Auditoría de score: 2.284 posiciones/perfiles y equivalencias entre ámbitos, 1.009 ajustes, 714 promedios y 2.558 contribuciones. Recuperación al cargar/actualizar conserva todos los scores y posiciones. Auditoría de 82 medidas: 390.320 lecturas correctas. Pruebas reales de 84 tablas en seis ámbitos, 4.568 igualdades y 1.344 medias de líneas.
- Antes/después: **698 scores bajan** (LaLiga 164, Premier 152, Serie A 129, Bundesliga 122, Ligue 1 131) y los 96 promedios generales de equipo cambian. Ningún score se pierde/recupera ni llega a cero por el nuevo ajuste. Siguen 1.017 válidos, 29 pendientes sobre el mínimo y ocho scores sin tarjetas emparejadas suficientes. Bases, ejes/percentiles, perfiles y posiciones de los 2.284 registros idénticos.
- Once capturas fuente conservan hashes, fechas y cifras. **0 jugadores nuevos, 0 estadísticas de origen actualizadas y 0 partidos modificados**. Los 698 cambios son puntuaciones derivadas de un nuevo criterio. No se contacta a proveedores ni se regeneran SQLite fuente.
- Cinco combinados regenerados por el generador en un directorio temporal, verificados contra el modelo (2.284 scores/base/factores y 96 medias), promovidos solo después de validar el conjunto. El entorno impide child_process.execFileSync desde Node; se ejecuta el mismo generador desde bash, sin cambiar permisos ni editar cifras a mano.
- Worker: 37 assets, 11 módulos, SHA256 `4bffc21fae1e5e913aeb4f06bd889586f3e87fb1cbf920ce9136bc6205aa506a`. GET de módulo/app/CSS exactos, HTML con hashes de caché normalizados, orden de módulos y HEAD correctos. Modo managed sin cua_repl: sin nueva navegación visual ni producción autenticada; sí componentes/controladores y HTML real generado.
- Fuente Sites `e8e21644aa4b27d78343a0230b8b06c8b0441127` subida y verificada. [PR #43](https://github.com/estadisticasfutbolxg/grada-futbol/pull/43), 15 archivos, integrado por squash en main `a96bda6f4ab63ddb4af9b22c4b942f63124b9639`, comprobado. Head/base exactos y mergeable clean, sin checks/statuses configurados; main sin protección ni rulesets, sin modificarlos.
- Publicación privada confirmada: versión **24**, despliegue `appgdep_6afe970995ac8191b8df112498ff80b0` en `succeeded`, revisión de entorno 1. Versión `appgprj_6ae0b8b2eb1881918601230d00603255~appgver_f13001de6a4c8191a96cca4bdee4c6b1`, fuente exacta `e8e21644aa4b27d78343a0230b8b06c8b0441127`. Worker SHA256 arriba; también fairplay.js, scores.js y components.js exactos al servir el artefacto.
- Lectura posterior: [GRADA privada](https://grada-futbol-analitica.ivanmatema2.chatgpt.site) owner-only revisión **3**, un owner, cero editores, grupos y visitantes. Fuente/versión confirmadas por get_site_version. Sin cambios de acceso, contraseña, bindings o red. Autocontrol, sin revisión independiente.
- Se cierra documentación con un incremento posterior sin redesplegar assets idénticos. No se afirma una nueva revisión visual o navegación de producción autenticada.
