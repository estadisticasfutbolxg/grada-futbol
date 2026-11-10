import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('understat', Path(__file__).resolve().parents[1] / 'scripts/import_understat.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class SourceValidation(unittest.TestCase):
    def test_sqlite_preserves_multiple_positions_as_json_and_numeric_zero(self):
        import json
        import sqlite3
        payload = {'metadata': {}, 'players': [{'id': '1', 'positions': ['MED', 'DEL'], 'goals': 0, 'unknown': None}],
                   'teams': [{'id': '2', 'goals': 0}], 'matches': [{'id': '3', 'home_goals': 0}]}
        db = sqlite3.connect(':memory:')
        try:
            db.deserialize(module.sqlite_bytes(payload))
            positions, goals, absent = db.execute('SELECT positions,goals,unknown FROM players').fetchone()
            self.assertEqual(json.loads(positions), ['MED', 'DEL'])
            self.assertEqual(goals, 0)
            self.assertIsNone(absent)
            self.assertEqual(db.execute("SELECT type FROM pragma_table_info('players') WHERE name='positions'").fetchone()[0], 'TEXT')
        finally:
            db.close()

    def test_numeric_values_preserve_absence_and_zero(self):
        self.assertIsNone(module.number(None))
        self.assertIsNone(module.number(''))
        self.assertEqual(module.number('0'), 0)
        self.assertEqual(module.number('1.5'), 1.5)
        for value in ['NaN', 'Infinity', -1, True]:
            with self.assertRaises(ValueError):
                module.number(value)
        with self.assertRaises(ValueError):
            module.number('1.5', integer=True)

    def test_reject_incomplete_source_and_untrusted_identifiers(self):
        with self.assertRaisesRegex(ValueError, '20 teams'):
            module.adapt({'teams': {}, 'players': []}, '2026-11-01T00:00:00Z')
        for value in ['../1', '1;DROP TABLE players', '１', '', '1' * 13]:
            with self.assertRaises(ValueError):
                module.identifier(value)


    def test_extracts_embedded_json_without_executing_javascript(self):
        import json
        content = {'teamsData': {'1': {'title': 'Club'}}, 'playersData': [], 'datesData': []}
        parts = ['<title>La liga 2026/2027</title>']
        for variable, value in content.items():
            encoded = ''.join('\\x%02x' % ord(c) for c in json.dumps(value))
            parts.append(variable + " = JSON.parse('" + encoded + "');")
        parsed = module.extract_page(''.join(parts))
        self.assertEqual(parsed['teams']['1']['title'], 'Club')
        self.assertEqual(parsed['players'], [])
        with self.assertRaises(ValueError):
            module.extract_page('<title>2025/2026</title>')
        with self.assertRaises(ValueError):
            module.extract_page('<title>2026/2027</title><script>window.x = alert(1)</script>')


if __name__ == '__main__':
    unittest.main()
