#!/usr/bin/env python3
"""Generate verified provider snapshots, SQLite and coherent derived scores."""
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
    parser.add_argument('--keeper-profiles',action='store_true',help='Enrich only keeper profiles, including verified received xGOT')
    parser.add_argument('--profiles-root',type=Path,help='Reuse real profile HTML in <league>/<player-id>.html')
    parser.add_argument('--squads',action='store_true',help='Enrich verified squad positions and nationalities')
    parser.add_argument('--squads-root',type=Path,help='Reuse real squad HTML in <league>/<team-id>.html')
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
                    if old.exists():
                        for source in [old,old.with_suffix('.sqlite.gz')]:
                            if source.exists():shutil.copy2(source,stage/source.name)
                    elif league.get('understatRefresh') is False:
                        raise ValueError('Falta la captura conservada de Understat para el catálogo de LaLiga. Su consulta general está pausada; el importador manual se conserva.')
                    else:run([sys.executable,'scripts/import_understat.py','--output-dir',str(stage)])
                fm=[sys.executable,'scripts/import_fotmob.py','--league',league['id'],'--output-dir',str(stage)]
                espn=[sys.executable,'scripts/import_laliga.py','--league',league['id'],'--output',str(stage/league['espnFile'])]
                if args.input_root:
                    cached=args.input_root/league['id']
                    fm+=['--input-dir',str(cached/'raw' if (cached/'raw').is_dir() else cached)]
                    espn+=['--input-dir',str(args.input_root/league['id']/'espn')]
                run(fm);run(espn)
                if args.squads or args.squads_root:
                    squads=[sys.executable,'scripts/enrich_squads.py','--league',league['id'],'--output-dir',str(stage)]
                    if args.squads_root:squads+=['--input-dir',str(args.squads_root/league['id'])]
                    run(squads)
                if args.profiles or args.profiles_root or args.keeper_profiles:
                    enrich=[sys.executable,'scripts/enrich_fotmob.py','--league',league['id'],'--output-dir',str(stage)]
                    if args.keeper_profiles and not args.profiles:enrich+=['--keepers-only']
                    if args.profiles_root:enrich+=['--input-dir',str(args.profiles_root/league['id'])]
                    run(enrich)
                run(['node','scripts/build_combined.cjs','--league',league['id'],'--data-dir',str(stage),'--reference-dir',str(args.output_dir)])
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
    if not any(o['status']=='generated' for o in outcomes):raise SystemExit('No complete league was generated; existing files were preserved.')
    # Recompute derived scores against the same final source set for every league.
    for league in CATALOG:
        required=[league['espnFile'],f"fotmob-{league['id']}-2026-27.json"]
        if league['primary']=='Understat':required.append(f"understat-{league['id']}-2026-27.json")
        if all((args.output_dir/name).exists() for name in required):
            run(['node','scripts/build_combined.cjs','--league',league['id'],'--data-dir',str(args.output_dir)])
    print(json.dumps({'leagues':outcomes},ensure_ascii=False))


if __name__=='__main__':main()
