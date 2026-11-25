# Comparador de fuentes GRADA

- Estado: `review`
- Responsable: dot; revisor: pendiente de revisión del propietario.
- Rama: `feat/20261125-dot-comparador-fuentes`.
- Base: `55a2efa724181f60fd4ee78972d26e8814a28e0a`.
- Alcance: piloto local y aislado, con Bzzoiro y FotMob + ESPN visibles por separado o juntos para el mismo encuentro.
- Archivos propios: `README-piloto.md`, `dist/comparar-fuentes.*`, `scripts/serve_source_pilot.py` y sus dos archivos de pruebas. No se modifica la configuración de fuentes, la entrada de la web, el despliegue, ni las capturas de datos.

## Evidencia y límites

Dos pruebas de Node y dos de Python correctas, incluido el servidor en loopback con HTTP y proveedor simulado. La clave de Bzzoiro no está en Git; no incluye datos de terceros ni consulta FotMob o ESPN. No se ha autenticado el piloto con datos reales ni validado en el navegador.

## Siguiente paso

Revisar en borrador, sin fusionar ni publicar. Configurar la clave como secreto de servidor de prueba y usar una referencia autorizada del mismo encuentro. Validar primero Madrid–Inter (601024), incluidas paradas y tiros recibidos, antes de contrastar xG/xA y plantear el selector del dashboard de temporada.
