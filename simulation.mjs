import {makeCycle,startMission,tickMission,cancelCycle,surveyRoute} from './mission.mjs?v=fixes-10';
import {makeEnergy,tickEnergy,tickSwap,onboardPack,returnBudgetWh,logEnergy,pauseSwap} from './energy.mjs?v=fixes-10';
import {SAMPLE_HOME,BASE,atBase,isInSample,isNavigable,routeToBase,routeToSample} from './navigation.mjs?v=fixes-10';
import {updateDrive,stopDrive} from './propulsion.mjs?v=fixes-10';
import {isReefOccluded,REEFS,reefPoint,clearReefFootprint} from './habitat.mjs?v=fixes-10';
import {PROBE,probeCenter,cameraFrame,projectObservation,obstacleBelow,cameraAvailable,canDrive,isGuardOccluded,holdProbe} from './probe.mjs?v=fixes-10';
export const LIMITS={x:10,z:7,waterDepth:2.5,minDepth:.3,maxDepth:1.9,maxSpeed:1.6};
export const HOME=SAMPLE_HOME;
export function seeded(seed=48271){return()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646}}
export function makeWorld(){const r=seeded(20261027),world=[];
 for(const [reefIndex,reef] of REEFS.entries())for(const zone of ['open','entrance','interior']){
  const local=zone==='open'?[.04,.9]:zone==='entrance'?[.04,.46]:[0,-.03],p=reefPoint(reef,...local);
  world.push({id:world.length+1,species:'sea-cucumber',...p,zone,reefIndex,angle:reef.angle+(r()-.5)*.8,size:.10+r()*.035});
 }
 while(world.length<88){const x=(r()-.5)*18,z=(r()-.5)*12;if(!clearReefFootprint({x,z},.35))continue;world.push({id:world.length+1,species:'sea-cucumber',x,z,y:-2.435,zone:'open',reefIndex:null,angle:r()*Math.PI*2,size:.10+r()*.10})}
 return world;
}
export function makeState(){return{cycle:makeCycle(),energy:makeEnergy(),x:HOME.x,z:HOME.z,heading:0,speed:0,drive:{left:0,right:0},driveCommand:{left:0,right:0},depth:.8,targetDepth:.8,tilt:0,targetTilt:0,cameraAspect:1.6,probeState:'ready',probeReason:'',latch:'open',pausedLatch:'',latchTimer:0,liftPower:true,manualRecovery:false,maintenance:false,maintenancePending:false,lampSpacing:.50,mode:'manual',stopped:false,recording:false,time:0,battery:98,turbidity:.25,keys:{},route:[],routeIndex:0,track:[],covered:new Set,valid:new Set,unobserved:new Set,hiddenReefs:new Set,seen:new Set,flags:[],records:[],sampleTimer:0,trackTimer:0,notice:'新版观测头已就绪。靠近参礁时，请留意模拟净空。',lastQuality:0}}
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const angle=n=>Math.atan2(Math.sin(n),Math.cos(n));
export function clearInput(s){s.keys={}}
export function emergencyStop(s){cancelCycle(s,'急停');if(['opening','removing','inserting','closing'].includes(s.energy.swapStage)){s.energy.pausedSwap=s.energy.swapStage;s.energy.pausedSeconds=s.energy.swapSeconds;s.energy.swapStage='paused'}s.stopped=true;s.speed=0;stopDrive(s);s.mode='manual';s.route=[];s.recording=false;clearInput(s);s.notice='急停已锁定。解除后需重新发出操作指令。'}
export function releaseStop(s){s.stopped=false;s.speed=0;stopDrive(s);s.mode='manual';s.route=[];clearInput(s);s.targetDepth=s.depth;s.targetTilt=s.tilt;s.manualRecovery=false;s.maintenancePending=false;if(['recovering','deploying'].includes(s.probeState)){s.probeState='held';if(['engaging','releasing'].includes(s.latch)){s.pausedLatch=s.latch;s.latch='paused'}}s.notice=s.probeState==='blocked'?'急停已解除；探头保护仍锁定，请先回收探头。':'急停已解除，旧驾驶输入与航线已清除。'}
export function setDepth(s,value){if(s.stopped||!s.energy.powerOn||s.energy.swapStage!=='idle'||s.energy.faults.leak||!s.energy.faults.link||s.energy.returnRequired||!isInSample(s.x,s.z)||!Number.isFinite(Number(value)))return;if(!s.liftPower||s.maintenance||s.probeState==='recovering')return;const next=clamp(Number(value),LIMITS.minDepth,LIMITS.maxDepth);if(s.probeState==='stowed'||s.probeState==='held'){s.probeState='deploying';s.latch='releasing';s.latchTimer=0;s.speed=0;stopDrive(s);s.mode='manual';s.route=[];clearInput(s)}if(s.probeState==='blocked'&&next>s.depth){s.notice='探头保护中：允许上收，禁止继续下放。';return}s.targetDepth=next}
export function setTilt(s,value){if(!s.stopped&&s.energy.powerOn&&!s.energy.faults.leak&&s.energy.faults.link&&!s.maintenance&&['ready','blocked'].includes(s.probeState)&&Number.isFinite(Number(value)))s.targetTilt=clamp(Number(value),0,PROBE.maxTilt)}
export function beginSurvey(s){if(s.stopped||!canDrive(s)||s.probeState!=='ready'||!cameraAvailable(s)||!isInSample(s.x,s.z))return;s.route=surveyRoute();s.routeIndex=0;s.mode='survey';s.recording=true;clearInput(s);s.notice='沿均匀航线调查。礁下遮挡保留为未观测，保护触发后需先回收探头。'}
export function returnHome(s){if(s.stopped||!s.energy.powerOn||s.energy.swapStage!=='idle'||s.energy.faults.leak||!s.energy.faults.link||!s.liftPower||s.maintenance)return;const docked=s.probeState==='stowed'&&s.latch==='locked';s.speed=0;stopDrive(s);s.route=routeToBase(s);s.routeIndex=0;s.mode=docked?'return':'retract';s.recording=false;if(!docked){s.probeState='recovering';s.latch='open';s.latchTimer=0}s.targetDepth=PROBE.stowDepth;s.targetTilt=0;clearInput(s);s.notice=docked?'保持离水锁止，正在返航。':'返航准备：先归正、离水回收并锁止，再沿通道驶回岸站。'}
export function retractProbe(s){if(s.stopped||!s.energy.powerOn||s.energy.faults.leak||!s.liftPower||s.maintenance)return;s.speed=0;stopDrive(s);s.mode='manual';s.route=[];s.recording=false;clearInput(s);if(s.probeState==='stowed'&&s.latch==='locked'){s.notice='探头已离水锁止。';return}s.probeState='recovering';s.latch='open';s.latchTimer=0;s.targetDepth=PROBE.stowDepth;s.targetTilt=0;s.notice='先归正镜头，再离水回收并锁止；船体保持停驶。'}
export function manual(s){if(s.stopped)return;cancelCycle(s,'手动接管');s.mode='manual';s.route=[];clearInput(s);s.notice=s.probeState==='ready'?'已切换手动驾驶。':'已取消自动任务；请先完成探头回收。'}
export function observationCenter(s){return probeCenter(s)}
export function quality(s){const c=probeCenter(s),height=LIMITS.waterDepth-s.depth,patch=c.x>2&&c.z<.5?25:0;return clamp(Math.round(100-s.turbidity*45-Math.abs(height-1)*22-patch-(s.tilt||0)*.09),8,99)}
export function capture(s,world,selfOccluded=isGuardOccluded){
 if(s.stopped||!cameraAvailable(s))return;const frame=cameraFrame(s),q=quality(s),height=LIMITS.waterDepth+frame.origin.y,occluded=o=>isReefOccluded(o,frame.origin,height)||selfOccluded(o,s);
 const visible=world.filter(o=>(!o.species||o.species==='sea-cucumber')&&projectObservation(o,s).inside&&!occluded(o));s.lastQuality=q;let fresh=0;
 for(let x=-9.5;x<10;x++)for(let z=-6.5;z<7;z++){const point={x,z};if(!projectObservation(point,s).inside)continue;const key=`${x},${z}`;s.covered.add(key);if(q>=60&&!occluded(point)){s.valid.add(key);s.unobserved.delete(key)}else if(!s.valid.has(key))s.unobserved.add(key)}
 REEFS.forEach((r,i)=>{if(projectObservation(r,s).inside&&occluded(r))s.hiddenReefs.add(i)});
 if(q>=60){for(const o of visible){if(!s.seen.has(o.id))fresh++;s.seen.add(o.id)}}else if(!s.flags.some(f=>Math.hypot(f.x-s.x,f.z-s.z)<1.7))s.flags.push({x:s.x,z:s.z,quality:q,time:s.time});
 if(s.cycle.active)s.cycle.observations++;
 s.records.push({time:s.time,x:s.x,z:s.z,depth:s.depth,tilt:s.tilt,clearance:obstacleBelow(s).clearance,probeState:s.probeState,latch:s.latch,quality:q,visibleTargets:visible.length,newEntries:fresh,mode:s.mode,unobserved:s.unobserved.size,hiddenReefs:s.hiddenReefs.size,cycleRun:s.cycle.run,cycleStage:s.cycle.stage,energyWh:onboardPack(s).wh,pack:s.energy.onboard,loadW:s.energy.loadW,dataType:'SIMULATED_ONLY'});if(s.records.length>2000)s.records.shift();return{quality:q,visible,fresh};
}
function blockProbe(s,reason){s.probeState='blocked';s.probeReason=reason;s.speed=0;stopDrive(s);s.mode='manual';s.route=[];s.recording=false;s.targetDepth=s.depth;clearInput(s);s.notice=reason+'。船体停驶、下放锁定；请点击“回收探头”。'}
export function tick(s,dt,world,selfOccluded=isGuardOccluded){
 if(s.stopped)return;dt=clamp(dt,0,.05);s.time+=dt;tickMission(s,dt,{returnHome,departBase,deployProbe,beginSurvey});tickEnergy(s,dt);tickSwap(s,dt);
 if(!s.energy.powerOn||s.energy.faults.leak){s.speed=0;stopDrive(s);s.keys={};s.recording=false;s.route=[];s.mode='manual';return}
 if(!s.energy.faults.link&&s.probeState!=='stowed'&&s.probeState!=='recovering'&&s.liftPower)retractProbe(s);
 if(s.energy.faults.link&&!s.energy.returnRequired&&onboardPack(s).wh<=returnBudgetWh(s)&&!atBase(s)){s.energy.returnRequired=true;returnHome(s);logEnergy(s,'达到演示返岸电量阈值');s.notice=!s.liftPower||s.maintenance?'低电量且回收机构不可用：停止调查，需人工处理；不能自动返岸。':'低电量：取消调查，回收锁止后返岸；估算阈值不保证实机安全。'}
 const k=s.keys;
 if((k.up||k.down)&&['ready','blocked'].includes(s.probeState))setDepth(s,s.targetDepth+((k.down?1:0)-(k.up?1:0))*.4*dt);
 if(s.latch==='releasing'){s.latchTimer+=dt;if(s.latchTimer>=PROBE.latchTime){s.latch='open';s.latchTimer=0}}
 const liftMoving=s.liftPower||s.manualRecovery,leveling=s.probeState==='recovering'&&s.tilt>1&&s.depth<.05;
 const below=obstacleBelow(s),rate=s.manualRecovery?.10:.28;
 const desired=s.depth+((liftMoving&&s.latch==='open'&&!leveling)?clamp(s.targetDepth-s.depth,-rate*dt,rate*dt):0);
 if(desired>s.depth&&desired>below.safeDepth+1e-8){s.depth=Math.max(s.depth,below.safeDepth);blockProbe(s,'模拟净空达到保护阈值')}else s.depth=desired;
 s.tilt+=clamp(s.targetTilt-s.tilt,-24*dt,24*dt);
 if(s.probeState==='deploying'&&s.latch==='open'&&s.depth>=LIMITS.minDepth-1e-8){s.probeState='ready';s.probeReason='';s.notice='探头已入水，可开始观察。'}
 if(s.probeState==='recovering'&&Math.abs(s.depth-PROBE.stowDepth)<1e-8&&s.tilt<1){
  if(s.latch!=='locked'){s.latch='engaging';s.latchTimer+=dt;if(s.latchTimer>=PROBE.latchTime)s.latch='locked'}
  if(s.latch==='locked'){s.probeState='stowed';s.probeReason='';s.manualRecovery=false;
   if(s.maintenancePending){s.maintenance=true;s.maintenancePending=false;s.notice='已收纳锁止，维护展开中；推进已禁用。'}
   else if(s.mode==='retract'){s.mode='return';s.notice='探头已离水锁止，正在返航。'}else s.notice='探头已离水锁止。点击观测姿态重新下放。';
  }
 }

 let thrust=(k.forward?1:0)-(k.back?1:0),turn=(k.right?1:0)-(k.left?1:0);
 if(!canDrive(s)||s.mode==='retract'){thrust=0;turn=0;s.speed=0;stopDrive(s)}else if(s.mode!=='manual'){const p=s.route[s.routeIndex];if(p){const dx=p.x-s.x,dz=p.z-s.z,d=Math.hypot(dx,dz);if(d<.35)s.routeIndex++;else{const diff=angle(Math.atan2(dx,-dz)-s.heading);turn=clamp(diff*2,-1,1);thrust=Math.abs(diff)>.6?.25:1}}else{s.mode='manual';s.recording=false;thrust=0;s.notice=atBase(s)?'已到岸站停泊位。请停机后按步骤换电。':'航线任务已完成。礁下未观测不等于海参为零。'}}
 const drive=updateDrive(s,thrust,turn,dt),heading=angle(s.heading+drive.turn*.9*dt),target=drive.forward*LIMITS.maxSpeed;s.speed+=(target-s.speed)*Math.min(1,dt*2.5);if(!thrust&&Math.abs(s.speed)<.005)s.speed=0;
 const nx=s.x+Math.sin(heading)*s.speed*dt,nz=s.z-Math.cos(heading)*s.speed*dt;
 const outsideReady=!isInSample(nx,nz)&&!(s.probeState==='stowed'&&s.latch==='locked'),navigable=isNavigable(nx,nz)&&!outsideReady,candidate={...s,x:navigable?nx:s.x,z:navigable?nz:s.z,heading};
 if((Math.abs(drive.turn)>0||Math.abs(s.speed)>0)&&obstacleBelow(candidate).clearance<PROBE.clearance-1e-8){blockProbe(s,'前方参礁与探头保护框干涉')}else{s.x=candidate.x;s.z=candidate.z;s.heading=heading;if(nx!==s.x||nz!==s.z){s.speed=0;stopDrive(s);s.notice=outsideReady?'离开样区前需离水收纳并锁止，请使用返岸功能。':'已到可通行水域边界；返岸请使用预设通道。'}}
 s.trackTimer+=dt;if(s.trackTimer>.25){s.trackTimer=0;s.track.push({x:s.x,z:s.z});if(s.track.length>1200)s.track.shift()}s.lastQuality=quality(s);s.sampleTimer+=dt;if(s.recording&&s.sampleTimer>=.5){s.sampleTimer=0;capture(s,world,selfOccluded)}
}

export function deployProbe(s){if(s.stopped||!s.liftPower)return;if(s.maintenance){s.notice='请先退出维护姿态。';return}setDepth(s,.8)}
export function setLampSpacing(s,value){const n=Number(value);if(!s.stopped&&Number.isFinite(n))s.lampSpacing=clamp(n,.36,.60)}
export function requestMaintenance(s){if(s.stopped||s.energy.faults.leak||!s.energy.faults.link||!s.energy.powerOn||s.energy.swapStage!=='idle'||!s.liftPower||s.maintenancePending)return;if(s.maintenance){s.maintenance=false;s.notice='已退出维护；探头仍保持离水锁止。';return}retractProbe(s);if(s.probeState==='stowed'&&s.latch==='locked'){s.maintenance=true;s.notice='干式维护示意：假定机器已吊上岸；禁止推进。'}else{s.maintenancePending=true;s.notice='先归正、回收、锁止，再展开维护。'}}
export function toggleLiftPower(s){if(!s.energy.powerOn||s.energy.swapStage!=='idle'||s.stopped||s.maintenance)return;s.liftPower=!s.liftPower;s.speed=0;stopDrive(s);s.mode='manual';s.route=[];s.recording=false;s.targetDepth=s.depth;clearInput(s);s.manualRecovery=false;s.maintenancePending=false;
 if(s.probeState!=='stowed')s.probeState=s.liftPower?(s.depth>=.3?'ready':'held'):'held';
 s.notice=s.liftPower?'卷扬供电恢复，需重新下达操作。':'卷扬失电演练：制动保持为模拟，可使用手摇回收；未验证实物防坠。';
}
export function handRecover(s){if(s.stopped||!s.energy.powerOn||s.energy.faults.leak||s.probeState==='stowed'||s.liftPower||s.maintenance)return;s.manualRecovery=true;s.probeState='recovering';s.latch='open';s.latchTimer=0;s.targetDepth=PROBE.stowDepth;s.targetTilt=0;s.notice='手摇回收流程模拟。仅卷扬失电，倾转仍按独立供电演示。'}

export function departBase(s){if(!atBase(s)||!canDrive(s)||s.energy.returnRequired||onboardPack(s).wh<=returnBudgetWh(s)||s.energy.swapStage!=='idle')return false;s.route=routeToSample();s.routeIndex=0;s.mode='depart';clearInput(s);s.notice='保持离水锁止，沿通道驶入样区；到达后手动下放探头。';return true}

export function startCycle(s){return startMission(s)}
export {cancelCycle};

export function suspend(s){if(s.stopped)return;cancelCycle(s,'页面离开前台');pauseSwap(s);holdProbe(s);s.speed=0;stopDrive(s);s.mode='manual';s.route=[];s.recording=false;clearInput(s);s.notice='页面离开前台，驾驶与机构动作已暂停；需重新下达指令。'}
