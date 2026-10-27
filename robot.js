import * as THREE from 'three';
import {PROBE,telescopicSections} from './probe.mjs?v=machine-2';

export const PARTS={
 hull:['双体浮筒与回收点','保留中央观测通道，前后提手与连接点用于回收布置。浮力、吃水和提拉强度尚未核算。'],
 battery:['低位独立电池舱','电池舱分置在浮筒甲板低处，并设可拆检修盖。降低布置高度不等于已经验证重心或稳性。'],
 box:['后置控制与检修舱','低矮控制舱、密封接缝、走线口和实体急停按钮为概念布局，尚未完成电气和防水设计。'],
 thruster:['带可拆护罩的双推进器','推进器缩入后部保护架，前后粗格栅用于隔挡较大异物。仍可能缠绕或堵塞，需验证推力损失和清理方式。'],
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
 const propellers=[];
 for(const x of [-.71,.71]){
  mesh(hullGeo,shell,boat,[x,-.16,0],'hull');box(.38,.11,.63,dark,boat,[x,.22,.28],'battery');lid(.37,.59,boat,[x,.30,.28],'battery');
  handle(boat,x,.16,-.91,'hull');handle(boat,x,.16,.88,'hull');
  // Duct and coarse end grilles remain detachable concept parts, not weed-proof claims.
  const duct=mesh(new THREE.CylinderGeometry(.145,.145,.28,24,1,true),dark,boat,[x,-.36,.85],'thruster');duct.rotation.x=Math.PI/2;
  for(const z of [.70,1.0]){mesh(new THREE.TorusGeometry(.15,.018,8,24),metal,boat,[x,-.36,z],'thruster');
   for(let j=-2;j<=2;j++){const gx=j*.045,len=Math.sqrt(.14*.14-gx*gx);bar([x+gx,-.36-len,z],[x+gx,-.36+len,z],.006,metal,boat,'thruster')}}
  box(.07,.29,.07,metal,boat,[x,-.11,.83],'thruster');
  const prop=new THREE.Group();prop.position.set(x,-.36,.85);boat.add(prop);for(let i=0;i<3;i++){const blade=box(.23,.028,.015,rubber,prop,[0,0,0],'thruster');blade.rotation.z=i*Math.PI/3}propellers.push(prop);
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
 let lastTime=0,lastHeading=0;
 return{boat,pod,gimbal,update(s){
  boat.position.set(s.x,0,s.z);boat.rotation.set(0,-s.heading,0);pod.position.y=-s.depth;gimbal.rotation.x=(s.tilt||0)*Math.PI/180;
  telescopicSections(s.depth).forEach((section,i)=>sleeves[i].position.y=section.center);
  const dt=Math.max(0,s.time-lastTime),yaw=dt>0?Math.atan2(Math.sin(s.heading-lastHeading),Math.cos(s.heading-lastHeading))/dt:0;lastTime=s.time;lastHeading=s.heading;propellers.forEach((p,i)=>p.rotation.z+=(s.speed*12+(i?1:-1)*yaw*5)*dt);drum.rotation.x+=Math.abs(s.targetDepth-s.depth)>.01?dt*1.5:0;
 }};
}
