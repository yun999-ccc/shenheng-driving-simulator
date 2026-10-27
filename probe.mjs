import {reefObstacleAt} from './habitat.mjs?v=life-6';
// Illustrative geometry/interlocks; not certified hardware limits.
export const PROBE=Object.freeze({mountOffset:.57,halfWidth:.35,halfLength:.29,bottomOffset:.22,clearance:.20,stowDepth:-.55,transitDepth:-.54,sleeveLength:1,mastTop:1.70,latchTime:.45,maxTilt:55,lensOffset:.10,verticalFov:65,far:10,waterDepth:2.5});
export function probeCenter(s){return{x:s.x+PROBE.mountOffset*Math.sin(s.heading),z:s.z-PROBE.mountOffset*Math.cos(s.heading)}}
export function cameraFrame(s){
 const c=probeCenter(s),a=(s.tilt||0)*Math.PI/180,sh=Math.sin(s.heading),ch=Math.cos(s.heading),st=Math.sin(a),ct=Math.cos(a);
 return{origin:{x:c.x+PROBE.lensOffset*st*sh,y:-s.depth-PROBE.lensOffset*ct,z:c.z-PROBE.lensOffset*st*ch},forward:{x:st*sh,y:-ct,z:-st*ch},right:{x:ch,y:0,z:sh},up:{x:sh*ct,y:st,z:-ch*ct}};
}
export function projectObservation(point,s){
 const f=cameraFrame(s),v={x:point.x-f.origin.x,y:(point.y??-2.405)-f.origin.y,z:point.z-f.origin.z};
 const dot=b=>v.x*b.x+v.y*b.y+v.z*b.z,d=dot(f.forward),tan=Math.tan(PROBE.verticalFov*Math.PI/360),x=dot(f.right)/(d*tan*(s.cameraAspect||1.6)),y=dot(f.up)/(d*tan);
 return{x,y,distance:d,inside:d>.05&&d<PROBE.far&&Math.abs(x)<1&&Math.abs(y)<1};
}
export function obstacleBelow(s){
 const c=probeCenter(s),radius=Math.hypot(PROBE.halfWidth,PROBE.halfLength),{height,index,blockIndex}=reefObstacleAt(c,radius);
 return{height,index,blockIndex,clearance:PROBE.waterDepth-s.depth-PROBE.bottomOffset-height,safeDepth:PROBE.waterDepth-height-PROBE.bottomOffset-PROBE.clearance};
}

export function telescopicSections(depth){const length=PROBE.sleeveLength,anchor=PROBE.mastTop,distalTopOffset=.12,extension=(anchor-length+depth-distalTopOffset)/3;return Array.from({length:4},(_,i)=>({length,top:anchor-i*extension,bottom:anchor-i*extension-length,center:anchor-length/2-i*extension}))}

// Shared structural cage geometry. Forward lower crossbar has an optical opening.
export const GUARD=[];
for(const y of [-.207,.107]){
 for(const x of [-.33,.33])GUARD.push({a:[x,y,-.27],b:[x,y,.27],r:.013});
 for(const z of [-.27,.27]){
  if(y===-.207&&z===-.27){GUARD.push({a:[-.33,y,z],b:[-.22,y,z],r:.013},{a:[.22,y,z],b:[.33,y,z],r:.013})}
  else GUARD.push({a:[-.33,y,z],b:[.33,y,z],r:.013});
 }
}
for(const x of [-.33,.33])for(const z of [-.27,.27])GUARD.push({a:[x,-.207,z],b:[x,.107,z],r:.013});
export const cameraAvailable=s=>s.depth>=.3-1e-8&&!s.maintenance;
export const canDrive=s=>s.liftPower!==false&&!s.maintenance&&(s.probeState==='ready'||s.probeState==='stowed'&&s.latch==='locked');
export function isGuardOccluded(point,s){
 const f=cameraFrame(s),c=probeCenter(s),ch=Math.cos(s.heading),sh=Math.sin(s.heading);
 const local=p=>[(p.x-c.x)*ch+(p.z-c.z)*sh,p.y+s.depth,-(p.x-c.x)*sh+(p.z-c.z)*ch];
 const origin=local(f.origin),end=local({...point,y:point.y??-2.405}),delta=end.map((v,i)=>v-origin[i]);
 return GUARD.some(({a,b,r})=>{let near=.05/Math.hypot(...delta),far=1;for(let i=0;i<3;i++){
  const min=Math.min(a[i],b[i])-r,max=Math.max(a[i],b[i])+r;
  if(Math.abs(delta[i])<1e-10){if(origin[i]<min||origin[i]>max)return false}
  else {const u=(min-origin[i])/delta[i],v=(max-origin[i])/delta[i];near=Math.max(near,Math.min(u,v));far=Math.min(far,Math.max(u,v));if(near>far)return false}
 }return near<1&&far>0});
}
