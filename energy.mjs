import {atBase,routeDistance,routeToBase} from './navigation.mjs?v=cycle-9';
// Explicit demonstration coefficients; no selected hardware or field measurements.
export const ENERGY_DEMO=Object.freeze({capacityWh:800,pvWp:600,chargeEfficiency:.82,maxChargeW:500,idleW:18,computerW:25,lampsW:12,winchW:80,motorW:120,reserveFraction:.10,returnSpeed:.7,returnW:180});
export function makeEnergy(){return{config:{...ENERGY_DEMO},onboard:'A',packs:{A:{wh:784,status:'onboard'},B:{wh:320,status:'charging'},C:{wh:800,status:'ready'}},charging:'B',ready:'C',powerOn:true,sun: .8,pvW:0,loadW:0,solarWh:0,consumedWh:0,curtailedWh:0,alarm:'',returnRequired:false,faults:{link:true,leak:false},hatch:0,moduleLift:0,swapStage:'idle',swapSeconds:0,pendingPack:null,events:[]}}
export const onboardPack=s=>s.energy.packs[s.energy.onboard];
export const batteryPercent=s=>Math.max(0,Math.min(100,100*onboardPack(s).wh/s.energy.config.capacityWh));
export function logEnergy(s,message){s.energy.events.push({time:s.time,message});if(s.energy.events.length>60)s.energy.events.shift()}
export function returnBudgetWh(s){const c=s.energy.config,d=routeDistance(s,routeToBase(s)),recovery=(Math.max(0,s.depth+.55)/.28+Math.abs(s.tilt)/24+.45)*c.winchW/3600;return c.capacityWh*c.reserveFraction+d/c.returnSpeed*c.returnW/3600+recovery}
export function tickShore(s,dt){const e=s.energy,c=e.config,pv=Math.min(c.maxChargeW,c.pvWp*Math.max(0,Math.min(1,e.sun))*c.chargeEfficiency);e.pvW=0;if(e.charging&&e.packs[e.charging].status==='ready'){const next=Object.keys(e.packs).find(id=>e.packs[id].status==='waiting');if(next){e.charging=next;e.packs[next].status='charging';logEnergy(s,next+'组进入充电位（模拟）')}}if(!e.charging)return;const pack=e.packs[e.charging];if(pack.status==='fault')return;const gain=Math.min(c.capacityWh-pack.wh,pv*dt/3600);pack.wh+=gain;e.solarWh+=gain;e.pvW=dt>0?gain*3600/dt:0;e.curtailedWh+=Math.max(0,pv*dt/3600-gain);if(pack.wh>=c.capacityWh-1e-8){pack.wh=c.capacityWh;if(pack.status!=='ready'){pack.status='ready';logEnergy(s,e.charging+'组充电完成（模拟）')}}}
export function tickEnergy(s,dt){const e=s.energy,c=e.config;tickShore(s,dt);const lifting=s.liftPower&&!s.manualRecovery&&Math.abs(s.targetDepth-s.depth)>.01&&s.latch==='open';e.loadW=e.powerOn?(c.idleW+(s.recording?c.computerW:0)+(s.depth>=.3?c.lampsW:0)+(lifting?c.winchW:0)+c.motorW*(Math.abs(s.drive.left)**3+Math.abs(s.drive.right)**3)):0;
 const pack=onboardPack(s),used=Math.min(pack.wh,e.loadW*dt/3600);pack.wh-=used;e.consumedWh+=used;s.battery=batteryPercent(s);
 if(pack.wh<=1e-8&&e.powerOn){e.powerOn=false;e.alarm='电量耗尽：推进断驱，需人工回收。';logEnergy(s,e.alarm)}
}
export const canSwap=s=>atBase(s)&&s.probeState==='stowed'&&s.latch==='locked'&&Math.abs(s.speed)<.005&&Math.abs(s.drive.left)<.005&&Math.abs(s.drive.right)<.005&&!s.stopped&&!s.maintenance&&!s.energy.faults.leak&&s.energy.faults.link;
export function swapAction(s){const e=s.energy,fail=m=>{s.notice=m;return false};if(!canSwap(s))return fail('换电需先返岸、探头离水锁止、停驶，并解除故障。');
 if(e.swapStage==='idle'){
  const ready=Object.keys(e.packs).find(id=>id!==e.onboard&&e.packs[id].status==='ready');if(!ready)return fail('没有就绪的备用电池，请先充电。');e.pendingPack=ready;e.powerOn=false;e.loadW=0;s.recording=false;s.mode='manual';s.route=[];s.keys={};s.drive={left:0,right:0};s.driveCommand={left:0,right:0};e.swapStage='off';logEnergy(s,'船载供电断开，等待开盖');
 }else if(e.swapStage==='paused'){e.swapStage=e.pausedSwap;e.pausedSwap=null;e.swapSeconds=e.pausedSeconds||0}
 else if(e.swapStage==='off'){e.swapStage='opening';e.swapSeconds=0}
 else if(e.swapStage==='open'){e.swapStage='removing';e.swapSeconds=0}
 else if(e.swapStage==='removed'){e.swapStage='inserting';e.swapSeconds=0}
 else if(e.swapStage==='inserted'){e.swapStage='closing';e.swapSeconds=0}
 else if(e.swapStage==='closed'){e.swapStage='checked';logEnergy(s,'连接与锁扣检查通过（模拟，非传感器实测）')}
 else if(e.swapStage==='checked'){e.powerOn=true;e.swapStage='idle';e.returnRequired=false;e.alarm='';s.liftPower=true;s.notice='换电完成；旧任务已清除，需重新下达任务。';logEnergy(s,'重新上电，保持探头锁止');return true}
 else return fail('机构动作进行中，请等待完成。');s.notice='换电演示：'+e.swapStage+'；船载供电保持断开。';return true;
}
export function tickSwap(s,dt){const e=s.energy;if(!['opening','removing','inserting','closing'].includes(e.swapStage))return;e.swapSeconds+=dt;const f=Math.min(1,e.swapSeconds/1.2);
 if(e.swapStage==='opening'){e.hatch=f;if(f===1)e.swapStage='open'}
 else if(e.swapStage==='removing'){e.moduleLift=f;if(f===1){e.packs[e.onboard].status='removed';e.swapStage='removed'}}
 else if(e.swapStage==='inserting'){e.moduleLift=1-f;if(f===1){const old=e.onboard,next=e.pendingPack;if(e.charging&&e.charging!==old&&e.packs[e.charging].status==='charging')e.packs[e.charging].status='waiting';e.onboard=next;e.packs[next].status='onboard';e.packs[old].status='charging';e.charging=old;e.ready=Object.keys(e.packs).find(id=>id!==next&&id!==old)||null;e.swapStage='inserted';e.pendingPack=null;s.battery=batteryPercent(s);logEnergy(s,old+'组移入充电位，'+next+'组装船')}}
 else if(e.swapStage==='closing'){e.hatch=1-f;if(f===1)e.swapStage='closed'}
}
export function fastCharge(s){const e=s.energy;if(e.powerOn||!canSwap(s)||!['idle','off','open','closed','checked'].includes(e.swapStage)){s.notice='请先返岸、收纳并停机，且等待换电机构停止后快进充电。';return false}tickShore(s,600);s.time+=600;logEnergy(s,'停机充电演示快进10分钟');s.notice='已快进10分钟停机充电；输入与电池存量按演示参数计算。';return true}
export function setSun(s,value){const n=Number(value);if(Number.isFinite(n))s.energy.sun=Math.max(0,Math.min(1,n))}
export function setEnergyFault(s,type,value){const e=s.energy;if(type==='link')e.faults.link=!!value;if(type==='leak')e.faults.leak=!!value;e.alarm=e.faults.leak?'舱内进水演练：停止推进，等待人工回收。':!e.faults.link?'通信中断演练：停驶并回收，等待恢复。':'';if(e.alarm){s.keys={};s.route=[];s.mode='manual';s.recording=false;s.speed=0;s.targetDepth=s.depth;s.targetTilt=s.tilt;if(['recovering','deploying'].includes(s.probeState))s.probeState='held';s.drive={left:0,right:0};s.driveCommand={left:0,right:0}}logEnergy(s,e.alarm||'故障解除；旧任务不自动恢复')}

export function shorePower(s,on){if(!canSwap(s)||s.energy.swapStage!=='idle'||s.cycle.active)return false;s.energy.powerOn=!!on;s.energy.loadW=0;s.keys={};s.route=[];s.recording=false;s.mode='manual';s.notice=on?'岸边供电恢复，旧任务不会自动恢复。':'船载已停机，岸站继续模拟充电。';logEnergy(s,s.notice);return true}
