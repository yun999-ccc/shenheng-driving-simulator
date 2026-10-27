// Designed masonry shelters, not a surveyed pond or a validated reef construction plan.
export const BED_Y=-2.5;
const hash=n=>{const v=Math.sin(n*127.1+34.3)*43758.5453;return v-Math.floor(v)};
const rotate=(x,z,a)=>({x:x*Math.cos(a)+z*Math.sin(a),z:-x*Math.sin(a)+z*Math.cos(a)});
export function reefPoint(reef,x,z,height=.065){const p=rotate(x,z,reef.angle);return{x:reef.x+p.x,y:BED_Y+height,z:reef.z+p.z}}
// A bevelled convex octagonal block. These exact vertices and faces feed rendering and rays.
function blockGeometry(w,h,d,seed){
 const positions=[],indices=[],bevel=Math.min(.009,h*.12),cuts=Array.from({length:4},(_,i)=>.015+hash(seed+i)*.022);
 for(let ring=0;ring<4;ring++){
  const inset=ring===0||ring===3?bevel:0,hx=w/2-inset,hz=d/2-inset;
  const y=[-h/2,-h/2+bevel,h/2-bevel,h/2][ring],c=cuts;
  const polygon=[[-hx+c[0],-hz],[hx-c[1],-hz],[hx,-hz+c[1]],[hx,hz-c[2]],[hx-c[2],hz],[-hx+c[3],hz],[-hx,hz-c[3]],[-hx,-hz+c[0]]];
  for(const [x,z] of polygon)positions.push(x,y,z);
 }
 for(let ring=0;ring<3;ring++)for(let i=0;i<8;i++){const a=ring*8+i,b=ring*8+(i+1)%8,c=b+8,d=a+8;indices.push(a,c,b,a,d,c)}
 for(let i=1;i<7;i++){indices.push(0,i,i+1);indices.push(24,24+i+1,24+i)}
 return{positions,indices};
}
function makeReef(i){
 const col=i%6,row=Math.floor(i/6);let x=-8+col*3.2+(hash(i+80)-.5)*.75+(row%2?.15:-.1),z=-4.8+row*3.2+(hash(i+170)-.5)*.65;
 if(Math.abs(x)<2.1)x=Math.sign(x)*(1.95+hash(i+240)*.30);if(i===0){x=-8;z=-4.8}
 const reef={id:i+1,x,z,angle:(hash(i+90)-.5)*.70,type:i%3,blocks:[]},tiers=i%3===1?3:2,layerHeight=i%3===1?.112:.128;
 function add(lx,lz,bottom,w,h,d,angle=0,kind='brick'){
  const seed=i*97+reef.blocks.length*11,p=reefPoint(reef,lx,lz,bottom+h/2),yaw=reef.angle+angle,geometry=blockGeometry(w,h,d,seed),positions=[];
  for(let j=0;j<geometry.positions.length;j+=3){const q=rotate(geometry.positions[j],geometry.positions[j+2],yaw);positions.push(p.x+q.x,p.y+geometry.positions[j+1],p.z+q.z)}
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let j=0;j<positions.length;j++) {const a=j%3;min[a]=Math.min(min[a],positions[j]);max[a]=Math.max(max[a],positions[j])}
  reef.blocks.push({x:p.x,y:p.y,z:p.z,w,h,d,angle:yaw,kind,seed,positions,indices:geometry.indices,bounds:{min,max},top:bottom+h});
 }
 for(let level=0;level<tiers;level++){
  const bottom=-.015+level*(layerHeight+.003),shift=level%2?.035:-.015;
  for(const side of [-1,1])for(let j=0;j<3;j++)add(side*(.305+(hash(i+j+level)-.5)*.012),-.31+j*.31+shift,bottom,.185,layerHeight,.295,(hash(i+j*5+level*7)-.5)*.035);
  for(const lx of [-.105,.105])add(lx,-.425+shift,bottom,.20,layerHeight,.18,(hash(i+lx+level)-.5)*.025);
 }
 const capBottom=-.015+tiers*(layerHeight+.003),capHeight=.092+hash(i+300)*.018;
 for(const j of [0,1,2]){if(reef.type===1&&j===2)continue;add((hash(i+j+12)-.5)*.025,-.31+j*.31,capBottom,.835+hash(i+j)*.025,capHeight,.29,(hash(i+j+15)-.5)*.035,'cap')}
 // Small buried fragments at the sides; they participate in rays and clearance too.
 for(let j=0;j<7;j++){const side=j%2?1:-1;add(side*(.53+hash(i*7+j)*.18),(hash(i*9+j+5)-.5)*1.1,-.022,.09+hash(i+j+1)*.09,.04+hash(i+j+2)*.025,.07+hash(i+j+3)*.08,(hash(i+j+4)-.5)*2,'rubble')}
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(const block of reef.blocks)for(let a=0;a<3;a++){min[a]=Math.min(min[a],block.bounds.min[a]);max[a]=Math.max(max[a],block.bounds.max[a])}
 reef.bounds={min,max};reef.roofHeight=max[1]-BED_Y;reef.halfX=.80;reef.halfZ=.65;
 return reef;
}
export const REEFS=Array.from({length:24},(_,i)=>makeReef(i));
export const REEF_BLOCKS=REEFS.flatMap((reef,index)=>reef.blocks.map(block=>({...block,reefIndex:index})));
function segmentBounds(origin,delta,bounds){let lo=0,hi=1;for(let axis=0;axis<3;axis++){
 if(Math.abs(delta[axis])<1e-12){if(origin[axis]<bounds.min[axis]||origin[axis]>bounds.max[axis])return false}
 else {const a=(bounds.min[axis]-origin[axis])/delta[axis],b=(bounds.max[axis]-origin[axis])/delta[axis];lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));if(lo>hi)return false}
 }return hi>1e-6&&lo<1-1e-6;
}
function triangleHit(origin,delta,positions,ia,ib,ic){
 const a=ia*3,b=ib*3,c=ic*3,e1=[positions[b]-positions[a],positions[b+1]-positions[a+1],positions[b+2]-positions[a+2]],e2=[positions[c]-positions[a],positions[c+1]-positions[a+1],positions[c+2]-positions[a+2]];
 const p=[delta[1]*e2[2]-delta[2]*e2[1],delta[2]*e2[0]-delta[0]*e2[2],delta[0]*e2[1]-delta[1]*e2[0]],det=e1[0]*p[0]+e1[1]*p[1]+e1[2]*p[2];if(Math.abs(det)<1e-10)return false;
 const t=[origin[0]-positions[a],origin[1]-positions[a+1],origin[2]-positions[a+2]],u=(t[0]*p[0]+t[1]*p[1]+t[2]*p[2])/det;if(u<0||u>1)return false;
 const q=[t[1]*e1[2]-t[2]*e1[1],t[2]*e1[0]-t[0]*e1[2],t[0]*e1[1]-t[1]*e1[0]],v=(delta[0]*q[0]+delta[1]*q[1]+delta[2]*q[2])/det;if(v<0||u+v>1)return false;
 const distance=(e2[0]*q[0]+e2[1]*q[1]+e2[2]*q[2])/det;return distance>1e-6&&distance<1-1e-6;
}
export function isReefOccluded(target,camera,height){
 const origin=[camera.x,camera.y??BED_Y+height,camera.z],delta=[target.x-origin[0],(target.y??BED_Y+.065)-origin[1],target.z-origin[2]];
 for(const reef of REEFS){if(!segmentBounds(origin,delta,reef.bounds))continue;for(const block of reef.blocks){
  if(!segmentBounds(origin,delta,block.bounds))continue;for(let i=0;i<block.indices.length;i+=3)if(triangleHit(origin,delta,block.positions,...block.indices.slice(i,i+3)))return true;
 }}return false;
}
// Conservative circle-vs-block footprints, including rubble, from the same authored pieces.
export function reefObstacleAt(point,radius){let height=0,index=-1,blockIndex=-1;for(let i=0;i<REEFS.length;i++)for(let j=0;j<REEFS[i].blocks.length;j++){
 const block=REEFS[i].blocks[j],dx=point.x-block.x,dz=point.z-block.z,c=Math.cos(block.angle),s=Math.sin(block.angle),lx=dx*c-dz*s,lz=dx*s+dz*c;
 const ex=Math.max(0,Math.abs(lx)-block.w/2),ez=Math.max(0,Math.abs(lz)-block.d/2);if(ex*ex+ez*ez<=radius*radius&&block.top>height){height=block.top;index=i;blockIndex=j}
 }return{height,index,blockIndex};
}
export function clearReefFootprint(point,margin=.3){return REEFS.every(r=>point.x<r.bounds.min[0]-margin||point.x>r.bounds.max[0]+margin||point.z<r.bounds.min[2]-margin||point.z>r.bounds.max[2]+margin)}
