(function(root){
  'use strict';
  const node=typeof module==='object'&&module.exports;
  const metrics=node?require('./metrics.js'):root.GradaMetrics;
  const fotmob=node?require('./fotmob.js'):root.GradaFotmob;
  const leagues=node?require('./leagues.js'):root.GradaLeagues;
  const sum=values=>values.reduce((a,b)=>a+b,0);
  const numeric=metrics.number;
  const totalKeys=new Set([...metrics.rates,'minutes','matches','clean','points','bigChances']);
  const rateKeys=new Set([...fotmob.publishedRates,'completedPer90','shotsPer90','savesPer90','shotsOnTargetPerMatch']);
  const percentageKeys=new Set([...fotmob.percentages,'accuracy','conversion','possession']);
  function identity(record,{team=false}={}){
    const id=record.sourceRecords?.FotMob?.id;
    return /^\d{1,12}$/.test(String(id))?(team?'club:':'player:')+id:null;
  }
  function primary(rows){const known=p=>['POR','DEF','MED','DEL'].includes(p.pos);return [...rows].sort((a,b)=>Number(known(b))-Number(known(a))||Number(leagues.get(a.league_key).kind==='tournament')-Number(leagues.get(b.league_key).kind==='tournament')||(b.minutes??-1)-(a.minutes??-1)||a.id.localeCompare(b.id))[0];}
  function partsFor(rows,key,{unit='total',weight=null}={}){
    return rows.flatMap(row=>{
      const context=metrics.context(row,key),value=unit==='90'||rateKeys.has(key)?metrics.metric(row,key,unit):row[key];
      if(!numeric(value)||!context?.source||weight&&(!numeric(context[weight])||context[weight]<=0))return [];
      return [{competition:row.league_key,source:context.source,value,minutes:context.minutes??null,matches:context.matches??null,
        captured_at:context.captured_at||null,minutes_captured_at:context.minutes_captured_at||null,componentCaptures:context.componentCaptures||{},url:context.url||null,sample_id:context.sample_id||null,original:context}];
    });
  }
  function context(parts,method,total){
    const sources=[...new Set(parts.map(p=>p.source))].sort();
    const known=parts.map(({original,...part})=>part).sort((a,b)=>a.competition.localeCompare(b.competition)||a.source.localeCompare(b.source));
    const dates=parts.map(p=>Date.parse(p.captured_at)).filter(Number.isFinite);
    return {source:sources.length===1?sources[0]:'Mixta',minutes:parts.every(p=>numeric(p.minutes))?sum(parts.map(p=>p.minutes)):null,
      matches:parts.every(p=>numeric(p.matches))?sum(parts.map(p=>p.matches)):null,
      captured_at:dates.length?new Date(Math.min(...dates)).toISOString():null,
      sample_id:JSON.stringify(known.map(p=>[p.competition,p.source,p.minutes,p.matches,p.sample_id])),
      aggregation:method,coverage:{known:parts.length,total},contributions:known};
  }
  function breakdown(rows){return rows.map(p=>({competition:p.league_key,label:leagues.get(p.league_key).name,minutes:p.minutes??null,matches:p.matches??null,goals:p.goals??null,assists:p.assists??null,xg:p.xg??null,xa:p.xa??null,team:p.team||p.name,player_id:p.id}));}
  function statistics(rows,base){
    if(rows.length===1)return {...base,competitionAggregate:true,disciplineSample:base,competitionBreakdown:breakdown(rows)};
    const result={...base,metricContexts:{},fieldSources:{}};
    function assign(key,parts,value,method){if(!parts.length||!numeric(value)){result[key]=null;return;}result[key]=value;result.metricContexts[key]=context(parts,method,rows.length);result.fieldSources[key]=result.metricContexts[key].source;}
    for(const key of totalKeys){
      if(Object.hasOwn(metrics.sums,key))continue;
      const parts=partsFor(rows,key);assign(key,parts,sum(parts.map(p=>p.value)),'sum_known');
      const rateParts=metrics.rates.has(key)?partsFor(rows,key,{unit:'90',weight:'minutes'}):[];
      if(parts.length&&rateParts.length){const rate=context(rateParts,'weighted_rate',rows.length);rate.reportedPer90=sum(rateParts.map(p=>p.value*p.minutes))/sum(rateParts.map(p=>p.minutes));result.metricContexts[key].rateContext=rate;}
      if(key==='psxg'&&parts.length&&parts.every(p=>numeric(p.original.pairedConceded)))result.metricContexts[key].pairedConceded=sum(parts.map(p=>p.original.pairedConceded));
    }
    for(const key of [...rateKeys,...percentageKeys]){
      const weight=key==='shotsOnTargetPerMatch'?'matches':'minutes',parts=partsFor(rows,key,{weight});
      assign(key,parts,parts.length?sum(parts.map(p=>p.value*p[weight]))/sum(parts.map(p=>p[weight])):null,percentageKeys.has(key)?'minutes_weighted_percentage':'weighted_rate');
    }
    const delta=metrics.pair(result,'goals','xg','same_source_difference');
    result.delta=delta?delta.first-delta.second:null;if(delta){result.metricContexts.delta=delta.context;result.fieldSources.delta=delta.context.source;}
    const conversion=metrics.pair(result,'goals','shots','same_source_ratio');
    if(conversion&&conversion.second>0){result.conversion=conversion.first/conversion.second*100;result.metricContexts.conversion=conversion.context;result.fieldSources.conversion=conversion.context.source;}
    const paired=rows.filter(p=>numeric(p.yellowCards)&&numeric(p.redCards)&&metrics.sameSample(metrics.context(p,'yellowCards'),metrics.context(p,'redCards')));
    if(paired.length){
      result.disciplineSample={};for(const key of ['yellowCards','redCards']){const parts=partsFor(paired,key);result.disciplineSample[key]=sum(parts.map(p=>p.value));(result.disciplineSample.metricContexts??={})[key]=context(parts,'sum_paired_cards',rows.length);}
    }else result.disciplineSample=null;
    result.competitionAggregate=true;
    result.competitionBreakdown=breakdown(rows);
    result.league=[...new Set(result.competitionBreakdown.map(p=>p.label))].join(' + ');
    return result;
  }
  function merge(data){
    if(Array.isArray(data.metadata.leagues)&&new Set(data.metadata.leagues.map(l=>l.id)).size!==data.metadata.leagues.length)throw new Error('Competición duplicada en la temporada.');
    if(data.metadata.aggregation==='provider_identity_season_v1')return data;
    if(!data.metadata.leagues?.some(l=>leagues.get(l.id).kind==='tournament'))return data;
    const teamGroups=new Map(),playerGroups=new Map();
    for(const team of data.teams){const key=identity(team,{team:true})||team.id;if(!teamGroups.has(key))teamGroups.set(key,[]);teamGroups.get(key).push(team);}
    const teams=[],clubIds=new Map(),clubNames=new Map();
    for(const [key,rows]of teamGroups){const base=primary(rows),merged=identity(base,{team:true})?statistics(rows,base):base;teams.push(merged);clubIds.set(key,merged.id);clubNames.set(key,merged.name);}
    const knownRoles=new Map();for(const p of data.players)if(identity(p)&&['POR','DEF','MED','DEL'].includes(p.pos)){const key=identity(p);if(!knownRoles.has(key))knownRoles.set(key,new Set());knownRoles.get(key).add(p.pos==='POR'?'keeper':'field');}
    for(const player of data.players){const id=identity(player),conflict=id&&knownRoles.get(id)?.size>1,key=(id||player.id)+(conflict?':'+(player.pos==='POR'?'keeper':['DEF','MED','DEL'].includes(player.pos)?'field':'unknown'):'');if(!playerGroups.has(key))playerGroups.set(key,[]);playerGroups.get(key).push(player);}
    const players=[];
    for(const rows of playerGroups.values()){
      if(new Set(rows.map(p=>p.league_key)).size!==rows.length)throw new Error('Identidad duplicada dentro de una competición.');
      const base=primary(rows);if(!identity(base)){players.push(base);continue;}
      const merged=statistics(rows,base),clubs=[...new Set(rows.map(p=>p.sourceRecords?.FotMob?.team_id).filter(id=>/^\d{1,12}$/.test(String(id))))];
      if(knownRoles.get(identity(base))?.size>1)merged.identityConflict=true;
      merged.team_id=clubs.length===1?clubIds.get('club:'+clubs[0])??null:null;
      merged.team=clubs.length===1?clubNames.get('club:'+clubs[0])||base.team:[...new Set(rows.map(p=>p.team))].join(', ');
      players.push(merged);
    }
    return {...data,metadata:{...data.metadata,aggregation:'provider_identity_season_v1',notes:data.metadata.notes+' Liga y torneos: sumas conocidas por ID FotMob; tasas y porcentajes medios con sus muestras propias. Los guiones no son ceros. Los porcentajes publicados se ponderan por minutos cuando faltan sus denominadores originales. Se conserva un desglose por competición.'},players,teams};
  }
  function scoringRows(players,referencePlayers){
    const canonical=new Map();for(const row of referencePlayers)if(row.competitionAggregate){const key=identity(row);if(key)canonical.set(key,canonical.has(key)?null:row);}
    return players.map(p=>{const key=identity(p),row=canonical.get(key);return row?{...row,id:p.id,team_id:p.team_id}:key&&canonical.has(key)?{...p,identityConflict:true}:p;});
  }
  function alignPositions(data,referencePlayers){
    const rows=scoringRows(data.players,referencePlayers);let changed=false;
    const players=data.players.map((p,i)=>{const canonical=rows[i];if(!canonical.competitionAggregate||p.pos===canonical.pos)return p;changed=true;
      return {...p,pos:canonical.pos,seasonPosition:{position:canonical.pos,original_position:p.seasonPosition?.original_position??p.pos,competition:canonical.league_key,method:'published_position_league_then_minutes',definition:'Puesto conocido publicado; prioridad de liga y después minutos, independiente del score.'}};
    });
    return changed?{...data,players}:data;
  }
  const api={identity,merge,scoringRows,alignPositions};if(node)module.exports=api;else root.GradaCompetitions=api;
})(typeof window==='object'?window:globalThis);
