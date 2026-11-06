#!/usr/bin/env python3
"""Download and validate Understat LaLiga 2026/27; generate JSON and free SQLite."""
import argparse
from datetime import datetime, timezone
import gzip
import hashlib
import json
import math
import os
from pathlib import Path
import re
import sqlite3
import tempfile
import urllib.request
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
PAGE = 'https://understat.com/league/La_liga/2026'
ENDPOINT = 'https://understat.com/getLeagueData/La%20liga/2026'
MAX_BYTES = 8 * 1024 * 1024


def decode_body(body):
    if body[:2] == b'\x1f\x8b':
        import io
        with gzip.GzipFile(fileobj=io.BytesIO(body)) as handle:
            body = handle.read(MAX_BYTES+1)
    if len(body) > MAX_BYTES:
        raise ValueError('Response exceeds size limit')
    return body


def extract_page(html):
    """Read Understat's embedded JSON as data, without executing page JavaScript."""
    title = re.search(r'<title>(.*?)</title>', html, re.S | re.I)
    if not title or not re.search(r'2026\s*[/–-]\s*(?:20)?27', title.group(1)):
        raise ValueError('La página no confirma LaLiga 2026/27')
    found = {}
    for variable, key in [('teamsData', 'teams'), ('playersData', 'players'), ('datesData', 'dates')]:
        match = re.search(r'\b'+variable+r"\s*=\s*JSON\.parse\(\s*'((?:\\.|[^'\\])*)'\s*\)", html)
        if not match:
            raise ValueError('La página no contiene '+variable)
        # Understat hex-escapes the JSON punctuation in its single-quoted strings.
        encoded = match.group(1)
        if re.search(r"\\(?!x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|[\\'\"/bfnrt])", encoded):
            raise ValueError('Escape no reconocido en '+variable)
        decoded = re.sub(r'\\x([0-9a-fA-F]{2})', lambda m: chr(int(m.group(1), 16)), encoded)
        # Typical captures escape every quote as hex; reject other JS string forms.
        found[key] = json.loads(decoded)
    return found


def download(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'GRADA football statistics/1.0', 'Accept': 'application/json,text/html',
                                                  'X-Requested-With': 'XMLHttpRequest', 'Referer': PAGE})
    with urllib.request.urlopen(request, timeout=25) as response:
        if urlparse(response.geturl()).hostname != 'understat.com':
            raise ValueError('Unexpected source redirect')
        return decode_body(response.read(MAX_BYTES+1))


def number(value, integer=False):
    if value is None or value == '':
        return None
    if isinstance(value, bool):
        raise ValueError('Boolean is not a statistic')
    n = float(value)
    if not math.isfinite(n) or n < 0 or (integer and not n.is_integer()):
        raise ValueError('Invalid statistic')
    return int(n) if integer else n


def name(value):
    if not isinstance(value, str) or not value.strip() or len(value) > 250:
        raise ValueError('Invalid name')
    return value.strip()


def identifier(value):
    value = str(value)
    if not value.isascii() or not value.isdigit() or len(value) > 12:
        raise ValueError('Invalid identifier')
    return value


def total(rows, key):
    values = [number(row.get(key)) for row in rows]
    return sum(values) if values and all(v is not None for v in values) else None


def adapt(raw, captured_at):
    if not isinstance(raw.get('teams'), dict) or len(raw['teams']) != 20:
        raise ValueError('Expected 20 teams')
    if not isinstance(raw.get('players'), list) or not raw['players']:
        raise ValueError('Missing players')
    teams = []
    for t in raw['teams'].values():
        history = t.get('history')
        if not isinstance(history, list):
            raise ValueError('Missing team history')
        goals, conceded, xg, xga = (total(history, k) for k in ['scored', 'missed', 'xG', 'xGA'])
        teams.append({'id': identifier(t['id']), 'name': name(t['title']), 'matches': len(history),
                      'minutes': len(history)*90, 'goals': goals, 'conceded': conceded, 'xg': xg, 'xga': xga,
                      'delta': goals-xg if goals is not None and xg is not None else None,
                      'passes': None, 'accuracy': None})
    players = []
    team_names = {t['name']: t['id'] for t in teams}
    for p in raw['players']:
        goals, xg, shots = number(p.get('goals'), True), number(p.get('xG')), number(p.get('shots'), True)
        team = name(p['team_title'])
        position = str(p.get('position', '')).split()
        pos = 'POR' if 'GK' in position else next(({'D': 'DEF', 'M': 'MED', 'F': 'DEL'}[x] for x in position if x in {'D', 'M', 'F'}), '—')
        players.append({'id': identifier(p['id']), 'name': name(p['player_name']), 'team_id': team_names.get(team), 'team': team,
                        'pos': pos, 'matches': number(p.get('games'), True), 'minutes': number(p.get('time')),
                        'goals': goals, 'assists': number(p.get('assists'), True), 'xg': xg, 'xa': number(p.get('xA')),
                        'shots': shots, 'keypasses': number(p.get('key_passes'), True),
                        'conversion': goals/shots*100 if goals is not None and shots else None,
                        'delta': goals-xg if goals is not None and xg is not None else None,
                        **{k: None for k in ['passes', 'completed', 'accuracy', 'progressive', 'saves', 'savepct', 'conceded', 'xga', 'psxg', 'prevented', 'clean', 'tackles', 'interceptions']}})
    matches = []
    dates = raw.get('dates')
    if not isinstance(dates, list) or len(dates) != 380:
        raise ValueError('Expected a 380-match schedule')
    for m in dates:
        if m.get('isResult') is not True:
            continue
        date = datetime.strptime(m['datetime'], '%Y-%m-%d %H:%M:%S')
        if not datetime(2026, 7, 1) <= date < datetime(2027, 7, 1):
            raise ValueError('Match outside 2026/27 season')
        matches.append({'id': identifier(m['id']), 'date': m['datetime'], 'home': name(m['h']['title']), 'away': name(m['a']['title']),
                        'home_id': identifier(m['h']['id']), 'away_id': identifier(m['a']['id']),
                        'home_goals': number(m['goals'].get('h'), True), 'away_goals': number(m['goals'].get('a'), True),
                        'home_xg': number(m['xG'].get('h')), 'away_xg': number(m['xG'].get('a')), 'minutes': 90})
    matches.sort(key=lambda m: (m['date'], m['id']))
    if len({p['id'] for p in players}) != len(players) or len({t['id'] for t in teams}) != 20 or len({m['id'] for m in matches}) != len(matches):
        raise ValueError('Duplicate identity')
    if not matches or sum(t['matches'] for t in teams) != len(matches)*2:
        raise ValueError('Inconsistent match coverage')
    if sum(t['goals'] for t in teams) != sum(t['conceded'] for t in teams):
        raise ValueError('Unbalanced goals')
    if sum(t['goals'] for t in teams) != sum(m['home_goals']+m['away_goals'] for m in matches):
        raise ValueError('Scores differ from team totals')
    if abs(sum(t['xg'] for t in teams)-sum(m['home_xg']+m['away_xg'] for m in matches)) > 0.02:
        raise ValueError('Expected-goal totals differ')
    team_ids = {t['id'] for t in teams}
    if any(m['home_id'] not in team_ids or m['away_id'] not in team_ids for m in matches):
        raise ValueError('Match with unknown team')
    datetime.fromisoformat(captured_at.replace('Z', '+00:00'))
    return {'metadata': {'source': 'Understat', 'url': PAGE, 'competition': 'LaLiga', 'season': '2026/27', 'season_id': 2026,
                         'imported_matches': len(matches), 'available_matches': 380, 'complete': len(matches) == 380,
                         'imported_at': captured_at, 'source_sha256': hashlib.sha256(json.dumps(raw, sort_keys=True).encode()).hexdigest(),
                         'notes': 'Temporada en curso. xG y xA del modelo Understat. Minutos de equipos: 90 por partido. Posiciones agrupadas desde Understat. Los jugadores con varios equipos conservan el agregado de la fuente. No hay paradas, goles ni xG recibidos de porteros; no se asigna a un portero el xG de su equipo.'},
            'players': players, 'teams': teams, 'matches': matches}


def atomic(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as handle:
            temporary = Path(handle.name)
            handle.write(content)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


def sqlite_bytes(payload):
    # Parameterized inserts: source names are values, never SQL statements.
    connection = sqlite3.connect(':memory:')
    try:
        connection.execute('CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)')
        connection.executemany('INSERT INTO metadata VALUES (?, ?)', [(k, json.dumps(v, ensure_ascii=False)) for k, v in payload['metadata'].items()])
        for table in ['players', 'teams', 'matches']:
            records = payload[table]
            keys = list(records[0])
            definition = ','.join('"'+k+'" '+('TEXT' if k in {'id', 'name', 'team_id', 'team', 'pos', 'date', 'home', 'away', 'home_id', 'away_id'} else 'REAL')+(' PRIMARY KEY' if k == 'id' else '') for k in keys)
            connection.execute('CREATE TABLE '+table+' ('+definition+')')
            connection.executemany('INSERT INTO '+table+' VALUES ('+','.join('?' for _ in keys)+')', [tuple(r[k] for k in keys) for r in records])
        if connection.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
            raise ValueError('SQLite integrity check failed')
        connection.commit()
        return connection.serialize()
    finally:
        connection.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, help='Reuse an actual downloaded Understat response')
    parser.add_argument('--captured-at', help='UTC time of the reused source; default: input file modification time')
    parser.add_argument('--output-dir', type=Path, default=ROOT / 'dist/downloads')
    args = parser.parse_args()
    if args.input:
        if args.input.stat().st_size > MAX_BYTES:
            raise ValueError('Input exceeds size limit')
        body = decode_body(args.input.read_bytes())
        captured = args.captured_at or datetime.fromtimestamp(args.input.stat().st_mtime, timezone.utc).isoformat()
        raw = json.loads(body)
    else:
        body = download(ENDPOINT)
        try:
            raw = json.loads(body)
        except (ValueError, UnicodeError):
            # The current site may put its data directly in the league HTML.
            body = download(PAGE)
            raw = extract_page(body.decode('utf-8'))
        captured = datetime.now(timezone.utc).isoformat()
    payload = adapt(raw, captured)
    document = json.dumps(payload, ensure_ascii=False, separators=(',', ':')).encode()
    database = gzip.compress(sqlite_bytes(payload), mtime=0)
    # Build and validate both in memory before replacing either public artifact.
    atomic(args.output_dir / 'understat-laliga-2026-27.json', document)
    atomic(args.output_dir / 'understat-laliga-2026-27.sqlite.gz', database)
    print(json.dumps({'source': 'Understat', 'season': '2026/27', 'teams': len(payload['teams']), 'players': len(payload['players']),
                      'matches': len(payload['matches']), 'captured_at': captured}, ensure_ascii=False))


if __name__ == '__main__':
    main()
