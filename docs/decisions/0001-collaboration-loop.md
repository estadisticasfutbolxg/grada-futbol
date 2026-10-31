# 0001 · Ramas cortas y loop por tarea

Estado: decisión de trabajo propuesta para el equipo; aún no configura reglas de GitHub.

## Contexto

GRADA se va a mantener entre dos personas. El proyecto es estático y pequeño; comparte un importador y un contrato de datos. Falta confirmar la carga inicial completa en el remoto.

## Decisión

Usar una tarea acotada, una rama y una entrega verificable por ciclo. La persona responsable implementa; la otra revisa. Las skills reutilizan el procedimiento y la ficha mantiene el contexto entre sesiones.

Cada tarea dispone de su archivo. Las observaciones del revisor viven en el PR y el responsable resume su resolución en la ficha. No hay un documento global que ambos deban editar en cada iteración.

El loop termina al entregar lo acordado, llegar a un bloqueo real o alcanzar el límite de reparación descrito en la ficha. No se instala un daemon ni se ejecutan iteraciones indefinidas.

## Consecuencias

Se facilita el relevo y se reduce el riesgo de pisar archivos. Sigue siendo necesaria la coordinación humana cuando dos cambios afectan al mismo contrato o a `dist/app.js`. Las reglas escritas no sustituyen los permisos, checks ni protecciones configurados en GitHub.

Más adelante se podrá añadir automatización si existe una necesidad concreta; esta decisión no exige un framework, una cuenta nueva ni una migración del proyecto.
