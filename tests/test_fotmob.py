"""Isolated source contracts; fixtures here are never published by GRADA."""
import importlib.util
import json
from pathlib import Path
import sqlite3
import unittest

spec=importlib.util.spec_from_file_location('fotmob',Path(__file__).resolve().parents[1]/'scripts/import_fotmob.py')
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def pages():
    result={}
    for stat,(kind,_) in module.SPECS.items():
        row={'id':1,'teamId':1,'name':'Isolated fixture','position':11,
             'statValue':{'name':stat,'value':1,'format':'fraction'},'substatValue':{'value':1,'format':'number'}}
        if stat=='accurate_pass':
            row['statValue']['value']=105.9;row['substatValue']={'value':94.4,'format':'percent'}
        if stat=='mins_played':
            row['statValue']={'name':stat,'value':700,'format':'number'};row['substatValue']['value']=10
        if stat=='total_tackle':row['statValue']['value']=2.6;row['substatValue']['value']=20
        for key,part,fmt,signed,_ in module.EXTRA.get(stat,[]):
            row[part]={'name':stat,'value':-3 if signed else 1,'format':fmt}
        if stat=='total_att_assist':row['substatValue']['format']='fraction'
        data={'currentSeasonId':'38843','currentStatName':stat,'type':kind,'leagueDetails':{'id':87},
              'seasons':[{'id':38843,'name':'2026/2027'}],'statsData':[row]}
        if kind=='teams':data['statsData']=[{**row,'id':i,'teamId':i,'name':f'Fixture club {i}'} for i in range(1,21)]
        result[stat]={'data':data,'captured_at':'2026-11-06T12:00:00+00:00','url':f'{module.BASE}/{kind}/{stat}/laliga','sha256':'fixture'}
    return result


class FotmobContract(unittest.TestCase):
    def test_does_not_back_calculate_counts_and_retains_signed_stat(self):
        data=module.build(pages());p=data['players'][0]
        self.assertIsNone(p['passes']);self.assertIsNone(p['completed'])
        self.assertEqual(p['metricContexts']['completed']['reportedPer90'],105.9)
        self.assertEqual(p['tackles'],20);self.assertEqual(p['metricContexts']['tackles']['reportedPer90'],2.6)
        self.assertEqual(p['prevented'],-3)
        self.assertIsNone(data['metadata']['imported_matches'])
        db=sqlite3.connect(':memory:')
        try:
            db.deserialize(module.database(data))
            self.assertEqual(db.execute('SELECT passes,completed,completed_per90,prevented FROM players').fetchone(),(None,None,105.9,-3))
            self.assertEqual(db.execute("SELECT reported_per90 FROM metric_contexts WHERE metric='tackles'").fetchone()[0],2.6)
        finally:db.close()

    def test_missing_rows_remain_unknown_and_different_clubs_are_not_joined(self):
        source=pages();source['interception']['data']['statsData']=[]
        source['ball_recovery']['data']['statsData'][0]['teamId']=2
        p=module.build(source)['players'][0]
        self.assertIsNone(p['interceptions']);self.assertIsNone(p['recoveries'])

    def test_html_extraction_validates_season_and_count_formats(self):
        source=pages();doc={'props':{'pageProps':{'data':source['total_tackle']['data']}}}
        def body():return ('<script id="__NEXT_DATA__" type="application/json">'+json.dumps(doc)+'</script>').encode()
        self.assertEqual(module.parse(body(),'total_tackle')['currentSeasonId'],'38843')
        doc['props']['pageProps']['data']['currentSeasonId']='2025'
        with self.assertRaises(ValueError):module.parse(body(),'total_tackle')
        source['total_tackle']['data']['statsData'][0]['substatValue']['value']=2.5
        with self.assertRaises(ValueError):module.build(source)


if __name__=='__main__':unittest.main()
