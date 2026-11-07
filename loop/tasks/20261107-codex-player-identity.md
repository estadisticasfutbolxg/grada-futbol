# 20261107 · Identidad de Mbappé entre proveedores

- Estado: `active`
- Responsable: Codex a petición del usuario
- Revisor: autocontrol, sin revisión independiente
- Rama: `fix/mbappe-source-identity`
- Base GitHub: `f68725161077c2459b942be5c325c34baf1bebc9`
- Base Sites: `c3a71c58eaac3c513e730feb8e8fb6303129f5b5`

## Problema y alcance

Understat 3423: Kylian Mbappe-Lottin; ESPN 86:231388 y FotMob 701154: Kylian Mbappé, todos en Real Madrid. La unión por nombre exacto no añadía tiros a puerta/90 ni regates y el área comparable quedaba ausente (4/6 ejes). El radar parcial sí tenía área geométrica.

Revisión de otros registros sin unión: existen variantes de nombre, registros de traspasos sin club único y roles desconocidos. No se generaliza una unión por parecido. Este incremento añade un registro de equivalencias por identificador, club y nombres comprobados; permite nuevas equivalencias revisadas sin relajar las guardas.

## Criterios

- [x] Unir Mbappé por identidad verificada conservando nombres y valores originales, fechas y denominadores.
- [x] Rechazar identificador, club o nombre distintos, duplicados y roles incompatibles.
- [x] Área en ficha, tabla, filtro y CSV con los seis ejes comunes; sin inventar ausencias.
- [ ] Pruebas, PR/merge y publicación confirmados.

La ampliación a otras ligas y el selector solo combinado se desarrollarán en otro incremento, según las nuevas peticiones del usuario.

## Validación local

Node pruebas y validador StatsBomb correctos; Chromium con captura real: Mbappé muestra 0,756 en tabla y ficha, con seis ejes, tiros a puerta 2,7/90 y regates 3,2/90. Pasó también regresión de unidades, filtros/CSV/descargas, fuentes individuales, actualización y fallos, y móvil. Combinado regenerado: 449 complementados, ESPN 412 y FotMob 430. Se conservan las fechas originales. Pendientes integración y publicación.
