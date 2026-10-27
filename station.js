import * as THREE from './vendor/three.module.js';
import {STATION} from './navigation.mjs?v=shore-8';
// Authored concept geometry, dimensions do not select a photovoltaic product.
export function createStation(parent){
 const root=new THREE.Group();root.name='Shore solar and spare battery station';root.position.set(STATION.x,STATION.y,STATION.z);parent.add(root);
 const mat=(c,r=.6,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
 const steel=mat('#a8b1ad',.37,.72),white=mat('#e2e6de',.48),green=mat('#315e53',.55),rubber=mat('#28332d',.95),concrete=mat('#c1c0af',.94),pv=mat('#182f43',.29,.35),cell=mat('#567287',.46,.42),gold=mat('#dfb65c',.5,.25),wood=mat('#92846c',.9);
 const mesh=(g,m,p,pos,part='station')=>{const o=new THREE.Mesh(g,m);o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;o.userData.part=part;p.add(o);return o};
 const box=(w,h,d,m,p,pos,part)=>mesh(new THREE.BoxGeometry(w,h,d),m,p,pos,part);
 const bar=(a,b,r,m,p)=>{const v=new THREE.Vector3(...a),q=new THREE.Vector3(...b),o=mesh(new THREE.CylinderGeometry(r,r,v.distanceTo(q),10),m,p,v.clone().add(q).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),q.sub(v).normalize());return o};
 // Raised pads, anchors, bracing and six framed panels, with visible cable route.
 box(6.8,1.90,4.4,concrete,root,[0,-.90,0]);
 for(const x of [-2.8,2.8])for(const z of [-1.6,1.6]){
  box(.48,.12,.48,white,root,[x,.08,z]);box(.09,2.58,.09,steel,root,[x,1.39,z]);
  for(const bx of [-.17,.17])for(const bz of [-.17,.17])mesh(new THREE.CylinderGeometry(.018,.018,.04,6),gold,root,[x+bx,.17,z+bz]);
  bar([x,.8,z],[x,2.58,z-Math.sign(z)*.65],.025,steel,root);
 }
 const roof=new THREE.Group();roof.position.set(0,2.83,0);roof.rotation.x=-.18;root.add(roof);
 for(const z of [-1.38,1.38])box(6.35,.09,.09,steel,roof,[0,-.10,z]);
 for(const x of [-2.1,0,2.1])for(const z of [-.78,.78]){
  box(2.02,.07,1.48,steel,roof,[x,0,z]);box(1.94,.025,1.40,pv,roof,[x,.048,z]);
  // Thin cell seams / busbars avoid a solid featureless blue roof.
  for(let i=-4;i<=4;i++)box(.009,.002,1.36,cell,roof,[x+i*.205,.062,z]);
  for(let j=-2;j<=2;j++)box(1.90,.002,.007,cell,roof,[x,.063,z+j*.23]);
 }
 bar([-2.73,2.65,1.62],[-2.73,.38,1.62],.018,rubber,root);bar([-2.73,.38,1.62],[-2.1,.38,1.05],.018,rubber,root);
 // Open-front service cutaway: separate charge and ready trays, no waterproof claim.
 const cabinet=new THREE.Group();cabinet.position.set(-1.95,.12,.45);root.add(cabinet);
 box(1.35,1.60,.08,green,cabinet,[0,.85,.42]);for(const x of [-.66,.66])box(.055,1.60,.85,white,cabinet,[x,.85,0]);
 for(const y of [.06,.83,1.64])box(1.37,.055,.86,white,cabinet,[0,y,0]);
 const trays=[];
 for(const [i,y] of [.26,1.03].entries()){
  const tray=new THREE.Group();tray.position.y=y;cabinet.add(tray);
  box(1.16,.04,.70,steel,tray,[0,-.09,-.12]);
  for(const x of [-.29,.29]){
   box(.43,.32,.53,green,tray,[x,.10,-.08]);box(.39,.018,.49,rubber,tray,[x,.27,-.08]);
   bar([x-.10,.29,-.08],[x-.10,.38,-.08],.015,steel,tray);bar([x+.10,.29,-.08],[x+.10,.38,-.08],.015,steel,tray);bar([x-.10,.38,-.08],[x+.10,.38,-.08],.02,rubber,tray);
   box(.06,.06,.04,gold,tray,[x,.10,.20]);
  }
  const ledMat=mat('#a4ba9b',.45);const led=mesh(new THREE.SphereGeometry(.035,12,8),ledMat,cabinet,[.50,y+.45,-.45]);
  trays.push({tray,led,ledMat,y,index:i});
 }
 // Bench, dry transport cradle and keel-safe soft supports.
 box(1.9,.08,.72,wood,root,[1.45,.95,.25]);for(const x of [.65,2.25])for(const z of [0,.5])box(.06,.88,.06,steel,root,[x,.47,z]);
 for(const x of [.75,2.15]){box(.14,.12,.60,rubber,root,[x,1.05,.25]);bar([x,1.1,-.1],[x,1.28,.25],.025,steel,root)}
 // Sloped gangway connects bank to the existing dock; joins the fixed side dock.
 const a=new THREE.Vector3(0,.02,-2),b=new THREE.Vector3(0,.27-STATION.y,15-STATION.z),delta=b.clone().sub(a),ramp=box(1.55,.10,delta.length(),wood,root,a.clone().add(b).multiplyScalar(.5).toArray());ramp.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),delta.clone().normalize());
 for(const side of [-.70,.70]){bar([side,a.y+.85,a.z],[side,b.y+.85,b.z],.025,steel,root);for(let i=0;i<4;i++){const f=i/3,y=a.y+(b.y-a.y)*f,z=a.z+(b.z-a.z)*f;bar([side,y,z],[side,y+.85,z],.025,steel,root)}}
 // Dockside fenders and line posts stay beside the hull, clear of the return corridor.
 for(const z of [-10.8,-9.2]){
  mesh(new THREE.CylinderGeometry(.075,.075,.38,14),rubber,root,[.84,-1.30,z]);
  mesh(new THREE.CylinderGeometry(.035,.035,.22,14),steel,root,[.48,-1.01,z]);
  bar([.37,-.91,z],[.59,-.91,z],.028,steel,root);
 }
 // Fixed position sign uses one texture; status text updates only when identities/status change.
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const ctx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const sign=new THREE.Mesh(new THREE.PlaneGeometry(3.4,.85),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,toneMapped:false}));sign.position.set(0,2.05,-1.69);sign.rotation.y=Math.PI;root.add(sign);let signature='';
 const labels={charging:'充电',ready:'就绪',onboard:'装船',removed:'已取出',waiting:'等待充电'};
 function update(s){const e=s.energy,ids=Object.keys(e.packs).filter(id=>id!==e.onboard),key=JSON.stringify([e.onboard,ids.map(id=>[id,e.packs[id].status,Math.floor(e.packs[id].wh)]),Math.round(e.pvW)]);if(key===signature)return;signature=key;
  trays.forEach((t,i)=>{const id=ids[i],p=e.packs[id];t.tray.visible=p.status!=='removed'&&!(e.pendingPack===id&&e.swapStage==='inserting');t.ledMat.color.set(p.status==='ready'?'#78ae75':'#d6ac55');t.ledMat.emissive.copy(t.ledMat.color).multiplyScalar(.25)});
  ctx.fillStyle='#244f43';ctx.fillRect(0,0,1024,256);ctx.fillStyle='#f1eee0';ctx.textAlign='center';ctx.font='bold 45px sans-serif';ctx.fillText('岸上太阳能 · 换电站',512,64);ctx.font='32px sans-serif';ctx.fillText(ids.map(id=>`${id}组 ${labels[e.packs[id].status]} ${Math.floor(e.packs[id].wh)}Wh`).join('  /  '),512,126);ctx.font='28px sans-serif';ctx.fillText(`船载 ${e.onboard}组 · 充电输入 ${Math.round(e.pvW)}W · 模拟用`,512,184);ctx.font='23px sans-serif';ctx.fillText('柜体为展示剖开状态 · 真实防水与电气规格待设计',512,228);texture.needsUpdate=true;
 }
 return{root,update};
}
