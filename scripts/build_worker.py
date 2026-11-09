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
    client_files = ['index.html','style.css','leagues.json','leagues.js','metrics.js','security.js','understat.js','laliga.js','fotmob.js','combined.js','scopes.js','filters.js','radar.js','squads.js','scores.js','components.js','profiles.js','refresh.js','app.js']
    files = [ROOT / 'dist' / filename for filename in client_files]
    client_bodies = {filename: (ROOT / 'dist' / filename).read_bytes() for filename in client_files}
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
    for path in files:
        body = client_bodies.get(path.name) if path.parent == ROOT / 'dist' else path.read_bytes()
        mime = {'.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json'}[path.suffix]
        assets['/' + path.relative_to(ROOT / 'dist').as_posix()] = {'type': mime + '; charset=utf-8', 'sha': hashlib.sha256(body).hexdigest(), 'gzip': base64.b64encode(gzip.compress(body, mtime=0)).decode()}
    factories = ',\n'.join(json.dumps(k) + ':function(module,exports,require){\n' + v[0] + '\n}' for k, v in modules.items())
    dependency_map = {k: v[1] for k, v in modules.items()}
    bundle = 'const factories={' + factories + '};\nconst dependencies=' + json.dumps(dependency_map) + ';\n'
    bundle += "const loaded=new Map();function load(id){if(loaded.has(id))return loaded.get(id).exports;const module={exports:{}};loaded.set(id,module);factories[id](module,module.exports,name=>{const target=dependencies[id][name];if(!target)throw new Error('Unknown bundled module');return load(target);});return module.exports;}\n"
    bundle += 'const assets=' + json.dumps(assets, separators=(',', ':')) + ';\nconst app=load(' + json.dumps(entry) + ');\nexport default {fetch(request){return app.handle(request,assets);}};\n'
    output = ROOT / 'dist/server/index.js'
    output.parent.mkdir(exist_ok=True)
    output.write_text(bundle)
    print(json.dumps({'worker': str(output), 'modules': len(modules), 'assets': len(assets), 'bytes': len(bundle.encode()), 'sha256': hashlib.sha256(bundle.encode()).hexdigest()}))


if __name__ == '__main__':
    build()
