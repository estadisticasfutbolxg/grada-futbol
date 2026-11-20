(function(root){
  'use strict';
  const node=typeof module==='object'&&module.exports;
  const clubs=node?require('./clubs.js'):root.GradaClubs;
  const countries={
    laliga:{code:'es',name:'España'},
    'premier-league':{code:'gb-eng',name:'Inglaterra'},
    'serie-a':{code:'it',name:'Italia'},
    bundesliga:{code:'de',name:'Alemania'},
    'ligue-1':{code:'fr',name:'Francia'}
  };
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const initials=name=>String(name||'?').trim().split(/\s+/).map(word=>[...word][0]||'').slice(0,2).join('').toLocaleUpperCase('es');
  function country(league){return Object.hasOwn(countries,league)?{...countries[league]}:null;}
  function flag(league){
    const item=country(league);
    return item?'<img class="country-flag" data-country-flag src="/assets/flags/'+item.code+'.svg" width="20" height="15" alt="" aria-hidden="true">':'';
  }
  function countryLabel(league){
    const item=country(league);
    if(item)return '<span class="country-identity" title="País de la competición: '+item.name+'">'+flag(league)+'<span>'+item.name+'</span></span>';
    if(league==='all')return '<span class="country-identity" title="España, Inglaterra, Italia, Alemania y Francia"><span class="league-flags" aria-hidden="true">'+Object.keys(countries).map(flag).join('')+'</span><span>5 países</span></span>';
    return '';
  }
  function leagueLabel(league,label){
    const item=country(league);
    return '<span class="league-identity"'+(item?' title="País de la competición: '+item.name+'"':'')+'>'+flag(league)+'<span>'+esc(label)+'</span>'+(item?'<span class="visually-hidden"> · País de la competición: '+item.name+'</span>':'')+'</span>';
  }
  function crestPath(team){
    // Only the provider ID on an actual team record; never a name or player ID.
    const source=team?.sourceRecords?.FotMob;
    if(!source||Object.hasOwn(team,'team_id')||Object.hasOwn(source,'team_id'))return null;
    const id=String(source.id??'');
    return /^[1-9][0-9]{0,8}$/.test(id)?'/assets/clubs/'+id+'.png':null;
  }
  function clubIcon(team,{size='sm'}={}){
    const variant=['xs','sm','lg'].includes(size)?size:'sm',src=crestPath(team);
    return '<span class="club-badge club-badge-'+variant+'" aria-hidden="true"><span class="club-monogram">'+esc(initials(team?.name))+'</span>'+
      (src?'<img data-club-crest src="'+src+'" width="48" height="48" loading="lazy" decoding="async" alt="">':'')+'</span>';
  }
  function teamLabel(team,{size='sm',label=team?.name}={}){
    return '<span class="club-identity">'+clubIcon(team,{size})+'<span class="club-label">'+esc(label)+'</span></span>';
  }
  function playerClub(player,catalog,{size='sm'}={}){
    const info=clubs.info(player,catalog),team=info.kind==='single'?info.clubs[0]:{name:info.kind==='multiple'?'Varios clubes':'?'};
    return '<span class="club-identity" title="'+esc(info.description)+'">'+clubIcon(team,{size})+'<span class="club-label">'+esc(info.label)+'</span></span>';
  }
  const initialized=new WeakSet();
  function init(document){
    if(initialized.has(document))return;
    initialized.add(document);
    document.addEventListener('load',event=>{
      const image=event.target;
      if(image?.matches?.('img[data-club-crest]'))image.closest('.club-badge')?.classList.add('is-ready');
    },true);
    document.addEventListener('error',event=>{
      const image=event.target;
      if(image?.matches?.('img[data-club-crest]')){image.hidden=true;image.closest('.club-badge')?.classList.remove('is-ready');}
      else if(image?.matches?.('img[data-country-flag]'))image.hidden=true;
    },true);
  }
  const api={country,flag,countryLabel,leagueLabel,crestPath,clubIcon,teamLabel,playerClub,init};
  if(node)module.exports=api;else root.GradaBranding=api;
})(typeof window==='object'?window:globalThis);
