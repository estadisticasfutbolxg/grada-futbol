#!/usr/bin/env python3
"""Cache verified FotMob club IDs as local PNGs, without refreshing statistics."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import re
import struct
import urllib.request
import zlib

ROOT = Path(__file__).resolve().parents[1]
PNG_LIMIT = 512 * 1024
ID = re.compile(r'[1-9][0-9]{0,8}')


def badge_url(club_id):
    if not ID.fullmatch(str(club_id)):
        raise ValueError('Invalid FotMob club ID')
    return f'https://images.fotmob.com/image_resources/logo/teamlogo/{club_id}.png'


def validate_png(body):
    if len(body) > PNG_LIMIT or body[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError('Expected a bounded PNG image')
    offset = 8
    dimensions = None
    image_data = False
    while offset + 12 <= len(body):
        length = struct.unpack('>I', body[offset:offset + 4])[0]
        end = offset + 12 + length
        if end > len(body):
            raise ValueError('Truncated PNG chunk')
        kind = body[offset + 4:offset + 8]
        payload = body[offset + 8:offset + 8 + length]
        crc = struct.unpack('>I', body[offset + 8 + length:end])[0]
        if zlib.crc32(kind + payload) & 0xffffffff != crc:
            raise ValueError('Invalid PNG checksum')
        if offset == 8:
            if kind != b'IHDR' or length != 13:
                raise ValueError('Missing PNG header')
            dimensions = struct.unpack('>II', payload[:8])
            if not all(1 <= n <= 512 for n in dimensions):
                raise ValueError('Unexpected crest dimensions')
        image_data |= kind == b'IDAT' and length > 0
        if kind == b'IEND':
            if length != 0 or end != len(body) or not image_data:
                raise ValueError('Invalid PNG ending')
            return dimensions
        offset = end
    raise ValueError('Incomplete PNG')


class SameImageRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if newurl != req.full_url:
            raise ValueError('Unexpected image redirect')
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def club_ids(data_dir):
    clubs = {}
    for league in json.loads((ROOT / 'dist/leagues.json').read_text()):
        data = json.loads((data_dir / f"fotmob-{league['id']}-2026-27.json").read_text())
        if data['metadata'].get('source') != 'FotMob' or data['metadata'].get('league_key') != league['id']:
            raise ValueError('Club list belongs to another source or league')
        rows = data['teams']
        if len(rows) != league['teams'] or len({str(t['id']) for t in rows}) != len(rows):
            raise ValueError('Unexpected club coverage')
        for team in rows:
            club_id = str(team['id'])
            badge_url(club_id)
            clubs.setdefault(club_id, {'name': team['name'], 'leagues': []})['leagues'].append(league['id'])
    return clubs


def download(club_id, destination):
    path = destination / f'{club_id}.png'
    if path.is_file():
        try:
            validate_png(path.read_bytes())
            return {'id': club_id, 'status': 'cached'}
        except ValueError:
            pass
    opener = urllib.request.build_opener(SameImageRedirect())
    last_error = None
    for _ in range(2):
        try:
            request = urllib.request.Request(badge_url(club_id), headers={'User-Agent': 'GRADA/1.0 (private football dashboard)'})
            with opener.open(request, timeout=20) as response:
                body = response.read(PNG_LIMIT + 1)
            dimensions = validate_png(body)
            temporary = path.with_suffix('.png.tmp')
            temporary.write_bytes(body)
            temporary.replace(path)
            return {'id': club_id, 'status': 'downloaded', 'dimensions': dimensions}
        except (OSError, ValueError) as error:
            last_error = str(error)
    return {'id': club_id, 'status': 'failed', 'error': last_error}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data-dir', type=Path, default=ROOT / 'dist/downloads')
    parser.add_argument('--output-dir', type=Path, default=ROOT / 'dist/assets/clubs')
    args = parser.parse_args()
    clubs = club_ids(args.data_dir)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(lambda club_id: download(club_id, args.output_dir), sorted(clubs)))
    manifest = {}
    for result in results:
        path = args.output_dir / f"{result['id']}.png"
        if result['status'] != 'failed':
            body = path.read_bytes()
            manifest[result['id']] = {**clubs[result['id']], 'url': badge_url(result['id']), 'sha256': hashlib.sha256(body).hexdigest(), 'dimensions': validate_png(body)}
    (args.output_dir / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    failures = [r for r in results if r['status'] == 'failed']
    print(json.dumps({'clubs': len(clubs), 'available': len(manifest), 'downloaded': sum(r['status'] == 'downloaded' for r in results), 'failed': failures}, ensure_ascii=False))
    return 1 if failures else 0


if __name__ == '__main__':
    raise SystemExit(main())
