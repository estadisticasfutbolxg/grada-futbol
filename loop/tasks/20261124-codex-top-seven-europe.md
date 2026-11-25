# 20261124-codex-top-seven-europe · Siete ligas y selecciones

- Estado: `active`
- Responsable: Codex
- Revisor: autocontrol; sin revisión independiente
- Rama: `feat/top-seven-european-scope`
- Base Sites: `0c861e56374543b0cca27e6f117109b338352015`, sincronizada
- Base GitHub: `0d7f8414f9e4828b8ecc090f6b8f4062e5666490`, comprobada
- PR y publicación privada: pendientes

## Objetivo

Añadir selección múltiple de ligas de primera división, con accesos Todas y «7 principales ligas europeas»: LaLiga, Premier League, Serie A, Bundesliga, Ligue 1, Liga Portugal y Eredivisie, solo sus primeras divisiones. Selecciones admite únicamente jugadores de esas ligas, manteniendo países deportivos de todo el mundo, posiciones verificadas y la media simple del once.

## Criterios

- [x] Selector de varias ligas y acceso adicional junto a Todas y las primeras divisiones individuales; tablas, filtros, comparación, fechas, enlaces y refresco respetan sus siete miembros y la cobertura parcial.
- [x] Selecciones filtra antes de deduplicar/elegir candidatos, también al entrar desde otra liga y mediante enlace directo; sin candidatos externos si faltan capturas europeas.
- [x] Un score canónico con referencia de todas las ligas cargadas; sin cambiar estadísticas, mínimos, disciplina, medias o fórmulas.
- [x] Pruebas significativas, auditoría de capturas intactas y verificación de navegación/privacidad.
- [ ] Código en GitHub, PR integrado y publicación privada confirmada; sin capturas, bases o secretos en GitHub.

- [x] Retirar las siete divisiones inferiores del catálogo, capturas, SQLite y cachés; regenerar scores contra las quince primeras divisiones sin consultas a proveedores.

## Plan y coordinación

1. Centralizar el grupo y su agregado; conectar selector, navegación, actualización y presentación.
2. Limitar los candidatos de selecciones, conservando sus scores y la formación coherente.
3. Validar con capturas reales, revisar, integrar y publicar; registrar evidencia.

Archivos compartidos: leagues/scopes, app, nations, fechas, branding/seguridad y documentación. No hay otra tarea activa sobre ellos. Ampliación explícita del usuario el 25 de noviembre: borrar ligas que no sean primera división de la app y las bases. Capturas actuales de primeras divisiones reutilizadas; no se consultan proveedores ni se modifican cifras para cambiar estos ámbitos. Evidencia local en `/workspace/scratch/grada-top7/`.

## Resultado y relevo

Implementación completa y validada; subida, integración y publicación en curso con autorización vigente. No hay cambios ajenos en la rama. Sin nuevos datos o consultas a proveedores.

- Catálogo con quince `division: 1` y ESPN `.1`. Se excluyen las siete divisiones inferiores de UI, ámbitos, referencias, actualización y Worker. Casillas multi-liga, búsqueda por país/liga y accesos Todas/siete europeas, sin Ctrl. Capturas parciales y selección vacía explícitas; refresco solo de miembros disponibles. Selecciones fuerza siete europeas antes de deduplicar y comprobar países, preservando países mundiales y score canónico.
- Borrado aplicado y comprobado: 28 archivos activos de fuentes/combinados/SQLite, catorce directorios de cachés y 150 escudos, más las copias retiradas de staging, incluidos siete SQLite. Inventario del workspace sin SQLite canónicos de las ligas retiradas. Limpieza de IndexedDB, ESPN legacy e historial de consultas; no se afectan ajustes ajenos ni archivos de primeras divisiones. API 400 y capturas 404 incluso con cachés antiguas. Versiones históricas de Sites conservadas.
- Retiradas 3.722 fichas, 150 clubes y 1.060 partidos de cobertura agregada; no son encuentros nuevos descargados. Quedan 6.044 fichas/248 clubes/1.346 partidos cubiertos por fuente. Las treinta fuentes JSON, quince SQLite y el archivo Understat conservan hash. Se regeneran quince combinados con referencia común; 3.939 scores cambian y 38 perfiles MED, sin cambios de posiciones ni pérdidas/nuevos scores. Estadísticas, nacionalidades y fechas intactas. Cero consultas nuevas a proveedores.
- Siete europeas: 3.197 fichas/132 clubes; países verificados 3.001, 112 países y veinte onces completos, sin duplicados o conflictos. Referencia de score completa de quince primeras divisiones en cualquier filtro; clubes ponderan minutos, selecciones media simple.

| Comprobación | Resultado | Límite |
| --- | --- | --- |
| Node `node --test tests/*.test.cjs` | 32 archivos correctos | Datos aislados no publicados |
| Python `unittest discover` | 16 casos correctos | Dos nuevos para borrado acotado |
| Capturas y modelo reales | 46 hashes, 10.643 equivalencias de scores, 3.488 medias | Sin consultas a proveedores |
| Worker exacto en VM/DOM | Cinco arranques correctos; quince ligas, todas las vistas, grupos, filtros, paginación y fallos | Sin QA visual de navegador disponible |
| Sintaxis, `check_collaboration_docs.py`, `git diff --check` | Correctos | Historial StatsBomb: falta `dist/downloads/statsbomb.json`, ajeno al conjunto activo |
| Privacidad previa | Owner-only custom revisión 3; owner 1, editores/grupos/visitantes 0 | Se conserva audiencia y runtime; no contraseña nueva |

Worker `4c665c9bb85026fbb4be75fd8c17b71e312054f438541183fda3c7cb6edf813d`, 328 assets/12 módulos, bundle gzip 86.569 bytes. SQLite 82.546.688 bytes / 8.187.445 gzip; treinta JSON 51.700.916 bytes / 3.118.917 gzip. Evidencia privada: `audit.json`, `score-changes.json`, `pruned-active.json`, `pruned-staging.json`, `runtime.json` y logs bajo `/workspace/scratch/grada-top7/`. No se suben estos datos a GitHub.

Autocontrol: corregidos el resumen de referencia global y la limpieza de filtros al cambiar miembros de una selección personalizada; sin hallazgos funcionales pendientes. No equivale a aprobación del colaborador.
