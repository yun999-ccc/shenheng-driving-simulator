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
  const tone=.43+.10*Math.sin(x*135+a*7)+.08*Math.sin(x*323-a*13)+hash(i*9+j)*.045;
  const base=new THREE.Color().setHSL(.105+hash(i*3+j)*.015,.24,Math.max(.18,Math.min(.34,tone*.58)));
  if(protrusion>.007)base.lerp(new THREE.Color('#9c8760'),Math.min(.60,protrusion*20));if(c<-.4)base.lerp(new THREE.Color('#72694b'),.35);colors.push(base.r,base.g,base.b);
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
export function cucumberFeetGeometry(){const b=collector();for(const row of [-1,0,1])for(let i=0;i<13;i++){const x=-.10+i*.0166,z=row*.019+.005*Math.sin(x/.13*2.8);b.add(new THREE.SphereGeometry(1,5,3),'#8d7f58',[.0023,.005,.0023],[x,-.036,z])}return b.finish()}
export function prawnGeometry(detail='high'){
 const high=detail==='high',sphere=()=>new THREE.SphereGeometry(1,high?12:7,high?7:4),cream=new THREE.Color('#c4b28a'),band=new THREE.Color('#5b4930');
 const shell=collector();shell.add(sphere(),'#c3b18b',[.012,.012,.021],[0,.023,-.024],[0,0,0],(p,i)=>{const c=cream.clone();if(p.getZ(i)>.6)c.lerp(band,.65);return c});
 for(let i=0;i<6;i++)shell.add(sphere(),'#b7a17b',[.011-i*.00085,(.011-i*.00085)*.86,.0069],[Math.sin(i*.35)*.001,.022-Math.pow(i/5,1.8)*.010,-.003+i*.009],[0,0,0],(p,j)=>{const c=cream.clone();if(p.getZ(j)>.28&&p.getZ(j)<.72)c.lerp(band,.85);else c.multiplyScalar(.91+hash(i*170+j)*.16);return c});
 const leaf=()=>{const s=new THREE.Shape();s.moveTo(0,-.008);s.quadraticCurveTo(.007,-.005,.006,.003);s.quadraticCurveTo(.003,.011,0,.015);s.quadraticCurveTo(-.005,.009,-.006,.003);s.quadraticCurveTo(-.007,-.005,0,-.008);const g=new THREE.ExtrudeGeometry(s,{depth:.0008,bevelEnabled:false,curveSegments:high?5:3});g.rotateX(Math.PI/2);return g};
 for(const side of [-1,1]){
  shell.tube([[side*.007,.030,-.036],[side*.013,.034,-.043]],.001,'#a89469',2);
  shell.add(sphere(),'#1a221a',[.0022,.0022,.0025],[side*.013,.034,-.043]);
  for(let leg=0;leg<5;leg++){const z=-.039+leg*.008;const reach=.017+(leg%2)*.004;shell.tube([[side*.008,.018,z],[side*.015,.010,z+.003],[side*reach,.0015,z-.007]],high?.00065:.0008,'#ae9871',high?5:2)}
  if(high)for(let leg=0;leg<5;leg++){const z=.004+leg*.008;shell.tube([[side*.006,.014,z],[side*.010,.006,z+.004],[side*.013,.005,z+.008]],.0005,'#a98e62',3)}
  const antenna=[[side*.004,.026,-.041],[side*.015,.026,-.067],[side*.045,.023,-.100],[side*.059,.016,-.103],[side*.045,.009,-.079]];
  shell.tube(antenna,high?.00032:.00048,'#a4844d',high?24:7);
  if(high)shell.tube([[side*.005,.028,-.042],[side*.012,.030,-.057],[side*.022,.027,-.069]],.00030,'#baa476',9);
  for(let fan=0;fan<2;fan++)shell.add(leaf(),fan?'#887049':'#ad9870',[1,1,1],[side*(.004+fan*.004),.007,.052],[0,side*(.22+fan*.48),0]);
 }
 shell.add(leaf(),'#927b54',[.45,1,.9],[0,.008,.054]);
 const rostrum=new THREE.ConeGeometry(.0012,.026,3);rostrum.rotateX(-Math.PI/2);shell.add(rostrum,'#b19c70',[1,1,1],[0,.032,-.054]);
 if(high)for(let i=0;i<8;i++)shell.add(new THREE.ConeGeometry(.00055,.0018,3),'#6f5d38',[1,1,1],[0,.034,-.044-i*.0026]);
 return shell.finish();
}
