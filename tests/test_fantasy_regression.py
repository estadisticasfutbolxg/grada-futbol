"""Statistical checks use isolated synthetic fixtures, never product observations."""
import importlib.util
from pathlib import Path
import unittest

SCRIPTS = Path(__file__).resolve().parents[1] / 'scripts'
spec = importlib.util.spec_from_file_location('regression', SCRIPTS / 'analyze_fantasy_regression.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def records(n=80):
    rows = []
    for i in range(n):
        value = (i * 7 % 31) / 10
        minutes = 250 + (i * 37 % 800)
        rows.append({'id': str(i), 'name': 'Isolated ' + str(i), 'team': 'Club ' + str(i % 10), 'profile': 'DEF', 'points': 5 * value + 0.1 * minutes + (i % 3 - 1) * 0.1,
                     'minutes': minutes, 'matches': 10, 'fantasy_minutes': minutes, 'fantasy_matches': 11,
                     'fantasy_captured_at': '2026-11-26T10:00:00Z', 'metrics': {'tackles': value},
                     'contexts': {'tackles': {'source': 'FotMob', 'minutes': minutes, 'matches': 10, 'captured_at': '2026-11-26T10:05:00Z', 'label': 'Entradas /90'}},
                     'fantasy_counts': {'yellowCards': 0, 'redCards': 0, 'penaltiesWon': 0}})
    return rows


class RegressionContract(unittest.TestCase):
    def test_zero_is_observed_missing_is_excluded_and_minutes_dates_are_checked(self):
        rows = records(4)
        rows[0]['metrics']['tackles'] = 0
        rows[1]['metrics']['tackles'] = None
        rows[2]['contexts']['tackles']['minutes'] = 100
        rows[3]['contexts']['tackles']['captured_at'] = '2026-11-01T10:00:00Z'
        selected, excluded = module.prepare(rows, ['tackles'])
        self.assertEqual(len(selected), 1)
        self.assertEqual(selected[0]['x'][0], 0)
        self.assertEqual(len(excluded), 3)

    def test_group_held_out_predictions_and_coefficients_recover_known_relation(self):
        fitted = module.fit_profile(records(), 'DEF')
        self.assertEqual(fitted['status'], 'fitted')
        self.assertGreater(fitted['validation']['r2'], 0.95)
        self.assertEqual(sorted(team for fold in fitted['folds'] for team in fold['test_clubs']), sorted({'Club ' + str(i) for i in range(10)}))
        coefficient = next(c for c in fitted['coefficients'] if c['key'] == 'tackles')
        self.assertAlmostEqual(coefficient['ridge_raw'], 5, delta=0.2)
        self.assertEqual(fitted['ols_status'], 'estimated')
        self.assertAlmostEqual(coefficient['ols_raw'], 5, delta=0.05)
        self.assertLess(coefficient['ols_ci'][0], coefficient['ols_ci'][1])
        self.assertLess(coefficient['ols_p'], 0.01)
        self.assertIn('redCards', fitted['constant_features'])
        self.assertFalse(any(c['key'] == 'redCards' for c in fitted['coefficients']))

    def test_small_profile_is_explicitly_not_estimated(self):
        result = module.fit_profile(records(5), 'MED_BALANCED')
        self.assertEqual(result['status'], 'insufficient_sample')
        self.assertEqual(result['coefficients'], [])
        self.assertEqual(result['players'], [])


if __name__ == '__main__':
    unittest.main()
