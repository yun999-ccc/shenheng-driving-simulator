import * as THREE from './vendor/three.module.js';
const hash=n=>{const v=Math.sin(n*127.1+83.7)*43758.5453;return v-Math.floor(v)};
export function cucumberGeometry(detail='high'){
 const nx=detail==='high'?100:48,nr=detail==='high'?56:28,positions=[],uv=[],colors=[],indices=[];
 const papillae=[];for(let row=0;row<4;row++)for(let i=0;i<7;i++)papillae.push({x:-.103+i*.033+(hash(i+row*20)-.5)*.011,a:[-1.16,-.40,.40,1.16][row]+(hash(i+row*40)-.5)*.18,h:.012+hash(i*13+row)*.010});
 for(let i=0;i<=nx;i++)for(let j=0;j<=nr;j++){
  const t=i/nx*2-1,x=t*.13,a=j/nr*Math.PI*2-Math.PI,profile=Math.pow(Math.max(0,1-t*t),.34),c=Math.cos(a),s=Math.sin(a);
  let protrusion=0;if(c>-.1)for(const p of papillae){const dx=(x-p.x)/.009,da=(a-p.a)/.16;protrusion+=p.h*Math.exp(-dx*dx-da*da)}
  const wrinkle=.0007*Math.sin(x*790+Math.sin(a*5)*2)*profile,grain=(hash(i*43+j)-.5)*.00055;
  const y=c>=0?(.042*profile+protrusion+wrinkle+grain)*c:(.040*profile)*c;
  const z=(.044*profile+protrusion*.58+wrinkle)*s+.005*Math.sin(t*2.8)*profile;
  positions.push(x,y,z);uv.push(i/nx,j/nr);
  // Explicit sRGB pigments: do not pass display-like HSL lightness into linear space.
  const mottling=.5+.25*Math.sin(x*135+a*7)+.17*Math.sin(x*323-a*13);
  const base=new THREE.Color('#735f42').lerp(new THREE.Color('#a48c60'),Math.max(0,Math.min(1,mottling)));
  if(protrusion>.007)base.lerp(new THREE.Color('#b09a70'),Math.min(.22,protrusion*7));
  if(c<-.4)base.lerp(new THREE.Color('#8a7450'),.20);colors.push(base.r,base.g,base.b);
 }
 for(let i=0;i<nx;i++)for(let j=0;j<nr;j++){const a=i*(nr+1)+j,b=a+nr+1;indices.push(a,a+1,b,b,a+1,b+1)}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();return geo;
}
function collector(){
 const positions=[],normals=[],colors=[];
 function add(geometry,color,scale=[1,1,1],position=[0,0,0],rotation=[0,0,0],colourFn){
  const flat=geometry.index?geometry.toNonIndexed():geometry,c=new THREE.Color(color),palette=[];
  for(let i=0;i<flat.attributes.position.count;i++)palette.push(colourFn?colourFn(flat.attributes.position,i):c);
  flat.scale(...scale);const matrix=new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...rotation));flat.applyMatrix4(matrix);flat.translate(...position);
  const p=flat.attributes.position,n=flat.attributes.normal;for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));normals.push(n.getX(i),n.getY(i),n.getZ(i));const color=palette[i];colors.push(color.r,color.g,color.b)}
  if(flat!==geometry)flat.dispose();geometry.dispose();
 }
 const tube=(points,r,color,segments=10)=>add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),segments,r,3,false),color);
 const finish=()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeBoundingSphere();return g};
 return{add,tube,finish};
}
export function cucumberFeetGeometry(){const b=collector();for(const row of [-1,0,1])for(let i=0;i<13;i++){const x=-.10+i*.0166,z=row*.019+.005*Math.sin(x/.13*2.8);b.add(new THREE.SphereGeometry(1,5,3),'#5f5439',[.0023,.005,.0023],[x,-.036,z])}return b.finish()}
// Continuous centreline and shell profiles replace disconnected abdominal ellipsoids.
export const PRAWN_PROFILE=Object.freeze([
 [-.044,.022,.0015,.005],[-.038,.024,.009,.011],[-.025,.025,.012,.013],[-.010,.024,.011,.012],
 [0,.023,.0105,.010],[.010,.022,.0097,.0092],[.020,.020,.0085,.0081],[.030,.017,.0072,.0067],[.040,.0135,.0056,.0051],[.050,.010,.002,.002]
]);
export function prawnSection(z){
 const bounded=Math.max(PRAWN_PROFILE[0][0],Math.min(PRAWN_PROFILE.at(-1)[0],z)),i=Math.min(PRAWN_PROFILE.length-2,Math.max(0,PRAWN_PROFILE.findIndex((p,j)=>j<PRAWN_PROFILE.length-1&&bounded<=PRAWN_PROFILE[j+1][0]))),a=PRAWN_PROFILE[i],b=PRAWN_PROFILE[i+1],t=Math.max(0,Math.min(1,(bounded-a[0])/(b[0]-a[0]))),u=t*t*(3-2*t);
 return{z,x:.0012*Math.sin((z+.04)*22),y:a[1]+(b[1]-a[1])*u,rx:a[2]+(b[2]-a[2])*u,ry:a[3]+(b[3]-a[3])*u};
}
function shellPigment(z,a){
 const c=new THREE.Color('#b1a187');let stripe=0;
 for(let i=0;i<6;i++)stripe=Math.max(stripe,Math.exp(-Math.pow((z-(-.003+i*.0083+.005))/.00165,4)));
 if(z<-.008)stripe=Math.max(stripe,Math.exp(-Math.pow((z+.013)/.0023,4))*.75);
 c.lerp(new THREE.Color('#614c34'),stripe*.83);if(Math.cos(a)<-.2)c.lerp(new THREE.Color('#c3b595'),.2);return c;
}
function shellSurface(start,end,nz,na,skirt=false){
 const p=[],indices=[],colors=[],rings=na+1;
 for(let i=0;i<=nz;i++)for(let j=0;j<=na;j++){
  const z=start+(end-start)*i/nz,a=skirt?-2.04+4.08*j/na:-Math.PI+Math.PI*2*j/na,s=prawnSection(z),c=Math.cos(a),sn=Math.sin(a);
  let radius=1;for(let k=0;k<6;k++)radius-=.035*Math.exp(-Math.pow((z-(-.003+k*.0083))/.00065,2));
  if(skirt)radius=1.025+.055*(i/nz)**4;
  const sideFlare=skirt&&c<.10?1.08:1;
  p.push(s.x+s.rx*sn*radius*sideFlare,s.y+s.ry*c*radius*(c<0?.72:1),z);
  const color=shellPigment(z,a);if(skirt&&i===nz)color.multiplyScalar(.75);colors.push(color.r,color.g,color.b);
 }
 for(let i=0;i<nz;i++)for(let j=0;j<na;j++){const a=i*rings+j,b=a+rings;indices.push(a,b,a+1,b,b+1,a+1)}
 if(!skirt){for(const endRing of [0,nz]){const s=prawnSection(endRing===0?start:end),center=p.length/3;p.push(s.x,s.y,s.z);const color=shellPigment(s.z,0);colors.push(color.r,color.g,color.b);for(let j=0;j<na;j++){const a=endRing*rings+j;indices.push(center,...(endRing===0?[a,a+1]:[a+1,a]))}}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();g.userData.surface=skirt?'overlapping-shell':'continuous-body';return g;
}
export function prawnGeometry(detail='high'){
 const high=detail==='high',sphere=()=>new THREE.SphereGeometry(1,high?10:7,high?6:4),shell=collector();
 const body=shellSurface(-.044,.050,high?94:22,high?22:8);
 shell.add(body,'#b1a187',[1,1,1],[0,0,0],[0,0,0],(p,i)=>shellPigment(p.getZ(i),Math.atan2(p.getX(i)-prawnSection(p.getZ(i)).x,p.getY(i)-prawnSection(p.getZ(i)).y)));
 // Open ventral skirts sit over the shared body; each posterior edge overlaps the next segment.
 if(high)for(let i=0;i<6;i++){
  const start=-.006+i*.0083,end=Math.min(.049,start+.0101),part=shellSurface(start,end,5,14,true);
  shell.add(part,'#b1a187',[1,1,1],[0,0,0],[0,0,0],(p,j)=>{const z=p.getZ(j),s=prawnSection(z),c=shellPigment(z,Math.atan2(p.getX(j)-s.x,p.getY(j)-s.y));if(z>end-.0006)c.multiplyScalar(.8);return c});
 }
 const leaf=()=>{const s=new THREE.Shape();s.moveTo(0,-.008);s.quadraticCurveTo(.007,-.005,.006,.003);s.quadraticCurveTo(.003,.011,0,.015);s.quadraticCurveTo(-.005,.009,-.006,.003);s.quadraticCurveTo(-.007,-.005,0,-.008);const g=new THREE.ExtrudeGeometry(s,{depth:.0008,bevelEnabled:false,curveSegments:high?5:3});g.rotateX(Math.PI/2);return g};
 for(const side of [-1,1]){
  shell.tube([[side*.006,.030,-.036],[side*.011,.032,-.043]],.0009,'#998668',2);
  shell.add(sphere(),'#182018',[.0021,.0021,.0023],[side*.011,.032,-.043]);
  for(let leg=0;leg<5;leg++){const z=-.037+leg*.0065,reach=.015+(leg%2)*.002;shell.tube([[side*.007,.017,z],[side*.011,.012,z+.003],[side*reach,.005,z-.002],[side*(reach+.001),.0016,z-.006]],high?.00055:.00065,'#a58f6d',high?6:3)}
  if(high)for(let leg=0;leg<5;leg++){const z=.004+leg*.008;shell.tube([[side*.005,.014,z],[side*.008,.007,z+.004],[side*.010,.006,z+.008]],.0004,'#9c855f',3)}
  const antenna=[[side*.004,.026,-.041],[side*.012,.026,-.066],[side*.034,.022,-.096],[side*.046,.015,-.104],[side*.040,.009,-.086]];
  shell.tube(antenna,high?.00025:.00036,'#997c4c',high?24:7);
  if(high)shell.tube([[side*.004,.028,-.042],[side*.010,.029,-.056],[side*.018,.027,-.066]],.00025,'#b19d7a',8);
  for(let fan=0;fan<2;fan++)shell.add(leaf(),fan?'#806b4d':'#a18d6c',[1,1,1],[side*(.003+fan*.004),.007,.052],[0,side*(.20+fan*.48),0]);
 }
 shell.add(leaf(),'#897456',[.40,1,.9],[0,.008,.054]);
 const rostrum=new THREE.ConeGeometry(.0010,.024,3);rostrum.rotateX(-Math.PI/2);shell.add(rostrum,'#a4916d',[1,1,1],[0,.032,-.054]);
 if(high)for(let i=0;i<8;i++)shell.add(new THREE.ConeGeometry(.00045,.0014,3),'#6a593d',[1,1,1],[0,.0335,-.044-i*.0025]);
 const geometry=shell.finish();geometry.userData.bodyConstruction='continuous-profile-with-overlapping-dorsal-shells';return geometry;
}
