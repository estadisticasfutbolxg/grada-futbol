#!/usr/bin/env python3
"""Refresh verified FotMob team statistics without replacing player captures."""
import argparse
import concurrent.futures
import copy
from datetime import datetime, timezone
import gzip
import hashlib
import json
from pathlib import Path
import subprocess
import urllib.request

import import_fotmob as fotmob


def enrich(data, pages, league):
    """Require a complete, current club set before changing the copied document."""
    expected = {str(t['id']) for t in data['teams']}
    required = {*fotmob.TEAM_SPECS, 'expected_goals_team', 'expected_goals_conceded_team'}
    if set(pages) != required or len(expected) != league['teams']:
        raise ValueError('Incomplete team capture')
    for stat, page in pages.items():
        ids = [str(r['id']) for r in page['data']['statsData']]
        if len(ids) != len(set(ids)) or set(ids) - expected or (stat in {'overview', 'expected_goals_team', 'expected_goals_conceded_team'} and set(ids) != expected):
            raise ValueError(f'Mismatched or duplicate club IDs: {stat}, missing {expected - set(ids)}, unexpected {set(ids) - expected}')
    old = {str(t['id']): t for t in data['teams']}
    for row in pages['overview']['data']['statsData']:
        if row['played'] < old[str(row['id'])]['matches']:
            raise ValueError('Team coverage moved backwards')
    result = copy.deepcopy(data)

    def context(team, stat):
        return {'source': 'FotMob', 'minutes': team['minutes'], 'matches': team['matches'],
                'captured_at': pages[stat]['captured_at'], 'url': pages[stat]['url']}

    fotmob.extend_teams(result, pages, league, context)
    fotmob.extend_team_xg(result, pages, league, context)
    result['metadata']['pages'].update({key: {k: v for k, v in page.items() if k != 'data'} for key, page in pages.items()})
    result['metadata']['coverage'].update({key: len(page['data']['statsData']) for key, page in pages.items()})
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--league', choices=fotmob.LEAGUES, default='laliga')
    parser.add_argument('--output-dir', type=Path, default=fotmob.ROOT / 'dist/downloads')
    parser.add_argument('--input-dir', type=Path)
    args = parser.parse_args()
    league = fotmob.LEAGUES[args.league]
    path = args.output_dir / f'fotmob-{league["id"]}-2026-27.json'
    before = json.loads(path.read_text())
    definitions = {**fotmob.TEAM_SPECS, **{k: fotmob.CORE[k] for k in ['expected_goals_team', 'expected_goals_conceded_team']}}

    def load(item):
        stat, (kind, filename) = item
        url = (f'https://www.fotmob.com/leagues/{league["fotmobId"]}/overview/{league["fotmobSlug"]}' if stat == 'overview'
               else f'{fotmob.base_url(league)}/{kind}/{stat}/{league["fotmobSlug"]}')
        if args.input_dir:
            local = args.input_dir / filename
            body = local.read_bytes()
            captured = datetime.fromtimestamp(local.stat().st_mtime, timezone.utc).isoformat()
        else:
            request = urllib.request.Request(url, headers={'User-Agent': 'GRADA football statistics/1.0'})
            with urllib.request.urlopen(request, timeout=25) as response:
                body = response.read(fotmob.MAX_BYTES + 1)
            captured = datetime.now(timezone.utc).isoformat()
            cached = fotmob.ROOT / 'data/raw/team-refresh' / league['id'] / filename
            fotmob.atomic(cached, body)
        if len(body) > fotmob.MAX_BYTES:
            raise ValueError('Source file too large')
        return stat, {'url': url, 'captured_at': captured, 'sha256': hashlib.sha256(body).hexdigest(),
                      'data': fotmob.parse(body, stat, league)}

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        pages = dict(pool.map(load, definitions.items()))
    result = enrich(before, pages, league)
    document = json.dumps(result, ensure_ascii=False, separators=(',', ':')).encode()
    subprocess.run(['node', '-e', "require('./dist/fotmob').validate(JSON.parse(require('fs').readFileSync(0,'utf8')))"],
                   cwd=fotmob.ROOT, input=document, check=True)
    database = gzip.compress(fotmob.database(result), mtime=0)
    fotmob.atomic(path, document)
    fotmob.atomic(path.with_suffix('.sqlite.gz'), database)
    print(json.dumps({'league': league['id'], 'teams': len(result['teams']), 'playersChanged': 0,
                      'matchesBefore': before['metadata']['imported_matches'], 'matchesAfter': result['metadata']['imported_matches']}))


if __name__ == '__main__':
    main()
