// A designed reef layout, shared by rendering and the synthetic visibility rule.
// Dimensions are illustrative, not a surveyed aquaculture site.
export const REEFS=Array.from({length:24},(_,i)=>({
 x:-8+(i%6)*3.2,z:-4.8+Math.floor(i/6)*3.2,
 angle:Math.sin(i*7.31)*.24,halfX:.58,halfZ:.36,roofHeight:.38
}));
export function isReefOccluded(target,camera,height){
 // Intersect the view ray with each shelter's horizontal roof slab.
 for(const reef of REEFS){
  if(height<=reef.roofHeight)continue;
  const t=(height-reef.roofHeight)/(height-.09);
  if(t<0||t>1)continue;
  const dx=camera.x+(target.x-camera.x)*t-reef.x;
  const dz=camera.z+(target.z-camera.z)*t-reef.z;
  const c=Math.cos(reef.angle),s=Math.sin(reef.angle);
  if(Math.abs(dx*c-dz*s)<reef.halfX&&Math.abs(dx*s+dz*c)<reef.halfZ)return true;
 }
 return false;
}
