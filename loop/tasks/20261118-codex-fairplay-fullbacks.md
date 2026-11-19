# 20261118-codex · Juego limpio y laterales equilibrados

- Estado: `active`
- Responsable: Codex
- Revisor: autocontrol; sin revisión independiente
- Rama: `feat/fair-play-and-balanced-fullbacks`
- Base Sites: `9f4cc47edcbdc428ce5cd1f0da07de7e2d235d07`
- Base GitHub: `3104b7fc463d6aa5c42d3257235d7210c22a3f9a`
- PR: pendiente
- Objetivo: añadir juego limpio moderado y un score mixto de lateral, integrar y publicar privado

## Petición y evidencia

El propietario pide penalizar amarillas y, más, rojas, y un único score de lateral con ataque y defensa. Grimaldo figura como Álex/Alejandro Grimaldo, ID Understat 11866 / FotMob 288406, Atlético Madrid en las tres capturas; DEF con LWB/LB/LM publicados, 4 goles, xG 2,906666, xA 1,790763, 850 min y score 0,107447. No se cambia su club, posición o datos para subir el score.

Hay 1.871 fichas con amarillas y rojas de muestra emparejada, 987 de las 995 con score. Los ocho casos restantes no se completan con ceros. No hay cambios previos locales; origen Sites y main GitHub comprobados. Acceso owner-only revisión 3; no cambiar audiencia ni contraseña.

## Diseño

1. Score de lateral/carrilero para DEF con puesto FB publicado, incluidos polivalentes: entradas, intercepciones, recuperaciones, goles, xG y xA por 90, con referencia fija de laterales verificados de las ligas cargadas. Un mismo score en cualquier ranking. No separar ofensivos/defensivos ni inferir minutos por puesto.
2. Ajuste opcional transparente sobre el score del radar: intensidad = (amarillas + 4 × rojas) × 90 / minutos propios emparejados; factor = 1 − 0,10 × intensidad / (1 + intensidad). Sin tarjetas publicadas, sin factor ni penalización inventados: conservar base y señalar «sin ajuste». Los ceros reales sí acreditan ausencia de descuento. No usar los minutos de otro proveedor ni aplicar muestras insuficientes.
3. Mantener índices MED sin ajuste para clasificar acciones; aplicar juego limpio una sola vez al score canónico. Mostrar área base y ajuste separado; equipos usan el resultado final ponderado por minutos.

## Aceptación

- [x] Laterales tienen un radar mixto, basado en puestos publicados, estable entre ligas/vistas y sin elegir el score más alto.
- [x] Más tarjetas nunca mejoran el score, rojas pesan más, ajuste acotado y nulos/muestras tratados explícitamente.
- [x] Base, ajuste, score final y procedencia visibles y coherentes en tabla/ficha/comparador/equipos.
- [ ] Verificar los 2.284 registros, casos reales, referencias, ceros/muestras y derivados; integrar y publicar conservando privacidad.

## Validación y entrega

- 19 archivos Node y 7 tests Python correctos; cinco nuevas regresiones de disciplina/roles y una de cero tiros/diferencias. Se prueban monotonía, roja = 4 amarillas, límite 10%, minutos propios, muestras incompatibles/insuficientes, nulos, cero real, score único, referencia de laterales, polivalentes, reapertura sin doble descuento y HTML base/factor/final.
- `audit_scores.cjs`: 2.284 igualdades entre ámbitos/perfiles, 1.009 ajustes comprobados, 714 medias y 2.558 contribuciones exactas. Recuperación de posiciones al cargar/actualizar conserva scores/referencias. La pérdida de posiciones sin recuperación es una simulación, no sesiones reales del usuario.
- `audit_metrics.cjs`: 82 medidas y 390.320 lecturas total/90 correctas. Cinco combinados regenerados con 2.284 playerScore/playerBaseScore/factores iguales al modelo. Se conservan hashes de las once capturas y sus fechas. Sintaxis, documentación, diff y build correctos.
- Grimaldo: base/final 0,448704, factor 1 por cero tarjetas verificadas; seis ejes mixtos, mismo score en cualquier ranking. 215 laterales tienen score completo; centrales sin puesto FB conservan sus ejes. Los polivalentes usan el mismo perfil mixto en ambos rankings.
- Se detectaron dos pérdidas provisionales de score (Danilo Veiga y Timo Becker) por xG ausente con cero tiros y cero goles explícitos en sus fichas. Se añade derivación genérica de suma vacía solo para pruebas FotMob verificadas/emparejadas; conserva originales, fuente, muestra y etiqueta `zero_shot_xg`. Hay 86 ceros así derivados. Se corrige además el metadato de los derivados para no heredar la tasa /90 de un componente; regresión del delta por 90 comprobada. No se imputan ausencias sin prueba.
- 1.017 scores válidos (995 antes), 29 pendientes sobre el mínimo; 22 recuperados y ninguno perdido. Disciplina verificada en 1.009 y ocho sin ajuste explícito; 698 tienen descuento positivo. Los índices MED no cambian su clasificación por tarjetas. No cambia ninguna posición.
- Modo Sites managed sin herramienta `cua_repl.js`: siguiendo la skill, no se inicia otro navegador/servidor ni se improvisa control alternativo. No se afirma nueva revisión visual; componentes reales y módulos/orden/contenido del Worker verificados por Node. `validate_data.py` no puede leer la captura histórica StatsBomb ausente, sin cambios en ese importador.
- El helper Sites no está instalado en la imagen: apertura Git ordinaria de origin/main comprobada antes de editar, con credencial efímera por stdin y sin persistir tokens. Audiencia owner-only revisión 3. Sin cambios de permisos, contraseña o configuración.

## Jugadores y partidos

0 jugadores nuevos, 0 cifras fuente sustituidas y 0 partidos modificados; ninguna consulta a proveedores. Se modifican **749 scores derivados**: LaLiga 174, Premier 159, Serie A 142, Bundesliga 131, Ligue 1 143. Se recuperan 22 (3/5/6/3/5 por liga) y ninguno se pierde. Se recalculan los 96 promedios generales de equipo; cinco combinados y Worker regenerados. 86 xG cero tienen prueba explícita de cero tiros/goles; los originales y SQLite fuente permanecen intactos. Listado completo entregado fuera de Git, sin subir datos ni bases.

## Integración

Pendientes commit/push, PR, merge y despliegue privado. Autocontrol sin revisión independiente; registrar sus resultados cuando estén confirmados.
