import * as THREE from 'three';
import {makeShrimpPopulation,shrimpPose} from './stocking.mjs?v=reef-5';

// Shared composite geometry keeps all 560 animals to one instanced draw call.
// A 10cm stylized grow-out animal; it is not the trial's initial seed size.
function shrimpGeometry(){
 const positions=[],normals=[],colors=[];
 function add(geometry,color,scale,position,rotation=0){
  geometry.scale(...scale);geometry.rotateY(rotation);geometry.translate(...position);
  const flat=geometry.index?geometry.toNonIndexed():geometry;
  const p=flat.attributes.position,n=flat.attributes.normal,c=new THREE.Color(color);
  for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));normals.push(n.getX(i),n.getY(i),n.getZ(i));colors.push(c.r,c.g,c.b)}
  if(flat!==geometry)flat.dispose();geometry.dispose();
 }
 const sphere=()=>new THREE.SphereGeometry(1,8,5);
 add(sphere(),'#9b8a69',[.014,.012,.024],[0,.014,-.019]);
 for(let i=0;i<5;i++)add(sphere(),i%2?'#544c37':'#a89b79',[.011-i*.0012,.009-i*.0008,.009],[Math.sin(i*.4)*.003,.012-i*.001,i*.012]);
 for(const side of [-1,1]){
  add(sphere(),'#24291d',[.003,.003,.003],[side*.010,.024,-.034]);
  add(sphere(),'#a99a72',[.010,.002,.013],[side*.008,.005,.061],side*.5);
  for(let i=0;i<4;i++)add(new THREE.CylinderGeometry(.0008,.0008,.025,3),'#7c7153',[1,1,1],[side*.014,.006,-.015+i*.012],side*.35);
  const antenna=new THREE.CylinderGeometry(.00045,.00045,.065,3);antenna.rotateX(Math.PI/2);antenna.rotateZ(side*.22);
  add(antenna,'#b5a47b',[1,1,1],[side*.013,.017,-.071],side*.20);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeBoundingSphere();return geometry;
}
export function createShrimp(parent){
 const population=makeShrimpPopulation(),group=new THREE.Group();parent.add(group);
 const geometry=shrimpGeometry(),material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7,metalness:0});
 const mesh=new THREE.InstancedMesh(geometry,material,population.length),dummy=new THREE.Object3D();group.add(mesh);mesh.receiveShadow=true;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
 let lastTime=-Infinity;
 function update(time){
  if(time>=lastTime&&time-lastTime<.08)return;
  lastTime=time;
  population.forEach((o,i)=>{const p=shrimpPose(o,time);dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,p.angle,0);dummy.scale.setScalar(p.scale);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});mesh.instanceMatrix.needsUpdate=true;
 }
 update(0);
 return{update,setVisible(value){group.visible=value},dispose(){geometry.dispose();material.dispose();mesh.dispose()}};
}
