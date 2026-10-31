#!/usr/bin/env python3
"""Importa una captura pública de FBref para LaLiga 2025/26, sin tocar StatsBomb.
No accede directamente a FBref. Usa un snapshot de GitHub fijado por commit/SHA.
"""
import argparse
import csv
from datetime import datetime, timezone
import hashlib
import io
import json
import math
from pathlib import Path
import re
import sqlite3
import tempfile
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
IDENTITY = {'league', 'season', 'team', 'player', 'nation', 'pos', 'url'}
NUMERIC = re.compile(r'^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$')


def q(value):
    return '"' + value.replace('"', '""') + '"'


def infer_type(column, rows):
    values = [row[column].strip() for row in rows if row[column].strip()]
    if column in IDENTITY or not values or not all(NUMERIC.fullmatch(v) for v in values):
        return 'TEXT'
    numbers = [float(v) for v in values]
    if not all(math.isfinite(v) for v in numbers):
        raise ValueError('Número no finito en ' + column)
    return 'INTEGER' if all(v.is_integer() for v in numbers) else 'REAL'


def convert(value, kind):
    value = value.strip()
    if not value:
        return None
    if kind == 'INTEGER':
        return int(float(value))
    if kind == 'REAL':
        return float(value)
    return value


def run(input_dir, output, manifest_path):
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    rows_by_table = {}
    reports = {}
    source_report = []
    for spec in manifest['files']:
        relative = spec['local']
        if input_dir:
            content = (input_dir / relative).read_bytes()
        else:
            cache = ROOT / 'data/fbref/raw' / relative
            if not cache.exists():
                url = f'https://raw.githubusercontent.com/{manifest["repository"]}/{manifest["commit"]}/{spec["path"]}'
                request = urllib.request.Request(url, headers={'User-Agent': 'GRADA-source-import/1.0'})
                with urllib.request.urlopen(request, timeout=60) as response:
                    content = response.read()
                cache.parent.mkdir(parents=True, exist_ok=True)
                cache.write_bytes(content)
            content = cache.read_bytes()
        blob = hashlib.sha1(b'blob ' + str(len(content)).encode() + b'\0' + content).hexdigest()
        if blob != spec['sha']:
            raise ValueError('El archivo no coincide con el snapshot fijado: ' + relative)
        reader = csv.DictReader(io.StringIO(content.decode('utf-8-sig')))
        columns = reader.fieldnames
        if not columns or len(columns) != len(set(columns)):
            raise ValueError('Cabecera vacía o duplicada: ' + relative)
        rows = [row for row in reader if row.get('league') == 'ESP-La Liga' and row.get('season') == '2526']
        if not rows or any(None in row or any(v is None for v in row.values()) for row in rows):
            raise ValueError('Filas ausentes o columnas desajustadas: ' + relative)
        table = relative.removesuffix('.csv').replace('/', '_')
        types = {column: infer_type(column, rows) for column in columns}
        reports[table] = {'rows': len(rows), 'columns': len(columns), 'non_null_by_column': {c: sum(bool(row[c].strip()) for row in rows) for c in columns}}
        rows_by_table[table] = (relative, columns, rows, types)
        source_report.append({**spec, 'sha256': hashlib.sha256(content).hexdigest()})
    standard = rows_by_table['teams_standard'][2]
    team_names = {row['team'] for row in standard}
    if len(standard) != len(team_names):
        raise ValueError('La tabla estándar de equipos contiene filas duplicadas')
    played = [int(float(row['playing_time_mp'])) for row in standard]
    if not all(0 <= n <= 38 for n in played):
        raise ValueError('Número de partidos fuera del rango de LaLiga')
    complete = len(team_names) == 20 and all(n == 38 for n in played)
    for table, (_, _, rows, _) in rows_by_table.items():
        if not {row['team'] for row in rows} <= team_names:
            raise ValueError('Equipo no presente en la tabla de referencia: ' + table)
    metadata = {
        'source': 'FBref via public third-party snapshot',
        'repository': manifest['repository'], 'source_commit': manifest['commit'],
        'source_commit_date': manifest.get('commit_date'),
        'downloaded_at': datetime.now(timezone.utc).isoformat(),
        'competition': 'LaLiga', 'season': '2025/26',
        'coverage_level': 'season_aggregates', 'teams': len(team_names),
        'reported_matches_per_team': sorted(set(played)),
        'complete_by_team_appearances': complete,
        'players_standard_records': len(rows_by_table['players_standard'][2]),
        'distinct_player_names': len({row['player'] for row in rows_by_table['players_standard'][2]}),
        'goalkeeper_records': len(rows_by_table['players_keeper'][2]),
        'tables': reports,
        'notes': [
            'Descarga directa de FBref bloqueada con 403; se usa la copia pública identificada.',
            'La cobertura se basa en los partidos declarados por equipo, no en una descarga de actas de partidos.',
            'Cada fila de jugador corresponde a un nombre y equipo; los traspasos pueden producir varias filas.',
            'No se han mezclado valores de Understat, SofaScore, SoFIFA ni StatsBomb.',
            'Las columnas vacías se conservan vacías en CSV y como NULL en SQLite.',
            'Los términos de FBref y de los propietarios de los datos siguen siendo aplicables.',
        ],
        'source_files': source_report,
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='grada-fbref-') as tmp:
        staged = Path(tmp)
        db = sqlite3.connect(staged / 'fbref_laliga_2025_26.sqlite')
        try:
            db.execute('CREATE TABLE metadata (key TEXT PRIMARY KEY,value TEXT NOT NULL)')
            for table, (relative, columns, rows, types) in rows_by_table.items():
                dest = staged / relative
                dest.parent.mkdir(parents=True, exist_ok=True)
                with dest.open('w', encoding='utf-8', newline='') as handle:
                    writer = csv.DictWriter(handle, fieldnames=columns)
                    writer.writeheader()
                    writer.writerows(rows)
                db.execute('CREATE TABLE ' + q(table) + ' (' + ','.join(q(c) + ' ' + types[c] for c in columns) + ')')
                db.executemany('INSERT INTO ' + q(table) + ' VALUES (' + ','.join('?' for _ in columns) + ')',
                               [tuple(convert(row[c], types[c]) for c in columns) for row in rows])
                if db.execute('SELECT COUNT(*) FROM ' + q(table)).fetchone()[0] != len(rows):
                    raise ValueError('Conteo SQLite incorrecto: ' + table)
            db.executemany('INSERT INTO metadata VALUES (?,?)', [(k, json.dumps(v, ensure_ascii=False)) for k, v in metadata.items()])
            db.commit()
            if db.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
                raise ValueError('Integridad SQLite incorrecta')
        finally:
            db.close()
        (staged / 'metadata.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding='utf-8')
        # Promoción solo después de calcular y validar el conjunto. No sustituye
        # automáticamente datos de la web ni promete atomicidad multiarchivo.
        output.mkdir(parents=True, exist_ok=True)
        import shutil
        for file in staged.rglob('*'):
            if file.is_file():
                dest = output / file.relative_to(staged)
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(file, dest)
    print(f'OK: {len(reports)} tablas, {len(team_names)} equipos, {metadata["players_standard_records"]} registros de jugadores y {metadata["goalkeeper_records"]} de porteros.')
    print('Cobertura por partidos declarados: ' + ('38 por cada uno de los 20 equipos.' if complete else 'parcial.'))
    print('Salida: ' + str(output))
    return metadata


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input-dir', type=Path, help='Carpeta con CSV originales players/ y teams/ del snapshot, para importar sin red')
    parser.add_argument('--output', type=Path, default=ROOT / 'data/fbref/laliga-2025-26')
    parser.add_argument('--manifest', type=Path, default=ROOT / 'docs/fbref-source.json')
    args = parser.parse_args()
    try:
        run(args.input_dir, args.output, args.manifest)
    except (ValueError, KeyError, OSError, csv.Error, sqlite3.Error, urllib.error.URLError) as exc:
        parser.exit(1, 'ERROR: ' + str(exc) + '\n')


if __name__ == '__main__':
    main()
