import {REEFS} from './habitat.mjs?v=thrusters-3';
// Illustrative geometry/interlocks; not certified hardware limits.
export const PROBE=Object.freeze({mountOffset:.57,halfWidth:.35,halfLength:.29,bottomOffset:.22,clearance:.20,stowDepth:.30,transitDepth:.40,maxTilt:55,lensOffset:.10,verticalFov:65,far:10,waterDepth:2.5});
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
 const c=probeCenter(s),radius=Math.hypot(PROBE.halfWidth,PROBE.halfLength);let height=0,index=-1;
 REEFS.forEach((r,i)=>{const dx=c.x-r.x,dz=c.z-r.z,cos=Math.cos(r.angle),sin=Math.sin(r.angle);if(Math.abs(dx*cos-dz*sin)<=r.halfX+radius&&Math.abs(dx*sin+dz*cos)<=r.halfZ+radius&&r.roofHeight>height){height=r.roofHeight;index=i}});
 return{height,index,clearance:PROBE.waterDepth-s.depth-PROBE.bottomOffset-height,safeDepth:PROBE.waterDepth-height-PROBE.bottomOffset-PROBE.clearance};
}

export function telescopicSections(depth){const length=.90,anchor=1.25,distalTopOffset=.12,extension=(anchor-length+depth-distalTopOffset)/3;return Array.from({length:4},(_,i)=>({length,top:anchor-i*extension,bottom:anchor-i*extension-length,center:anchor-length/2-i*extension}))}
