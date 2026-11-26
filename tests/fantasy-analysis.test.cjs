'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),V=require('../dist/fantasy-analysis'),{club,cross}=require('../scripts/export_fantasy_regression.cjs'),{csvCell}=require('../scripts/package_fantasy_regression.cjs'),{fixture}=require('./helpers/explore.cjs');
function data(){
 const d=fixture();d.metadata.league_key='laliga';d.players=d.players.map((p,i)=>({...p,name:'Isolated '+i,team:'Club '+p.team_id,sourceRecords:{FotMob:{id:String(i+1),team_id:p.team_id,name:'Isolated '+i,pos:p.pos}}}));
 const fantasy={metadata:{source:'Analítica Fantasy',season:'2026/27',captured_at:'2026-11-26T10:00:00Z',url:'https://www.analiticafantasy.com/fixture'},players:d.players.map((p,i)=>({playerId:i+1000,playerName:p.name,teamName:p.team,positionId:{POR:1,DEF:2,MED:3,DEL:4}[p.pos],totalPoints:i,minsPlayed:p.minutes,matchesPlayed:p.matches,yellowCard:0,redCard:0,secondYellowCard:1,penaltyWon:0,goalsPts:99999}))};return {d,fantasy};
}
test('Fantasy joins are one-to-one, club-scoped and distinguish observed counts from scoring components',()=>{
 const {d,fantasy}=data(),r=cross(d,fantasy,d.players);
 assert.equal(r.records.length,d.players.length);assert.equal(new Set(r.records.map(p=>p.fantasy_id)).size,r.records.length);assert.equal(r.records[0].fantasy_counts.redCards,1);assert(!Object.keys(r.records[0].metrics).includes('goalsPts'));
 fantasy.players[0].teamName='Another club';assert.equal(cross(d,fantasy,d.players).unmatched.length,1);
 assert.equal(club('Deportivo Alavés'),club('Alaves'));assert.equal(club('Deportivo A Coruña'),club('Deportivo La Coruna'));assert.notEqual(club('Atlético Madrid'),club('Deportivo A Coruña'));
 const duplicate={...fantasy.players[1],playerId:99999};fantasy.players.push(duplicate);assert(!cross(d,fantasy,d.players).records.some(r=>r.id===d.players[1].id));
});
test('report rendering labels insufficient samples, escapes names and never implies a fitted coefficient',()=>{
 const m={key:'MED_DEF',label:'Isolated <profile>',n:5,matched:6,status:'insufficient_sample',reason:'Insufficient <n>',coefficients:[],players:[],excluded:[{name:'<script>',team:'A&B',reasons:['missing <x>']}],exclusion_counts:{'missing <x>':1}};
 const html=V.model({models:[m]},m.key);assert(html.includes('Muestra insuficiente'));assert(!html.includes('<script>'));assert(html.includes('&lt;script&gt;'));assert(!html.includes('Ridge · pts'));
 assert.throws(()=>V.validate({metadata:{competition:'Other'}}));assert.equal(csvCell('=HYPERLINK(1)'), '"\'=HYPERLINK(1)"');assert.equal(csvCell(-2),'"-2"');
});

test('grouped reports distinguish proposed axis weights, group allocation and the approved score policy',()=>{
 const m={key:'DEF',label:'Defensas',n:25,matched:25,status:'fitted',clubs:10,alpha:1,validation:{mae:5,r2:0.5},minutes_only:{mae:7},constant_features:[],ols_status:'insufficient_sample',exclusion_counts:{},excluded:[],players:[{name:'A',team:'B',points:5,predicted_oof:4}],feature_labels:{goals:'Goles <90>',assists:'Asistencias'},correlation:{features:['goals','assists'],matrix:[[1,0.9],[0.9,1]],threshold:0.8},groups:[{id:'G1',members:['goals','assists'],signs:[1,1],size:2,min_abs_correlation:0.9,ridge:10}],coefficients:['goals','assists'].map(key=>({key,label:key,kind:'axis',group:'G1',group_size:2,ridge_standardized:5,ridge_raw:2,sign_stability:1,suggested_axis_share:0.5}))};
 const html=V.model({models:[m]},'DEF');assert.match(html,/Matriz de correlaciones/);assert.match(html,/Pesos orientativos/);assert.match(html,/50 %/);assert.match(html,/Pesos ofensivos aplicados al score/);assert.match(html,/Este reparto alternativo no se utiliza/);assert.match(html,/no son efectos individuales/);assert(!html.includes('Goles <90>'));assert(html.includes('Goles &lt;90&gt;'));
});
