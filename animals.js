import * as THREE from './vendor/three.module.js';
import {cucumberGeometry,cucumberFeetGeometry} from './animal-geometry.js?v=cycle-9';
const skinTexture=()=>{const size=128,data=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const n=Math.sin(x*127.1+y*311.7)*43758.5453,v=100+Math.floor((n-Math.floor(n))*70)+Math.round(Math.sin(x*.5+Math.sin(y*.4))*18),i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=v;data[i+3]=255}const t=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t};
export function createCucumbers(parent,world){
 // Small artistic shadow lift preserves brown readability; not real bioluminescence.
 const texture=skinTexture(),material=new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.80,metalness:0,clearcoat:0,specularIntensity:.30,envMapIntensity:.25,emissive:'#8b7552',emissiveIntensity:.18,bumpMap:texture,bumpScale:.00065}),feetMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7});
 const geometries=[cucumberGeometry('high'),cucumberGeometry('low'),cucumberFeetGeometry()];
 const meshes=geometries.map((g,i)=>{const m=new THREE.InstancedMesh(g,i===2?feetMaterial:material,world.length);m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);parent.add(m);return m});
 const baseMaterial=new THREE.MeshBasicMaterial({vertexColors:true,fog:false}),dummy=new THREE.Object3D();let signature='';
 function update(cameraPosition,forceHigh=false){
  const near=world.map(o=>Math.hypot(cameraPosition.x-o.x,cameraPosition.y-o.y,cameraPosition.z-o.z)<(forceHigh?2.6:1.5));const key=near.join('');if(key===signature)return;signature=key;const counts=[0,0,0];
  world.forEach((o,i)=>{const scale=o.size/.17;dummy.position.set(o.x,o.y,o.z);dummy.rotation.set(0,o.angle,0);dummy.scale.setScalar(scale);dummy.updateMatrix();const index=near[i]?0:1,instance=counts[index]++;meshes[index].setMatrixAt(instance,dummy.matrix);meshes[index].setColorAt(instance,new THREE.Color().setScalar(.96+Math.sin(o.id*1.7)*.025));if(near[i])meshes[2].setMatrixAt(counts[2]++,dummy.matrix)});
  meshes.forEach((m,i)=>{m.count=counts[i];m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true});
 }
 update(new THREE.Vector3(0,0,0));return{update,geometries,setBaseColour:value=>meshes.forEach((m,i)=>m.material=value?baseMaterial:i===2?feetMaterial:material),dispose(){geometries.forEach(g=>g.dispose());meshes.forEach(m=>m.dispose());material.dispose();feetMaterial.dispose();baseMaterial.dispose();texture.dispose()}};
}
