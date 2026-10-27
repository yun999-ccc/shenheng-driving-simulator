// Authored pond geometry / operating corridors, not surveyed navigation data.
export const SAMPLE_HOME=Object.freeze({x:-6,z:4});
export const BASE=Object.freeze({x:-16.1,z:14});
export const STATION=Object.freeze({x:-18,y:1.4,z:24});
export const isInSample=(x,z)=>Math.abs(x)<=9.3&&Math.abs(z)<=6.1;
export function isNavigable(x,z){return isInSample(x,z)||(x>=-17.4&&x<=9.3&&z>=5.7&&z<=10)||(x>=-17.4&&x<=-14.7&&z>=8.7&&z<=15.2)}
export const atBase=s=>Math.hypot(s.x-BASE.x,s.z-BASE.z)<.55;
export function routeToBase(s){if(atBase(s))return[];const points=[];if(s.z<8.7||s.x>-14.7)points.push({x:SAMPLE_HOME.x,z:9},{x:BASE.x,z:9});points.push({...BASE});return points}
export const routeToSample=()=>[{x:BASE.x,z:9},{x:SAMPLE_HOME.x,z:9},{...SAMPLE_HOME}];
export function routeDistance(start,points){let p=start,d=0;for(const q of points){d+=Math.hypot(q.x-p.x,q.z-p.z);p=q}return d}
