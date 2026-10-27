import * as THREE from 'three';
import {THRUSTERS,jetPoint} from './propulsion.mjs?v=recovery-4';
import {PROBE,telescopicSections,GUARD} from './probe.mjs?v=recovery-4';

export const PARTS={
 hull:['双体浮筒与回收点','保留中央观测通道，前后提手与连接点用于回收布置。浮力、吃水和提拉强度尚未核算。'],
 battery:['低位独立电池舱','电池舱分置在浮筒甲板低处，并设可拆检修盖。降低布置高度不等于已经验证重心或稳性。'],
 box:['后置控制与检修舱','低矮控制舱、密封接缝、走线口和实体急停按钮为概念布局，尚未完成电气和防水设计。'],
 thruster:['左右独立双推进器 · 模拟','导管、固定护网、轮毂和三片桨叶分开建模。正反转与左右驱动状态联动；检视中的粒子只表示水流方向，转速与流速均非实测。护网仍需验证阻力、缠绕和清理方式。'],
 lift:['键向导向、卷扬与制动 · 概念','方形套筒限制相对转动，主牵引绳连接末级，级间联动绳路为示意。失电制动、手摇接口与承载锁销均为概念，未完成倍率、受力、公差与防坠验证。'],
 pod:['前向开口防护框与倾转观测头','前下横杆留出中央光学开口；水下画面保留船体与护框，合成目标按结构射线遮挡过滤。灯间距可调，需通过浑水槽验证。净空仍是已知几何模拟。'],dock:['离水承托与锁销 · 概念','探头中心收至水面上0.55米，框底高于水面0.33米；四点承托后锁销接合。锁销、眼环和托座仅表达动作关系，没有完成承载、容差或疲劳验证。']
};

export function createRobot(scene){
 const boat=new THREE.Group();scene.add(boat);
 const material=(color,roughness=.55,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
 const shell=material('#e5ebe7',.32),metal=material('#9ba8a2',.35,.65),dark=material('#263f3b',.55,.1),teal=material('#315e53',.5),rubber=material('#202b28',.95),amber=material('#dfb65c',.6);
 function mesh(geo,mat,parent,pos,part){const o=new THREE.Mesh(geo,mat);if(pos)o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;if(part)o.userData.part=part;parent.add(o);return o}
 const box=(w,h,d,mat,parent,pos,part)=>mesh(new THREE.BoxGeometry(w,h,d),mat,parent,pos,part);
 const cyl=(r,h,mat,parent,pos,part)=>mesh(new THREE.CylinderGeometry(r,r,h,16),mat,parent,pos,part);
 const bar=(a,b,r,mat,parent,part)=>{const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),o=cyl(r,from.distanceTo(to),mat,parent,from.clone().add(to).multiplyScalar(.5).toArray(),part);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),to.sub(from).normalize());return o};
 function handle(parent,x,y,z,part){bar([x-.12,y,z],[x-.12,y+.10,z],.018,dark,parent,part);bar([x+.12,y,z],[x+.12,y+.10,z],.018,dark,parent,part);bar([x-.12,y+.10,z],[x+.12,y+.10,z],.022,rubber,parent,part)}
 function lid(w,d,parent,pos,part){box(w+.025,.018,d+.025,rubber,parent,[pos[0],pos[1]-.012,pos[2]],part);box(w,.035,d,teal,parent,pos,part);for(const x of [-w*.39,w*.39])for(const z of [-d*.37,d*.37])cyl(.012,.007,metal,parent,[pos[0]+x,pos[1]+.022,pos[2]+z],part)}
 const hullShape=new THREE.Shape();hullShape.moveTo(-.25,-1.1);hullShape.lineTo(-.25,.75);hullShape.quadraticCurveTo(-.25,1.15,0,1.36);hullShape.quadraticCurveTo(.25,1.15,.25,.75);hullShape.lineTo(.25,-1.1);hullShape.quadraticCurveTo(0,-1.23,-.25,-1.1);
 const hullGeo=new THREE.ExtrudeGeometry(hullShape,{depth:.29,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.035,bevelThickness:.04});hullGeo.rotateX(-Math.PI/2);
 const serviceGrilles=[],propellers=[],flowEffects=new THREE.Group(),labels=new THREE.Group();boat.add(flowEffects,labels);flowEffects.visible=false;labels.visible=false;
 for(const x of [-.71,.71]){
  mesh(hullGeo,shell,boat,[x,-.16,0],'hull');box(.38,.11,.63,dark,boat,[x,.22,.28],'battery');lid(.37,.59,boat,[x,.30,.28],'battery');
  handle(boat,x,.16,-.91,'hull');handle(boat,x,.16,.88,'hull');
  // Duct and coarse end grilles remain detachable concept parts, not weed-proof claims.
  const duct=mesh(new THREE.CylinderGeometry(.145,.145,.28,32,1,true),teal,boat,[x,-.36,.85],'thruster');duct.rotation.x=Math.PI/2;duct.material=teal.clone();duct.material.side=THREE.DoubleSide;
  for(const z of [.70,1.0]){
   const grille=new THREE.Group();grille.position.set(x,-.36,z);boat.add(grille);if(z===1.0)serviceGrilles.push(grille);
   mesh(new THREE.TorusGeometry(.15,.018,8,24),metal,grille,[0,0,0],'thruster');
   for(let j=-2;j<=2;j++){const gx=j*.045,len=Math.sqrt(.14*.14-gx*gx);bar([gx,-len,0],[gx,len,0],.006,metal,grille,'thruster')}
   for(const [bx,by] of [[0,.15],[.15,0],[0,-.15],[-.15,0]]){const screw=cyl(.014,.026,dark,grille,[bx,by,.01],'thruster');screw.rotation.x=Math.PI/2}
  }
  box(.07,.29,.07,metal,boat,[x,-.11,.83],'thruster');
  const config=THRUSTERS.find(t=>t.x===x),prop=new THREE.Group();prop.position.set(x,-.36,.85);boat.add(prop);
  const hub=cyl(.034,.075,metal,prop,[0,0,0],'thruster');hub.rotation.x=Math.PI/2;
  // Each swept blade extends outwards from the hub; mirrored rotors have opposite handedness.
  const bladeShape=new THREE.Shape();bladeShape.moveTo(.022,-.012);bladeShape.bezierCurveTo(.053,-.027,.096,-.025,.128,.008);bladeShape.quadraticCurveTo(.127,.029,.105,.037);bladeShape.quadraticCurveTo(.057,.039,.022,.012);bladeShape.closePath();
  const bladeGeo=new THREE.ExtrudeGeometry(bladeShape,{depth:.008,bevelEnabled:true,bevelThickness:.002,bevelSize:.002,bevelSegments:2,steps:1});bladeGeo.translate(0,0,-.004);
  for(let i=0;i<3;i++){const blade=mesh(bladeGeo,amber,prop,[0,0,0],'thruster');blade.scale.y=config.hand;blade.rotation.z=i*Math.PI*2/3;blade.rotation.x=.18*config.hand}
  const positions=new Float32Array(72*3),flowGeo=new THREE.BufferGeometry();flowGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const flow=new THREE.Points(flowGeo,new THREE.PointsMaterial({color:'#b9dfcc',size:.021,transparent:true,opacity:.55,depthWrite:false}));flow.position.copy(prop.position);flow.frustumCulled=false;flowEffects.add(flow);
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const context=canvas.getContext('2d');context.fillStyle='#163e37dd';context.fillRect(0,0,256,64);context.fillStyle='#edf4e6';context.font='28px sans-serif';context.textAlign='center';context.fillText(config.side==='left'?'左推进器':'右推进器',128,42);
  const label=new THREE.Sprite(new THREE.SpriteMaterial({map:Object.assign(new THREE.CanvasTexture(canvas),{colorSpace:THREE.SRGBColorSpace}),depthTest:false,transparent:true,toneMapped:false,fog:false}));label.position.set(x,-.04,1.07);label.scale.set(.64,.16,1);label.renderOrder=5;labels.add(label);
  propellers.push({rotor:prop,flow,config,phase:0});
  for(const side of [-1,1])bar([x+side*.19,-.14,.62],[x+side*.19,-.52,1.07],.017,teal,boat,'thruster');
 }
 for(const z of [-.57,.62]){if(z===-.57){for(const x of [-.66,.66])box(.48,.085,.10,metal,boat,[x,.24,z],'hull')}else box(1.80,.085,.10,metal,boat,[0,.24,z],'hull');for(const x of [-.65,.65])box(.15,.13,.18,dark,boat,[x,.25,z],'hull')}
 box(.64,.15,.47,shell,boat,[0,.34,.55],'box');lid(.66,.49,boat,[0,.43,.55],'box');
 cyl(.055,.04,amber,boat,[.20,.47,.64],'box');cyl(.035,.045,material('#b7433c'),boat,[.20,.51,.64],'box');
 cyl(.013,.38,dark,boat,[.24,.65,.39],'box');cyl(.025,.20,metal,boat,[-.21,.58,.39],'box');cyl(.075,.028,shell,boat,[-.21,.70,.39],'box');
 const tow=mesh(new THREE.TorusGeometry(.055,.012,8,20),metal,boat,[0,.32,-.84],'hull');tow.rotation.x=Math.PI/2;
 // Taller keyed sections allow a dry docking position without negative overlap.
 const sleeves=[],anchor=PROBE.mastTop,sleeveLength=PROBE.sleeveLength;
 for(let i=0;i<4;i++){
  const half=.075-i*.013,shape=new THREE.Shape();shape.moveTo(-half,-half);shape.lineTo(half,-half);shape.lineTo(half,half);shape.lineTo(-half,half);shape.closePath();
  const hole=new THREE.Path(),inside=half-.006;hole.moveTo(-inside,-inside);hole.lineTo(-inside,inside);hole.lineTo(inside,inside);hole.lineTo(inside,-inside);hole.closePath();shape.holes.push(hole);
  const geometry=new THREE.ExtrudeGeometry(shape,{depth:sleeveLength,bevelEnabled:false});geometry.translate(0,0,-sleeveLength/2);geometry.rotateX(Math.PI/2);
  const sleeve=mesh(geometry,i%2?metal:dark,boat,[0,anchor-sleeveLength/2,-PROBE.mountOffset],'lift');sleeves.push(sleeve);
 }
 // Rear bracing leaves the complete cage travel channel unobstructed.
 for(const x of [-.50,.50])bar([x,.26,-.13],[0,1.22,-.13],.025,metal,boat,'lift');
 bar([0,1.22,-.13],[0,1.22,-.57],.028,metal,boat,'lift');
 box(.26,.16,.22,teal,boat,[.21,.43,-.13],'lift');const drum=cyl(.085,.15,dark,boat,[.21,.44,-.13],'lift');drum.rotation.z=Math.PI/2;
 box(.10,.10,.14,amber,boat,[.36,.44,-.13],'lift');const crank=new THREE.Group();crank.position.set(.43,.44,-.13);boat.add(crank);bar([0,0,0],[0,.13,0],.013,metal,crank,'lift');bar([0,.13,0],[.09,.13,0],.018,rubber,crank,'lift');
 const pulley=mesh(new THREE.TorusGeometry(.07,.016,8,20),metal,boat,[.105,anchor,-.57],'lift');pulley.rotation.y=Math.PI/2;
 bar([.21,.44,-.13],[.105,anchor,-.57],.006,rubber,boat,'lift');
 const hoist=bar([.105,.7,-.57],[.105,anchor,-.57],.005,amber,boat,'lift');
 const stageCables=[],stagePulleys=[];
 for(let i=1;i<4;i++){const x=(i%2?-.1:.1);stageCables.push(bar([x,.7,-.57],[x,anchor,-.57],.003,amber,boat,'lift'));const wheel=mesh(new THREE.TorusGeometry(.025,.007,6,14),metal,boat,[x,anchor,-.57],'lift');wheel.rotation.y=Math.PI/2;stagePulleys.push(wheel)}
 const loom=new THREE.CatmullRomCurve3([new THREE.Vector3(.18,.36,.32),new THREE.Vector3(.31,.30,.04),new THREE.Vector3(.18,.41,-.13)]);mesh(new THREE.TubeGeometry(loom,14,.012,6,false),rubber,boat,null,'box');
 const flexCable=new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(),new THREE.Vector3(0,.1,0)),4,.007,6,false),rubber);flexCable.userData.part='lift';boat.add(flexCable);let lastCableDepth=NaN;
 const pins=[];
 for(const side of [-1,1]){
  for(const z of [-.75,-.39]){box(.16,.035,.12,rubber,boat,[side*.35,.3125,z],'dock');bar([side*.43,.25,z],[side*.43,.30,z],.02,metal,boat,'dock')}
  bar([side*.41,.30,-.45],[side*.41,.65,-.45],.018,metal,boat,'dock');
  const pin=cyl(.012,.15,amber,boat,[side*.44,.61,-.45],'dock');pin.rotation.z=Math.PI/2;pins.push(pin);
 }
 const pod=new THREE.Group();pod.position.set(0,-.8,-PROBE.mountOffset);boat.add(pod);
 box(.17,.11,.14,dark,pod,[0,.08,0],'pod');
 GUARD.forEach(({a,b,r})=>bar(a,b,r,metal,pod,'pod'));
 for(const side of [-1,1]){const eye=mesh(new THREE.TorusGeometry(.025,.009,8,20),metal,pod,[side*.33,.06,.12],'dock');eye.rotation.y=Math.PI/2}
 const gimbal=new THREE.Group();pod.add(gimbal);for(const x of [-.13,.13]){box(.025,.15,.10,teal,pod,[x,.015,0],'pod');const axle=cyl(.035,.03,metal,pod,[x,0,0],'pod');axle.rotation.z=Math.PI/2}
 box(.20,.105,.16,dark,gimbal,[0,-.015,0],'pod');cyl(.048,.045,rubber,gimbal,[0,-.075,0],'pod');mesh(new THREE.CircleGeometry(.034,20),material('#487f83',.12,.5),gimbal,[0,-.099,0],'pod').rotation.x=Math.PI/2;
 const lampGeo=new THREE.CylinderGeometry(.035,.035,.06,14),lampMat=material('#e9e5c4',.25);
 const lamps=[];for(const side of [-1,1]){const lamp=new THREE.Group();lamp.position.x=side*.25;gimbal.add(lamp);bar([0,0,0],[-side*.12,0,0],.012,metal,lamp,'pod');mesh(lampGeo,dark,lamp,[0,-.025,0],'pod');mesh(new THREE.CircleGeometry(.029,14),lampMat,lamp,[0,-.056,0],'pod').rotation.x=Math.PI/2;lamps.push({lamp,side})}
 // Separate downward range concept is fixed on the cage, independent of camera tilt.
 cyl(.028,.06,teal,pod,[.23,-.10,.18],'pod');mesh(new THREE.CircleGeometry(.023,14),rubber,pod,[.23,-.131,.18],'pod').rotation.x=Math.PI/2;
 const dimensions=new THREE.Group();boat.add(dimensions);dimensions.visible=false;
 const textLabel=(text,position,scale)=>{const c=document.createElement('canvas');c.width=512;c.height=80;const t=c.getContext('2d');t.fillStyle='#eaf2e5ed';t.fillRect(0,0,512,80);t.fillStyle='#294d40';t.font='26px sans-serif';t.textAlign='center';t.fillText(text,256,51);const o=new THREE.Sprite(new THREE.SpriteMaterial({map:Object.assign(new THREE.CanvasTexture(c),{colorSpace:THREE.SRGBColorSpace}),transparent:true,depthTest:false,toneMapped:false,fog:false}));o.position.set(...position);o.scale.set(scale,scale*80/512,1);o.renderOrder=5;dimensions.add(o)};
 hullGeo.computeBoundingBox();const hullBounds=hullGeo.boundingBox,width=hullBounds.max.x-hullBounds.min.x+1.42,length=hullBounds.max.z-hullBounds.min.z;
 const dimensionLine=points=>dimensions.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))),new THREE.LineBasicMaterial({color:'#cfb66b',depthTest:false})));
 dimensionLine([[-width/2,.18,1.45],[width/2,.18,1.45]]);dimensionLine([[1.19,.18,hullBounds.min.z],[1.19,.18,hullBounds.max.z]]);
 textLabel(`模型宽 ${width.toFixed(2)} m`,[0,.23,1.53],1.02);textLabel(`模型长 ${length.toFixed(2)} m`,[1.30,.28,0],1.02);textLabel('模型几何 · 非定型参数',[0,1.92,-.45],1.25);
 const pose=s=>{boat.position.set(s.x,0,s.z);boat.rotation.set(0,-s.heading,0);pod.position.y=-s.depth;gimbal.rotation.x=(s.tilt||0)*Math.PI/180;lamps.forEach(({lamp,side})=>lamp.position.x=side*(s.lampSpacing??.5)/2)};
 const colliders=[];boat.traverse(o=>{if(o.isMesh&&o.userData.part)colliders.push(o)});
 let lastTime=0,lastDepth=.8,serviceAmount=0,auxiliary=true;
 return{boat,pod,gimbal,pose,colliders,setAuxiliary(value){auxiliary=value},setInspection(value,showDimensions=false){flowEffects.visible=value&&auxiliary;labels.visible=value&&auxiliary;dimensions.visible=showDimensions&&auxiliary},update(s){
  pose(s);
  telescopicSections(s.depth).forEach((section,i)=>sleeves[i].position.y=section.center);
  const dt=Math.max(0,s.time-lastTime),travel=s.time<lastTime?0:s.depth-lastDepth;lastTime=s.time;lastDepth=s.depth;
  serviceAmount+=Math.sign((s.maintenance?1:0)-serviceAmount)*Math.min(Math.abs((s.maintenance?1:0)-serviceAmount),dt*1.6);
  serviceGrilles.forEach(o=>{o.position.z=1+serviceAmount*.38;o.rotation.y=serviceAmount*.65});
  pins.forEach((p,i)=>p.position.x=(i===0?-1:1)*(s.latch==='locked'?.37:(s.latch==='engaging'||s.latch==='paused'&&s.pausedLatch==='engaging')?.44-.07*Math.min(1,s.latchTimer/PROBE.latchTime):.44));
  const sections=telescopicSections(s.depth),bottom=-s.depth+.12;
  hoist.position.y=(anchor+bottom)/2;hoist.scale.y=(anchor-bottom)/hoist.geometry.parameters.height;
  stageCables.forEach((c,i)=>{const top=sections[i].top-.04,bot=sections[i+1].bottom+.04;c.position.y=(top+bot)/2;c.scale.y=(top-bot)/c.geometry.parameters.height;stagePulleys[i].position.y=top});
  if(!Number.isFinite(lastCableDepth)||Math.abs(s.depth-lastCableDepth)>.015){const path=new THREE.CatmullRomCurve3([new THREE.Vector3(.12,1.48,-.57),new THREE.Vector3(.20,(1.48+bottom)/2,-.48),new THREE.Vector3(.12,bottom,-.57)]);flexCable.geometry.dispose();flexCable.geometry=new THREE.TubeGeometry(path,24,.007,6,false);lastCableDepth=s.depth}
  if(s.manualRecovery&&Math.abs(travel)>1e-7)crank.rotation.x+=dt*3;
  propellers.forEach(({rotor,flow,config},i)=>{
   const motor=propellers[i],command=s.drive[config.side];rotor.rotation.z+=command*config.hand*32*dt;
   motor.phase+=dt*(.3+Math.abs(command)*1.3);flow.visible=Math.abs(command)>.02;
   const position=flow.geometry.attributes.position;for(let j=0;j<position.count;j++){const p=jetPoint(j,position.count,motor.phase,command);position.setXYZ(j,p.x,p.y,p.z)}position.needsUpdate=true;
  });
  drum.rotation.x+=travel/.085;
 }};
}
