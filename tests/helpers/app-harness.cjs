'use strict';
// Minimal DOM doubles for controller/HTML tests. No layout or browser claims.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function harness(){
 const nodes=new Map(),listeners=new Map();let context;
 class Element{
  constructor(){this.html='';this.value='';this.hidden=false;this.open=false;this.disabled=false;this.dataset={};this.textContent='';this.style={};this.offsetWidth=280;this.offsetHeight=90;this.classList={toggle(){},contains:()=>false};}
  set innerHTML(value){this.html=value;this.buttonCache=null;this.labelCache=null;this.detailCache=null;}
  get innerHTML(){return this.html;}
  get options(){return [...this.html.matchAll(/<option value="([^"]*)"[^>]*>(.*?)<\/option>/g)].map(m=>({value:m[1],textContent:m[2]}));}
  get buttons(){return this.buttonCache??=Array.from(this.html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g),m=>{
   const el=new Element();el.textContent=m[2].replace(/<[^>]*>/g,'');for(const attr of m[1].matchAll(/data-([\w-]+)="([^"]*)"/g))el.dataset[attr[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=attr[2];
   const classes=/class="([^"]*)"/.exec(m[1])?.[1].split(' ')||[];el.classList.contains=c=>classes.includes(c);return el;
  });}
  get labels(){return this.labelCache??=[...this.html.matchAll(/<label><input type="checkbox" value="([^"]*)"( checked)?( disabled)?><span>(.*?)<\/span><\/label>/g)].map(m=>{
   const label=new Element(),input=new Element();input.value=m[1];input.checked=!!m[2];input.disabled=!!m[3];input.closest=s=>s==='input[type="checkbox"]'?input:null;label.textContent=m[4].replace(/<[^>]*>/g,'');label.input=input;return label;
  });}
  get details(){return this.detailCache??=[...this.html.matchAll(/<details[^>]*id="([^"]*)"([^>]*)>/g)].map(m=>{const el=new Element();el.id=m[1];el.open=m[2].includes('open');return el;});}
  getBoundingClientRect(){return {left:100,top:100,bottom:130};}
  contains(el){return el===this;}
  closest(){return new Element();}
  focus(){context.document.activeElement=this;}
  setAttribute(){}
  scrollIntoView(){this.scrolled=true;}
 }
 const node=selector=>{if(!nodes.has(selector))nodes.set(selector,new Element());return nodes.get(selector);};
 const queryAll=selector=>{
  if(/^#(?:club|league)-options label$/.test(selector))return node(selector.split(' ')[0]).labels;
  if(/^#(?:club|league)-options input$/.test(selector))return node(selector.split(' ')[0]).labels.map(l=>l.input);
  if(selector==='#team-comparison-body details')return node('#team-comparison-body').details;
  const match=/^\[data-([\w-]+)\]$/.exec(selector);
  return match?[...nodes.values()].flatMap(el=>el.buttons).filter(el=>Object.hasOwn(el.dataset,match[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase()))):[];
 };
 context={console,URLSearchParams,Intl,setTimeout,clearTimeout,location:{search:''},document:{querySelector:node,querySelectorAll:queryAll,addEventListener:(type,fn)=>{if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);}},addEventListener(){},innerWidth:1280,innerHeight:800,scrollTo(){},GradaOwner:{init(){}}};context.window=context;
 for(const [global,file]of Object.entries({GradaLeagues:'leagues',GradaMetrics:'metrics',GradaFairplay:'fairplay',GradaSecurity:'security',GradaUnderstat:'understat',GradaLaLiga:'laliga',GradaRoles:'roles',GradaNationality:'nationality',GradaFotmob:'fotmob',GradaIdentity:'identity',GradaPositions:'positions',GradaCombined:'combined',GradaScopes:'scopes',GradaClubs:'clubs',GradaBranding:'branding',GradaFilters:'filters',GradaRadar:'radar',GradaSquads:'squads',GradaScores:'scores',GradaNations:'nations',GradaExplore:'explore',GradaProfiles:'profiles',GradaRefresh:'refresh',GradaDates:'dates'}))context[global]=require('../../dist/'+file+'.js');
 vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../../dist/components.js'),'utf8'),context);
 const source=fs.readFileSync(path.join(__dirname,'../../dist/app.js'),'utf8');if(!source.endsWith('start();\n'))throw new Error('Unexpected app entrypoint');
 vm.runInContext(source.slice(0,-'start();\n'.length),context);
 return {node,queryAll,listeners,run:(code,bindings={})=>{Object.assign(context,bindings);return vm.runInContext(code,context);},context};
}
module.exports={harness};
