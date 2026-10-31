#!/usr/bin/env python3
"""Importa StatsBomb Open Data (Mundial masculino 2022) a SQLite y a la web.
Solo usa la biblioteca estándar. Conserva los archivos originales en data/raw/.
"""
import argparse
import collections
import gzip
import hashlib
import json
import math
import os
from pathlib import Path
import sqlite3
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://raw.githubusercontent.com/hudl/open-data/master/'
POSITIONS = {1:'POR', **dict.fromkeys(range(2,9),'DEF'), **dict.fromkeys(list(range(9,17))+[18,19,20],'MED'), **dict.fromkeys([17,21,22,23,24,25],'DEL')}

def download(path):
    cache = ROOT / 'data/raw' / path
    if cache.exists():
        return json.loads(cache.read_text())
    error = None
    for attempt in range(3):
        try:
            request = urllib.request.Request(BASE + path, headers={'User-Agent':'GRADA-StatsBomb-Open-Data/1.0'})
            with urllib.request.urlopen(request, timeout=60) as response:
                content = response.read()
            result = json.loads(content)
            cache.parent.mkdir(parents=True, exist_ok=True)
            temp = cache.with_suffix('.tmp')
            temp.write_bytes(content)
            temp.replace(cache)
            return result
        except Exception as exc:
            error = exc
            if attempt < 2:
                time.sleep(2 ** attempt)
    raise RuntimeError(f'No se pudo descargar {path}: {error}')

def clock_minutes(value):
    if value is None:
        return None
    parts = [float(p) for p in value.split(':')]
    return parts[0] + parts[1]/60 + (parts[2]/3600 if len(parts)>2 else 0)

def blank_player(pid, name, tid, team):
    return dict(id=pid,name=name,team_id=tid,team=team,pos=None,matches=0,minutes=0.,
        goals=0,assists=0,xg=0.,xa=0.,shots=0,passes=0,completed=0,saves=0,
        conceded=0,xga=0.,clean=0,tackles=0,interceptions=0,keypasses=0,
        progressive=0,accuracy=None,conversion=None,savepct=None,delta=0.,psxg=None,prevented=None)

def new_team(tid,name):
    return dict(id=tid,name=name,matches=0,minutes=0.,goals=0,conceded=0,xg=0.,xga=0.,
        shots=0,passes=0,completed=0,accuracy=None,delta=0.,possession=None,assists=0)

def aggregate_match(match, events, lineups, players, teams):
    # La tanda de penaltis (periodo 5) queda excluida de todas las métricas.
    events = [e for e in events if e.get('period',0) in (1,2,3,4)]
    duration = 120 if any(e.get('period') in (3,4) for e in events) else 90
    tids = [match['home_team']['home_team_id'],match['away_team']['away_team_id']]
    names = [match['home_team']['home_team_name'],match['away_team']['away_team_name']]
    for tid,name,goals,conceded in [(tids[0],names[0],match['home_score'],match['away_score']),
                                     (tids[1],names[1],match['away_score'],match['home_score'])]:
        if tid not in teams:
            teams[tid] = new_team(tid,name)
        t=teams[tid]; t['matches']+=1; t['minutes']+=duration; t['goals']+=goals; t['conceded']+=conceded
    intervals={}
    for team in lineups:
        for lp in team.get('lineup',[]):
            ps=lp.get('positions',[])
            if not ps:
                continue
            pid=lp['player_id']; tid=team['team_id']
            if pid not in players:
                players[pid]=blank_player(pid,lp.get('player_nickname') or lp['player_name'],tid,team['team_name'])
            p=players[pid]; p['matches']+=1
            intervals[pid]=[]
            for role in ps:
                start=clock_minutes(role.get('from'))
                end=clock_minutes(role.get('to'))
                start=0 if start is None else min(start,duration)
                end=duration if end is None else min(end,duration)
                if end>start:
                    intervals[pid].append((start,end,role.get('position_id'),role.get('from_period',1),role.get('to_period') or (4 if duration==120 else 2)))
                    p['minutes']+=end-start
                    p.setdefault('_roles',collections.Counter())[POSITIONS.get(role.get('position_id'),'MED')]+=end-start
            if p.get('_roles'):
                p['pos']=p['_roles'].most_common(1)[0][0]
    def player(e):
        pid=e.get('player',{}).get('id')
        if pid is None:
            return None
        if pid not in players:
            players[pid]=blank_player(pid,e['player']['name'],e['team']['id'],e['team']['name'])
        return players[pid]
    shots={e['id']:e for e in events if e['type']['name']=='Shot'}
    match_xg=collections.Counter()
    for e in events:
        p=player(e)
        tid=e.get('team',{}).get('id')
        if tid not in teams:
            continue
        t=teams[tid]; kind=e['type']['name']
        if kind=='Shot':
            s=e.get('shot',{}); xg=s.get('statsbomb_xg')
            if not isinstance(xg,(int,float)):
                raise ValueError(f'Tiro sin xG: {e["id"]}')
            t['xg']+=xg; t['shots']+=1; match_xg[tid]+=xg
            if p:
                p['xg']+=xg; p['shots']+=1
                if s.get('outcome',{}).get('name')=='Goal':
                    p['goals']+=1
        elif kind=='Pass':
            pa=e.get('pass',{}); ok='outcome' not in pa
            t['passes']+=1; t['completed']+=int(ok)
            if p:
                p['passes']+=1; p['completed']+=int(ok)
                p['assists']+=int(pa.get('goal_assist',False)); t['assists']+=int(pa.get('goal_assist',False))
                p['keypasses']+=int(pa.get('shot_assist',False))
                target=shots.get(pa.get('assisted_shot_id'))
                # xA derivada: suma del xG de los tiros creados directamente por el pase.
                if target:
                    p['xa']+=target['shot']['statsbomb_xg']
                a=e.get('location'); b=pa.get('end_location')
                # Definición local: pase completado que gana al menos 10 m hacia portería.
                if ok and a and b and (b[0]-a[0])*105/120>=10:
                    p['progressive']+=1
        elif kind=='Duel' and p and e.get('duel',{}).get('type',{}).get('name')=='Tackle':
            p['tackles']+=1
        elif kind=='Interception' and p:
            p['interceptions']+=1
    for tid in tids:
        teams[tid]['xga']+=sum(v for opponent,v in match_xg.items() if opponent!=tid)
    # El orden de los eventos identifica al guardameta presente, incluso en el
    # tiempo añadido. Evita asignar tiros por un reloj nominal de 90 minutos.
    active_keepers={}
    for e in events:
        kind=e['type']['name']; tid=e.get('team',{}).get('id')
        if kind in ('Starting XI','Tactical Shift'):
            for entry in e.get('tactics',{}).get('lineup',[]):
                if entry.get('position',{}).get('id')==1:
                    active_keepers[tid]=entry['player']['id']
        elif kind=='Substitution' and active_keepers.get(tid)==e.get('player',{}).get('id'):
            active_keepers[tid]=e['substitution']['replacement']['id']
        if kind not in ('Shot','Own Goal Against'):
            continue
        targettid=next((other for other in tids if other!=tid),None) if kind=='Shot' else tid
        pid=active_keepers.get(targettid)
        if pid is None or pid not in players:
            raise ValueError(f"No se pudo identificar al portero para el evento {e['id']}")
        p=players[pid]
        if kind=='Own Goal Against':
            p['conceded']+=1
        else:
            shot=e['shot']; outcome=shot.get('outcome',{}).get('name')
            p['xga']+=shot['statsbomb_xg']
            if outcome in ('Saved','Saved to Post','Saved Off Target'):
                p['saves']+=1
            elif outcome=='Goal':
                p['conceded']+=1
    for pid,spans in intervals.items():
        if any(role==1 for _,_,role,_,_ in spans):
            p=players[pid]
            # Portería a cero del equipo, solo si el guardameta jugó >=60 min en portería.
            opposing=match['away_score'] if p['team_id']==tids[0] else match['home_score']
            p['clean']+=int(opposing==0 and sum(end-start for start,end,role,_,_ in spans if role==1)>=60)
    return dict(id=match['match_id'],date=match['match_date'],home=names[0],away=names[1],
                home_id=tids[0],away_id=tids[1],home_goals=match['home_score'],away_goals=match['away_score'],
                home_xg=match_xg[tids[0]],away_xg=match_xg[tids[1]],minutes=duration)

def finish(players,teams):
    for p in players.values():
        p.pop('_roles',None)
        if p['pos'] is None:
            p['pos']='—'
        p['accuracy']=p['completed']/p['passes']*100 if p['passes'] else None
        p['conversion']=p['goals']/p['shots']*100 if p['shots'] else None
        p['savepct']=p['saves']/(p['saves']+p['conceded'])*100 if p['saves']+p['conceded'] else None
        p['delta']=p['goals']-p['xg']
    for t in teams.values():
        t['accuracy']=t['completed']/t['passes']*100 if t['passes'] else None
        t['delta']=t['goals']-t['xg']

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--limit',type=int,help='Importar solo N partidos (la cobertura parcial queda indicada)')
    args=parser.parse_args()
    if args.limit is not None and args.limit<1:
        parser.error('--limit debe ser mayor que cero')
    matches=sorted(download('data/matches/43/106.json'),key=lambda m:(m['match_date'],m['match_id']))
    total=len(matches)
    if args.limit:
        matches=matches[:args.limit]
    players={};teams={};summary=[]
    dest=ROOT/'dist/downloads';dest.mkdir(parents=True,exist_ok=True)
    tmp=ROOT/'data/statsbomb.tmp.sqlite';tmp.parent.mkdir(exist_ok=True)
    if tmp.exists():tmp.unlink()
    db=sqlite3.connect(tmp)
    db.executescript('''CREATE TABLE metadata (key TEXT PRIMARY KEY,value TEXT);
CREATE TABLE matches (id INTEGER PRIMARY KEY,date TEXT,home_id INTEGER,away_id INTEGER,home_goals INTEGER,away_goals INTEGER,home_xg REAL,away_xg REAL,minutes REAL,source_json TEXT NOT NULL);
CREATE TABLE events (id TEXT PRIMARY KEY,match_id INTEGER,period INTEGER,minute INTEGER,second INTEGER,team_id INTEGER,player_id INTEGER,type TEXT,x REAL,y REAL,xg REAL,outcome TEXT,assist_shot_id TEXT);
CREATE TABLE lineups (match_id INTEGER,team_id INTEGER,player_id INTEGER,source_json TEXT,PRIMARY KEY(match_id,team_id,player_id));''')
    for i,m in enumerate(matches,1):
        mid=m['match_id'];print(f'[{i}/{len(matches)}] {mid}: {m["home_team"]["home_team_name"]} - {m["away_team"]["away_team_name"]}',flush=True)
        ev=download(f'data/events/{mid}.json');lu=download(f'data/lineups/{mid}.json')
        summary.append(aggregate_match(m,ev,lu,players,teams));s=summary[-1]
        db.execute('INSERT INTO matches VALUES (?,?,?,?,?,?,?,?,?,?)',(mid,s['date'],s['home_id'],s['away_id'],s['home_goals'],s['away_goals'],s['home_xg'],s['away_xg'],s['minutes'],json.dumps(m,ensure_ascii=False)))
        for e in ev:
            loc=e.get('location',[None,None]);shot=e.get('shot',{})
            db.execute('INSERT INTO events VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',(e['id'],mid,e.get('period'),e.get('minute'),e.get('second'),e.get('team',{}).get('id'),e.get('player',{}).get('id'),e['type']['name'],loc[0],loc[1],shot.get('statsbomb_xg'),shot.get('outcome',{}).get('name'),e.get('pass',{}).get('assisted_shot_id')))
        for team in lu:
            db.executemany('INSERT INTO lineups VALUES (?,?,?,?)',[(mid,team['team_id'],p['player_id'],json.dumps(p,ensure_ascii=False)) for p in team['lineup']])
        db.commit()
    finish(players,teams)
    metadata=dict(source='StatsBomb Open Data',url='https://github.com/statsbomb/open-data',
        competition='Mundial masculino',season='2022',competition_id=43,season_id=106,
        imported_matches=len(matches),available_matches=total,complete=len(matches)==total,
        imported_at=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),
        notes=['Tandas de penaltis excluidas de las estadísticas.','Minutos calculados con intervalos de posición; sin descuento añadido.',
               'xA calculada como suma del xG de los tiros directamente asistidos; no es una predicción de pase independiente.',
               'PSxG y goles evitados no están disponibles en esta importación.','Posesión no calculada.'])
    payload=dict(metadata=metadata,players=list(players.values()),teams=list(teams.values()),matches=summary)
    for name,items in [('players',payload['players']),('teams',payload['teams'])]:
        db.execute(f'CREATE TABLE {name} (id INTEGER PRIMARY KEY, name TEXT, stats_json TEXT)')
        db.executemany(f'INSERT INTO {name} VALUES (?,?,?)',[(p['id'],p['name'],json.dumps(p,ensure_ascii=False)) for p in items])
    db.executemany('INSERT INTO metadata VALUES (?,?)',[(k,json.dumps(v,ensure_ascii=False)) for k,v in metadata.items()])
    db.execute('CREATE INDEX events_match_id ON events(match_id)');db.execute('CREATE INDEX events_player_id ON events(player_id)');db.commit()
    if db.execute('PRAGMA integrity_check').fetchone()[0]!='ok':
        raise RuntimeError('La verificación de SQLite no pasó')
    db.close()
    if sum(t['goals'] for t in teams.values())!=sum(s['home_goals']+s['away_goals'] for s in summary):
        raise RuntimeError('Los goles de los equipos no cuadran')
    if not math.isclose(sum(p['xg'] for p in players.values()),sum(t['xg'] for t in teams.values()),abs_tol=1e-6):
        raise RuntimeError('El xG de jugadores y equipos no cuadra')
    if sum(p['conceded'] for p in players.values()) != sum(t['conceded'] for t in teams.values()):
        raise RuntimeError('Los goles encajados por los porteros no coinciden con los marcadores')
    if not math.isclose(sum(p['xga'] for p in players.values()),sum(t['xga'] for t in teams.values()),abs_tol=1e-6):
        raise RuntimeError('El xG recibido por los porteros no coincide con el de los equipos')
    text=json.dumps(payload,ensure_ascii=False,separators=(',',':'),allow_nan=False)
    (ROOT/'dist/data.js').write_text('window.GRADA_DATA = '+text+';\n')
    (dest/'statsbomb.json').write_text(text)
    (dest/'statsbomb.sqlite.gz').write_bytes(gzip.compress(tmp.read_bytes(),compresslevel=9))
    tmp.replace(ROOT/'data/statsbomb.sqlite')
    digest=hashlib.sha256((dest/'statsbomb.sqlite.gz').read_bytes()).hexdigest()
    (dest/'SHA256SUMS').write_text(digest+'  statsbomb.sqlite.gz\n')
    print(f'Importación terminada: {len(matches)} partidos, {len(teams)} equipos, {len(players)} jugadores. SQLite verificada.')

if __name__=='__main__':
    main()
