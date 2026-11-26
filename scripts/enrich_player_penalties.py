#!/usr/bin/env python3
"""Refresh only published penalties conceded; preserve all other captured statistics."""
import argparse
import copy
from datetime import datetime, timezone
import gzip
import hashlib
import json
from pathlib import Path
import subprocess
import urllib.request
import import_fotmob as fotmob


def enrich(data, page, league, minutes_page=None):
    result = copy.deepcopy(data)
    players = {str(p['id']): p for p in result['players']}
    for p in players.values():
        p['penaltiesCommitted'] = None
        p.setdefault('metricContexts', {}).pop('penaltiesCommitted', None)
    accepted, skipped = [], []
    teams = {str(t['id']) for t in result['teams']}
    for row in page['data']['statsData']:
        player = players.get(str(row['id']))
        if not player or str(row['teamId']) not in teams or player['team_id'] != str(row['teamId']):
            skipped.append(str(row['id']))
            continue
        if row['statValue'].get('format') != 'number':
            raise ValueError('Penalty count format invalid')
        player['penaltiesCommitted'] = fotmob.number(row['statValue']['value'], True)
        player['metricContexts']['penaltiesCommitted'] = fotmob.penalty_context(player, row, page, minutes_page, league)
        accepted.append({'id': player['id'], 'name': player['name'], 'team': player['team'],
                         'penaltiesCommitted': player['penaltiesCommitted']})
    result['metadata'].setdefault('pages', {})['penalty_conceded'] = {k: v for k, v in page.items() if k != 'data'}
    result['metadata'].setdefault('coverage', {})['penalty_conceded'] = len(page['data']['statsData'])
    if minutes_page:
        result['metadata']['pages']['penalty_minutes'] = {k: v for k, v in minutes_page.items() if k != 'data'}
    return result, {'league': league['id'], 'updatedPlayers': accepted, 'unmatchedIDs': skipped,
                    'rankingRows': len(page['data']['statsData']), 'individualMatchesUpdated': 0}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--league', choices=fotmob.LEAGUES, required=True)
    parser.add_argument('--input', type=Path)
    parser.add_argument('--output-dir', type=Path, default=fotmob.ROOT / 'dist/downloads')
    parser.add_argument('--captured-at')
    parser.add_argument('--minutes-input', type=Path)
    parser.add_argument('--minutes-captured-at')
    args = parser.parse_args()
    league = fotmob.LEAGUES[args.league]
    url = fotmob.base_url(league, 'penalty_conceded') + '/players/penalty_conceded/' + league['fotmobSlug']
    if args.input:
        body = args.input.read_bytes()
        captured = args.captured_at or datetime.fromtimestamp(args.input.stat().st_mtime, timezone.utc).isoformat()
    else:
        with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'GRADA football statistics/1.0'}), timeout=30) as response:
            body = response.read(fotmob.MAX_BYTES + 1)
        captured = datetime.now(timezone.utc).isoformat()
        fotmob.atomic(fotmob.ROOT / 'data/raw/penalties' / league['id'] / 'penalty_conceded.html', body)
    if len(body) > fotmob.MAX_BYTES or not datetime.fromisoformat(captured).tzinfo:
        raise ValueError('Invalid capture size/date')
    page = {'url': url, 'captured_at': captured, 'sha256': hashlib.sha256(body).hexdigest(),
            'data': fotmob.parse(body, 'penalty_conceded', league)}
    minutes_page = None
    if args.minutes_input:
        minute_body = args.minutes_input.read_bytes()
        if len(minute_body) > fotmob.MAX_BYTES:
            raise ValueError('Minutes capture too large')
        minute_date = args.minutes_captured_at or datetime.fromtimestamp(args.minutes_input.stat().st_mtime, timezone.utc).isoformat()
        effective = {**league, 'fotmobSeason': fotmob.stat_season(league, 'penalty_conceded')}
        minutes_page = {'url': fotmob.base_url(effective) + '/players/mins_played/' + league['fotmobSlug'], 'captured_at': minute_date, 'sha256': hashlib.sha256(minute_body).hexdigest(), 'data': fotmob.parse(minute_body, 'mins_played', effective)}
    elif not args.input:
        effective = {**league, 'fotmobSeason': fotmob.stat_season(league, 'penalty_conceded')}
        minute_url = fotmob.base_url(effective) + '/players/mins_played/' + league['fotmobSlug']
        with urllib.request.urlopen(urllib.request.Request(minute_url, headers={'User-Agent': 'GRADA football statistics/1.0'}), timeout=30) as response:
            minute_body = response.read(fotmob.MAX_BYTES + 1)
        if len(minute_body) > fotmob.MAX_BYTES:
            raise ValueError('Minutes capture too large')
        minute_date = datetime.now(timezone.utc).isoformat()
        fotmob.atomic(fotmob.ROOT / 'data/raw/penalties' / league['id'] / 'mins_played.html', minute_body)
        minutes_page = {'url': minute_url, 'captured_at': minute_date, 'sha256': hashlib.sha256(minute_body).hexdigest(), 'data': fotmob.parse(minute_body, 'mins_played', effective)}
    path = args.output_dir / f'fotmob-{league["id"]}-2026-27.json'
    data, report = enrich(json.loads(path.read_text()), page, league, minutes_page)
    document = json.dumps(data, ensure_ascii=False, separators=(',', ':')).encode()
    subprocess.run(['node', '-e', "require('./dist/fotmob').validate(JSON.parse(require('fs').readFileSync(0,'utf8')))"], cwd=fotmob.ROOT, input=document, check=True)
    database = gzip.compress(fotmob.database(data), mtime=0)
    fotmob.atomic(path, document)
    fotmob.atomic(path.with_suffix('.sqlite.gz'), database)
    print(json.dumps(report, ensure_ascii=False))


if __name__ == '__main__':
    main()
