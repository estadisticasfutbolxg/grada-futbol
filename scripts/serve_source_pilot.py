"""Local-only GRADA source pilot. Never serves the checkout or raw provider payloads."""
import json
import os
import re
import sys
from functools import lru_cache
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import HTTPRedirectHandler, Request, build_opener

DIST = Path(__file__).resolve().parents[1] / "dist"
API = "https://sports.bzzoiro.com/api/v2/events/"
LIMIT = 4 * 1024 * 1024
FIXTURES = {
    601024: "Real Madrid - Inter · Champions · 08/09/2026",
    213647: "Real Madrid - Celta · LaLiga · 21/11/2026",
    213614: "Barcelona - Real Madrid · LaLiga · 25/10/2026",
    213638: "Valencia - Real Madrid · LaLiga · 07/11/2026",
    209598: "Everton - Chelsea · Premier League · 17/10/2026",
    209639: "Coventry - Crystal Palace · Premier League · 21/11/2026",
}
FILES = {
    "/": ("comparar-fuentes.html", "text/html"),
    "/comparar-fuentes.js": ("comparar-fuentes.js", "text/javascript"),
    "/comparar-fuentes.css": ("comparar-fuentes.css", "text/css"),
}


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class PilotError(Exception):
    pass


def obj(value):
    return value if isinstance(value, dict) else {}


def number(value, *, zero=True):
    if type(value) not in (int, float) or not 0 <= value < 1e7 or (not zero and not value):
        return None
    return value


def stats_view(player):
    fields = dict(player)
    fields.update(obj(player.get("stats")))
    return {
        "goals": number(fields.get("goals"), zero=False),
        "saves": number(fields.get("saves"), zero=False),
        "xg": number(fields.get("xg"), zero=False),
        "xa": number(fields.get("xa"), zero=False),
        "minutes": number(player.get("minutes_played")),
    }


def normalize(fixture, stats, players, incidents, lineup):
    for data in (stats, players, incidents, lineup):
        if isinstance(data, dict) and "event_id" in data and data["event_id"] != fixture:
            raise PilotError("La API devolvió datos de otro partido.")
    source_rows = players
    if isinstance(players, dict):
        source_rows = next(
            (players[key] for key in ("players", "player_stats", "results")
             if isinstance(players.get(key), list)), None,
        )
    notes = []
    if not isinstance(source_rows, list):
        notes.append("No se reconoce la estructura de jugadores; no se han interpretado sus cifras.")
        source_rows = []
    rows = {}
    for row in source_rows:
        if not isinstance(row, dict):
            continue
        person = obj(row.get("player"))
        ident = row.get("player_id", person.get("id"))
        name = row.get("player_name") or person.get("name") or row.get("name")
        side = row.get("team_id")
        metrics = stats_view(row)
        if type(ident) is not int or ident <= 0 or not isinstance(name, str) or metrics["minutes"] in (None, 0):
            continue
        if ident in rows:
            raise PilotError("Identificador de jugador repetido; no se puede emparejar.")
        rows[ident] = {"id": ident, "name": name[:100], "team": side if type(side) is int else None, **metrics}
    teams = {}
    captured = obj(obj(stats).get("stats"))
    shots = obj(stats).get("shotmap")
    map_rows = [s for s in shots if isinstance(s, dict)] if isinstance(shots, list) else []
    for side in ("home", "away"):
        block = obj(captured.get(side))
        xg = obj(block.get("xg"))
        candidates = [s for s in map_rows if s.get("home") is (side == "home")
                      and s.get("type") in ("goal", "save")
                      and s.get("sit") not in ("shootout", "own-goal", "own_goal")]
        values = [number(s.get("xgot")) for s in candidates]
        coords = [(s.get("player_id"), s.get("min")) for s in candidates]
        unique = all(type(p) is int and type(m) in (int, float) for p, m in coords)
        unique = unique and len(set(coords)) == len(coords)
        teams[side] = {
            "saves": number(block.get("saves"), zero=False),
            "shotsOnTarget": number(block.get("shots_on_target"), zero=False),
            "xg": number(xg.get("actual", block.get("expected_goals")), zero=False),
            "estimated": xg.get("estimated") if type(xg.get("estimated")) is bool else None,
            "mapOnTarget": len(candidates) if map_rows and unique else None,
            "mapWithXgot": sum(v is not None for v in values) if map_rows and unique else None,
            "mapXgot": sum(values) if values and unique and all(v is not None for v in values) else None,
        }
    incident_rows = incidents if isinstance(incidents, list) else obj(incidents).get("incidents")
    if not isinstance(incident_rows, list):
        incident_rows = []
        notes.append("Sin lista de incidencias reconocida.")
    not_playing = [
        v.get("player_id") for v in incident_rows
        if isinstance(v, dict) and v.get("type") == "card" and not v.get("rescinded")
        and type(v.get("player_id")) is int and v["player_id"] not in rows
    ]
    if not_playing:
        notes.append("Tarjetas sin fila jugada reconocida: " + ", ".join(map(str, sorted(set(not_playing)))) + ".")
    if obj(lineup).get("lineup_status") != "confirmed":
        notes.append("No se ha confirmado la estructura de alineación; no se asigna xGOT a porteros.")
    return {"fixture": fixture, "teams": teams, "players": list(rows.values()), "notes": notes}


def fetch(path, token):
    if not re.fullmatch(r"\d+/(?:stats|player-stats|incidents|lineups)/", path):
        raise PilotError("Ruta no permitida.")
    request = Request(API + path, headers={"Authorization": "Token " + token, "Accept": "application/json"})
    try:
        with build_opener(NoRedirect()).open(request, timeout=15) as response:
            body = response.read(LIMIT + 1)
    except HTTPError as exc:
        messages = {401: "La clave de Bzzoiro no es válida.", 403: "Bzzoiro no permite la consulta.",
                    429: "Bzzoiro ha limitado las consultas; inténtalo más tarde."}
        raise PilotError(messages.get(exc.code, f"Bzzoiro devolvió HTTP {exc.code}.")) from None
    except (URLError, TimeoutError, OSError, ValueError):
        raise PilotError("No se pudo conectar con Bzzoiro.") from None
    if len(body) > LIMIT:
        raise PilotError("Respuesta demasiado grande.")
    try:
        return json.loads(body)
    except (ValueError, UnicodeError):
        raise PilotError("Bzzoiro no devolvió JSON válido.") from None


@lru_cache(maxsize=len(FIXTURES))
def load(fixture):
    token = os.environ.get("BZZOIRO_API_TOKEN", "").strip()
    if not token:
        raise PilotError("Falta configurar BZZOIRO_API_TOKEN en el servidor local.")
    data = [fetch(f"{fixture}/{path}/", token) for path in ("stats", "player-stats", "incidents", "lineups")]
    return normalize(fixture, *data)


class Handler(BaseHTTPRequestHandler):
    def send(self, status, payload, content="application/json"):
        self.send_response(status)
        self.send_header("Content-Type", content + "; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("X-Frame-Options", "DENY")
        self.end_headers()
        self.wfile.write(payload)

    def json(self, status, payload):
        self.send(status, json.dumps(payload, ensure_ascii=False).encode())

    def do_GET(self):
        if self.headers.get("Host") != f"127.0.0.1:{self.server.server_port}":
            self.json(403, {"error": "Usa la dirección local indicada."})
            return
        if self.headers.get("Sec-Fetch-Site") in ("cross-site", "same-site"):
            self.json(403, {"error": "Origen no permitido."})
            return
        if self.path in FILES:
            file, content = FILES[self.path]
            self.send(200, (DIST / file).read_bytes(), content)
        elif self.path == "/api/fixtures":
            self.json(200, FIXTURES)
        else:
            match = re.fullmatch(r"/api/pilot/(\d{1,8})", self.path)
            fixture = int(match[1]) if match else None
            if fixture not in FIXTURES:
                self.json(404, {"error": "Partido no incluido."})
                return
            try:
                self.json(200, load(fixture))
            except PilotError as exc:
                self.json(502, {"error": str(exc)})


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8011
    with HTTPServer(("127.0.0.1", port), Handler) as server:
        print(f"GRADA · Comparación local: http://127.0.0.1:{server.server_port}", flush=True)
        server.serve_forever()
