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
