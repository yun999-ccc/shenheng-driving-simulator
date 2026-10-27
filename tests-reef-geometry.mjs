import assert from 'node:assert/strict';
import * as THREE from './vendor/three.module.js';
import {REEFS,REEF_BLOCKS,BED_Y,reefPoint,isReefOccluded} from './habitat.mjs';
// Independent Three.js raycasting against the identical faces supplied to the renderer.
const positions=[],indices=[];
for(const b of REEF_BLOCKS){const base=positions.length/3;positions.push(...b.positions);indices.push(...b.indices.map(i=>i+base))}
const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeBoundingSphere();
const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));mesh.updateMatrixWorld();
const ray=new THREE.Raycaster(),origin=new THREE.Vector3(),direction=new THREE.Vector3();let checked=0;
for(const reef of REEFS)for(let j=0;j<40;j++){
 const target=reefPoint(reef,Math.sin(j*1.71)*.50,Math.cos(j*2.19)*.65,.065);
 const camera=reefPoint(reef,Math.sin(j*1.17)*1.35,Math.cos(j*.73)*1.35,.11+(j%7)*.23);
 origin.set(camera.x,camera.y,camera.z);direction.set(target.x,target.y,target.z).sub(origin);const length=direction.length();ray.set(origin,direction.normalize());ray.near=length*1e-6;ray.far=length*(1-1e-6);
 assert.equal(isReefOccluded(target,camera),ray.intersectObject(mesh).length>0,`reef ${reef.id}, ray ${j}`);checked++;
}
assert(indices.every(i=>i>=0&&i<positions.length/3));assert(geometry.boundingSphere.radius>0);
console.log(`${checked} reef visibility rays agree with independent Three.js mesh raycasting; geometry only, no browser render validation.`);
geometry.dispose();mesh.material.dispose();
