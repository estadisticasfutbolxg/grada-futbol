# 20261122-codex · Selecciones con sistemas coherentes y escudos

- Estado: `review`
- Responsable: Codex
- Revisor: autocontrol, sin revisión independiente solicitada
- Rama: `feat/balanced-national-lineups`
- Base Sites: `dba8fd8fed2458fbf717727c5d2dfa7dc04d2d87`
- Base GitHub: `050bc1eb841900cc385ec79dd6b530dfac9deef4`
- PR: no creado
- Entrega: merge y publicación privada, autorización vigente

## Objetivo y alcance

Escudo del club de cada titular en el campo. Sustituir el 4-4-2 fijo por selección automática entre sistemas coherentes, con contención y creación, bandas verificadas y delantero centro publicado. Preservar país, IDs, muestras, mínimo de 200 minutos, score canónico, ponderación por minutos y audiencia privada.

Archivos compartidos: nuevo modelo puro de formaciones, `dist/nations.js`, app/HTML/CSS/empaquetador, tests y contratos. No hay otra tarea activa sobre ellos. Fuera de alcance: fórmulas individuales, nuevas consultas o cifras de proveedores, permisos y actualización de partidos.

## Aceptación

- [x] Escudo por ID de club verificado en cada tarjeta; fallback sin asignar uno ficticio.
- [x] Siete sistemas, asignación única con puestos compatibles, contención y creación obligatorias, delantero centro y bandas/carriles coherentes.
- [x] Jugadores por mayor suma de scores y elección entre los siete onces por el mismo score ponderado publicado, sin cambiar scores individuales; incompletos sin score global.
- [x] Campo refleja sistema elegido y muestra puestos, evidencia y alternativas sin mezclar perfil estadístico con posición publicada.
- [ ] Casos límite, equivalencia de datos/scores, empaquetado, PR/merge y publicación privada comprobados.

## Plan y evidencia

1. Roles/plantillas y asignación óptima del once; reutilizar escudos locales.
2. Campo dinámico, desglose de encaje y explicación.
3. Pruebas y comparación con capturas/scores anteriores, integración y publicación.

La base está limpia y sincronizada con el repositorio nativo. GitHub main verificado por conector. Modelo anterior: todos los DEL intercambiables; España incluía a un extremo RW como segundo delantero sin exigir ST. Los MED no tenían función de contención/creación. Se cambia únicamente el once propuesto; la posición y el score de cada jugador permanecen iguales.

## Resultado y autocontrol

- Modelo `national_xi_balanced_minutes_v2`. Siete sistemas; asignación bipartita húngara para maximizar suma de scores en cada uno, con prioridad a cubrir los puestos compatibles. Reasignación de las mismas personas por afinidad de funciones, sin modificar scores/minutos. Se elige el mayor promedio ponderado entre esos siete onces completos; un score cero sigue siendo válido.
- Un delantero centro exige DEL/ST. Contención exige MED/CDM o CM con perfil defensivo; creación y apoyos exigen CAM/CM y perfiles compatibles según el puesto. Bandas y carriles respetan el lado publicado. Los encajes por perfil se identifican como teóricos y el detalle separa puesto propuesto del perfil canónico del score.
- Campo con filas del sistema elegido y escudo local por ID de club en las once tarjetas; nombre del club accesible y desglose. Fallback existente para club no asignado o imagen ausente. Ranking y las dos tablas de detalle mantienen score primero, con evidencia y siete alternativas.
- Cobertura: 2.134 fichas con país, 104 países y **17 onces completos**. Se añade Noruega a los completos, ninguno de los 16 anteriores se pierde. Sistemas elegidos: cinco 4-3-3, seis 4-2-3-1, dos 4-2-2-2, uno 4-4-2 y tres 3-4-2-1. Los siete sistemas tienen casos completos verificados en fixtures aisladas. España usa 4-3-3, Rodri en contención y Dani Olmo como interior creativo; Francia, 4-2-3-1.
- **0 jugadores, estadísticas, nacionalidades o partidos actualizados**; cero consultas a proveedores. Capturas, SQLite y combinados sin regenerar. No cambia ninguna fórmula individual ni de club. Las propuestas y algunos scores de selecciones sí cambian al corregir sus integrantes.

## Validación real

- 27 archivos Node y 10 tests Python correctos. Seis casos nuevos de formaciones y cuatro adaptados de selecciones: siete sistemas alcanzables, bandas/striker/contención, versatilidad sin duplicados, mínimo 200, score cero y ausencias, identidad entre ligas, HTML seguro y fallback de escudos. El emparejamiento concuerda con búsqueda exhaustiva independiente en 30 grupos de defensas. El portero de mayor score se mantiene aunque otro de menor score/pocos minutos inflara la media.
- Once capturas por SHA256 y 2.284 scores/perfiles iguales a la base. Auditoría real: 3.431 encajes, 108 medias de onces completos alternativos, 416 bloques y 17 elecciones entre sistemas; 187 escudos de titulares con archivo local verificado. Modelo sin mutar datos. El cálculo en esta ejecución fue de 131 ms, sin red ni navegador; se conserva caché por modelo.
- Worker: 145 assets/12 módulos; un bundle gzip de 77.899 bytes. SHA256 `37ae09447ebdef2eaa57bd16a6cb85a0c5c5de70de0506c44745979d4f19c53b`. 108 assets exactos y seis arranques del bundle en VM/DOM dobles (normal, publicados, liga solicitada, liga fallida, caché más reciente y selección por enlace). Vista Francia/España, once escudos, clic a ficha y nacionalidad comprobados con el controlador real. No equivale a QA visual de navegador; no hay `cua_repl.js` disponible en este entorno managed.
- Sintaxis, compilación del empaquetador, enlaces y diff correctos. `validate_data.py` sigue sin la captura histórica `dist/downloads/statsbomb.json`, ajena a estas ligas; las comprobaciones actuales pasan y no se inventa ni descarga para superar ese check.
- Autocontrol sin hallazgos funcionales pendientes; no representa aprobación de otra persona. Evidencia local: `/workspace/scratch/grada-national-formations/audit.json`, `runtime.json`, `node-tests.log`, `python-tests.log`; fuera de GitHub. Datos, bases, imágenes generadas, Worker y secretos no se suben a GitHub.

## Integración y publicación

Pendientes: subida, PR, merge y despliegue privado. Conservar audiencia owner-only revisión 3 y actualización sin contraseña adicional.
