'use strict';
const fs=require('node:fs'),path=require('node:path'),V=require('../dist/fantasy-analysis');
function csvCell(value){const text=value===null||value===undefined?'':String(value),safe=typeof value==='string'&&/^\s*[=+\-@]/.test(text)?"'"+text:text;return '"'+safe.replaceAll('"','""')+'"';}
function packageReport(report,joined){
 V.validate(report);
 const fields=[...new Set(joined.records.flatMap(r=>Object.keys(r.metrics)))];
 const header=['id_grada','id_fantasy','jugador','equipo','perfil','puntos_acumulados','minutos_fantasy','minutos_analitica','pj_fantasy','pj_fotmob','metodo_cruce',...fields.map(k=>k+' · '+(joined.records.find(r=>r.contexts[k])?.contexts[k].label||k)),'amarillas','expulsiones_directa_y_doble_amarilla','penaltis_provocados'];
 const rows=joined.records.map(r=>[r.id,r.fantasy_id,r.name,r.team,r.profile,r.points,r.fantasy_minutes,r.minutes,r.fantasy_matches,r.matches,r.match_method,...fields.map(k=>r.metrics[k]),r.fantasy_counts.yellowCards,r.fantasy_counts.redCards,r.fantasy_counts.penaltiesWon]);
 const csv='\ufeff'+[header,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
 const css=fs.readFileSync(path.join(__dirname,'../dist/style.css'),'utf8');
 const html='<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:;"><title>GRADA · regresiones Fantasy · LaLiga 2026/27</title><style>'+css+'</style></head><body class="reg-offline">'+V.overview(report)+report.models.map(m=>V.model(report,m.key)).join('')+'<p>Informe exploratorio. Datos FotMob/ESPN de GRADA y Analítica Fantasy, según las fuentes y capturas descritas. Los cuatro pesos ofensivos aprobados se muestran por separado del reparto alternativo positivo; nuevas regresiones no los actualizan automáticamente.</p></body></html>';
 return {csv,html};
}
if(require.main===module){
 const arg=(key,fallback)=>{const i=process.argv.indexOf(key);return i<0?fallback:process.argv[i+1];},reportFile=arg('--report',null),input=arg('--input',null),folder=arg('--output-dir',path.join(__dirname,'../dist/downloads'));
 if(!reportFile||!input)throw Error('--report and --input required');
 const report=JSON.parse(fs.readFileSync(reportFile)),joined=JSON.parse(fs.readFileSync(input)),files=packageReport(report,joined);fs.mkdirSync(folder,{recursive:true});
 fs.writeFileSync(path.join(folder,'fantasy-regression-input-laliga-2026-27.json'),JSON.stringify(joined));
 for(const [ext,body]of Object.entries({json:JSON.stringify(report),html:files.html,csv:files.csv}))fs.writeFileSync(path.join(folder,'fantasy-regression-laliga-2026-27.'+ext),body);
 process.stdout.write(JSON.stringify({models:report.models.length,matched:joined.records.length,output:folder})+'\n');
}
module.exports={csvCell,packageReport};
