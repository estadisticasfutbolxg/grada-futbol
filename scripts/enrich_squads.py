#!/usr/bin/env python3
"""Add verified squad positions/nationalities to real FotMob JSON and SQLite."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import gzip
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import urllib.request
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('fotmob_import', ROOT / 'scripts/import_fotmob.py')
fotmob = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fotmob)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--league', choices=fotmob.LEAGUES, required=True)
    parser.add_argument('--input-dir', type=Path, help='Reuse original <team-id>.html files without network')
    parser.add_argument('--output-dir', type=Path, default=ROOT / 'dist/downloads')
    args = parser.parse_args()
    source = args.output_dir / f'fotmob-{args.league}-2026-27.json'
    data = json.loads(source.read_text())
    folder = args.input_dir or ROOT / 'data/raw/fotmob-squads' / args.league
    folder.mkdir(parents=True, exist_ok=True)
    failed = []
    if not args.input_dir:
        def download(team):
            try:
                team_id = str(team['id'])
                if not team_id.isascii() or not team_id.isdigit():
                    raise ValueError('Invalid team ID')
                url = f'https://www.fotmob.com/teams/{team_id}/squad/team'
                request = urllib.request.Request(url, headers={'User-Agent': 'GRADA football statistics/1.0'})
                with urllib.request.urlopen(request, timeout=25) as response:
                    if urlparse(response.geturl()).hostname != 'www.fotmob.com':
                        raise ValueError('Unexpected squad redirect')
                    body = response.read(fotmob.MAX_BYTES + 1)
                if len(body) > fotmob.MAX_BYTES:
                    raise ValueError('Squad too large')
                fotmob.atomic(folder / f'{team_id}.html', body)
                return None
            except (OSError, ValueError):
                return str(team['id'])
        with ThreadPoolExecutor(max_workers=2) as pool:
            failed = [team for team in pool.map(download, data['teams']) if team]
    with tempfile.TemporaryDirectory(dir=args.output_dir) as temporary:
        output = Path(temporary) / 'enriched.json'
        result = subprocess.run(['node', str(ROOT / 'scripts/enrich_squads.cjs')], input=json.dumps({'league': args.league, 'source': str(source), 'folder': str(folder), 'output': str(output)}), text=True, capture_output=True, check=True, timeout=60)
        payload = json.loads(output.read_text())
        # Both representations validate before promotion. Season statistics and
        # their timestamps remain unchanged; metadata has its own capture date.
        database = gzip.compress(fotmob.database(payload), mtime=0)
        fotmob.atomic(source.with_suffix('.sqlite.gz'), database)
        fotmob.atomic(source, output.read_bytes())
        report = json.loads(result.stdout)
        report['download_failed_teams'] = failed
        print(json.dumps(report))


if __name__ == '__main__':
    main()
