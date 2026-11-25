"""Deletion is bounded to retired football artifacts; active/archived data stays."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('prune', ROOT / 'scripts/prune_inactive_data.py')
prune = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prune)


class RetiredData(unittest.TestCase):
    def test_dry_run_then_remove_inactive_databases_caches_and_images_only(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            data, cache, assets = root / 'downloads', root / 'raw', root / 'clubs'
            data.mkdir(); assets.mkdir()
            catalog = [{'id': 'laliga', 'teams': 20, 'division': 1, 'espn': 'esp.1'}]
            source = {'metadata': {'source': 'FotMob', 'league_key': 'laliga'}, 'teams': [{'id': i} for i in range(1, 21)]}
            (data / 'fotmob-laliga-2026-27.json').write_text(json.dumps(source))
            keep = ['fotmob-laliga-2026-27.sqlite.gz', 'understat-laliga-2026-27.sqlite.gz', 'statsbomb.sqlite.gz', 'fbref-laliga-2025-26.sqlite']
            remove = ['fotmob-championship-2026-27.sqlite.gz', 'espn-championship-2026-27.json', 'combined-championship-2026-27.json', 'fotmob-championship-2025-26.sqlite']
            for name in keep + remove:
                (data / name).write_bytes(name.encode())
            for key in ['laliga', 'championship']:
                folder = cache / 'fotmob-profiles' / key
                folder.mkdir(parents=True); (folder / '1.html').write_text(key)
            for key in ['1', '99']:
                (assets / (key + '.png')).write_bytes(key.encode())
            (assets / 'manifest.json').write_text(json.dumps({'1': {'leagues': ['laliga']}, '99': {'leagues': ['championship']}}))
            result = prune.plan(data, catalog, cache, assets)
            self.assertTrue(all((data / f).exists() for f in remove))
            self.assertEqual({p.name for p in result['files']}, set(remove + ['99.png']))
            prune.apply(result, assets)
            for name in keep:
                self.assertEqual((data / name).read_bytes(), name.encode())
            self.assertTrue((cache / 'fotmob-profiles/laliga/1.html').exists())
            self.assertFalse((cache / 'fotmob-profiles/championship').exists())
            self.assertTrue((assets / '1.png').exists())
            self.assertEqual(set(json.loads((assets / 'manifest.json').read_text())), {'1'})

    def test_requires_first_divisions_and_verified_active_teams_before_deleting(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary)
            with self.assertRaises(ValueError):
                prune.plan(folder, [{'id': 'championship', 'division': 2, 'espn': 'eng.2'}])
            with self.assertRaises(ValueError):
                prune.plan(folder, [{'id': 'championship', 'division': 1, 'espn': 'eng.2'}])


if __name__ == '__main__':
    unittest.main()
