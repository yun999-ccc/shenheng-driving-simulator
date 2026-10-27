// Illustrative standing population, not a stocking instruction or survival model.
export const SHRIMP_SCENARIO=Object.freeze({
 species:'日本对虾（车虾）',sampleWidth:20,sampleLength:14,
 referenceDensity:2,count:560,modelBodyLength:.10,
 evidence:'https://xuebao.dlou.edu.cn/article/2018/2095-1388/201803001.html'
});
const random=i=>{const n=Math.sin(i*127.1+71.7)*43758.5453;return n-Math.floor(n)};
export function makeShrimpPopulation(){
 return Array.from({length:SHRIMP_SCENARIO.count},(_,i)=>({
  id:`shrimp-${i+1}`,species:'shrimp',x:(random(i+1)-.5)*19.4,
  z:(random(i+1900)-.5)*13.4,phase:random(i+800)*Math.PI*2,
  scale:.8+random(i+3600)*.4
 }));
}
// Bounded near-bottom motion, driven by simulation time for repeatable resets.
export function shrimpPose(animal,time){
 const t=time*.15+animal.phase,a=animal.phase+Math.sin(t*.65)*.6;
 return{x:animal.x+Math.sin(t)*.18,z:animal.z+Math.cos(t*.83)*.18,
  y:-2.465+Math.max(0,Math.sin(t*.6))*.025,angle:a,
  scale:animal.scale};
}
