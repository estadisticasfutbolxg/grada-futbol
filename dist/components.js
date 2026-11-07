(function(root) {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const numberFormat = new Intl.NumberFormat('es-ES',{maximumFractionDigits:2});
  const dateFormat = new Intl.DateTimeFormat('es-ES',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Madrid'});
  const format = value => numberFormat.format(value);
  function provenance(record,key,metadata) {
    const ctx = root.GradaMetrics.context(record,key), source = ctx?.source || record.fieldSources?.[key];
    if (!source) return null;
    const date = ctx?.captured_at || metadata.sources?.[source]?.imported_at || metadata.imported_at;
    const when = dateFormat.format(new Date(date));
    const differentMatches = typeof ctx?.matches === 'number' && ctx.matches !== record.matches;
    return {source,date,matches:ctx?.matches ?? null,label:source+(differentMatches?' · '+ctx.matches+' PJ':''),
      text:source+' · captura '+when+' (Madrid)'+(typeof ctx?.matches === 'number'?' · '+ctx.matches+' PJ de origen':'')+(typeof ctx?.minutes==='number'?' · '+format(ctx.minutes)+' min de origen':ctx?.minutes===null?' · sin minutos de esta fuente para calcular /90':'')+(typeof ctx?.reportedPer90==='number'?' · tasa /90 publicada por el proveedor':'')};
  }
  function sourceMark(record,key,metadata) {
    const info = provenance(record,key,metadata);
    return info ? '<small class="metric-source" title="'+esc(info.text)+'">'+esc(info.label)+'</small>' : '';
  }
  function radar(record,players,metadata,cachedProfile) {
    const profile = cachedProfile || root.GradaRadar.profile(record,players);
    if (!profile.axes.length) return '<div class="radar-empty"><b>'+esc(profile.kind==='team'?'Índice del perfil pendiente':'Perfil estadístico')+'</b><p>No hay al menos tres métricas con datos y una referencia suficiente para dibujar el radar.'+(profile.missingAxes?.length?' Pendiente: '+esc(profile.missingAxes.map(k=>root.GradaRadar.axis(k)?.label||k).join(', '))+'.':'')+'</p></div>';
    const axes = profile.axes, n = axes.length, cx = 210, cy = 150, radius = 94;
    const point = (i,r) => { const angle = -Math.PI/2+i*2*Math.PI/n; return [cx+Math.cos(angle)*r,cy+Math.sin(angle)*r]; };
    const polygon = r => axes.map((_,i)=>point(i,r).join(',')).join(' ');
    function lines(text) {
      const words = text.split(' '), result = [''];
      for (const word of words) {
        if ((result[result.length-1]+' '+word).trim().length > 12) result.push(word);
        else result[result.length-1] = (result[result.length-1]+' '+word).trim();
      }
      return result;
    }
    const shortLabels = {goals:'Goles /90',xg:'xG /90',xa:'xA /90',shots:'Tiros /90',keypasses:'P. clave /90',completedPer90:'P. compl. /90',recoveries:'Recup. /90',conversion:'Conv. %',assists:'Asist. /90',tackles:'Entradas /90',interceptions:'Intercep. /90',progressive:'P. progr. /90',passes:'Pases /90',accuracy:'Pases %',savepct:'Paradas %',savesPerMatch:'Paradas /PJ',concededPerMatch:'GC /PJ',cleanPerMatch:'Ceros /PJ'};
    Object.assign(shortLabels,{shotsOnTargetPer90:'A puerta /90',dribblesPer90:'Regates /90',clearances:'Despejes /90',blocks:'Bloqueos /90',prevented:'G. evitados /90',highClaims:'Aéreos /90',sweeperActions:'Líbero /90',longBallsPer90:'P. largos /90',lineBreakingPasses:'Rompe líneas /90',chancesCreated:'Ocasiones /90',bigChancesCreated:'G. ocasiones /90',goalsPerMatch:'Goles /PJ',xgPerMatch:'xG /PJ',xgaPerMatch:'xGA /PJ',goalsPerXg:'Goles /xG',shotsOnTargetPerMatch:'A puerta /PJ',bigChancesPerMatch:'G. ocas. /PJ',pointsPerMatch:'Puntos /PJ',goalDifferencePerMatch:'Dif. goles /PJ',xgDifferencePerMatch:'Dif. xG /PJ'});
    const svg = '<svg viewBox="0 0 420 330" role="img" aria-label="'+esc('Percentiles estadísticos de '+record.name)+'">'+
      [0.25,0.5,0.75,1].map(r=>'<polygon class="radar-grid" points="'+polygon(radius*r)+'"/><text class="radar-tick" x="'+(cx+5)+'" y="'+(cy-radius*r-3)+'">'+r*100+'</text>').join('')+
      axes.map((a,i)=>{const p = point(i,radius), label = point(i,128), anchor = label[0]<cx-10?'end':label[0]>cx+10?'start':'middle';return '<line class="radar-spoke" x1="'+cx+'" y1="'+cy+'" x2="'+p[0]+'" y2="'+p[1]+'"/><text class="radar-label" x="'+label[0]+'" y="'+label[1]+'" text-anchor="'+anchor+'">'+lines(shortLabels[a.key] || a.label).map((line,j)=>'<tspan x="'+label[0]+'" dy="'+(j?12:0)+'">'+esc(line)+'</tspan>').join('')+'</text>';}).join('')+
      '<polygon class="radar-shape" points="'+axes.map((a,i)=>point(i,radius*a.percentile/100).join(',')).join(' ')+'"/>'+
      axes.map((a,i)=>{const p = point(i,radius*a.percentile/100), info = provenance(record,a.key,metadata), text = a.label+': '+format(a.value)+'; percentil '+Math.round(a.percentile)+'; '+a.referenceCount+' '+(profile.kind==='team'?'equipos':'jugadores')+' de referencia; '+(info?.text || metadata.source)+(a.lowerBetter?'; menor valor es mejor':'');return '<g tabindex="0" role="img" aria-label="'+esc(text)+'"><title>'+esc(text)+'</title><circle class="radar-point" cx="'+p[0]+'" cy="'+p[1]+'" r="4"/></g>';}).join('')+'</svg>';
    const areaText=profile.kind==='team'&&profile.comparableArea===null?'—':new Intl.NumberFormat('es-ES',{minimumFractionDigits:3,maximumFractionDigits:3}).format(profile.area);
    return '<figure class="radar-card"><figcaption>Perfil estadístico · '+esc(profile.profileLabel||record.pos)+' · percentiles</figcaption>'+svg+
      '<div class="radar-area"><span>'+(profile.kind==='team'?'Índice del perfil · 0–1':'Área relativa · 0–1')+'</span><strong>'+areaText+'</strong></div><p class="sub">Área respecto al polígono máximo (todos los ejes en P100). '+(profile.comparableArea===null?'Faltan ejes comunes: el índice queda pendiente.':'Comparable en el mismo perfil, selección de ligas y '+axes.length+' ejes.')+'</p>'+
      '<p class="sub">Referencia: '+esc(profile.referenceRule)+'. Volúmenes por 90 o por PJ, según el eje.'+(axes.some(a=>a.lowerBetter)?' En goles y xG recibidos, menos es mejor.':'')+' Es rendimiento estadístico, no una valoración física.</p>'+
      '<details><summary>Ver valores y procedencia</summary><ul>'+axes.map(a=>{const info = provenance(record,a.key,metadata);return '<li>'+esc(a.label)+': <b>'+format(a.value)+'</b> · P'+Math.round(a.percentile)+' · '+a.referenceCount+' referencias · '+esc(info?.source || metadata.source)+'</li>';}).join('')+'</ul></details></figure>';
  }
  function squadArea(summary,{title='Área general del equipo · suma de jugadores',population='jugadores',note='Toda la plantilla asignada, sin mínimo adicional ni ponderación. La suma puede superar 1.'}={}){
    if(!summary)return '';
    const fixed=new Intl.NumberFormat('es-ES',{minimumFractionDigits:3,maximumFractionDigits:3}),value=n=>n===null?'—':fixed.format(n);
    return '<section class="squad-area"><h2>'+esc(title)+'</h2><strong>'+value(summary.area)+'</strong><p>'+summary.validPlayers+' / '+summary.totalPlayers+' '+esc(population)+' con área válida · '+summary.missingPlayers+' pendientes. '+esc(note)+'</p><details><summary>Ver contribuciones de los jugadores</summary><p>Se suma con precisión completa; se muestran tres decimales.</p><ul class="squad-contributions">'+summary.players.map(p=>'<li><span>'+esc(p.name)+' <small>'+esc(p.pos)+'</small></span><b>'+value(p.area)+'</b></li>').join('')+'</ul></details></section>';
  }
  root.GradaComponents = {provenance,sourceMark,radar,squadArea};
})(window);
