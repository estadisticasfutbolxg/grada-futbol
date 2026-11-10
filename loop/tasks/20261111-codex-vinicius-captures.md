# 20261111-codex · Conservar la posición al recuperar capturas

- Estado: `active`
- Responsable: Codex
- Revisor: autocontrol; sin revisión independiente
- Rama: `fix/vinicius-capture-fallback`
- Base Sites: `6e51097ce09513f615faa8ec5f1d5061b3e444e1`
- Base GitHub: `5cf19096a182b8651557e1dd18b1188294a249f8`
- Issue: no creado
- PR: pendiente
- Objetivo de entrega: merge y publicación autorizados por el usuario

## Objetivo

El usuario sigue sin ver el score de Vinícius. Comprobar la posición que recibe y evitar que una captura agregada más reciente descarte posiciones y campos verificados de las fichas conservadas. Ofrecer un enlace reproducible a las capturas publicadas sin borrar datos guardados.

## Alcance y coordinación

- Cliente de carga/selección de capturas, recuperación de fichas FotMob y respuesta pública del Worker; pruebas de regresión y documentación.
- Las tareas históricas abiertas de bootstrap/FBref no afectan a este contrato. No hay cambios locales previos.
- Fuera de alcance: cambiar fórmulas, asignar una posición según los ejes disponibles, imputar ausencias, volver a descargar estadísticas, alterar permisos o autenticación.

## Aceptación

- [x] Reproducir MED y score pendiente al cargar un agregado FotMob sin posición.
- [x] Conservar posición/campos verificados solo para el mismo ID, club, liga y temporada; mantener ceros, muestras y fechas reales.
- [x] Comprobar en navegador score DEL en tabla, ficha y comparador con caché incompleta, además de una captura publicada reproducible.
- [x] Mantener las rutas de actualización protegidas y la lectura pública sin consultas a proveedores.
- [ ] Subir, integrar y publicar; registrar pruebas y límites sin atribuir al navegador del usuario un estado no observado.

## Iteración actual

1. Comparar las tres capturas publicadas y reproducir la selección de una captura incompleta más nueva.
2. Recuperar evidencia conservada al cargar fuentes y servir capturas; añadir navegación reproducible.
3. Validar campos/procedencia, navegador, integración y publicación.

### Evidencia

- Las tres capturas LaLiga de producción coinciden por bytes con las embebidas en v17. Understat identifica Vinícius (7008) como MED; ESPN (252107) y FotMob (846033), DEL. Cruce de identidad correcto.
- Reproducción Node: al sustituir las posiciones de campo FotMob por desconocidas en una copia aislada de pruebas, la combinación vuelve a MED y queda sin score por intercepciones. La captura original produce DEL y los seis ejes completos. No se modifica ningún JSON del producto.
- No se puede inspeccionar el IndexedDB privado del usuario; se ha solicitado opcionalmente la posición/motivo que ve. La causa de su sesión no se considera confirmada.
- `node --test tests/*.test.cjs`: quince archivos correctos. Cinco regresiones nuevas cubren posición desconocida, ceros y fecha propia de ficha, identidad/club/temporada/portería, derivados con muestras distintas y servidor público sin llamadas externas. Se mantienen los tests de acceso del propietario.
- Chromium sobre el Worker: captura limpia, IndexedDB con agregado más reciente sin posiciones y dos ejes de Vinícius ausentes, y copia guardada MED omitida solo en modo publicado. En los tres casos, DEL y score `0,39783869839981034` (visible `0,398`) en tabla, ficha, comparador y Todas. Las copias guardadas permanecen idénticas. Enlace desde Todas conserva ID/liga; móvil 390 px sin desbordamiento y portada sin selector de unidades. Sin errores JS.
- Auditoría de las capturas originales: 2.284 registros, 994 scores válidos y 52 pendientes sobre el mínimo general, igual que v17. Las once capturas de proveedores conservan hashes, fechas y cifras. No cambian fórmula, referencias ni datos de las fuentes.

### Revisión y entrega

Autocontrol: la posición se conserva por identidad y procedencia, nunca por el score que genera. Un agregado reciente con posición conocida no se sustituye por una posición antigua; un perfil verificado posterior sí conserva su evidencia. No se consideran resueltos los 52 pendientes por ejes/muestras realmente ausentes.

Integración/publicación pendientes. Sin estadísticas nuevas descargadas: **0 jugadores y 0 partidos**. Se reutilizan capturas reales existentes y no se publican fixtures, bases ni credenciales. No hay cambios en la audiencia ni en la autenticación.
