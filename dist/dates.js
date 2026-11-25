(function(root){
  'use strict';
  const names={understat:'Understat',espn:'ESPN',fotmob:'FotMob'},sourceNames=new Set(Object.values(names));
  const cache=new WeakMap(),zone='Europe/Madrid';
  const day=new Intl.DateTimeFormat('es-ES',{dateStyle:'medium',timeZone:zone});
  const full=new Intl.DateTimeFormat('es-ES',{dateStyle:'medium',timeStyle:'short',timeZone:zone});
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const numeric=value=>typeof value==='number'&&Number.isFinite(value);
  function timestamp(value){
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(value))return null;
    const time=Date.parse(value);return Number.isFinite(time)?time:null;
  }
  function range(values){
    const dates=[...values].filter(numeric);return dates.length?{first:Math.min(...dates),last:Math.max(...dates)}:null;
  }
  function format(value,withTime=false){
    if(!value)return 'Sin fecha';
    const formatter=withTime?full:day;
    return value.first===value.last?formatter.format(value.first):formatter.formatRange(value.first,value.last);
  }
  // Work from the displayed snapshot, including retained fields. A newer identity
  // capture must never advance the date of that player's statistics.
  function snapshot(data,record=null){
    if(!data?.metadata)return [];
    if(!record&&cache.has(data))return cache.get(data);
    const meta=data.metadata,leagues=Array.isArray(meta.leagues)?meta.leagues:[{id:meta.league_key,name:meta.competition,sources:meta.sources||{[meta.source]:meta}}];
    const rows=[],index=new Map(),parsed=new Map();
    const recordSources=record?new Set([...Object.keys(record.sourceRecords||{}),...Object.values(record.fieldSources||{}),...Object.values(record.metricContexts||{}).map(context=>context?.source)]):null;
    if(recordSources&&!recordSources.size)recordSources.add(meta.primary_source||meta.source);
    const parse=value=>{if(!parsed.has(value))parsed.set(value,timestamp(value));return parsed.get(value);};
    const add=(set,value)=>{const time=parse(value);if(time!==null)set.add(time);};
    for(const league of leagues||[]){
      if(record&&record.league_key&&league.id!==record.league_key)continue;
      for(const [source,sourceMeta]of Object.entries(league.sources||{})){
        if(!sourceNames.has(source))continue;
        if(recordSources&&!recordSources.has(source))continue;
        const base=parse(sourceMeta.imported_at),row={league:league.id,leagueName:league.name,source,base:base===null?null:{first:base,last:base},statistics:new Set(),identity:new Set()};
        // Aggregate captures supply the default dates for fields without context.
        if(base!==null)row.statistics.add(base);
        rows.push(row);index.set(league.id+':'+source,row);
      }
    }
    function visit(item,league,fallback){
      for(const [field,context]of Object.entries(item.metricContexts||{})){
        if(!context||(!numeric(item[field])&&!numeric(context.reportedPer90)))continue;
        for(const contribution of context.contributions||[]){
          const component=index.get(contribution.competition+':'+contribution.source);if(!component)continue;
          add(component.statistics,contribution.captured_at);add(component.statistics,contribution.minutes_captured_at);
          for(const at of Object.values(contribution.componentCaptures||{}))add(component.statistics,at);
        }
        if(context.contributions?.length)continue;
        const row=index.get(league+':'+(context.source||fallback));if(!row)continue;
        add(row.statistics,context.captured_at);
        add(row.statistics,context.minutes_captured_at);
        for(const at of Object.values(context.componentCaptures||{}))add(row.statistics,at);
      }
      for(const context of [item.positionContext,item.positionResolution?.context,item.tacticalContext,item.nationality?.context]){
        if(!context)continue;
        const row=index.get(league+':'+(context.source||fallback));if(row)add(row.identity,context.captured_at);
      }
      for(const [source,raw]of Object.entries(item.sourceRecords||{}))if(raw)visit(raw,league,source);
    }
    for(const item of record?[record]:[...(data.players||[]),...(data.teams||[])])visit(item,item.league_key||meta.league_key,meta.primary_source);
    const result=rows.map(row=>({...row,statistics:range(row.statistics),identity:range(row.identity)}));
    if(!record)cache.set(data,result);
    return result;
  }
  function sourceSummary(rows){
    return [...sourceNames].flatMap(source=>{
      const dates=rows.filter(row=>row.source===source).flatMap(row=>row.statistics?[row.statistics.first,row.statistics.last]:[]);
      return rows.some(row=>row.source===source)?[{source,dates:range(dates)}]:[];
    });
  }
  function timeHTML(value){
    return value?'<time datetime="'+new Date(value.first).toISOString()+'">'+esc(format(value,true))+'</time>':'Sin fecha';
  }
  function panel(rows,history,refreshing=false){
    const summary=sourceSummary(rows).map(row=>'<span class="date-chip"><b>'+row.source+'</b> '+esc(format(row.dates))+'</span>').join('');
    const body=rows.map(row=>{
      const attempt=history?.get(row.league,row.source),label=attempt?.status==='accepted'?'Consulta válida':'Se conservan datos';
      return '<tr><th scope="row">'+esc(row.leagueName)+'</th><td>'+row.source+'</td><td>'+timeHTML(row.statistics)+'</td><td>'+timeHTML(row.base)+'</td><td>'+timeHTML(row.identity)+'</td><td>'+(attempt?timeHTML({first:attempt.at,last:attempt.at})+'<span class="date-outcome">'+label+'</span>':'Sin registro')+'</td></tr>';
    }).join('');
    return '<summary><span class="date-heading">Datos cargados</span><span class="date-chips">'+summary+'</span><span class="date-action">'+(refreshing?'Actualizando…':'Ver fechas')+'</span></summary><div class="date-body"><p>Fechas de captura, no del último partido. Cada fuente puede conservar estadísticas de distintas consultas. Las fichas de posición y nacionalidad tienen su propia fecha. Horario de Madrid.</p><div class="date-scroll" tabindex="0" role="region" aria-label="Fechas por liga y fuente"><table><thead><tr><th>Liga</th><th>Fuente</th><th>Estadísticas</th><th>Captura base</th><th>Fichas</th><th>Último intento aquí</th></tr></thead><tbody>'+body+'</tbody></table></div><p>El último intento se guarda en este navegador. Una consulta válida puede devolver datos en caché; si falla, se conserva la captura anterior. La fecha de una ficha no actualiza sus estadísticas.</p></div>';
  }
  function recordHTML(data,record){
    const summary=sourceSummary(snapshot(data,record));
    return summary.length?'<p class="record-dates">Capturas estadísticas · '+summary.map(row=>'<span>'+row.source+' '+esc(format(row.dates))+'</span>').join(' · ')+'. Horario de Madrid.</p>':'';
  }
  function history(storage,leagueIds){
    const key='grada:refresh-checks:2026-27:v1',allowed=new Set(leagueIds),entries=new Map();
    function valid(id,source,value){return allowed.has(id)&&sourceNames.has(source)&&value&&['accepted','retained'].includes(value.status)&&timestamp(value.at)!==null;}
    try{
      const saved=JSON.parse(storage?.getItem(key)||'[]');
      if(Array.isArray(saved))for(const item of saved.slice(0,32*sourceNames.size)){
        if(Array.isArray(item)&&item.length===4){const [id,source,at,status]=item;if(valid(id,source,{at,status}))entries.set(id+':'+source,{at:timestamp(at),status});}
      }
    }catch(_){}
    function persist(){try{storage?.setItem(key,JSON.stringify([...entries].map(([entry,value])=>{const split=entry.lastIndexOf(':');return [entry.slice(0,split),entry.slice(split+1),new Date(value.at).toISOString(),value.status];})));}catch(_){}}
    persist();
    return {
      get:(id,source)=>entries.get(id+':'+source)||null,
      record(id,source,status,at=new Date().toISOString()){
        if(!valid(id,source,{status,at}))return false;
        entries.set(id+':'+source,{at:timestamp(at),status});
        persist();
        return true;
      }
    };
  }
  const api={snapshot,sourceSummary,format,panel,recordHTML,history};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.GradaDates=api;
})(typeof window==='object'?window:globalThis);
