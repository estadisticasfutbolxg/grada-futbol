#!/usr/bin/env python3
"""Generate verified combined league snapshots and free SQLite downloads."""
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT=Path(__file__).resolve().parents[1]
CATALOG=json.loads((ROOT/'dist/leagues.json').read_text())


def run(args):
    subprocess.run(args,cwd=ROOT,check=True)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--league',action='append',choices=[l['id'] for l in CATALOG])
    parser.add_argument('--all',action='store_true',help='Process every configured league; unavailable leagues are reported and omitted')
    parser.add_argument('--input-root',type=Path,help='Reuse original HTML in <league>/ and ESPN responses in <league>/espn/')
    parser.add_argument('--profiles',action='store_true',help='Enrich players from verified FotMob profile pages')
    parser.add_argument('--profiles-root',type=Path,help='Reuse real profile HTML in <league>/<player-id>.html')
    parser.add_argument('--output-dir',type=Path,default=ROOT/'dist/downloads')
    args=parser.parse_args()
    selected=args.league or ([l['id'] for l in CATALOG] if args.all else [])
    if not selected:parser.error('Choose --all or at least one --league')
    args.output_dir.mkdir(parents=True,exist_ok=True)
    outcomes=[]
    for league in [l for l in CATALOG if l['id'] in selected]:
        try:
            with tempfile.TemporaryDirectory(prefix='grada-league-') as temporary:
                stage=Path(temporary)
                if league['primary']=='Understat':
                    old=ROOT/'dist/downloads/understat-laliga-2026-27.json'
                    if old.exists() and old.with_suffix('.sqlite.gz').exists():
                        for source in [old,old.with_suffix('.sqlite.gz')]:
                            if source.exists():shutil.copy2(source,stage/source.name)
                    else:run([sys.executable,'scripts/import_understat.py','--output-dir',str(stage)])
                fm=[sys.executable,'scripts/import_fotmob.py','--league',league['id'],'--output-dir',str(stage)]
                espn=[sys.executable,'scripts/import_laliga.py','--league',league['id'],'--output',str(stage/league['espnFile'])]
                if args.input_root:
                    fm+=['--input-dir',str(args.input_root/league['id'])]
                    espn+=['--input-dir',str(args.input_root/league['id']/'espn')]
                run(fm);run(espn)
                if args.profiles or args.profiles_root:
                    enrich=[sys.executable,'scripts/enrich_fotmob.py','--league',league['id'],'--output-dir',str(stage)]
                    if args.profiles_root:enrich+=['--input-dir',str(args.profiles_root/league['id'])]
                    run(enrich)
                run(['node','scripts/build_combined.cjs','--league',league['id'],'--data-dir',str(stage)])
                check="const fs=require('fs'),c=require('./dist/combined.js'),d=JSON.parse(fs.readFileSync(process.argv[1]));const q=c.coverage(d);if(!q.complete)throw Error(q.missing.join(','));console.log(JSON.stringify({league:d.metadata.competition,players:d.players.length,teams:d.teams.length,coverage:q}));"
                run(['node','-e',check,str(stage/f"combined-{league['id']}-2026-27.json")])
                # All outputs exist and validate before any published filename changes.
                for source in stage.iterdir():
                    target=args.output_dir/source.name
                    with tempfile.NamedTemporaryFile(dir=args.output_dir,delete=False) as handle:
                        tmp=Path(handle.name)
                    try:shutil.copyfile(source,tmp);os.replace(tmp,target)
                    finally:tmp.unlink(missing_ok=True)
                outcomes.append({'league':league['id'],'status':'generated'})
        except (ValueError,OSError,subprocess.CalledProcessError) as error:
            outcomes.append({'league':league['id'],'status':'unavailable','error':str(error)})
            if not args.all:raise
    print(json.dumps({'leagues':outcomes},ensure_ascii=False))
    if not any(o['status']=='generated' for o in outcomes):raise SystemExit('No complete league was generated; existing files were preserved.')


if __name__=='__main__':main()
