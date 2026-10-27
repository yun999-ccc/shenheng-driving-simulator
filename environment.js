import * as THREE from 'three';
import {REEFS} from './habitat.mjs?v=pond-1';

const containerWidth=()=>document.documentElement.clientWidth;
const hash=n=>{const v=Math.sin(n*127.1+34.3)*43758.5453;return v-Math.floor(v)};
const mat=(color,roughness=1,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});

export function createPondEnvironment(scene,renderer){
 const above=new THREE.Group(),underwater=new THREE.Group();scene.add(above,underwater);
 const loader=new THREE.TextureLoader();
 const texture=(name,color=false)=>{const t=loader.load(new URL(`./assets/textures/${name}`,import.meta.url).href);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(color)t.colorSpace=THREE.SRGBColorSpace;return t};
 const sandMap=texture('coast_sand_02_diffuse.jpg',true),sandNormal=texture('coast_sand_02_nor_gl.jpg'),sandArm=texture('coast_sand_02_arm.jpg');
 const earthMap=texture('brown_mud_02_diff.jpg',true),earthNormal=texture('brown_mud_02_nor_gl.jpg');
 const rockMap=texture('rock_01_diff.jpg',true),rockNormal=texture('rock_01_nor_gl.jpg');
 const sandMat=new THREE.MeshStandardMaterial({color:'#b8ad89',map:sandMap,normalMap:sandNormal,normalScale:new THREE.Vector2(.45,.45),roughnessMap:sandArm,aoMap:sandArm,aoMapIntensity:.55,roughness:1});
 const earthMat=new THREE.MeshStandardMaterial({color:new THREE.Color('#d3c6a8').multiplyScalar(1.25),map:earthMap,normalMap:earthNormal,normalScale:new THREE.Vector2(.65,.65),roughness:1,vertexColors:true});
 const rockMat=new THREE.MeshStandardMaterial({color:'#898b7e',map:rockMap,normalMap:rockNormal,normalScale:new THREE.Vector2(.6,.6),roughness:.88});
 const add=(geo,material,parent,pos)=>{const o=new THREE.Mesh(geo,material);if(pos)o.position.set(...pos);o.receiveShadow=true;parent.add(o);return o};
 const box=(w,h,d,material,parent,pos)=>add(new THREE.BoxGeometry(w,h,d),material,parent,pos);
 const cylinder=(r,h,material,parent,pos)=>add(new THREE.CylinderGeometry(r,r,h,14),material,parent,pos);
 const tileUV=(geo,scale)=>{const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*scale[0],uv.getY(i)*scale[1]);return geo};
 const bed=add(tileUV(new THREE.PlaneGeometry(57,43),[19,14.3]),sandMat,underwater,[0,-2.5,0]);bed.rotation.x=-Math.PI/2;

 // Earth berms slope into the pond. A full landscape is visible beyond the sample area.
 const terrainGeo=new THREE.PlaneGeometry(130,110,130,110);terrainGeo.rotateX(-Math.PI/2);
 const pos=terrainGeo.attributes.position,colors=[];
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),z=pos.getZ(i),edge=Math.max(Math.abs(x)-27,Math.abs(z)-20);
  let y=edge<-.7?-2.7:edge<3.3?-2.5+(edge+.7)/4*3.8:1.3;
  y+=(Math.sin(x*.57)*Math.cos(z*.71)*.10+hash(i)*.055)*Math.min(1,Math.max(0,edge+1));
  pos.setY(i,y);
  const wet=edge<1.8,noise=.86+hash(i+100)*.2;
  const c=new THREE.Color(wet?'#9e9c80':edge>7?'#a6ac85':'#e5d9b7').multiplyScalar(noise);colors.push(c.r,c.g,c.b);
 }
 terrainGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));tileUV(terrainGeo,[43.3,36.6]);terrainGeo.computeVertexNormals();add(terrainGeo,earthMat,above);
 // Patches of gravel road on the berm crown.
 const roadMat=new THREE.MeshStandardMaterial({color:new THREE.Color('#e3d9bc').multiplyScalar(1.35),map:earthMap,normalMap:earthNormal,normalScale:new THREE.Vector2(.32,.32),roughness:1});
 for(const x of [-32,32]){const road=add(tileUV(new THREE.PlaneGeometry(2.3,51),[.77,17]),roadMat,above,[x,1.34,0]);road.rotation.x=-Math.PI/2}
 for(const z of [-25,25]){const road=add(tileUV(new THREE.PlaneGeometry(66,2.3),[22,.77]),roadMat,above,[0,1.34,z]);road.rotation.x=-Math.PI/2}
 // Shoreline riprap: shared geometry, one draw call, varied scales and rotations.
 const stoneGeo=new THREE.IcosahedronGeometry(1,1),stones=new THREE.InstancedMesh(stoneGeo,rockMat,360),dummy=new THREE.Object3D();above.add(stones);stones.receiveShadow=true;
 for(let i=0;i<360;i++){
  const side=i%4,t=hash(i+400)*2-1,offset=hash(i+500)*1.8;
  const x=side<2?(side?1:-1)*(27+offset):t*28,z=side>=2?(side===2?1:-1)*(20+offset):t*21;
  dummy.position.set(x,-.18+offset*.63,z);dummy.rotation.set(hash(i+9),hash(i+7)*6.28,hash(i+8));dummy.scale.set(.18+hash(i)*.34,.12+hash(i+4)*.26,.18+hash(i+6)*.32);dummy.updateMatrix();stones.setMatrixAt(i,dummy.matrix);
  stones.setColorAt(i,new THREE.Color().setScalar(.7+hash(i+15)*.45));
 }stones.computeBoundingSphere();
 // Sparse shoreline reeds, instanced and restricted to the banks, not an underwater lawn.
 const reedGeo=new THREE.PlaneGeometry(.028,1,1,4);reedGeo.translate(0,.5,0);
 const reedMat=new THREE.MeshStandardMaterial({color:'#6f7546',side:THREE.DoubleSide,roughness:1});
 const reeds=new THREE.InstancedMesh(reedGeo,reedMat,1000);above.add(reeds);
 for(let i=0;i<1000;i++){
  const cluster=Math.floor(i/8),side=cluster%4,t=hash(cluster+900)*2-1;
  const x=side<2?(side?1:-1)*(29.1+hash(cluster)*.6):t*29,z=side>=2?(side===2?1:-1)*(22.1+hash(cluster+4)*.6):t*22;
  dummy.position.set(x+(hash(i)-.5)*.3,.95,z+(hash(i+1)-.5)*.3);dummy.rotation.set((hash(i+6)-.5)*.25,hash(i+2)*6.28,(hash(i+3)-.5)*.35);dummy.scale.set(1,.35+hash(i+4)*.7,1);dummy.updateMatrix();reeds.setMatrixAt(i,dummy.matrix);reeds.setColorAt(i,new THREE.Color().setHSL(.15+hash(i+8)*.06,.18,.32+hash(i+9)*.14));
 }reeds.computeBoundingSphere();

 // Adjacent ponds and low coastal ridgelines provide context beyond the working pond.
 const distantWater=mat('#526e66',.2,.1);for(const p of [[-48,0,24,35],[48,0,24,35],[0,-45,52,24]]){const o=add(new THREE.PlaneGeometry(p[2],p[3]),distantWater,above,[p[0],1.65,p[1]===0?0:p[1]]);o.rotation.x=-Math.PI/2}
 const hillMat=mat('#6e7b72');for(let i=0;i<14;i++){const a=i/14*Math.PI*2,r=140+hash(i)*25;const h=add(new THREE.SphereGeometry(1,16,8),hillMat,above,[Math.sin(a)*r,-9,Math.cos(a)*r]);h.scale.set(24+hash(i)*36,13+hash(i+1)*16,19+hash(i+2)*32)}
 const concrete=mat('#b0aaa0',.95),rust=mat('#635a46',.7,.28),paint=mat('#607b72',.55,.25);
 // Illustrative sluice and operator platform on the far bank.
 const sluice=new THREE.Group();sluice.position.set(9,0,-22);above.add(sluice);
 box(3.3,.24,4.6,concrete,sluice,[0,.94,0]);for(const x of [-1.2,1.2])box(.30,2.8,.36,concrete,sluice,[x,-.15,1.1]);box(2.1,1.7,.12,paint,sluice,[0,-.05,1.15]);for(const x of [-1.3,1.3])box(.09,2.5,.09,rust,sluice,[x,2.12,.9]);box(2.8,.12,.12,rust,sluice,[0,3.3,.9]);cylinder(.04,2,rust,sluice,[0,2.25,.9]);const wheel=add(new THREE.TorusGeometry(.24,.025,8,24),rust,sluice,[0,3.45,.9]);wheel.rotation.x=Math.PI/2;
 for(const x of [-1.5,1.5]){for(const z of [-1.6,0,1.6])cylinder(.025,1,rust,sluice,[x,1.55,z]);const rail=cylinder(.025,3.6,rust,sluice,[x,2.02,0]);rail.rotation.x=Math.PI/2}
 const shed=new THREE.Group();shed.position.set(-18,1.4,-27);above.add(shed);box(4.8,2.2,3.1,mat('#b8bab1'),shed,[0,1.1,0]);box(5.2,.13,3.6,mat('#626f72',.65,.4),shed,[0,2.24,0]);box(.9,1.65,.04,paint,shed,[-1,.85,1.58]);box(1.2,.65,.05,mat('#405963',.25),shed,[1.05,1.3,1.58]);
 // A narrow shore platform, outside the software sample boundary.
 const wood=mat('#887964',.96);for(let i=0;i<15;i++)box(1.6,.10,.2,wood,above,[-18,.27,15-i*.22]);for(const x of [-18.6,-17.4])for(const z of [12,15])cylinder(.055,2.6,rust,above,[x,-.5,z]);
 const markerMat=mat('#dfb260',.6),markerWhite=mat('#e5e4d7',.6),buoys=[];
 for(const x of [-10,10])for(const z of [-7,7]){const buoy=new THREE.Group();buoy.position.set(x,.035,z);above.add(buoy);const body=add(new THREE.SphereGeometry(.13,14,10),markerMat,buoy,[0,.04,0]);body.scale.y=.65;cylinder(.025,.34,markerWhite,buoy,[0,.16,0]);buoys.push(buoy)}
 // Submerged low brick shelters and individual cobbles; no target-like decorative vegetation.
 const brickMat=new THREE.MeshStandardMaterial({color:'#67614c',map:rockMap,normalMap:rockNormal,normalScale:new THREE.Vector2(.5,.5),roughness:.93});
 const supportGeo=new THREE.BoxGeometry(.18,.26,.20),roofGeo=new THREE.BoxGeometry(1.16,.12,.72);
 const supports=new THREE.InstancedMesh(supportGeo,brickMat,REEFS.length*4),roofs=new THREE.InstancedMesh(roofGeo,brickMat,REEFS.length);supports.castShadow=roofs.castShadow=true;supports.receiveShadow=roofs.receiveShadow=true;underwater.add(supports,roofs);
 REEFS.forEach((reef,i)=>{let j=0;for(const x of [-.46,.46])for(const z of [-.23,.23]){dummy.position.set(reef.x+x*Math.cos(reef.angle)+z*Math.sin(reef.angle),-2.37,reef.z-x*Math.sin(reef.angle)+z*Math.cos(reef.angle));dummy.rotation.set(0,reef.angle,0);dummy.scale.set(1,1,1);dummy.updateMatrix();supports.setMatrixAt(i*4+j++,dummy.matrix)}dummy.position.set(reef.x,-2.18,reef.z);dummy.updateMatrix();roofs.setMatrixAt(i,dummy.matrix)});supports.computeBoundingSphere();roofs.computeBoundingSphere();
 const pebbles=new THREE.InstancedMesh(stoneGeo,rockMat,180);underwater.add(pebbles);pebbles.receiveShadow=true;for(let i=0;i<180;i++){dummy.position.set((hash(i+1900)-.5)*21,-2.48,(hash(i+2100)-.5)*15);dummy.rotation.set(hash(i),hash(i+8)*6,hash(i+3));dummy.scale.set(.03+hash(i+5)*.09,.025+hash(i+7)*.05,.03+hash(i+9)*.1);dummy.updateMatrix();pebbles.setMatrixAt(i,dummy.matrix)}pebbles.computeBoundingSphere();

 const dustGeo=new THREE.BufferGeometry(),dustPositions=new Float32Array(160*3);for(let i=0;i<160;i++){dustPositions[i*3]=(hash(i+3000)-.5)*22;dustPositions[i*3+1]=-2.35+hash(i+3300)*1.9;dustPositions[i*3+2]=(hash(i+3600)-.5)*16}dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));underwater.add(new THREE.Points(dustGeo,new THREE.PointsMaterial({color:'#c2c5a5',size:.009,transparent:true,opacity:.23,depthWrite:false})));
 const skyGeo=new THREE.SphereGeometry(350,24,16),skyMat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{},vertexShader:`varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 vDir;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
 void main(){vec3 d=normalize(vDir);float h=max(d.y,0.);vec3 col=mix(vec3(.62,.69,.68),vec3(.20,.38,.55),pow(h,.48));float n=noise(d.xz/(h+.13)*2.4)*.6+noise(d.xz/(h+.13)*6.)*.27+noise(d.xz/(h+.13)*13.)*.13;float cloud=smoothstep(.52,.72,n)*smoothstep(.02,.25,h);col=mix(col,vec3(.82,.83,.79),cloud*.65);gl_FragColor=vec4(col,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});const sky=new THREE.Mesh(skyGeo,skyMat);scene.add(sky);
 const envScene=new THREE.Scene();envScene.add(new THREE.Mesh(skyGeo,skyMat));const pmrem=new THREE.PMREMGenerator(renderer),envTarget=pmrem.fromScene(envScene,.045,.1,500);scene.environment=envTarget.texture;scene.environmentIntensity=.4;pmrem.dispose();

 const reflection=new THREE.WebGLRenderTarget(containerWidth()>700?1024:512,containerWidth()>700?1024:512,{type:THREE.HalfFloatType});
 const mirrorCamera=new THREE.PerspectiveCamera(),textureMatrix=new THREE.Matrix4(),biasMatrix=new THREE.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),look=new THREE.Vector3(),direction=new THREE.Vector3();
 const waterUniforms={time:{value:0},reflectionMap:{value:reflection.texture},textureMatrix:{value:textureMatrix},sunDirection:{value:new THREE.Vector3(-.45,.78,.43).normalize()},boatPosition:{value:new THREE.Vector2()},heading:{value:0},speed:{value:0},turbidity:{value:.25}};
 const waterMat=new THREE.ShaderMaterial({uniforms:waterUniforms,vertexShader:`uniform float time;uniform mat4 textureMatrix;varying vec3 vWorld;varying vec4 vReflect;void main(){vec3 p=position;p.y+=sin(p.x*1.5+p.z*.63+time*.8)*.009+sin(p.z*2.7-p.x*.4-time*1.1)*.005;vec4 world=modelMatrix*vec4(p,1.);vWorld=world.xyz;vReflect=textureMatrix*world;gl_Position=projectionMatrix*viewMatrix*world;}`,fragmentShader:`
 uniform float time;uniform sampler2D reflectionMap;uniform vec3 sunDirection;uniform vec2 boatPosition;uniform float heading;uniform float speed;uniform float turbidity;varying vec3 vWorld;varying vec4 vReflect;
 float rand(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(rand(i),rand(i+vec2(1.,0.)),f.x),mix(rand(i+vec2(0.,1.)),rand(i+1.),f.x),f.y);}
 float height(vec2 p){vec2 q=p+vec2(noise(p*.4+time*.03),noise(p*.35-time*.025))*1.3;return sin(q.x*1.6+q.y*.55+time*.8)*.017+sin(q.x*-2.1+q.y*1.75-time*.65)*.009+sin(q.x*5.15+q.y*3.8+time*1.4)*.0025+sin(q.x*10.2-q.y*6.1-time*1.7)*.0008;}
 void main(){vec2 p=vWorld.xz;float e=.016;float dx=(height(p+vec2(e,0))-height(p-vec2(e,0)))/(2.*e),dz=(height(p+vec2(0,e))-height(p-vec2(0,e)))/(2.*e);vec2 local=p-boatPosition;float along=-dot(local,vec2(sin(heading),-cos(heading))),across=dot(local,vec2(cos(heading),sin(heading)));float wake=sin(length(vec2(across,along*.65))*36.-time*6.)*.012*abs(speed)*exp(-abs(across)*2.-abs(along-1.)*.8)*smoothstep(0.,.5,along);vec3 n=normalize(vec3(-dx+ wake,1.,-dz+wake));vec3 eye=normalize(cameraPosition-vWorld);float fresnel=.035+.965*pow(1.-max(dot(n,eye),0.),5.);vec2 uv=vReflect.xy/vReflect.w+n.xz*.012;vec3 reflected=texture2D(reflectionMap,clamp(uv,.002,.998)).rgb;float ripple=height(p)*2.;vec3 base=mix(vec3(.040,.105,.079),vec3(.073,.107,.063),turbidity)+ripple;vec3 color=mix(base,reflected,clamp(.20+fresnel*.78,0.,.94));float highlight=pow(max(dot(reflect(-sunDirection,n),eye),0.),135.);color+=vec3(1.,.92,.7)*highlight*.75;float shadow=exp(-(local.x*local.x/1.1+local.y*local.y/1.8)*2.);color*=1.-shadow*.20;float bank=min(27.-abs(p.x),20.-abs(p.y));float edge=(1.-smoothstep(0.,.65,bank))*.13;color+=vec3(.18,.19,.12)*edge;gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const waterGeo=new THREE.PlaneGeometry(54,40,96,72);waterGeo.rotateX(-Math.PI/2);const water=new THREE.Mesh(waterGeo,waterMat);scene.add(water);
 let reflectionFrame=0;
 const prepare=(camera,s,elapsed,boat)=>{
  waterUniforms.time.value=elapsed;waterUniforms.boatPosition.value.set(s.x,s.z);waterUniforms.heading.value=s.heading;waterUniforms.speed.value=s.speed;waterUniforms.turbidity.value=s.turbidity;
  buoys.forEach((o,i)=>{o.position.y=.035+Math.sin(elapsed*1.4+i)*.018;o.rotation.z=Math.sin(elapsed+i)*.025});
  if(reflectionFrame++%3!==0)return;
  camera.updateMatrixWorld();mirrorCamera.copy(camera);mirrorCamera.position.copy(camera.position);mirrorCamera.position.y=-camera.position.y;camera.getWorldDirection(direction);look.copy(camera.position).add(direction);look.y=-look.y;mirrorCamera.up.set(0,-1,0);mirrorCamera.lookAt(look);mirrorCamera.updateMatrixWorld();
  textureMatrix.copy(biasMatrix).multiply(mirrorCamera.projectionMatrix).multiply(mirrorCamera.matrixWorldInverse);
  const target=renderer.getRenderTarget();water.visible=false;underwater.visible=false;
  const submerged=[];boat.traverse(o=>{if(o.isMesh&&o.getWorldPosition(direction).y<-.08&&o.visible){submerged.push(o);o.visible=false}});
  renderer.setRenderTarget(reflection);renderer.render(scene,mirrorCamera);renderer.setRenderTarget(target);
  submerged.forEach(o=>o.visible=true);underwater.visible=true;water.visible=true;
 };
 return{above,underwater,water,sky,prepare,dispose(){reflection.dispose();envTarget.dispose()}};
}
