# 20261121-codex · Actualizar sin contraseña adicional

- Estado: `review`
- Responsable: Codex
- Revisor: autocontrol; sin revisión independiente solicitada
- Rama: `feat/owner-refresh-without-password`
- Base Sites: `18fcba4e6adf355c91e59957170ede335bf576f1`
- Base GitHub: `0bc98e62b85c67e4b240c8e1cdc4f29fe5626103`
- Issue/PR: no creados
- Entrega: merge y publicación privada, autorización vigente

## Objetivo y alcance

Retirar la contraseña adicional de actualización porque la web es privada. El botón inicia el refresco tras comprobar la sesión del propietario; se conserva la autorización del servidor en fuentes y fichas individuales/agrupadas. No modificar audiencia, identidad vinculada, fuentes, fórmulas o capturas. Mantener las optimizaciones de v27.

Archivos compartidos: `worker/owner.cjs`, `dist/owner.js`, HTML/CSS/glosario, pruebas y contrato de acceso. Sin otra tarea activa sobre estos archivos.

## Aceptación

- [x] El propietario actualiza sin contraseña ni cookie de desbloqueo.
- [x] Sin identidad o con otra cuenta se deniega antes de consultar proveedores; ID vinculado sigue siendo autoridad.
- [x] Se retiran formulario y rutas de contraseña, conservando entrada/salida de ChatGPT y fallos seguros.
- [x] Datos/scores y optimizaciones intactos; sin consultas de estadísticas para validar.
- [ ] Pruebas, GitHub y publicación privada confirmados.

## Plan y evidencia

1. Conservar la identificación de Sites y retirar el segundo desbloqueo.
2. Probar propietario/visitantes, interfaz y Worker con las capturas existentes.
3. Integrar y publicar conservando owner-only revisión 3.

Base publicada v27; solo un propietario y cero editores/grupos/visitantes. Validación y entrega pendientes.

### Resultado y revisión local

- Botón directo: comprueba `/api/owner/status` y llama al refresco, sin formulario, segunda confirmación ni desbloqueo de 30 min. Doble pulsación no duplica la actualización. Los enlaces de entrada/cambio de cuenta de Sites se conservan para sesiones caducadas u otras cuentas.
- Backend comprueba la identidad de Sites en todas las fuentes y fichas. Conserva el ID previamente vinculado; mismo correo con otro ID queda denegado. Sin vinculación previa, usa el correo verificado configurado. Anónimo, visitante, R2/configuración fallidos o pin inválido se deniegan. Ninguna ruta de contraseña sigue operativa.
- Se deja de usar `GRADA_OWNER_SESSION_SECRET`; no se cambian secretos de producción ni se sobrescribe R2. Campos heredados de contraseña quedan privados e inactivos. El estado elimina la cookie antigua si llega y da compatibilidad a pestañas anteriores. Contrato y ejemplo de variables actualizados.
- **0 jugadores, estadísticas, scores y partidos actualizados**. Once capturas y sus fechas intactas. Conservados mínimo 200 min, 1.502 scores, referencias, 96 equipos, lotes de seis y un script agrupado. Sin consultas reales a proveedores para comprobarlo.

| Comprobación | Resultado | Límite |
| --- | --- | --- |
| `node --test tests/*.test.cjs` | 24 archivos correctos; seis casos de acceso/interfaz | Propietario sin cookie; denegaciones sin upstream; no persistencia nueva |
| Worker/bundle | 142 assets y 11 módulos; gzip 68.629 bytes, sin formulario ni firma de desbloqueo | SHA256 `aa905fb8b9c3a1d19ca9676f9eb92da4ab92557ec91c660608ecba0c3749e1b1` |
| Cinco arranques reales en VM | Normal, publicado, liga solicitada, fallo parcial y caché reciente conservan hashes de scores de v27 | Un script; 106 assets exactos; once capturas intactas |
| Sintaxis JS y docs/diff | Correctos | Sin cambios de importadores o fórmulas |
| Navegador | No disponible en modo managed sin `cua_repl.js` | No se afirma QA visual/móvil |

Autocontrol del diff y criterios: sin hallazgos pendientes. No equivale a revisión independiente. Commit/push, PR/merge y publicación pendientes de confirmar, con audiencia privada conservada.
