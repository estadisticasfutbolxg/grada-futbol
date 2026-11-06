# 20261101 · Porteros, ayuda de columnas y LaLiga 2026/27

- Estado: `active`
- Responsable: Codex, a petición de Ivan
- Revisor: colaborador por asignar; autocontrol de Codex
- Rama: `feat/keepers-help-live-laliga`
- Base Sites: `8f440ac4ac0675472d38f106c52c1048a6f72fee`
- Base GitHub: `e4c19afeba176a1c710d1823df0eb4f1c9759f41`
- Issue: no creado
- PR: pendiente
- Objetivo de entrega: código en PR y edición publicada en Sites, pública por petición posterior

## Objetivo

Mostrar xG y goles encajados por 90 minutos de porteros, explicar columnas al pasar el cursor o enfocarlas, y actualizar LaLiga 2026/27 desde una fuente pública real. El usuario primero canceló compartir con otra persona; después pidió expresamente publicar el Site para cualquiera con el enlace.

## Alcance y coordinación

Interfaz en `dist/`, adaptador y generador de ESPN, pruebas de métricas/actualización y documentación. La importación histórica de StatsBomb no cambia. No hay otra tarea activa sobre estos archivos. El trabajo FBref anterior conserva su captura independiente de 2025/26.

## Aceptación

- [ ] Porteros con xG recibidos/90 y goles encajados/90; sin doble normalización y con nulos correctos.
- [ ] Ayuda de todas las columnas por cursor y teclado, sin cortar el texto al desplazar la tabla.
- [ ] Actualización real de LaLiga 2026/27, procedencia, fecha, cobertura y error que conserva la última captura válida.
- [ ] Filtros, comparación, ficha y CSV coherentes con fuente y unidad.
- [ ] Validación, código subido y publicación confirmada con acceso público solicitado.

## Iteración actual

1. Validar los campos reales de ESPN y conservar métricas ausentes como null.
2. Implementar tasas, ayudas y actualización con caché local.
3. Comprobar datos, comportamiento y publicar la edición privada.

### Evidencia

ESPN: clasificación de 20 equipos y plantillas con estadísticas, temporada declarada 2026-27, respuestas públicas CORS. No ofrece xG ni minutos en estos endpoints. FBref bloquea este entorno; no se elude ese bloqueo.

### Revisión

Pendiente de autocontrol funcional; no equivale a aprobación del colaborador.

### Resultado y relevo

Pendiente de implementación y publicación.

## Incremento 1 · 1 de noviembre

Implementados tasas, ayudas y actualización ESPN. Checks: sintaxis JS, 7 casos de métricas/proveedor en dos archivos de Node, `validate_data.py` y `check_collaboration_docs.py` correctos. Captura real: 20 equipos, 627 registros de jugadores y 104/380 partidos. La revisión de navegador requiere habilitar sockets del proceso Chromium; pendiente. El usuario pide además descargar Understat y guardar cada incremento en GitHub. La skill del loop recoge esa preferencia.

## Integración del incremento 1

PR [#2](https://github.com/estadisticasfutbolxg/grada-futbol/pull/2) fusionado por squash con autorización explícita del usuario: `831f1e338641fe75c47c84272d97d9ac0df734a3`. SHA del incremento en rama comprobado: `fe418cf9f9f80c03fd2bd02517243b1991175857`. Chromium pasó tasas, tooltips cursor/teclado/Escape, orden, CSV, ficha, comparación, vacío y conservación ante fallo de red; vista móvil 390 px sin desbordamiento. Sites ya tiene acceso público confirmado (revisión 2). Se prepara el despliegue del código. El usuario pide integrar y publicar cada incremento comprobado.

## Incremento Understat y seguridad · 5 de noviembre

Se retoman los cambios locales previos sin perderlos. Rama prevista `feat/understat-xg-security`, base GitHub comprobada `831f1e338641fe75c47c84272d97d9ac0df734a3`. La captura real anterior, del 1 de noviembre, contiene 105 partidos, 20 equipos y 487 jugadores; regenerada y validada conservando su fecha. Se intenta actualizar desde el origen sin sustituir datos válidos ante error.

Se añade el scraper Python, SQLite/JSON, integración de la captura en la web, CSP, escape HTML, enlaces fijos y protección de fórmulas CSV. La actualización de Understat en la web recarga la captura publicada; no es un backend Python. No hay cifras de paradas ni xG recibidos de porteros en esta descarga de liga. PR y despliegue pendientes de confirmar.

### Verificación del incremento · 6 de noviembre

Sintaxis de los módulos JS, pruebas de métricas/proveedor/CSV, tres pruebas Python, validador de artefactos StatsBomb y enlaces de documentación correctos. JSON/SQLite de Understat regenerados desde la respuesta real del 1 de noviembre con su fecha original. Se comprobarán además conteos y xG entre la captura, JSON y SQLite. La consulta del 5 de noviembre devuelve HTML en vez de JSON y no confirma la temporada; no se publica como descarga reciente. El nuevo intento de navegador quedó pendiente de permiso de sockets: no se afirma esa comprobación visual. Autocontrol detectó y corrigió el cambio de Understat a ESPN cuando falta la caché de ESPN.
