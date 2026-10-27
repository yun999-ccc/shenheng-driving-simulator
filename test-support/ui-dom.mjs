// Minimal deterministic DOM test fixture, not a layout engine or browser.
export function makeDOM(html){const elements=[],listeners=new Map,windowListeners=new Map;
 const camel=k=>k.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());
 class El{
  constructor(tag='',attrs='',parent=null){this.tagName=tag.toUpperCase();this.parent=parent;this.dataset={};this.attrs={};for(const m of attrs.matchAll(/(?:^|\s)([\w-]+)(?:="([^"]*)")?/g))this.attrs[m[1]]=m[2]??'';this.id=this.attrs.id;for(const [k,v]of Object.entries(this.attrs))if(k.startsWith('data-'))this.dataset[camel(k.slice(5))]=v;this.style={};this.children=[];this.disabled='disabled'in this.attrs;this.value=this.attrs.value||'';this.checked='checked'in this.attrs;this.textContent='';this.innerHTML='';this.clientWidth=165;this.clientHeight=103;this.type=this.attrs.type||'';this.listeners=new Map;this.classes=new Set((this.attrs.class||'').split(' '));this.classList={add:x=>this.classes.add(x),remove:x=>this.classes.delete(x),contains:x=>this.classes.has(x),toggle:(x,v)=>{if(v??!this.classes.has(x))this.classes.add(x);else this.classes.delete(x)}}}
  addEventListener(k,f){if(!this.listeners.has(k))this.listeners.set(k,[]);this.listeners.get(k).push(f)}
  append(...nodes){this.children.push(...nodes);nodes.forEach(n=>n.parent=this)}replaceChildren(...nodes){this.children=[];this.append(...nodes)}
  setAttribute(k,v){this.attrs[k]=v}getContext(){return new Proxy({},{get:()=>()=>{}})}setPointerCapture(){}scrollIntoView(){}
  dispatch(k,event={}){event={target:this,preventDefault(){},...event};this['on'+k]?.(event);for(const f of this.listeners.get(k)||[])f(event)}
  click(){if(!this.disabled)this.dispatch('click')}showModal(){this.open=true}close(){this.open=false}
  closest(q){let p=this;while(p){if(matches(p,q))return p;p=p.parent}return null}
  getBoundingClientRect(){return{left:0,top:0,right:165,bottom:103}}
 }
 const stack=[],voids=new Set(['INPUT','META','LINK','BR','HR','IMG','USE','PATH','CIRCLE','RECT']);
 for(const m of html.matchAll(/<(\/)?([a-z][\w-]*)\b([^>]*)>/gi)){
  const tag=m[2].toUpperCase();if(m[1]){const i=stack.findLastIndex(e=>e.tagName===tag);if(i>=0)stack.length=i;continue}
  const o=new El(tag,m[3],stack.at(-1));elements.push(o);if(o.parent)o.parent.children.push(o);if(!voids.has(tag)&&!m[3].endsWith('/'))stack.push(o);
 }
 function simple(o,q){if(q==='dialog[open]')return o.tagName==='DIALOG'&&o.open;if(q.startsWith('#'))return o.id===q.slice(1);if(q.startsWith('[data-')){const m=/\[data-([\w-]+)(?:=([^\]]+))?\]/.exec(q),k=camel(m[1]);return m[2]?o.dataset[k]===m[2].replaceAll('"',''):k in o.dataset}if(q.startsWith('.'))return o.classes.has(q.slice(1));return o.tagName===q.toUpperCase()}
 function matches(o,q){const parts=q.split(' ');if(!simple(o,parts.pop()))return false;for(const part of parts.reverse()){let p=o.parent;while(p&&!simple(p,part))p=p.parent;if(!p)return false;o=p}return true}
 const emit=(map,k,event)=>{for(const f of map.get(k)||[])f(event)},add=(map,k,f)=>{if(!map.has(k))map.set(k,[]);map.get(k).push(f)};
 const document={querySelector:q=>{const o=elements.find(o=>matches(o,q));if(!o&&q.startsWith('#'))throw Error('Missing UI '+q);return o||null},querySelectorAll:q=>elements.filter(o=>matches(o,q)),createElement:tag=>new El(tag),addEventListener:(k,f)=>add(listeners,k,f),hidden:false};
 const window={addEventListener:(k,f)=>add(windowListeners,k,f)};
 return{document,window,emitDocument:(k,event={})=>emit(listeners,k,event),emitWindow:(k,event={})=>emit(windowListeners,k,{target:new El('DIV'),preventDefault(){},...event})};
}
