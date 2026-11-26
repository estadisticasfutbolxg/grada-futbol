#!/usr/bin/env python3
"""Download the public LaLiga Fantasy table as a separate, attributed dataset."""
import argparse
import csv
from datetime import datetime, timezone
import hashlib
from html.parser import HTMLParser
import io
import json
from pathlib import Path
import re
import urllib.request
from urllib.parse import urlsplit
from import_fotmob import atomic

URL = 'https://www.analiticafantasy.com/fantasy-la-liga/estadisticas'
MAX_BYTES = 12 * 1024 * 1024


class Scripts(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.parts, self.current = [], None

    def handle_starttag(self, tag, attrs):
        if tag == 'script':
            self.current = []

    def handle_data(self, data):
        if self.current is not None:
            self.current.append(data)

    def handle_endtag(self, tag):
        if tag == 'script' and self.current is not None:
            self.parts.append(''.join(self.current))
            self.current = None


def parse(body):
    parser = Scripts()
    parser.feed(body.decode('utf-8'))
    chunks = []
    for script in parser.parts:
        prefix = 'self.__next_f.push('
        if script.startswith(prefix) and script.endswith(')'):
            value = json.loads(script[len(prefix):-1])
            if isinstance(value, list) and len(value) == 2 and value[0] == 1 and isinstance(value[1], str):
                chunks.append(value[1])
    text = ''.join(chunks)
    matches = list(re.finditer(r'"seasonYear"\s*:\s*2026\s*,\s*"initialPlayers"\s*:\s*', text))
    if len(matches) != 1:
        raise ValueError('Unique LaLiga Fantasy 2026/27 payload not confirmed')
    players, _ = json.JSONDecoder().raw_decode(text[matches[0].end():])
    if not isinstance(players, list) or not players or len(players) > 3000:
        raise ValueError('Invalid player table')
    ids = set()
    for player in players:
        pid = player.get('playerId')
        if not isinstance(pid, int) or isinstance(pid, bool) or pid in ids or not isinstance(player.get('playerName'), str) or not player['playerName'].strip():
            raise ValueError('Invalid or duplicate player identity')
        ids.add(pid)
        if any(isinstance(value, (dict, list)) for value in player.values()):
            raise ValueError('Unexpected nested table value')
    return players


def csv_bytes(players):
    keys = list(dict.fromkeys(key for player in players for key in player))
    output = io.StringIO(newline='')
    writer = csv.DictWriter(output, fieldnames=keys)
    writer.writeheader()
    for player in players:
        writer.writerow({key: "'" + value if isinstance(value, str) and value.lstrip().startswith(('=', '+', '-', '@')) else value for key, value in player.items()})
    return output.getvalue().encode('utf-8-sig')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path)
    parser.add_argument('--output-dir', type=Path, default=Path('data/analitica-fantasy'))
    args = parser.parse_args()
    if args.input:
        body = args.input.read_bytes()
        captured = datetime.fromtimestamp(args.input.stat().st_mtime, timezone.utc).isoformat()
    else:
        request = urllib.request.Request(URL, headers={'User-Agent': 'GRADA football statistics/1.0'})
        with urllib.request.urlopen(request, timeout=40) as response:
            if urlsplit(response.url).hostname != 'www.analiticafantasy.com':
                raise ValueError('Unexpected source redirect')
            body = response.read(MAX_BYTES + 1)
        captured = datetime.now(timezone.utc).isoformat()
    if len(body) > MAX_BYTES:
        raise ValueError('Source too large')
    players = parse(body)
    metadata = {'source': 'Analítica Fantasy', 'url': URL, 'competition': 'LaLiga Fantasy', 'season': '2026/27',
                'captured_at': captured, 'sha256': hashlib.sha256(body).hexdigest(), 'players': len(players),
                'notes': 'Published fantasy counts and scoring fields, kept separate from GRADA scores and other provider definitions. No license permission is inferred from public access.'}
    atomic(args.output_dir / 'analitica-fantasy-laliga-2026-27.json', json.dumps({'metadata': metadata, 'players': players}, ensure_ascii=False).encode())
    atomic(args.output_dir / 'analitica-fantasy-laliga-2026-27.csv', csv_bytes(players))
    print(json.dumps(metadata, ensure_ascii=False))


if __name__ == '__main__':
    main()
