#!/usr/bin/env python3
"""Comprueba los artefactos de GRADA sin descargar ni modificar datos."""
import argparse
import gzip
import hashlib
import json
import math
from pathlib import Path
import re
import sqlite3
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def require(condition, message):
    if not condition:
        raise ValueError(message)


def number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def near(actual, expected, message):
    require(number(actual) and number(expected) and math.isclose(actual, expected, rel_tol=1e-9, abs_tol=1e-6), message)


def ratio(value, numerator, denominator, message):
    if denominator == 0:
        require(value is None, message + ': debe ser null sin denominador')
    else:
        near(value, numerator / denominator * 100, message)


def unique(items, name):
    ids = [item['id'] for item in items]
    require(all(isinstance(i, int) and not isinstance(i, bool) for i in ids), name + ': identificador no entero')
    require(len(ids) == len(set(ids)), name + ': identificadores duplicados')
    return set(ids)


def finite_tree(value):
    if isinstance(value, dict):
        for item in value.values():
            finite_tree(item)
    elif isinstance(value, list):
        for item in value:
            finite_tree(item)
    elif isinstance(value, (int, float)) and not isinstance(value, bool):
        require(math.isfinite(value), 'El payload contiene un número no finito')


def validate(root):
    folder = root / 'dist/downloads'
    payload = json.loads((folder / 'statsbomb.json').read_text(encoding='utf-8'))
    finite_tree(payload)
    js = (root / 'dist/data.js').read_text(encoding='utf-8')
    match = re.fullmatch(r'\s*window\.GRADA_DATA\s*=\s*(\{.*\})\s*;\s*', js, re.S)
    require(match is not None, 'data.js no contiene un payload GRADA válido')
    require(json.loads(match.group(1)) == payload, 'data.js y statsbomb.json no coinciden')
    meta = payload['metadata']
    players, teams, matches = (payload[k] for k in ('players', 'teams', 'matches'))
    require(meta['source'] == 'StatsBomb Open Data', 'Fuente de datos inesperada')
    require(isinstance(meta['imported_at'], str) and meta['imported_at'].endswith('Z'), 'Falta fecha UTC de importación')
    for key in ('imported_matches', 'available_matches'):
        require(isinstance(meta[key], int) and not isinstance(meta[key], bool) and meta[key] > 0, 'Cobertura inválida: ' + key)
    require(meta['imported_matches'] == len(matches), 'La cobertura no coincide con los partidos')
    require(meta['imported_matches'] <= meta['available_matches'], 'Cobertura importada mayor que la disponible')
    require(type(meta['complete']) is bool and meta['complete'] == (len(matches) == meta['available_matches']), 'Indicador de cobertura completa incorrecto')
    require(players and teams and matches, 'No hay datos importados')
    player_ids = unique(players, 'players')
    team_ids = unique(teams, 'teams')
    match_ids = unique(matches, 'matches')
    for p in players:
        require(p['team_id'] in team_ids, 'Jugador con equipo desconocido')
        require(p['pos'] in ('POR', 'DEF', 'MED', 'DEL', '—'), 'Posición no reconocida')
        require(number(p['minutes']) and p['minutes'] >= 0, 'Minutos inválidos')
        for key in ('matches', 'goals', 'assists', 'shots', 'passes', 'completed', 'saves', 'conceded', 'clean', 'tackles', 'interceptions', 'keypasses', 'progressive'):
            require(isinstance(p[key], int) and not isinstance(p[key], bool) and p[key] >= 0, 'Contador inválido: ' + key)
        require(p['completed'] <= p['passes'], 'Más pases completados que intentados')
        require(p['goals'] <= p['shots'], 'Más goles individuales que tiros')
        ratio(p['accuracy'], p['completed'], p['passes'], 'Precisión de pase incoherente')
        ratio(p['conversion'], p['goals'], p['shots'], 'Conversión incoherente')
        ratio(p['savepct'], p['saves'], p['saves'] + p['conceded'], 'Porcentaje de paradas incoherente')
        near(p['delta'], p['goals'] - p['xg'], 'Goles menos xG incoherente')
        require(p['psxg'] is None and p['prevented'] is None, 'Esta importación no proporciona PSxG ni goles evitados')
    for t in teams:
        require(t['possession'] is None, 'Esta importación no calcula posesión')
        ratio(t['accuracy'], t['completed'], t['passes'], 'Precisión de equipo incoherente')
        near(t['delta'], t['goals'] - t['xg'], 'Goles menos xG del equipo incoherente')
        played = [m for m in matches if t['id'] in (m['home_id'], m['away_id'])]
        require(t['matches'] == len(played), 'Partidos de un equipo incoherentes')
        near(t['minutes'], sum(m['minutes'] for m in played), 'Minutos de equipo incoherentes')
        near(t['goals'], sum(m['home_goals'] if t['id'] == m['home_id'] else m['away_goals'] for m in played), 'Marcadores del equipo incoherentes')
    for m in matches:
        require(m['home_id'] in team_ids and m['away_id'] in team_ids and m['home_id'] != m['away_id'], 'Equipos de partido inválidos')
        require(m['minutes'] in (90, 120), 'Duración nominal de partido no reconocida')
    goals = sum(m['home_goals'] + m['away_goals'] for m in matches)
    xg = sum(m['home_xg'] + m['away_xg'] for m in matches)
    near(sum(t['goals'] for t in teams), goals, 'Goles de equipos no cuadran')
    near(sum(t['conceded'] for t in teams), goals, 'Goles encajados de equipos no cuadran')
    near(sum(p['conceded'] for p in players), goals, 'Goles encajados por porteros no cuadran')
    for rows, key in ((players, 'xg'), (teams, 'xg'), (players, 'xga'), (teams, 'xga')):
        near(sum(row[key] for row in rows), xg, 'Los totales de ' + key + ' no cuadran')
    compressed = folder / 'statsbomb.sqlite.gz'
    checksums = {}
    for line in (folder / 'SHA256SUMS').read_text().splitlines():
        if line.strip():
            digest, filename = line.split(maxsplit=1)
            checksums[filename.strip().lstrip('*')] = digest
    require(hashlib.sha256(compressed.read_bytes()).hexdigest() == checksums.get(compressed.name), 'El SHA256 del gzip no coincide')
    with tempfile.TemporaryDirectory(prefix='grada-validate-') as tmp:
        dbpath = Path(tmp) / 'statsbomb.sqlite'
        with gzip.open(compressed, 'rb') as src, dbpath.open('wb') as dst:
            while chunk := src.read(1024 * 1024):
                dst.write(chunk)
        with sqlite3.connect(dbpath.as_uri() + '?mode=ro', uri=True) as db:
            require(db.execute('PRAGMA integrity_check').fetchone()[0] == 'ok', 'Integridad SQLite incorrecta')
            stored_meta = {k: json.loads(v) for k, v in db.execute('SELECT key,value FROM metadata')}
            require(stored_meta == meta, 'Metadata de SQLite y JSON distinta')
            for table, expected in (('players', players), ('teams', teams)):
                stored = {row[0]: json.loads(row[1]) for row in db.execute(f'SELECT id,stats_json FROM {table}')}
                require(stored == {row['id']: row for row in expected}, 'Estadísticas SQLite y JSON distintas: ' + table)
            require({row[0] for row in db.execute('SELECT id FROM matches')} == match_ids, 'Partidos de SQLite y JSON distintos')
            for m in matches:
                row = db.execute('SELECT home_id,away_id,home_goals,away_goals,home_xg,away_xg,minutes FROM matches WHERE id=?', (m['id'],)).fetchone()
                expected = [m[k] for k in ('home_id', 'away_id', 'home_goals', 'away_goals', 'home_xg', 'away_xg', 'minutes')]
                for a, b in zip(row, expected):
                    near(a, b, 'Partido de SQLite y JSON incoherente')
            sql_xg = db.execute('SELECT COALESCE(SUM(xg),0) FROM events WHERE type=? AND period BETWEEN 1 AND 4', ('Shot',)).fetchone()[0]
            near(sql_xg, xg, 'El xG de eventos excluyendo tandas no cuadra')
            scored = db.execute('SELECT COUNT(*) FROM events WHERE type=? AND outcome=? AND period BETWEEN 1 AND 4', ('Shot', 'Goal')).fetchone()[0]
            near(scored, sum(p['goals'] for p in players), 'Goles individuales y eventos no cuadran')
            events = db.execute('SELECT COUNT(*) FROM events').fetchone()[0]
            require(events > 0, 'La base no contiene eventos')
    manifest_path = folder / 'source-manifest.json'
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text())
        require(manifest['competition_id'] == meta['competition_id'] and manifest['season_id'] == meta['season_id'], 'Manifiesto de otra competición/temporada')
        paths = [item['path'] for item in manifest['files']]
        require(len(paths) == len(set(paths)), 'Rutas duplicadas en manifiesto')
        expected_paths = {f'data/matches/{meta["competition_id"]}/{meta["season_id"]}.json'}
        expected_paths |= {f'data/{kind}/{mid}.json' for mid in match_ids for kind in ('events', 'lineups')}
        require(set(paths) == expected_paths, 'El manifiesto de origen no corresponde a la cobertura importada')
        require(all(re.fullmatch('[0-9a-f]{40}', item['sha']) for item in manifest['files']), 'SHA de origen inválido')
    print(f'OK: {len(matches)} partidos, {len(team_ids)} equipos, {len(player_ids)} registros de jugadores, {events} eventos; artefactos y métricas coherentes.')
    print('Cobertura: ' + ('completa' if meta['complete'] else 'parcial') + '. Procedencia: ' + ('manifiesto estructural comprobado' if manifest_path.exists() else 'sin manifiesto remoto') + '.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT, help='Raíz de una copia de GRADA que se quiera comprobar')
    args = parser.parse_args()
    try:
        validate(args.root.resolve())
    except (ValueError, KeyError, TypeError, OSError, sqlite3.Error) as exc:
        print('ERROR: ' + str(exc), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
