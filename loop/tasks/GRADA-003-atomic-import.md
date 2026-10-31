# GRADA-003 · Mantener coherentes las salidas al importar

- Estado: `ready`
- Responsable: por asignar
- Revisor: por asignar
- Rama: por crear
- Base: por registrar al comenzar
- Issue: no creado; identificador local
- PR: no creado
- Objetivo de entrega: PR con importación que conserva el último conjunto válido ante fallos

## Problema comprobado en el código

El importador actual escribe `data.js`, JSON y gzip y después puede fallar una comprobación o un reemplazo. El manifiesto de SHA de origen, capturado en la descarga inicial, no se actualiza en una importación HTTP posterior. Puede quedar un conjunto de archivos incoherente o una procedencia antigua.

## Alcance y coordinación

Importador, generación del conjunto de artefactos, contrato de datos y validación. Coordinar con cualquier cambio de métricas. No cambiar fórmulas ni añadir competiciones en esta tarea.

## Aceptación

- [ ] Calcular y validar el conjunto nuevo en un área de staging antes de ofrecerlo como versión válida.
- [ ] Un fallo durante descarga, cálculo o preparación conserva la versión anterior que sirve la web.
- [ ] La estrategia de promoción y recuperación queda documentada; no se promete atomicidad entre varios archivos si el diseño no la ofrece.
- [ ] La procedencia identifica esta importación o declara explícitamente su ausencia, sin conservar un manifiesto obsoleto como si fuese actual.
- [ ] Un caso de fallo reproducible y una importación válida demuestran el comportamiento.
- [ ] Pasan los checks de datos y de los consumidores afectados.

## Siguiente paso

Diseñar una promoción por conjunto/versionado o una recuperación documentada antes de tocar la UI. Esta ficha es una tarea preparada; no acredita que la mejora esté implementada.
