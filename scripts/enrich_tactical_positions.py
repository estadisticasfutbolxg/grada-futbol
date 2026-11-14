#!/usr/bin/env python3
"""Enrich verified squad positions from cached HTML; preserve statistics and SQLite."""
import argparse
import gzip
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('fotmob_import', ROOT / 'scripts/import_fotmob.py')
fotmob = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fotmob)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--league', choices=fotmob.LEAGUES, required=True)
    parser.add_argument('--input-dir', type=Path, required=True, help='Real <team-id>.html squad pages; mtimes are preserved as capture dates')
    parser.add_argument('--output-dir', type=Path, default=ROOT / 'dist/downloads')
    args = parser.parse_args()
    source = args.output_dir / f'fotmob-{args.league}-2026-27.json'
    with tempfile.TemporaryDirectory(dir=args.output_dir) as temporary:
        output = Path(temporary) / 'enriched.json'
        options = {'league': args.league, 'source': str(source.resolve()), 'folder': str(args.input_dir.resolve()), 'output': str(output)}
        result = subprocess.run(['node', str(ROOT / 'scripts/enrich_tactical_positions.cjs')], input=json.dumps(options), text=True, capture_output=True, check=True, timeout=60)
        payload = json.loads(output.read_text())
        database = gzip.compress(fotmob.database(payload), mtime=0)
        # Both artifacts are prepared before promoting either; two file renames
        # are not a filesystem transaction. Build/publish only after validation.
        fotmob.atomic(source.with_suffix('.sqlite.gz'), database)
        fotmob.atomic(source, output.read_bytes())
        print(result.stdout.strip())


if __name__ == '__main__':
    main()
