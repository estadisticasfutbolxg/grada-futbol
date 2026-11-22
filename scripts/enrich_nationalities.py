#!/usr/bin/env python3
"""Country metadata from cached squads; prepare JSON and SQLite before promotion."""
import argparse
import gzip
import importlib.util
import json
from pathlib import Path
import shutil
import sqlite3
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('fotmob_import', ROOT / 'scripts/import_fotmob.py')
fotmob = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fotmob)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input-root', type=Path, required=True, help='Cached league/team.html pages and original results.json')
    parser.add_argument('--data-dir', type=Path, default=ROOT / 'dist/downloads')
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(dir=args.data_dir) as temporary:
        stage = Path(temporary)
        for league in fotmob.LEAGUES:
            name = f'fotmob-{league}-2026-27.json'
            shutil.copy2(args.data_dir / name, stage / name)
        result = subprocess.run(['node', str(ROOT / 'scripts/enrich_nationalities.cjs'), '--input-root', str(args.input_root.resolve()), '--data-dir', str(stage)], text=True, capture_output=True, check=True, timeout=90)
        prepared = []
        for league in fotmob.LEAGUES:
            name = f'fotmob-{league}-2026-27.json'
            payload = json.loads((stage / name).read_text())
            database = fotmob.database(payload)
            connection = sqlite3.connect(':memory:')
            try:
                connection.deserialize(database)
                rows = connection.execute('SELECT id,stats_json FROM players').fetchall()
                assert {key: json.loads(value).get('nationality') for key, value in rows} == {p['id']: p.get('nationality') for p in payload['players']}
            finally:
                connection.close()
            output = stage / name.replace('.json', '.sqlite.gz')
            output.write_bytes(gzip.compress(database, mtime=0))
            prepared.extend([stage / name, output])
        # Prepare all ten files first. Renames are individually atomic; publish
        # only after validating the complete combined set in its staging folder.
        for item in prepared:
            item.replace(args.data_dir / item.name)
        print(result.stdout.strip())


if __name__ == '__main__':
    main()
