# GRADA · Estadísticas de fútbol

Web en español con líderes, tablas por equipo y jugador, perfiles, comparador y exportación CSV. Está hecha con HTML, CSS y JavaScript, sin dependencias de aplicación.

Los datos son de **StatsBomb Open Data, Mundial masculino de 2022**: 64 partidos, 32 selecciones, 681 registros de jugadores y 234.637 eventos. Los marcadores suman 172 goles. La cobertura y la fecha de importación aparecen en la web. No se incluyen cifras de demostración. PSxG y goles evitados se muestran como no disponibles.

## Estado de esta entrega

Esta entrega incorpora las skills, la documentación, el loop y sus validadores. El código y los datos de la aplicación todavía deben subirse al remoto mediante GRADA-001. Las cifras y descargas descritas debajo corresponden al paquete completo preparado localmente; consulta [el estado comprobado](docs/STATUS.md) antes de asumir que están en GitHub.

## Ver la web

Abre `dist/index.html` en tu navegador. Los datos ya importados están incluidos en `dist/data.js`; no hace falta una API, registro ni servidor para consultar las tablas. Si prefieres servirla localmente:

```sh
python -m http.server 8000 --directory dist
```

Abre http://localhost:8000. El botón CSV descarga la tabla actual respetando filtros, orden y modo por 90 minutos.

## Base de datos gratuita

SQLite no necesita registro, servidor ni suscripción. En `dist/downloads/` se incluyen:

- `statsbomb.sqlite.gz`: base de datos SQLite comprimida. Descomprímela para abrirla con DB Browser for SQLite, Python u otra herramienta compatible.
- `statsbomb.json`: métricas derivadas de equipos, jugadores y partidos.
- `SHA256SUMS`: comprobación de integridad del archivo comprimido.
- `source-manifest.json`: rutas y SHA de los archivos de origen usados en la importación incluida.

Tablas de SQLite: `matches`, `events`, `lineups`, `players`, `teams`, `metadata`. Los eventos conservan un subconjunto normalizado de campos. La base incluye los eventos de las tandas para consulta, pero estos se excluyen de las métricas. No se importa StatsBomb 360 ni `freeze_frame`.

## Volver a importar

Requiere Python 3.10 o posterior y conexión a Internet. Solo usa la biblioteca estándar:

```sh
python scripts/import_statsbomb.py
```

La importación comprueba la integridad de SQLite y que los totales de goles y xG coincidan. Los JSON originales quedan en la caché local `data/raw/`, excluida de Git.

Para una importación parcial explícita:

```sh
python scripts/import_statsbomb.py --limit 3
```

La web indicará la cobertura parcial. Sus rankings solo representarán esos partidos.

## GitHub Pages

El flujo `.github/workflows/pages.yml` permite regenerar los datos y publicar `dist/`. Para activarlo, el propietario debe seleccionar **Settings → Pages → Source → GitHub Actions**, y ejecutarlo desde **Actions → Publicar GRADA con StatsBomb → Run workflow**. Una subida a `main` también lo ejecuta. Subir el código al repositorio no equivale a haber publicado la web.

## Métricas y límites

- Goles y xG: eventos `Shot` y `shot.statsbomb_xg`; las tandas (periodo 5) se excluyen. Los goles de equipo proceden del marcador, incluidos los autogoles. Los autogoles no añaden xG.
- Pases: intentos de pase y pases sin `pass.outcome` como completados.
- Asistencias: `pass.goal_assist`.
- xA derivada: suma del xG de los tiros enlazados por `pass.assisted_shot_id`. No es un modelo independiente del valor esperado de todos los pases.
- Pases progresivos: pases completados que avanzan al menos 10 metros en el eje longitudinal, convirtiendo el campo StatsBomb de 120 unidades a 105 metros. Es una definición propia de GRADA.
- Conversión: goles / tiros. Precisión: pases completados / intentados. Los líderes de precisión requieren al menos 30 intentos.
- Paradas: tiros rivales con resultado `Saved`, `Saved to Post` o `Saved Off Target`, asignados al portero presente mediante el orden de alineaciones, cambios y eventos. El porcentaje usa paradas / (paradas + goles encajados), incluidos los autogoles.
- Minutos: suma de intervalos de posición de las alineaciones, con límite de 90 o 120 minutos. No incluyen el tiempo añadido. Sin intervalos válidos, el dato por 90 queda sin calcular.
- Portería a cero: equipo sin encajar goles y portero con al menos 60 minutos en portería.
- PSxG y goles evitados: **no disponibles**, nunca rellenados con cero ni estimaciones.
- Posesión: no calculada.

## Fuente y licencia de datos

Fuente: [StatsBomb Open Data](https://github.com/statsbomb/open-data), actualmente alojada en [hudl/open-data](https://github.com/hudl/open-data). Consulta su [licencia](https://github.com/hudl/open-data/blob/master/LICENSE.pdf) y términos de uso. Los datos y la marca StatsBomb pertenecen a sus titulares.

## Trabajar entre dos personas

Empieza por [CONTRIBUTING.md](CONTRIBUTING.md) y [el mapa de documentación](docs/README.md). Las instrucciones para asistentes están en [AGENTS.md](AGENTS.md), y las tres skills compartidas en `.agents/skills/`. El [loop de tareas](loop/README.md) incluye un [prompt reutilizable](loop/PROMPT.md), plantillas y fichas de arranque. El [estado real](docs/STATUS.md) distingue la copia local, GitHub y la publicación.

Comprobaciones locales sin red:

```sh
python scripts/check_collaboration_docs.py
python scripts/validate_data.py
```
