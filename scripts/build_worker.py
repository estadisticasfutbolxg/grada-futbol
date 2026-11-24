#!/usr/bin/env python3
"""Bundle the existing buildless site and read-only refresh service without dependencies.

The generated Worker embeds gzip assets, including real provider captures. It is
ignored by Git; only source and this generator belong in the repository.
"""
import base64
import gzip
import hashlib
import json
from pathlib import Path
import re
import subprocess
import xml.etree.ElementTree as ET
from download_club_badges import validate_png

ROOT = Path(__file__).resolve().parents[1]


def build():
    modules = {}

    def include(path):
        path = path.resolve()
        if not path.is_relative_to(ROOT) or path.suffix not in {'.cjs', '.js', '.json'}:
            raise ValueError('Unsupported bundle dependency')
        key = path.relative_to(ROOT).as_posix()
        if key in modules:
            return key
        source = path.read_text()
        modules[key] = None
        dependencies = {}
        if path.suffix == '.json':
            source = 'module.exports=' + json.dumps(json.loads(source), ensure_ascii=False) + ';'
        else:
            for target in re.findall(r"\brequire\(['\"]([^'\"]+)['\"]\)", source):
                if not target.startswith('.'):
                    raise ValueError('External dependencies are not supported')
                dependencies[target] = include(path.parent / target)
        modules[key] = (source, dependencies)
        return key

    entry = include(ROOT / 'worker/app.cjs')
    assets = {}
    client_files = ['index.html','style.css','leagues.json','leagues.js','metrics.js','sampling.js','fairplay.js','security.js','understat.js','laliga.js','roles.js','nationality.js','fotmob.js','identity.js','positions.js','combined.js','scopes.js','clubs.js','branding.js','filters.js','radar.js','squads.js','scores.js','formations.js','nations.js','explore.js','components.js','profiles.js','refresh.js','owner.js','dates.js','app.js']
    files = [ROOT / 'dist' / filename for filename in client_files]
    client_bodies = {filename: (ROOT / 'dist' / filename).read_bytes() for filename in client_files}
    # Preserve the source script order in one immutable browser request. Individual
    # modules remain available for diagnostics and ordinary local development.
    markup = client_bodies['index.html'].decode()
    script_pattern = r'<script src="([a-z-]+\.js)"></script>'
    scripts = re.findall(script_pattern, markup)
    if not scripts or scripts[-1] != 'app.js' or len(set(scripts)) != len(scripts) or any(name not in client_bodies for name in scripts):
        raise ValueError('Unexpected browser entrypoints')
    bundle_name = 'grada-client.js'
    client_bodies[bundle_name] = ("'use strict';\n" + '\n;\n'.join(client_bodies[name].decode() for name in scripts)).encode()
    files.append(ROOT / 'dist' / bundle_name)
    markup = re.sub(script_pattern, '', markup)
    markup = markup.replace('</body>', '<script defer src="' + bundle_name + '"></script></body>')
    client_bodies['index.html'] = markup.encode()
    def version_asset(match):
        filename = match[2]
        body = client_bodies.get(filename)
        if body is None:
            return match[0]
        return match[1] + filename + '?v=' + hashlib.sha256(body).hexdigest()[:16] + match[3]
    # A new HTML response must load one coherent set of client modules, even if
    # the browser still has files from the previous deployment in its cache.
    client_bodies['index.html'] = re.sub(r'''(\b(?:src|href)=["'])([^"']+)(["'])''', version_asset, client_bodies['index.html'].decode()).encode()
    expected = json.loads((ROOT / 'dist/leagues.json').read_text())
    for league in expected:
        for filename in [league['espnFile'], f"fotmob-{league['id']}-2026-27.json"] + (['understat-laliga-2026-27.json'] if league['primary'] == 'Understat' else []):
            path = ROOT / 'dist/downloads' / filename
            if not path.is_file():
                raise ValueError('Missing real source capture: ' + filename)
            files.append(path)
    # Only bounded local PNG crests and reviewed vector flags are deployable images.
    asset_root = (ROOT / 'dist/assets').resolve()
    for path in sorted((asset_root / 'clubs').glob('*.png')):
        if not path.resolve().is_relative_to(asset_root) or not re.fullmatch(r'[1-9][0-9]{0,8}', path.stem):
            raise ValueError('Unsafe crest path')
        validate_png(path.read_bytes())
        files.append(path)
    for name in ['es', 'gb-eng', 'it', 'de', 'fr']:
        path = asset_root / 'flags' / (name + '.svg')
        body = path.read_bytes()
        if len(body) > 128 * 1024 or b'<!' in body:
            raise ValueError('Unexpected flag document')
        flag = ET.fromstring(body)
        for element in flag.iter():
            if element.tag not in {'{http://www.w3.org/2000/svg}svg', '{http://www.w3.org/2000/svg}path', '{http://www.w3.org/2000/svg}g'}:
                raise ValueError('Unsupported flag element')
            if any(key.lower().startswith('on') or 'href' in key.lower() or 'url(' in value.lower() or '@import' in value.lower() for key, value in element.attrib.items()):
                raise ValueError('Active or external flag content')
        files.append(path)
    files.append(asset_root / 'flags/LICENSE.txt')
    for path in files:
        body = client_bodies.get(path.name) if path.parent == ROOT / 'dist' else path.read_bytes()
        mime = {'.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.txt': 'text/plain'}[path.suffix]
        content_type = mime if path.suffix == '.png' else mime + '; charset=utf-8'
        assets['/' + path.relative_to(ROOT / 'dist').as_posix()] = {'type': content_type, 'sha': hashlib.sha256(body).hexdigest(), 'gzip': base64.b64encode(gzip.compress(body, mtime=0)).decode()}
    # ID aliases preserve bookmarks without serving the archived provider data.
    legacy = subprocess.run(['node', str(ROOT / 'scripts/build_legacy_links.cjs')], cwd=ROOT, capture_output=True, check=True, text=True)
    aliases = json.loads(legacy.stdout)
    if not isinstance(aliases, dict) or len(aliases) > 2000 or any(not re.fullmatch(r'[a-z-]+\|combined:\d{1,12}', key) or not isinstance(value, str) or not re.fullmatch(r'combined:\d{1,12}', value) for key, value in aliases.items()):
        raise ValueError('Invalid legacy player links')
    body = json.dumps(aliases, separators=(',', ':')).encode()
    assets['/legacy-player-links.json'] = {'type': 'application/json; charset=utf-8', 'sha': hashlib.sha256(body).hexdigest(), 'gzip': base64.b64encode(gzip.compress(body, mtime=0)).decode()}
    factories = ',\n'.join(json.dumps(k) + ':function(module,exports,require){\n' + v[0] + '\n}' for k, v in modules.items())
    dependency_map = {k: v[1] for k, v in modules.items()}
    bundle = 'const factories={' + factories + '};\nconst dependencies=' + json.dumps(dependency_map) + ';\n'
    bundle += "const loaded=new Map();function load(id){if(loaded.has(id))return loaded.get(id).exports;const module={exports:{}};loaded.set(id,module);factories[id](module,module.exports,name=>{const target=dependencies[id][name];if(!target)throw new Error('Unknown bundled module');return load(target);});return module.exports;}\n"
    bundle += 'const assets=' + json.dumps(assets, separators=(',', ':')) + ';\nconst app=load(' + json.dumps(entry) + ');\nexport default {fetch(request,env){return app.handle(request,assets,{env});}};\n'
    output = ROOT / 'dist/server/index.js'
    output.parent.mkdir(exist_ok=True)
    output.write_text(bundle)
    print(json.dumps({'worker': str(output), 'modules': len(modules), 'assets': len(assets), 'bytes': len(bundle.encode()), 'sha256': hashlib.sha256(bundle.encode()).hexdigest()}))


if __name__ == '__main__':
    build()
