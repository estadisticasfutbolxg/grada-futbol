# Aplicar pesos Fantasy aprobados al bloque ofensivo

- Estado: `review`
- Responsable: Codex
- Revisor: autocontrol, sin revisión independiente
- Rama: `feat/apply-fantasy-attack-weights`
- Base nativa: `7316531e6a5a93da526017772c8d5169f368bf66`
- Base GitHub: `0d1be7fa38af79fa2b878dd26863cf3e66662b4f`

## Alcance autorizado

El usuario aprueba los porcentajes de goles, asistencias, xG y xA publicados en la conversación: magnitud de coeficientes estandarizados repartidos / suma de magnitudes de todos los predictores del perfil, incluidos minutos y extras. Aplicar cada peso por separado; el resto conserva área no ofensiva original. No introducir minutos, tarjetas o penaltis provocados como nuevos ejes, ni aplicar signos negativos para penalizar goles/asistencias. Juego limpio actual permanece. La calibración de LaLiga se aplica por perfil en todas las competiciones; no afirmar calibración en otras ligas.

Generador reproducible desde informe congelado, con fecha, hash y método. Nuevas regresiones y aplicación solo cuando el usuario lo solicite; actualizar estadísticas no debe recalibrar pesos. Preservar elegibilidad, fuentes, mínimo 200 y coherencia entre tablas, fichas, comparadores, equipos y selecciones. Pesos y generador versionados, sin capturas/modelos completos/DB en GitHub. Publicar conservando Site privado.

## Plan y verificación

1. Configuración y generación deterministas; pesos independientes y trazabilidad.
2. Actualizar fórmula, gráfico y explicaciones; distinguir pesos aplicados de otras propuestas.
3. Pruebas de peso individual, límites, muestras/ausencias, ninguna pérdida de score o cambio de perfil; auditoría de sectores y agregados.
4. Regenerar 18 combinados con capturas existentes, checks, PR/merge y despliegue privado.

## Resultado y comprobaciones

- Modelo `role_fairplay_radar_v11`: pesos por métrica de seis perfiles, con configuración congelada y protegida frente a mutaciones. Porteros conservan su modelo. Mismo mínimo, referencias, ejes, posición y perfil estadístico; no se reentrena la clasificación con los nuevos scores.
- Generador usa valores completos, denominador de todos los predictores y magnitudes positivas; conserva signos originales, fecha, hash y muestras. Aplicación determinista/atómica con seis perfiles completos; rechaza entradas parciales sin sustituir configuración. Refresco habitual sin calibración automática.
- Comparación de 6.766 identidades: 3.945 scores cambian, cero perdidos/ganados, cero cambios de posición/perfil y cero cambios en porteros. Se mantienen 4.224 scores y 393 pendientes por datos/muestras. 4.224 gráficos descompuestos exactamente y 18 combinados con misma calibración.
- Auditoría de coherencia entre competiciones, disciplina y promedios/contribuciones de equipo correcta. 38 archivos Node y 28 pruebas Python; ESLint, Ruff, documentación y diff correctos.
- Informe descargable actualizado para distinguir política aplicada (magnitudes sobre todos los predictores) de propuesta alternativa (solo ejes positivos, no aplicada). No se modifica el ajuste de la regresión congelada ni se descarga ninguna captura.
- Pruebas con Worker compilado/VM/DOM; navegador no disponible, sin QA visual ni revisión independiente.

Integración y publicación privada pendientes de confirmar. No hay jugadores ni partidos nuevos descargados: solo scores y agregados derivados.
