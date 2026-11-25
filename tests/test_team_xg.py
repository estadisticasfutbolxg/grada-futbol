"""Team refresh must preserve players and reject mismatched captures."""
import copy
import importlib.util
from pathlib import Path
import sys
import unittest

SCRIPTS = Path(__file__).resolve().parents[1] / 'scripts'
sys.path.insert(0, str(SCRIPTS))
spec = importlib.util.spec_from_file_location('team_xg', SCRIPTS / 'enrich_team_xg.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def fixture():
    league = module.fotmob.LEAGUES['laliga']
    data = {'metadata': {'pages': {}, 'coverage': {}, 'notes': '', 'imported_matches': 10},
            'players': [{'id': '42', 'minutes': 200, 'xg': 0}],
            'teams': [{'id': str(i), 'matches': 1} for i in range(1, 21)]}
    pages = {}
    for stat in [*module.fotmob.TEAM_SPECS, 'expected_goals_team', 'expected_goals_conceded_team']:
        fmt = 'number' if stat in {'clean_sheet_team', 'big_chance_team'} else 'percent' if stat == 'possession_percentage_team' else 'fraction'
        rows = [{'id': i, 'played': 2, 'scoresStr': '2-2', 'pts': 3, 'statValue': {'format': fmt, 'value': 0}} for i in range(1, 21)]
        pages[stat] = {'captured_at': '2026-11-25T08:00:00Z', 'url': 'https://www.fotmob.com/verified', 'data': {'statsData': rows}}
    return data, pages, league


class TeamRefresh(unittest.TestCase):
    def test_same_sample_team_xg_and_sqlite_keep_players_and_unknown_omitted_teams(self):
        data, pages, league = fixture()
        before = copy.deepcopy(data)
        pages['clean_sheet_team']['data']['statsData'].pop()
        result = module.enrich(data, pages, league)
        self.assertEqual(data, before)
        self.assertEqual(result['players'], before['players'])
        self.assertEqual(result['teams'][0]['xg'], 0)
        self.assertEqual(result['teams'][0]['metricContexts']['xg']['matches'], 2)
        self.assertEqual(result['teams'][0]['metricContexts']['xg']['minutes'], 180)
        self.assertIsNone(result['teams'][-1]['clean'])
        self.assertEqual(result['metadata']['imported_matches'], 20)

    def test_mismatch_partial_xg_duplicates_and_backwards_samples_leave_original_untouched(self):
        for change in [lambda p: p['expected_goals_team']['data']['statsData'].pop(),
                       lambda p: p['overview']['data']['statsData'][0].update(played=0),
                       lambda p: p['clean_sheet_team']['data']['statsData'][0].update(id=999),
                       lambda p: p['expected_goals_team']['data']['statsData'][0].update(id=2)]:
            data, pages, league = fixture()
            before = copy.deepcopy(data)
            change(pages)
            with self.assertRaises(ValueError):
                module.enrich(data, pages, league)
            self.assertEqual(data, before)


if __name__ == '__main__':
    unittest.main()
