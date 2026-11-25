import importlib.util
import json
import os
import threading
import unittest
from http.client import HTTPConnection
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location(
    "source_pilot", Path(__file__).resolve().parents[1] / "scripts/serve_source_pilot.py",
)
pilot = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pilot)


class SourcePilotTest(unittest.TestCase):
    def test_keeper_validation_and_missing_values(self):
        shots = [
            {"home": False, "type": "save", "min": 17, "player_id": 11, "xgot": .2},
            {"home": False, "type": "goal", "min": 35, "player_id": 12, "xgot": None},
            {"home": False, "type": "goal", "min": 86, "player_id": 13, "sit": "own-goal", "xgot": .7},
            {"home": False, "type": "goal", "min": 125, "player_id": 11, "sit": "shootout", "xgot": .9},
        ]
        players = {"players": [
            {"player_id": 1, "name": "A", "minutes_played": 95, "saves": 5, "goals": 0},
            {"player_id": 2, "name": "B", "minutes_played": 0},
        ]}
        result = pilot.normalize(601024, {"shotmap": shots}, players,
                                 [{"type": "card", "player_id": 2}], {})
        self.assertEqual(len(result["players"]), 1)
        self.assertEqual(result["players"][0]["minutes"], 95)
        self.assertEqual(result["players"][0]["saves"], 5)
        self.assertIsNone(result["players"][0]["goals"])
        self.assertEqual(result["teams"]["away"]["mapOnTarget"], 2)
        self.assertEqual(result["teams"]["away"]["mapWithXgot"], 1)
        self.assertIsNone(result["teams"]["away"]["mapXgot"])
        self.assertIn("2", result["notes"][0])
        result = pilot.normalize(601024, {"shotmap": shots + shots[:1]}, [], [], {})
        self.assertIsNone(result["teams"]["away"]["mapOnTarget"])
        with self.assertRaises(pilot.PilotError):
            pilot.normalize(601024, {"event_id": 213647}, [], [], {})

    def test_http_surfaces_and_bounded_server_calls(self):
        fixtures = iter([{"event_id": 601024}, {"players": []}, {"incidents": []}, {}])
        with (
            pilot.HTTPServer(("127.0.0.1", 0), pilot.Handler) as server,
            patch.dict(os.environ, {"BZZOIRO_API_TOKEN": "synthetic-test-token"}),
            patch.object(pilot, "fetch", side_effect=lambda *_: next(fixtures)) as fetch,
        ):
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                with self.subTest("la página real y sus activos"):
                    self.assertIn(b"Comparador de fuentes", self.get(server, "/")[1])
                    self.assertEqual(self.get(server, "/comparar-fuentes.js")[0], 200)
                    self.assertEqual(self.get(server, "/comparar-fuentes.css")[0], 200)
                self.assertEqual(self.get(server, "/api/pilot/123")[0], 404)
                self.assertEqual(self.get(server, "/scripts/serve_source_pilot.py")[0], 404)
                self.assertEqual(self.get(server, "/api/pilot/601024", {"Host": "external.invalid"})[0], 403)
                self.assertEqual(self.get(server, "/api/pilot/601024", {"Sec-Fetch-Site": "cross-site"})[0], 403)
                for _ in range(2):
                    status, body = self.get(server, "/api/pilot/601024")
                    self.assertEqual(status, 200)
                    self.assertEqual(json.loads(body)["fixture"], 601024)
                    self.assertNotIn(b"synthetic-test-token", body)
                self.assertEqual(fetch.call_count, 4)
            finally:
                pilot.load.cache_clear()
                server.shutdown()
                thread.join()

    @staticmethod
    def get(server, path, headers=None):
        conn = HTTPConnection("127.0.0.1", server.server_port, timeout=3)
        try:
            conn.request("GET", path, headers=headers or {})
            response = conn.getresponse()
            return response.status, response.read()
        finally:
            conn.close()


if __name__ == "__main__":
    unittest.main()
