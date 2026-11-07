#!/usr/bin/env python3
"""Extract public FotMob LaLiga 2026/27 HTML rankings into JSON and SQLite."""
import argparse
import concurrent.futures
from datetime import datetime, timezone
import gzip
import hashlib
from html.parser import HTMLParser
import io
import json
import math
import os
import re
from pathlib import Path
import sqlite3
import tempfile
import urllib.request

ROOT=Path(__file__).resolve().parents[1]
LEAGUES={r['id']:r for r in json.loads((ROOT/'dist/leagues.json').read_text())}
DEFAULT=LEAGUES['laliga']
BASE='https://www.fotmob.com/leagues/87/stats/season/38843'
MAX_BYTES=8*1024*1024
SPECS={
 'accurate_pass':('players','fotmob-html.txt'),
 'total_tackle':('players','fotmob-total_tackle.html'),
 'interception':('players','fotmob-interception.html'),
 'ball_recovery':('players','fotmob-ball_recovery.html'),
 'mins_played':('players','fotmob-mins_played.html'),
 'accurate_pass_team':('teams','fotmob-accurate_pass_team.html'),
}
FIELDS={'total_tackle':'tackles','interception':'interceptions','ball_recovery':'recoveries'}
# Formats are checked against the public ranking, never guessed from values.
# (metric, primary/substat, format, signed, published-per-90)
EXTRA={
 'lbp_total':[('lineBreakingPasses','substatValue','number',False,False)],
 'effective_clearance':[('clearances','substatValue','number',False,False)],
 'outfielder_block':[('blocks','substatValue','number',False,False)],
 'total_high_claim':[('highClaims','substatValue','number',False,False)],
 'total_keeper_sweeper':[('sweeperActions','substatValue','number',False,False)],
 'saves':[('saves','substatValue','number',False,False)],
 'goals_conceded':[('conceded','substatValue','number',False,False)],
 'ontarget_scoring_att':[('shotsOnTargetPer90','statValue','fraction',False,True),('shotsOnTargetPct','substatValue','percent',False,False)],
 'accurate_long_balls':[('longBallsPer90','statValue','fraction',False,True),('longBallAccuracy','substatValue','percent',False,False)],
 'won_contest':[('dribblesPer90','statValue','fraction',False,True),('dribbleSuccess','substatValue','percent',False,False)],
 'poss_won_att_3rd':[('finalThirdRecoveriesPer90','statValue','fraction',False,True),('midfieldRecoveriesPer90','substatValue','fraction',False,True)],
 'fouls':[('foulsPer90','statValue','fraction',False,True)],
 'total_att_assist':[('chancesCreated','statValue','number',False,False)],
 'big_chance_created':[('bigChancesCreated','statValue','number',False,False)],
 'big_chance_missed':[('bigChancesMissed','statValue','number',False,False)],
 'yellow_card':[('yellowCards','statValue','number',False,False)],
 'red_card':[('redCards','statValue','number',False,False)],
 'penalty_save':[('penaltiesSaved','statValue','number',False,False),('penaltiesFaced','substatValue','number',False,False)],
 'clean_sheet':[('clean','statValue','number',False,False)],
 '_save_percentage':[('savepct','statValue','percent',False,False)],
 '_goals_prevented':[('prevented','statValue','fraction',True,False)],
 'expected_goalsontarget':[('xgot','statValue','fraction',False,False)],
}
for stat in EXTRA:SPECS[stat]=('players',f'fotmob-{stat}.html')
RATE_COUNT={'lbp_total','effective_clearance','outfielder_block','total_high_claim','total_keeper_sweeper','saves','goals_conceded'}
EXTRA_FIELDS=list(dict.fromkeys(item[0] for specs in EXTRA.values() for item in specs))
CORE={
 'expected_goals':('players','fotmob-expected_goals.html'),
 'expected_assists':('players','fotmob-expected_assists.html'),
 'total_scoring_att':('players','fotmob-total_scoring_att.html'),
 'goals':('players','fotmob-goals.html'),
 'goal_assist':('players','fotmob-goal_assist.html'),
 'expected_goals_team':('teams','fotmob-expected_goals_team.html'),
 'expected_goals_conceded_team':('teams','fotmob-expected_goals_conceded_team.html'),
 'overview':('overview','fotmob-overview.html'),
}
TEAM_SPECS={s:('teams',f'fotmob-{s}.html') for s in ['clean_sheet_team','ontarget_scoring_att_team','big_chance_team','possession_percentage_team','goals_team_match','goals_conceded_team_match']}
TEAM_SPECS['overview']=('overview','fotmob-overview.html')

def specs(league):return {**SPECS,**TEAM_SPECS,**(CORE if league['primary']=='FotMob' else {})}

def base_url(league):return f"https://www.fotmob.com/leagues/{league['fotmobId']}/stats/season/{league['fotmobSeason']}"

class NextData(HTMLParser):
 def __init__(self):
  super().__init__(convert_charrefs=False);self.capture=False;self.parts=[]
 def handle_starttag(self,tag,attrs):
  if tag=='script' and dict(attrs).get('id')=='__NEXT_DATA__':self.capture=True
 def handle_data(self,data):
  if self.capture:self.parts.append(data)
 def handle_endtag(self,tag):
  if tag=='script':self.capture=False

def number(value,integer=False,signed=False):
 if isinstance(value,bool) or not isinstance(value,(int,float)) or not math.isfinite(value) or (value<0 and not signed) or (integer and int(value)!=value):raise ValueError('Invalid statistic')
 return int(value) if integer else value

def parse(body,stat,league=DEFAULT):
 parser=NextData();parser.feed(body.decode('utf-8'));page=json.loads(''.join(parser.parts))['props']['pageProps']
 if stat=='overview':
  details=page.get('details',{})
  if details.get('id')!=league['fotmobId'] or details.get('selectedSeason')!='2026/2027':raise ValueError('Wrong standings season')
  tables=[t['data']['table']['all'] for t in page.get('table',[]) if t.get('data',{}).get('leagueId')==league['fotmobId']]
  if len(tables)!=1 or len(tables[0])!=league['teams']:raise ValueError('Incomplete FotMob standings')
  return {'statsData':tables[0]}
 doc=page['data']
 if str(doc.get('currentSeasonId'))!=str(league['fotmobSeason']) or doc.get('currentStatName')!=stat or doc.get('type')!=specs(league)[stat][0] or doc.get('leagueDetails',{}).get('id')!=league['fotmobId']:raise ValueError('Wrong FotMob competition, season or statistic')
 if not any(str(s.get('id'))==str(league['fotmobSeason']) and s.get('name')=='2026/2027' for s in doc.get('seasons',[])):raise ValueError('Season 2026/27 not confirmed')
 rows=doc.get('statsData')
 if not isinstance(rows,list) or not 1<=len(rows)<=1500:raise ValueError('Missing statistic rows')
 seen=set()
 for r in rows:
  pid=str(r.get('id'));tid=str(r.get('teamId'))
  if not pid.isascii() or not pid.isdigit() or not tid.isascii() or not tid.isdigit() or pid in seen:raise ValueError('Invalid or duplicate identity')
  seen.add(pid)
  if not isinstance(r.get('name'),str) or not r['name'].strip() or len(r['name'])>250:raise ValueError('Invalid player name')
  if r.get('statValue',{}).get('name')!=stat:raise ValueError('Mismatched row statistic')
  number(r['statValue']['value'],signed=stat=='_goals_prevented')
 return doc

def atomic(path,body):
 path.parent.mkdir(parents=True,exist_ok=True);temporary=None
 try:
  with tempfile.NamedTemporaryFile(dir=path.parent,delete=False) as handle:
   temporary=Path(handle.name);handle.write(body);handle.flush();os.fsync(handle.fileno())
  os.replace(temporary,path)
 finally:
  if temporary:temporary.unlink(missing_ok=True)

def build(pages,league=DEFAULT):
 team_rows=pages['accurate_pass_team']['data']['statsData']
 if len(team_rows)!=league['teams']:raise ValueError('Unexpected number of league teams')
 teams=[{'id':str(r['id']),'name':r['name']} for r in team_rows];team_map={t['id']:t['name'] for t in teams}
 mins=pages['mins_played']['data']['statsData'];players={};skipped=0
 for r in mins:
  pid=str(r['id']);tid=str(r['teamId'])
  if tid not in team_map:raise ValueError('Unknown team')
  minutes=number(r['statValue']['value']);matches=number(r['substatValue']['value'],True)
  if r['substatValue']['format']!='number':raise ValueError('Unexpected match-count format')
  players[pid]={'id':pid,'name':r['name'],'team_id':tid,'team':team_map[tid],'pos':'POR' if r.get('position')==11 else '—','minutes':minutes,'matches':matches,
    'passes':None,'completed':None,'accuracy':None,'tackles':None,'interceptions':None,'recoveries':None,'metricContexts':{}}
  players[pid].update({key:None for key in EXTRA_FIELDS})
 def context(p,stat,rate=None):
  result={'source':'FotMob','minutes':p['minutes'],'matches':p['matches'],'captured_at':pages[stat]['captured_at'],'url':pages[stat]['url'],'minutes_captured_at':pages['mins_played']['captured_at']}
  if rate is not None:result['reportedPer90']=rate
  return result
 for stat in ['accurate_pass',*FIELDS]:
  for r in pages[stat]['data']['statsData']:
   p=players.get(str(r['id']))
   if not p or p['team_id']!=str(r['teamId']):skipped+=1;continue
   rate=number(r['statValue']['value']);sub=r.get('substatValue',{})
   if r['statValue']['format']!='fraction':raise ValueError('Expected provider per-90 rate')
   if stat=='accurate_pass':
    if sub.get('format')!='percent':raise ValueError('Expected pass accuracy percentage')
    accuracy=number(sub['value'])
    if accuracy>100:raise ValueError('Invalid pass accuracy')
    p['accuracy']=accuracy;p['metricContexts']['accuracy']=context(p,stat);p['metricContexts']['accuracy']['reportedValue']=True
    p['metricContexts']['completed']=context(p,stat,rate)
   else:
    if sub.get('format')!='number':raise ValueError('Expected defensive count')
    key=FIELDS[stat];p[key]=number(sub['value'],True);p['metricContexts'][key]=context(p,stat,rate)
 for stat,specs in EXTRA.items():
  for r in pages[stat]['data']['statsData']:
   p=players.get(str(r['id']))
   if not p or p['team_id']!=str(r['teamId']):skipped+=1;continue
   for key,part,fmt,signed,is_rate in specs:
    item=r.get(part,{})
    if item.get('format')!=fmt:raise ValueError(f'Unexpected format for {stat}/{key}')
    value=number(item['value'],fmt=='number',signed)
    if fmt=='percent' and value>100:raise ValueError('Invalid percentage')
    p[key]=value;ctx=context(p,stat)
    if is_rate:ctx['reportedPer90']=value
    if fmt=='percent':ctx['reportedValue']=True
    if stat in RATE_COUNT:
     if r['statValue']['format']!='fraction':raise ValueError('Expected per-90 rate')
     ctx['reportedPer90']=number(r['statValue']['value'])
    if stat=='total_att_assist':
     if r['substatValue']['format']!='fraction':raise ValueError('Expected chances created per 90')
     ctx['reportedPer90']=number(r['substatValue']['value'])
    p['metricContexts'][key]=ctx
 for p in players.values():
  for key in ['minutes','matches']:p['metricContexts'][key]=context(p,'mins_played')
 captures=[v['captured_at'] for v in pages.values()]
 metadata={'source':'FotMob','competition':league['name'],'league_key':league['id'],'season':league['season'],'season_id':league['fotmobSeason'],'league_id':league['fotmobId'],'url':base_url(league)+'/players/accurate_pass/'+league['fotmobSlug'],
  'imported_at':min(captures),'complete':False,'imported_matches':None,'available_matches':league['matches'],
  'coverage':{s:len(d['data']['statsData']) for s,d in pages.items()},'skipped_rows':skipped,
  'pages':{s:{k:v for k,v in d.items() if k!='data'} for s,d in pages.items()},
  'notes':'Rankings públicos FotMob de '+league['name']+' 2026/27. Las ausencias no son ceros. Pases precisos, largos, tiros a puerta y regates: tasas y porcentajes publicados, sin inferir totales. Pases que rompen líneas no equivalen a la definición de pases progresivos de StatsBomb. Los goles evitados pueden ser negativos y se conservan como cifra publicada; no se reconstruye PSxG. Fecha de consulta de GRADA; no es fecha de actualización interna del proveedor.'}
 payload={'metadata':metadata,'players':list(players.values()),'teams':teams,'matches':[]}
 if all(stat in pages for stat in TEAM_SPECS):extend_teams(payload,pages,league,context)
 if league['primary']=='FotMob':extend_core(payload,pages,league,context)
 return payload

def extend_core(payload,pages,league,context):
 players={p['id']:p for p in payload['players']};teams={t['id']:t for t in payload['teams']}
 for p in players.values():p.update({k:None for k in ['goals','assists','shots','xg','xa','xga','psxg','conversion','delta','keypasses','progressive','shotsPer90']})
 def assign(p,key,value,stat,reported=False,team=False):
  p[key]=value;p['metricContexts'][key]=context(p,stat)
  if team:p['metricContexts'][key]['minutes_captured_at']=pages['overview']['captured_at']
  if reported:p['metricContexts'][key]['reportedValue']=True
 for stat,main,sub in [('expected_goals','xg','goals'),('expected_assists','xa','assists'),('total_scoring_att','shotsPer90','conversion')]:
  for row in pages[stat]['data']['statsData']:
   p=players.get(str(row['id']))
   if not p or p['team_id']!=str(row['teamId']):continue
   a,b=row['statValue'],row['substatValue']
   if a['format']!='fraction' or b['format']!=('percent' if stat=='total_scoring_att' else 'number'):raise ValueError('Unexpected core metric format')
   assign(p,main,number(a['value']),stat)
   assign(p,sub,number(b['value'],stat!='total_scoring_att'),stat,True)
   if sub=='conversion' and p[sub]>100:raise ValueError('Invalid conversion')
 for stat,key in [('goals','goals'),('goal_assist','assists')]:
  for row in pages[stat]['data']['statsData']:
   p=players.get(str(row['id']))
   if not p or p['team_id']!=str(row['teamId']) or p[key] is not None:continue
   if row['statValue']['format']!='number':raise ValueError('Expected count')
   assign(p,key,number(row['statValue']['value'],True),stat)
 for p in players.values():
  if p['goals'] is not None and p['xg'] is not None:assign(p,'delta',p['goals']-p['xg'],'expected_goals')
 for stat,key in [('expected_goals_team','xg'),('expected_goals_conceded_team','xga')]:
  if len(pages[stat]['data']['statsData'])!=league['teams']:raise ValueError('Missing team xG')
  for row in pages[stat]['data']['statsData']:
   t=teams.get(str(row['id']))
   if not t or row['statValue']['format']!='fraction':raise ValueError('Invalid team xG')
   assign(t,key,number(row['statValue']['value']),stat,team=True)
 payload['metadata'].update({'profile':'full','notes':payload['metadata']['notes']+' Modelo xG/xA FotMob. Tiros totales disponibles solo mediante coincidencia validada ESPN; tiros/90 y conversión son publicados. No incluye serie de xG por partido.'})

def extend_teams(payload,pages,league,context):
 teams={t['id']:t for t in payload['teams']}
 def assign(t,key,value,stat):
  t[key]=value;t['metricContexts'][key]=context(t,stat);t['metricContexts'][key]['minutes_captured_at']=pages['overview']['captured_at']
 for row in pages['overview']['data']['statsData']:
  t=teams.get(str(row['id']))
  if not t:raise ValueError('Unknown standings team')
  gp=number(row['played'],True);score=re.fullmatch(r'(\d+)-(\d+)',row['scoresStr'])
  if not score or gp>2*(league['teams']-1):raise ValueError('Invalid team coverage')
  t.update({'matches':gp,'minutes':gp*90,'points':number(row['pts'],True,True),'goals':int(score[1]),'conceded':int(score[2]),'xg':None,'xga':None,'clean':None,'bigChances':None,'shotsOnTargetPerMatch':None,'possession':None,'metricContexts':{}})
  for key in ['matches','minutes','points','goals','conceded']:
   t['metricContexts'][key]=context(t,'overview');t['metricContexts'][key]['minutes_captured_at']=pages['overview']['captured_at']
 for stat,key,fmt in [('clean_sheet_team','clean','number'),('ontarget_scoring_att_team','shotsOnTargetPerMatch','fraction'),('big_chance_team','bigChances','number'),('possession_percentage_team','possession','percent')]:
  for row in pages[stat]['data']['statsData']:
   t=teams.get(str(row['id']))
   if not t or row['statValue']['format']!=fmt:raise ValueError('Invalid team statistic')
   value=number(row['statValue']['value'],fmt=='number')
   if fmt=='percent' and value>100:raise ValueError('Invalid team percentage')
   assign(t,key,value,stat)
 if sum(t['goals'] for t in teams.values())!=sum(t['conceded'] for t in teams.values()):raise ValueError('Unbalanced standings goals')
 played=sum(t['matches'] for t in teams.values())/2
 if int(played)!=played:raise ValueError('Unbalanced team appearances')
 payload['metadata'].update({'imported_matches':int(played),'notes':payload['metadata']['notes']+' La clasificación FotMob aporta minutos nominales de equipo (90 por PJ); las métricas de equipo conservan su captura propia.'})

def database(payload):
 c=sqlite3.connect(':memory:')
 try:
  c.execute('CREATE TABLE metadata (key TEXT PRIMARY KEY,value TEXT)');c.executemany('INSERT INTO metadata VALUES (?,?)',[(k,json.dumps(v,ensure_ascii=False)) for k,v in payload['metadata'].items()])
  c.execute('CREATE TABLE teams (id TEXT PRIMARY KEY,name TEXT,matches INTEGER,minutes REAL,points INTEGER,goals INTEGER,conceded INTEGER,xg REAL,xga REAL,clean INTEGER,big_chances INTEGER,shots_on_target_per_match REAL,stats_json TEXT)');c.executemany('INSERT INTO teams VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',[(t['id'],t['name'],t.get('matches'),t.get('minutes'),t.get('points'),t.get('goals'),t.get('conceded'),t.get('xg'),t.get('xga'),t.get('clean'),t.get('bigChances'),t.get('shotsOnTargetPerMatch'),json.dumps(t,ensure_ascii=False)) for t in payload['teams']])
  keys=['minutes','matches','passes','completed','tackles','interceptions','recoveries','accuracy',*EXTRA_FIELDS,*(['goals','assists','shots','xg','xa','xga','conversion','delta','keypasses','shotsPer90'] if payload['metadata'].get('profile')=='full' else [])]
  integer_keys={'goals','assists','shots','keypasses','matches','passes','completed','tackles','interceptions','recoveries',*(item[0] for specs in EXTRA.values() for item in specs if item[2]=='number')}
  c.execute('CREATE TABLE players (id TEXT PRIMARY KEY,name TEXT,team_id TEXT,'+','.join(k+(' INTEGER' if k in integer_keys else ' REAL') for k in keys)+',completed_per90 REAL,stats_json TEXT)')
  c.executemany('INSERT INTO players VALUES ('+','.join('?' for _ in range(len(keys)+5))+')',[(p['id'],p['name'],p['team_id'],*(p[k] for k in keys),p['metricContexts'].get('completed',{}).get('reportedPer90'),json.dumps(p,ensure_ascii=False)) for p in payload['players']])
  c.execute('CREATE TABLE metric_contexts (player_id TEXT,metric TEXT,reported_per90 REAL,captured_at TEXT,url TEXT,minutes REAL,matches INTEGER,PRIMARY KEY(player_id,metric))')
  c.executemany('INSERT INTO metric_contexts VALUES (?,?,?,?,?,?,?)',[(p['id'],k,v.get('reportedPer90'),v['captured_at'],v['url'],v['minutes'],v['matches']) for p in payload['players'] for k,v in p['metricContexts'].items()])
  c.commit()
  if c.execute('PRAGMA integrity_check').fetchone()[0]!='ok':raise ValueError('SQLite integrity failure')
  return c.serialize()
 finally:c.close()

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--league',choices=LEAGUES,default='laliga');parser.add_argument('--input-dir',type=Path);parser.add_argument('--output-dir',type=Path,default=ROOT/'dist/downloads');args=parser.parse_args();league=LEAGUES[args.league]
 def get(item):
  stat,(kind,filename)=item;url=f"{base_url(league)}/{kind}/{stat}/{league['fotmobSlug']}" if stat!='overview' else f"https://www.fotmob.com/leagues/{league['fotmobId']}/overview/{league['fotmobSlug']}"
  if args.input_dir:
   path=args.input_dir/filename
   if path.stat().st_size>MAX_BYTES:raise ValueError('Source file too large')
   body=path.read_bytes();captured=datetime.fromtimestamp(path.stat().st_mtime,timezone.utc).isoformat()
  else:
   request=urllib.request.Request(url,headers={'User-Agent':'GRADA football statistics/1.0'})
   with urllib.request.urlopen(request,timeout=25) as response:body=response.read(MAX_BYTES+1)
   captured=datetime.now(timezone.utc).isoformat()
   if body[:2]==b'\x1f\x8b':
    with gzip.GzipFile(fileobj=io.BytesIO(body)) as handle:body=handle.read(MAX_BYTES+1)
  if len(body)>MAX_BYTES:raise ValueError('Source response too large')
  return stat,{'url':url,'captured_at':captured,'sha256':hashlib.sha256(body).hexdigest(),'data':parse(body,stat,league)}
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:pages=dict(pool.map(get,specs(league).items()))
 payload=build(pages,league);document=json.dumps(payload,ensure_ascii=False,separators=(',',':')).encode();db=gzip.compress(database(payload),mtime=0)
 atomic(args.output_dir/f"fotmob-{league['id']}-2026-27.json",document);atomic(args.output_dir/f"fotmob-{league['id']}-2026-27.sqlite.gz",db)
 print(json.dumps({'source':'FotMob','season':'2026/27','players':len(payload['players']),'coverage':payload['metadata']['coverage'],'imported_at':payload['metadata']['imported_at']}))

if __name__=='__main__':main()
