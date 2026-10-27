import * as THREE from 'three';
import {THRUSTERS,jetPoint} from './propulsion.mjs?v=thrusters-3';
import {PROBE,telescopicSections} from './probe.mjs?v=thrusters-3';

export const PARTS={
 hull:['双体浮筒与回收点','保留中央观测通道，前后提手与连接点用于回收布置。浮力、吃水和提拉强度尚未核算。'],
 battery:['低位独立电池舱','电池舱分置在浮筒甲板低处，并设可拆检修盖。降低布置高度不等于已经验证重心或稳性。'],
 box:['后置控制与检修舱','低矮控制舱、密封接缝、走线口和实体急停按钮为概念布局，尚未完成电气和防水设计。'],
 thruster:['左右独立双推进器 · 模拟','导管、固定护网、轮毂和三片桨叶分开建模。正反转与左右驱动状态联动；检视中的粒子只表示水流方向，转速与流速均非实测。护网仍需验证阻力、缠绕和清理方式。'],
 lift:['四节伸缩导向与卷扬','一节外套筒和三节滑套保持固定长度，通过重叠变化升降。卷扬、导轮及内走线路径可辨认；传动联动、止回与载荷尚未设计。'],
 pod:['可倾转观测头与保护框','镜头可由垂直下视倾转至55°，两侧分置补光，独立下视测距模块用于净空概念。保护逻辑只读取合成几何，未接真实传感器。']
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
 const propellers=[],flowEffects=new THREE.Group(),labels=new THREE.Group();boat.add(flowEffects,labels);flowEffects.visible=false;labels.visible=false;
 for(const x of [-.71,.71]){
  mesh(hullGeo,shell,boat,[x,-.16,0],'hull');box(.38,.11,.63,dark,boat,[x,.22,.28],'battery');lid(.37,.59,boat,[x,.30,.28],'battery');
  handle(boat,x,.16,-.91,'hull');handle(boat,x,.16,.88,'hull');
  // Duct and coarse end grilles remain detachable concept parts, not weed-proof claims.
  const duct=mesh(new THREE.CylinderGeometry(.145,.145,.28,32,1,true),teal,boat,[x,-.36,.85],'thruster');duct.rotation.x=Math.PI/2;duct.material=teal.clone();duct.material.side=THREE.DoubleSide;
  for(const z of [.70,1.0]){mesh(new THREE.TorusGeometry(.15,.018,8,24),metal,boat,[x,-.36,z],'thruster');
   for(let j=-2;j<=2;j++){const gx=j*.045,len=Math.sqrt(.14*.14-gx*gx);bar([x+gx,-.36-len,z],[x+gx,-.36+len,z],.006,metal,boat,'thruster')}}
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
  const label=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),depthTest:false,transparent:true}));label.position.set(x,-.04,1.07);label.scale.set(.64,.16,1);label.renderOrder=5;labels.add(label);
  propellers.push({rotor:prop,flow,config,phase:0});
  for(const side of [-1,1])bar([x+side*.19,-.14,.62],[x+side*.19,-.52,1.07],.017,teal,boat,'thruster');
 }
 for(const z of [-.57,.62]){box(1.80,.085,.10,metal,boat,[0,.24,z],'hull');for(const x of [-.65,.65])box(.15,.13,.18,dark,boat,[x,.25,z],'hull')}
 box(.64,.15,.47,shell,boat,[0,.34,.55],'box');lid(.66,.49,boat,[0,.43,.55],'box');
 cyl(.055,.04,amber,boat,[.20,.47,.64],'box');cyl(.035,.045,material('#b7433c'),boat,[.20,.51,.64],'box');
 cyl(.013,.38,dark,boat,[.24,.65,.39],'box');cyl(.025,.20,metal,boat,[-.21,.58,.39],'box');cyl(.075,.028,shell,boat,[-.21,.70,.39],'box');
 const tow=mesh(new THREE.TorusGeometry(.055,.012,8,20),metal,boat,[0,.32,-.84],'hull');tow.rotation.x=Math.PI/2;
 // Fixed-length telescopic sleeves. No mesh is scaled to invent a stroke.
 const sleeves=[],sleeveLength=.90,anchor=1.25;
 for(let i=0;i<4;i++){const radius=.075-i*.013;const sleeve=mesh(new THREE.CylinderGeometry(radius,radius,sleeveLength,20,1,true),i%2?metal:dark,boat,[0,anchor-sleeveLength/2,-PROBE.mountOffset],'lift');sleeves.push(sleeve)}
 for(const x of [-.14,.14]){bar([x,.26,-.57],[x,.55,-.57],.025,metal,boat,'lift');bar([x,.55,-.57],[0,1.18,-.57],.018,metal,boat,'lift')}
 box(.28,.15,.24,teal,boat,[.19,.45,-.50],'lift');const drum=cyl(.09,.16,dark,boat,[.19,.47,-.50],'lift');drum.rotation.z=Math.PI/2;
 const pulley=mesh(new THREE.TorusGeometry(.075,.02,8,20),metal,boat,[.10,1.24,-.57],'lift');pulley.rotation.y=Math.PI/2;
 bar([.19,.47,-.50],[.10,1.23,-.57],.006,rubber,boat,'lift');
 // A clipped deck loom leads into the sleeve; moving cables are routed internally.
 const loom=new THREE.CatmullRomCurve3([new THREE.Vector3(.18,.36,.32),new THREE.Vector3(.30,.30,0),new THREE.Vector3(.22,.34,-.40)]);
 mesh(new THREE.TubeGeometry(loom,14,.012,6,false),rubber,boat,null,'box');
 const pod=new THREE.Group();pod.position.set(0,-.8,-PROBE.mountOffset);boat.add(pod);
 box(.17,.11,.14,dark,pod,[0,.08,0],'pod');
 // Rounded rectangular cage: conservative collision envelope is stored in probe.mjs.
 for(const y of [-.22,.12]){
  for(const x of [-.33,.33])bar([x,y,-.27],[x,y,.27],.013,metal,pod,'pod');
  for(const z of [-.27,.27])bar([-.33,y,z],[.33,y,z],.013,metal,pod,'pod');
 }
 for(const x of [-.33,.33])for(const z of [-.27,.27])bar([x,-.22,z],[x,.12,z],.013,metal,pod,'pod');
 const gimbal=new THREE.Group();pod.add(gimbal);for(const x of [-.13,.13]){box(.025,.15,.10,teal,pod,[x,.015,0],'pod');const axle=cyl(.035,.03,metal,pod,[x,0,0],'pod');axle.rotation.z=Math.PI/2}
 box(.20,.105,.16,dark,gimbal,[0,-.015,0],'pod');cyl(.048,.045,rubber,gimbal,[0,-.075,0],'pod');mesh(new THREE.CircleGeometry(.034,20),material('#487f83',.12,.5),gimbal,[0,-.099,0],'pod').rotation.x=Math.PI/2;
 const lampGeo=new THREE.CylinderGeometry(.035,.035,.06,14),lampMat=material('#e9e5c4',.25);
 for(const x of [-.25,.25]){bar([x*.52,0,0],[x,-.015,0],.012,metal,gimbal,'pod');mesh(lampGeo,dark,gimbal,[x,-.025,0],'pod');mesh(new THREE.CircleGeometry(.029,14),lampMat,gimbal,[x,-.056,0],'pod').rotation.x=Math.PI/2}
 // Separate downward range concept is fixed on the cage, independent of camera tilt.
 cyl(.028,.06,teal,pod,[.23,-.10,.18],'pod');mesh(new THREE.CircleGeometry(.023,14),rubber,pod,[.23,-.131,.18],'pod').rotation.x=Math.PI/2;
 let lastTime=0;
 return{boat,pod,gimbal,setInspection(value){flowEffects.visible=value;labels.visible=value},update(s){
  boat.position.set(s.x,0,s.z);boat.rotation.set(0,-s.heading,0);pod.position.y=-s.depth;gimbal.rotation.x=(s.tilt||0)*Math.PI/180;
  telescopicSections(s.depth).forEach((section,i)=>sleeves[i].position.y=section.center);
  const dt=Math.max(0,s.time-lastTime);lastTime=s.time;
  propellers.forEach(({rotor,flow,config},i)=>{
   const motor=propellers[i],command=s.drive[config.side];rotor.rotation.z+=command*config.hand*32*dt;
   motor.phase+=dt*(.3+Math.abs(command)*1.3);flow.visible=Math.abs(command)>.02;
   const position=flow.geometry.attributes.position;for(let j=0;j<position.count;j++){const p=jetPoint(j,position.count,motor.phase,command);position.setXYZ(j,p.x,p.y,p.z)}position.needsUpdate=true;
  });
  drum.rotation.x+=Math.abs(s.targetDepth-s.depth)>.01?dt*1.5:0;
 }};
}
