import assert from 'node:assert/strict';
import * as THREE from './vendor/three.module.js';
import {cucumberGeometry,cucumberFeetGeometry,prawnGeometry,prawnSection} from './animal-geometry.js';
import {createCucumbers} from './animals.js';
import {createShrimp} from './shrimp.js';
import {underwaterLook} from './water-look.mjs';
import {makeWorld} from './simulation.mjs';
import {makeShrimpPopulation,shrimpPose} from './stocking.mjs';
const verify=(g,label)=>{for(const name of ['position','normal','color']){assert(g.attributes[name],label+' missing '+name);for(const n of g.attributes[name].array)assert(Number.isFinite(n),label+' nonfinite '+name)}g.computeBoundingBox();assert(g.boundingBox.max.x>g.boundingBox.min.x);assert(g.boundingBox.max.y>g.boundingBox.min.y);assert(g.boundingBox.max.z>g.boundingBox.min.z)};
const seaHigh=cucumberGeometry(),seaLow=cucumberGeometry('low'),feet=cucumberFeetGeometry(),prawnHigh=prawnGeometry(),prawnLow=prawnGeometry('low');
for(const [label,g] of [['cucumber high',seaHigh],['cucumber low',seaLow],['tube feet',feet],['prawn high',prawnHigh],['prawn low',prawnLow]])verify(g,label);
assert(seaHigh.index.count>seaLow.index.count*3);assert(prawnHigh.attributes.position.count>prawnLow.attributes.position.count*2);assert(prawnLow.attributes.position.count<3000);
// Outward normals must face the camera; an inverted body can disappear with back-face culling.
let top=0,up=0;const p=seaHigh.attributes.position,n=seaHigh.attributes.normal;for(let i=0;i<p.count;i++)if(Math.abs(p.getX(i))<.05&&p.getY(i)>.03){top++;if(n.getY(i)>0)up++}assert(up/top>.9);
const ray=new THREE.Raycaster(new THREE.Vector3(0,.2,0),new THREE.Vector3(0,-1,0)),body=new THREE.Mesh(seaHigh,new THREE.MeshBasicMaterial());body.updateMatrixWorld();assert(ray.intersectObject(body).length>0);
for(const animal of makeWorld()){const scale=animal.size/.17;assert(animal.y+seaHigh.boundingBox.min.y*scale> -2.5);assert(animal.y+feet.boundingBox.min.y*scale> -2.5)}
// Body length remains 10cm order; antennae intentionally extend beyond the body.
assert(prawnHigh.boundingBox.max.z-prawnHigh.boundingBox.min.z>.16);assert(prawnHigh.boundingBox.max.y<.04);for(const a of makeShrimpPopulation())for(const t of [0,10,600]){const p=shrimpPose(a,t);assert(p.y-.031+prawnHigh.boundingBox.min.y*p.scale>-2.5)}
for(const t of [-1,0,.25,1,2]){const look=underwaterLook(t);assert.equal(look.blur,0);assert(look.fog>0&&Number.isFinite(look.fog))}assert(underwaterLook(1).fog>underwaterLook(0).fog);
const parent=new THREE.Group(),world=makeWorld(),cucumbers=createCucumbers(parent,world),shrimp=createShrimp(parent);cucumbers.update(new THREE.Vector3(0,50,0));assert.equal(parent.children.slice(0,3).reduce((sum,m)=>sum+(m.geometry===cucumbers.geometries[2]?0:m.count),0),88);shrimp.update(10,new THREE.Vector3(0,50,0));assert.equal(parent.children[3].children.reduce((sum,m)=>sum+m.count,0),560);cucumbers.update(new THREE.Vector3(world[0].x,world[0].y+.2,world[0].z),true);assert(parent.children[0].count>0);assert.equal(parent.children[0].count+parent.children[1].count,88);cucumbers.dispose();shrimp.dispose();
const colour=seaHigh.attributes.color,mean=[0,0,0];for(let i=0;i<colour.count;i++){mean[0]+=colour.getX(i)/colour.count;mean[1]+=colour.getY(i)/colour.count;mean[2]+=colour.getZ(i)/colour.count}assert(.2126*mean[0]+.7152*mean[1]+.0722*mean[2]<.08,'sea cucumber pigment regressed to a pale colour');assert(mean[0]>mean[2]*1.5);assert.equal(prawnHigh.userData.bodyConstruction,'continuous-profile-with-overlapping-dorsal-shells');for(let z=-.044;z<.050;z+=.0001){const a=prawnSection(z),b=prawnSection(z+.00001);assert(Math.abs(a.rx-b.rx)<.0001);assert(Math.abs(a.y-b.y)<.0001)}assert.equal(prawnSection(.0500000000001).rx,prawnSection(.05).rx);
const baseParent=new THREE.Group(),sample=createCucumbers(baseParent,world);sample.setBaseColour(true);assert(baseParent.children.every(m=>m.material.isMeshBasicMaterial&&m.material.fog===false));sample.setBaseColour(false);assert(baseParent.children[0].material.clearcoat===0);assert(baseParent.children[0].material.roughness>=.75);sample.dispose();
console.log('Animal geometry attributes, winding, detail budgets, bed clearance and artistic water coefficient checks passed; not anatomy or visual validation.');
for(const g of [seaHigh,seaLow,feet,prawnHigh,prawnLow])g.dispose();body.material.dispose();
