# 20261031-codex-web-fbref · Subir código y generadores

- Estado: `review`
- Responsable de la entrega: Codex, a petición de estadisticasfutbolxg
- Revisor: por asignar
- Rama: `docs/colaboracion`
- Base comprobada: `6f077740cae918c5a1b07d16cf16e0af8553d058`
- Issue: no creado
- PR: ampliar el pull request #1 existente con el alcance final
- Objetivo de entrega: código y generadores en GitHub, sin subir la base

## Objetivo

Incorporar el código de la web, la generación de SQLite desde StatsBomb y un importador separado de una captura pública atribuida a FBref para LaLiga 2025/26.

## Aceptación

- [x] La entrega incluye el código de la web y un arranque vacío sin datos ficticios.
- [x] StatsBomb puede descargarse y generar el payload de la web y SQLite.
- [x] El importador FBref usa un snapshot fijado, verifica SHA, filtra LaLiga 2025/26 y genera CSV y SQLite sin mezclar proveedores.
- [x] Se han comprobado 22 tablas FBref, con 20 equipos, 611 registros estándar y 39 de porteros.
- [x] La base y los datos generados quedan fuera del commit, según la indicación del usuario.
- [ ] Commit y archivos remotos verificados.
- [ ] Revisión por la otra persona e integración en main, si procede.

## Evidencia

La generación StatsBomb y su validador pasaron en la copia local completa. La descarga FBref directa devolvió 403; se usa una copia pública identificada como procedente de FBref, con todas las descargas cotejadas contra sus SHA. La prueba de generación FBref sin red pasó con los archivos reales descargados. Las columnas de pases y PSxG están vacías y no se rellenaron.

## Límites

La web todavía consume StatsBomb; FBref se entrega como importación separada. El workflow de Pages requiere configuración real del propietario. Un PR abierto no demuestra una publicación.
