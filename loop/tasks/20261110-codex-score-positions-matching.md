# 20261110 · Scores completos, posiciones y cruce genérico

- Estado: `active`
- Responsable: Codex, a petición del usuario
- Revisor: autocontrol; sin revisión independiente
- Rama: `fix/score-positions-matching`
- Base GitHub: `33c1cdeab73494bff52b8d5ad8e83e1664c566e5`
- Base Sites: `84891da4107e3cbc90102f98b27cf8b1176703c6`
- Entrega: PR, merge y publicación

## Objetivo

Revisar todos los jugadores con minutos suficientes y score pendiente. Los ceros publicados deben contar como valores válidos, conservando la distinción con null. Revisar posiciones por evidencias de los proveedores e implementar cruce genérico de nombres con club, compatibilidad y unicidad; no completar ausencias inventando cero. Mantener un único score por posición y promedios coherentes de equipo.

## Alcance y coordinación

Combinación/identidades/posiciones, lectores y cálculo si la auditoría encuentra un defecto, explicaciones de score pendiente, pruebas y documentación. No hay cambios previos ni tareas activas solapadas. Aplicadas grada-loop, grada-data, grada-review y Sites; autorizaciones vigentes de Git/merge/publicación, audiencia pública conservada. El usuario solicita mantener las capturas actuales mientras gestiona permisos: se reutilizan las once capturas JSON del Site v16, sin consultas nuevas a proveedores. Entorno reabierto; fuente restaurada desde el repositorio nativo con credencial efímera por stdin. Las capturas, bases y secretos permanecen fuera de GitHub.

## Auditoría inicial

2.284 registros; 967 scores válidos. 79 jugadores con los minutos mínimos (450 campo/180 porteros) siguen sin score: 76 por métricas faltantes y 3 por muestra de un eje de otro proveedor insuficiente. Existen 281 discrepancias de posición entre proveedores, no equivalentes todas a errores. Vinícius (Understat 7008, ESPN 86:252107, FotMob 846033) está bien unido, pero MED por Understat frente a DEL de ambas fuentes restantes; como MED falta intercepciones, con 592 minutos principales y 585 de FotMob.

## Plan y aceptación

1. Auditar minutos propios, ceros, ausencias, posiciones y cruces; registrar criterios verificables.
2. Resolver variantes genéricas inequívocas y posiciones con evidencia y procedencia, conservando conflictos dudosos.
3. Probar ceros/duplicados/roles/coberturas y coherencia entre vistas; regenerar derivados con originales intactos.
4. Subir incrementos, integrar y publicar; comunicar jugadores/partidos afectados y pendientes reales.

- [ ] Ceros publicados producen score válido cuando la muestra y los ejes son suficientes; null sigue desconocido.
- [ ] Posiciones revisadas de forma general, con evidencia y procedencia; Vinícius calculado con el perfil adecuado.
- [ ] Nombres compuestos, acentos e iniciales se unen solo con candidatos únicos en el mismo club y sin reutilizar una ficha.
- [ ] Datos originales intactos; referencias y equipos usan los mismos scores por posición.
- [ ] Pruebas, GitHub y publicación confirmados; recuento final y límites documentados.

## Incremento 1 · unión y posiciones

Implementados módulos puros identity/positions, cruce mutual único de tokens/iniciales/contracciones/alias publicados, barrera de IDs revisados y clasificación por consenso o ficha, independiente de los valores. Los nuevos importadores conservan posiciones Understat completas, alias ESPN y evidencia de posición/nombres FotMob. Añadida serialización JSON de posiciones en SQLite. Corregido el lector de posiciones Understat del Worker para compartir el parser (su regex anterior conservaba la cadena mixta entera).

La auditoría con originales intactos pasa de 967 a 994 scores: 27 recuperados; quedan 52 registros por encima del mínimo, 49 por ejes ausentes y 3 por minutos insuficientes en un proveedor de eje. Vinícius DEL ya tiene score (aprox. 0,396 con la referencia provisional actual). LaLiga une 481/487 filas; otras ligas mejoran sus enlaces ESPN. Se revisan las parejas genéricas recuperadas; no se permiten homónimos ni uniones por apellido con nombres completos incompatibles. Reglas especiales solo a nivel de diminutivos/transliteración general, sin nuevas excepciones de jugador.

Trece archivos Node pasan, incluidas pruebas de score cero, aportación ponderada cero, nulos, alias, acentos, orden asiático, iniciales, colisiones, permutación de plantillas, clubes/roles, posición y conservación de ceros de ficha. Pruebas Python y de SQLite verifican posiciones estructuradas y ceros. La primera prueba de claves señaló que keeper_long debía normalizarse a keeperlong: corregido y repetido. El validador histórico StatsBomb no puede ejecutarse en este entorno restaurado porque no contiene statsbomb.json/SQLite históricos; no se han cambiado sus importadores ni datos, ni se descargan partidas nuevas para un chequeo ajeno. Se validan las once capturas actuales con sus lectores originales y sus SHA256. Pendientes explicación de posición/muestras en UI, auditoría final, navegador y publicación.
