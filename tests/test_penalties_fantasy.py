"""Source definitions and isolated download fixtures; never published as statistics."""
import copy
import json
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import enrich_player_penalties as penalties
import import_analitica_fantasy as fantasy


class PenaltiesContract(unittest.TestCase):
    def test_full_refresh_only_uses_minutes_with_matching_appearances_in_same_batch(self):
        player = {'id': '1', 'team_id': '7', 'minutes': 900, 'matches': 10}
        row = {'substatValue': {'format': 'number', 'value': 10}}
        page = {'captured_at': '2026-11-26T10:00:00Z', 'url': 'https://www.fotmob.com/fixture'}
        minute_page = {'captured_at': '2026-11-26T10:01:00Z', 'data': {'statsData': [{'id': 1, 'teamId': 7, 'statValue': {'value': 900}, 'substatValue': {'format': 'number', 'value': 10}}]}}
        context = penalties.fotmob.penalty_context(player, row, page, minute_page, penalties.fotmob.DEFAULT)
        self.assertEqual(context['minutes'], 900)
        minute_page['captured_at'] = '2026-11-25T10:00:00Z'
        self.assertIsNone(penalties.fotmob.penalty_context(player, row, page, minute_page, penalties.fotmob.DEFAULT)['minutes'])
        row['substatValue']['value'] = 11
        self.assertIsNone(penalties.fotmob.penalty_context(player, row, page, page, penalties.fotmob.DEFAULT)['minutes'])

    def test_counts_keep_own_appearances_and_no_borrowed_minutes(self):
        data = {'metadata': {'pages': {}, 'coverage': {}, 'imported_at': '2026-11-01T10:00:00Z'},
                'players': [{'id': '1', 'name': 'Isolated', 'team': 'Club', 'team_id': '7', 'minutes': 999, 'matches': 10, 'goals': 4, 'metricContexts': {}},
                            {'id': '2', 'team_id': '7', 'metricContexts': {}}], 'teams': [{'id': '7'}]}
        row = {'id': 1, 'teamId': 7, 'statValue': {'value': 0, 'format': 'number'}, 'substatValue': {'value': 13, 'format': 'number'}}
        page = {'captured_at': '2026-11-26T10:00:00Z', 'url': 'https://www.fotmob.com/fixture', 'data': {'statsData': [row]}}
        before = copy.deepcopy(data)
        result, report = penalties.enrich(data, page, penalties.fotmob.DEFAULT)
        self.assertEqual(data, before)
        self.assertEqual(result['players'][0]['penaltiesCommitted'], 0)
        self.assertIsNone(result['players'][1]['penaltiesCommitted'])
        self.assertIsNone(result['players'][0]['metricContexts']['penaltiesCommitted']['minutes'])
        self.assertEqual(result['players'][0]['metricContexts']['penaltiesCommitted']['matches'], 13)
        self.assertEqual(result['players'][0]['goals'], 4)
        self.assertEqual(result['metadata']['imported_at'], data['metadata']['imported_at'])
        page['data']['statsData'][0]['teamId'] = 8
        result, report = penalties.enrich(data, page, penalties.fotmob.DEFAULT)
        self.assertIsNone(result['players'][0]['penaltiesCommitted'])
        self.assertEqual(report['unmatchedIDs'], ['1'])

    def test_wrong_season_is_rejected_and_verified_empty_ranking_is_unknown(self):
        league = penalties.fotmob.LEAGUES['bundesliga']
        doc = {'currentSeasonId': league['fotmobStatSeasons']['penalty_conceded'], 'currentStatName': 'penalty_conceded',
               'type': 'players', 'leagueDetails': {'id': league['fotmobId']}, 'seasons': [{'id': league['fotmobStatSeasons']['penalty_conceded'], 'name': '2026/2027'}], 'statsData': []}
        def body():
            return ('<script id="__NEXT_DATA__">' + json.dumps({'props': {'pageProps': {'data': doc}}}) + '</script>').encode()
        self.assertEqual(penalties.fotmob.parse(body(), 'penalty_conceded', league)['statsData'], [])
        doc['currentSeasonId'] = league['fotmobSeason']
        with self.assertRaises(ValueError):
            penalties.fotmob.parse(body(), 'penalty_conceded', league)


class FantasyContract(unittest.TestCase):
    def test_extracts_full_payload_without_executing_scripts_and_preserves_zero(self):
        players = [{'playerId': 7, 'playerName': '=Isolated', 'penaltyConceded': 0, 'goals': 2}]
        text = json.dumps({'seasonYear': 2026, 'initialPlayers': players})
        body = ('<script>self.__next_f.push(' + json.dumps([1, text]) + ')</script>').encode()
        self.assertEqual(fantasy.parse(body), players)
        self.assertIn("'=Isolated", fantasy.csv_bytes(players).decode('utf-8-sig'))
        with self.assertRaises(ValueError):
            fantasy.parse(body.replace(b'2026', b'2025'))
        players.append(players[0])
        body = ('<script>self.__next_f.push(' + json.dumps([1, json.dumps({'seasonYear': 2026, 'initialPlayers': players})]) + ')</script>').encode()
        with self.assertRaises(ValueError):
            fantasy.parse(body)


if __name__ == '__main__':
    unittest.main()
