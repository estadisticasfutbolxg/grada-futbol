#!/usr/bin/env python3
"""Download the public ESPN season and reuse the browser adapter. No dependencies."""
import argparse
import concurrent.futures
from datetime import datetime, timezone
import gzip
import io
import json
import os
from pathlib import Path
import subprocess
import tempfile
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
LEAGUES={r['id']:r for r in json.loads((ROOT/'dist/leagues.json').read_text())}
STANDINGS = 'https://site.api.espn.com/apis/v2/sports/soccer/esp.1/standings?season=2026'


def download(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'GRADA football statistics/1.0'})
    with urllib.request.urlopen(request, timeout=25) as response:
        body=response.read(8*1024*1024+1)
    if body[:2]==b'\x1f\x8b':
        with gzip.GzipFile(fileobj=io.BytesIO(body)) as handle:body=handle.read(8*1024*1024+1)
    if len(body)>8*1024*1024:raise ValueError('Source response too large')
    return json.loads(body)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--league',choices=LEAGUES,default='laliga')
    parser.add_argument('--input-dir',type=Path,help='Original cached standings.json and roster-<id>.json; preserves earliest query time')
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    league=LEAGUES[args.league];inputs=[]
    def source(filename,url):
        if not args.input_dir:return download(url)
        path=args.input_dir/filename
        if path.stat().st_size>8*1024*1024:raise ValueError('Source file too large')
        inputs.append(path.stat().st_mtime);return json.loads(path.read_text())
    standings = source('standings.json',f"https://site.api.espn.com/apis/v2/sports/soccer/{league['espn']}/standings?season=2026")
    rows = [row for child in standings.get('children', []) for row in child.get('standings', {}).get('entries', [])]
    if standings.get('season', {}).get('year') != league['year'] or len(rows) != league['teams']:
        raise ValueError('Unexpected league season or team count')

    def roster(row):
        team_id = str(row['team']['id'])
        if not team_id.isdigit():
            raise ValueError('Identificador de equipo inválido')
        return source(f'roster-{team_id}.json',f"https://site.api.espn.com/apis/site/v2/sports/soccer/{league['espn']}/teams/{team_id}/roster?season=2026")

    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        rosters = list(pool.map(roster, rows))
    # One definition for web refresh and offline generation; validate before writing.
    captured=datetime.fromtimestamp(min(inputs),timezone.utc).isoformat() if inputs else datetime.now(timezone.utc).isoformat()
    script = "const a=require('./dist/laliga.js');let s='';process.stdin.on('data',c=>s+=c);process.stdin.on('end',()=>{const d=JSON.parse(s);process.stdout.write(JSON.stringify(a.adapt(d.standings,d.rosters,d.captured,d.league)));});"
    result = subprocess.run(['node', '-e', script], cwd=ROOT,
                            input=json.dumps({'standings': standings, 'rosters': rosters,'captured':captured,'league':league['id']}),
                            text=True, capture_output=True, check=True, timeout=30)
    payload = json.loads(result.stdout)
    output = (args.output or ROOT/'dist/downloads'/league['espnFile']).resolve()
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
