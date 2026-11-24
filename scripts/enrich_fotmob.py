#!/usr/bin/env python3
"""Add verified FotMob player profiles to existing real JSON and SQLite captures."""
import argparse
import concurrent.futures
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
    parser.add_argument('--league', choices=fotmob.LEAGUES, default='laliga')
    parser.add_argument('--input-dir', type=Path)
    parser.add_argument('--output-dir', type=Path, default=ROOT / 'dist/downloads')
    parser.add_argument('--keepers-only', action='store_true', help='Download only verified keeper records; keep other ranking data')
    parser.add_argument('--minimum-minutes', type=int, help='Limit profile requests to this verified sample; always include keepers')
    parser.add_argument('--missing-only', action='store_true', help='Reuse cached profile HTML with its original capture time')
    args = parser.parse_args()
    if args.minimum_minutes is not None and args.minimum_minutes < 0:
        parser.error('Minimum minutes must be non-negative')
    source = args.output_dir / f'fotmob-{args.league}-2026-27.json'
    data = json.loads(source.read_text())
    folder = args.input_dir or ROOT / 'data/raw/fotmob-profiles' / args.league
    folder.mkdir(parents=True, exist_ok=True)
    if not args.input_dir:
        def download(player):
            try:
                cached = folder / f"{player['id']}.html"
                if args.missing_only and cached.is_file() and 0 < cached.stat().st_size <= fotmob.MAX_BYTES:
                    return True
                url = f"https://www.fotmob.com/players/{player['id']}/player"
                request = urllib.request.Request(url, headers={'User-Agent': 'GRADA football statistics/1.0'})
                with urllib.request.urlopen(request, timeout=20) as response:
                    if urlparse(response.geturl()).hostname != 'www.fotmob.com':
                        raise ValueError('Unexpected profile redirect')
                    body = response.read(fotmob.MAX_BYTES + 1)
                if len(body) > fotmob.MAX_BYTES:
                    raise ValueError('Profile too large')
                fotmob.atomic(folder / f"{player['id']}.html", body)
            except Exception:
                # Missing profiles retain the valid ranking data and are reported.
                return False
            return True
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            selected = [p for p in data['players'] if (not args.keepers_only or p['pos'] == 'POR') and (args.minimum_minutes is None or p['minutes'] >= args.minimum_minutes or p['pos'] == 'POR')]
            list(pool.map(download, selected))
    with tempfile.TemporaryDirectory(dir=args.output_dir) as temporary:
        output = Path(temporary) / 'enriched.json'
        result = subprocess.run(['node', str(ROOT / 'scripts/enrich_profiles.cjs')], input=json.dumps({'league': args.league, 'source': str(source), 'folder': str(folder), 'output': str(output), 'previous': str(ROOT / 'dist/downloads' / source.name), 'keepersOnly': args.keepers_only, 'minimumMinutes': args.minimum_minutes}), text=True, capture_output=True, check=True)
        payload = json.loads(output.read_text())
        database = gzip.compress(fotmob.database(payload), mtime=0)
        # Prepare and validate the complete pair before promoting either artifact.
        fotmob.atomic(source.with_suffix('.sqlite.gz'), database)
        fotmob.atomic(source, output.read_bytes())
        print(result.stdout)


if __name__ == '__main__':
    main()
