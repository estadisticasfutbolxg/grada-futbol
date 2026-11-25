#!/usr/bin/env python3
"""Remove inactive league captures, SQLite, managed caches and unused badges.

Dry run unless --apply is supplied. Original StatsBomb, FBref and archived
Understat files are outside the managed filename pattern and are preserved.
"""
import argparse
import json
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
SOURCE = re.compile(r'(?:fotmob|espn|combined)-([a-z0-9-]+)-\d{4}-\d{2}\.(?:json|sqlite(?:\.gz)?)')


def plan(data_dir, catalog, cache_root=None, assets_dir=None):
    allowed = {row['id'] for row in catalog}
    if not allowed or any(row.get('division') != 1 or not re.fullmatch(r'[a-z]{3}\.1', row['espn']) for row in catalog):
        raise ValueError('A verified first-division catalog is required')
    files, directories = [], []
    for path in data_dir.iterdir():
        match = SOURCE.fullmatch(path.name)
        if match and match[1] not in allowed and path.is_file():
            files.append(path)
    if cache_root is not None:
        for family in ['fotmob-profiles', 'fotmob-squads']:
            folder = cache_root / family
            if folder.is_dir():
                for path in folder.iterdir():
                    if path.is_dir() and not path.is_symlink() and re.fullmatch(r'[a-z0-9-]+', path.name) and path.name not in allowed:
                        directories.append(path)
    manifest = None
    if assets_dir is not None:
        clubs = {}
        for league in catalog:
            data = json.loads((data_dir / f"fotmob-{league['id']}-2026-27.json").read_text())
            if data['metadata'].get('source') != 'FotMob' or data['metadata'].get('league_key') != league['id'] or len(data['teams']) != league['teams']:
                raise ValueError('Unverified active club catalog')
            for team in data['teams']:
                club_id = str(team['id'])
                if not re.fullmatch(r'[1-9][0-9]{0,8}', club_id):
                    raise ValueError('Invalid club ID')
                clubs.setdefault(club_id, []).append(league['id'])
        for path in assets_dir.glob('*.png'):
            if re.fullmatch(r'[1-9][0-9]{0,8}', path.stem) and path.stem not in clubs:
                files.append(path)
        manifest_file = assets_dir / 'manifest.json'
        if manifest_file.exists():
            old = json.loads(manifest_file.read_text())
            manifest = {key: {**value, 'leagues': clubs[key]} for key, value in old.items() if key in clubs}
    return {'files': files, 'directories': directories, 'manifest': manifest}


def apply(result, assets_dir=None):
    for path in result['files']:
        path.unlink()
    for path in result['directories']:
        shutil.rmtree(path)
    if result['manifest'] is not None and assets_dir is not None:
        target = assets_dir / 'manifest.json'
        temporary = target.with_suffix('.json.tmp')
        temporary.write_text(json.dumps(result['manifest'], ensure_ascii=False, indent=2) + '\n')
        temporary.replace(target)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data-dir', type=Path, default=ROOT / 'dist/downloads')
    parser.add_argument('--cache-root', type=Path, default=ROOT / 'data/raw')
    parser.add_argument('--assets-dir', type=Path, default=ROOT / 'dist/assets/clubs')
    parser.add_argument('--sources-only', action='store_true', help='Clean another generated source folder without caches or images')
    parser.add_argument('--apply', action='store_true', help='Apply the reviewed deletion plan')
    args = parser.parse_args()
    catalog = json.loads((ROOT / 'dist/leagues.json').read_text())
    result = plan(args.data_dir, catalog, None if args.sources_only else args.cache_root, None if args.sources_only else args.assets_dir)
    report = {'applied': args.apply, 'files': [str(p) for p in result['files']], 'directories': [str(p) for p in result['directories']], 'fileBytes': sum(p.stat().st_size for p in result['files'])}
    if args.apply:
        apply(result, None if args.sources_only else args.assets_dir)
    print(json.dumps(report))


if __name__ == '__main__':
    main()
