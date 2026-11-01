#!/usr/bin/env python3
"""Download the public ESPN season and reuse the browser adapter. No dependencies."""
import argparse
import concurrent.futures
import json
import os
from pathlib import Path
import subprocess
import tempfile
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
STANDINGS = 'https://site.api.espn.com/apis/v2/sports/soccer/esp.1/standings?season=2026'


def download(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'GRADA football statistics/1.0'})
    with urllib.request.urlopen(request, timeout=25) as response:
        return json.load(response)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'dist/downloads/laliga-2026-27.json')
    args = parser.parse_args()
    standings = download(STANDINGS)
    rows = [row for child in standings.get('children', []) for row in child.get('standings', {}).get('entries', [])]
    if standings.get('season', {}).get('year') != 2026 or len(rows) != 20:
        raise ValueError('La fuente no devuelve LaLiga 2026/27 con 20 equipos')

    def roster(row):
        team_id = str(row['team']['id'])
        if not team_id.isdigit():
            raise ValueError('Identificador de equipo inválido')
        return download(f'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/teams/{team_id}/roster?season=2026')

    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        rosters = list(pool.map(roster, rows))
    # One definition for web refresh and offline generation; validate before writing.
    script = "const a=require('./dist/laliga.js');let s='';process.stdin.on('data',c=>s+=c);process.stdin.on('end',()=>{const d=JSON.parse(s);process.stdout.write(JSON.stringify(a.adapt(d.standings,d.rosters)));});"
    result = subprocess.run(['node', '-e', script], cwd=ROOT,
                            input=json.dumps({'standings': standings, 'rosters': rosters}),
                            text=True, capture_output=True, check=True, timeout=30)
    payload = json.loads(result.stdout)
    output = args.output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=output.parent, delete=False) as handle:
            temporary = Path(handle.name)
            json.dump(payload, handle, ensure_ascii=False, separators=(',', ':'))
            handle.write('\n')
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, output)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
    print(json.dumps({'output': str(output), 'source': payload['metadata']['source'],
                      'season': payload['metadata']['season'], 'teams': len(payload['teams']),
                      'players': len(payload['players']), 'matches': payload['metadata']['imported_matches'],
                      'imported_at': payload['metadata']['imported_at']}, ensure_ascii=False))


if __name__ == '__main__':
    main()
