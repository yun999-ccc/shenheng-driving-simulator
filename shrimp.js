import * as THREE from './vendor/three.module.js';
import {makeShrimpPopulation,shrimpPose} from './stocking.mjs?v=shore-8';
import {prawnGeometry} from './animal-geometry.js?v=shore-8';
// Opaque PBR shell approximates a wet translucent-looking carapace; no costly screen refraction.
export function createShrimp(parent){
 const population=makeShrimpPopulation(),group=new THREE.Group();parent.add(group);
 const geometries=[prawnGeometry('high'),prawnGeometry('low')],material=new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.53,metalness:0,clearcoat:.06,clearcoatRoughness:.52,specularIntensity:.45,envMapIntensity:.32});
 const meshes=geometries.map(g=>{const m=new THREE.InstancedMesh(g,material,population.length);group.add(m);m.receiveShadow=true;m.frustumCulled=false;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);return m}),dummy=new THREE.Object3D(),baseMaterial=new THREE.MeshBasicMaterial({vertexColors:true,fog:false});let lastTime=-Infinity,lastEye='';
 function update(time,cameraPosition=new THREE.Vector3(0,0,0),forceHigh=false){
  const eye=[cameraPosition.x,cameraPosition.y,cameraPosition.z].map(n=>n.toFixed(1)).join(',');if(time>=lastTime&&time-lastTime<.08&&eye===lastEye)return;lastTime=time;lastEye=eye;const counts=[0,0];
  population.forEach(o=>{const p=shrimpPose(o,time),distance=Math.hypot(p.x-cameraPosition.x,p.y-cameraPosition.y,p.z-cameraPosition.z),index=distance<(forceHigh?.75:.65)?0:1;dummy.position.set(p.x,p.y-.031,p.z);dummy.rotation.set(0,p.angle,0);dummy.scale.setScalar(p.scale);dummy.updateMatrix();meshes[index].setMatrixAt(counts[index]++,dummy.matrix)});meshes.forEach((m,i)=>{m.count=counts[i];m.instanceMatrix.needsUpdate=true});
 }
 update(0);return{update,population,setBaseColour:value=>meshes.forEach(m=>m.material=value?baseMaterial:material),getPose:(i,time)=>shrimpPose(population[i],time),setVisible:value=>group.visible=value,dispose(){geometries.forEach(g=>g.dispose());material.dispose();baseMaterial.dispose();meshes.forEach(m=>m.dispose())}};
}
