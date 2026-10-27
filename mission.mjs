import {atBase,isInSample} from './navigation.mjs?v=cycle-9';
import {canSwap,onboardPack,returnBudgetWh,swapAction,logEnergy} from './energy.mjs?v=cycle-9';
export const CYCLE_STAGES={idle:'等待开始',precheck:'设备预检',depart:'驶入调查样区',deploy:'下放观测头',survey:'沿路线巡检',return:'回收并返岸',dockcheck:'岸边停泊检查','waiting-spare':'停机等待备用组',swapping:'人工换电 · 自动演示',charging:'旧组太阳能回充',complete:'完成，岸边待命',interrupted:'流程已中断'};
export const surveyRoute=()=>Array.from({length:5},(_,row)=>{const z=5-row*2.5;return(row%2?[8,-8]:[-8,8]).map(x=>({x,z}))}).flat();
export function makeCycle(){return{active:false,stage:'idle',stageTime:0,startedAt:0,completedAt:null,events:[],plan:surveyRoute(),oldPack:null,preparing:false,waitingPurpose:'swap',actionTimer:0,reason:'',run:0,observations:0,surveyComplete:false,checks:[]}}
function stage(s,name,note){const c=s.cycle;c.stage=name;c.stageTime=0;c.actionTimer=0;c.reason=note||'';c.events.push({time:s.time,stage:name,note:note||CYCLE_STAGES[name]});s.notice=note||CYCLE_STAGES[name]}
export function cancelCycle(s,reason='手动接管'){const c=s.cycle;if(!c?.active)return;c.active=false;stage(s,'interrupted',reason+'；需重新开始整条流程。');if(['opening','removing','inserting','closing'].includes(s.energy.swapStage)){s.energy.pausedSwap=s.energy.swapStage;s.energy.pausedSeconds=s.energy.swapSeconds;s.energy.swapStage='paused'}s.recording=false;s.route=[];s.mode='manual';s.keys={};s.speed=0;s.drive={left:0,right:0};s.driveCommand={left:0,right:0};s.targetDepth=s.depth;s.targetTilt=s.tilt;if(['recovering','deploying'].includes(s.probeState))s.probeState='held'}
export function canStartCycle(s){return !s.stopped&&s.energy.powerOn&&s.energy.swapStage==='idle'&&!s.energy.faults.leak&&s.energy.faults.link&&s.liftPower&&!s.maintenance&&!s.maintenancePending&&!s.cycle.active&&['ready','stowed','held'].includes(s.probeState)}
export function startMission(s){if(!canStartCycle(s)){s.notice='请先解除故障、完成换电与探头保护复位，再开始流程。';return false}const run=s.cycle.run+1;s.cycle={...makeCycle(),active:true,startedAt:s.time,run};s.keys={};s.speed=0;s.drive={left:0,right:0};s.driveCommand={left:0,right:0};s.route=[];s.mode='manual';s.recording=false;s.targetDepth=s.depth;s.targetTilt=s.tilt;stage(s,'precheck','正在模拟检查：供电、通信、卷扬、舱内状态与回收锁止。');return true}
function shutdown(s){s.energy.powerOn=false;s.energy.loadW=0;s.recording=false;s.mode='manual';s.route=[];s.keys={};s.speed=0;s.drive={left:0,right:0};s.driveCommand={left:0,right:0}}
export function tickMission(s,dt,controls){const c=s.cycle;if(!c.active)return;
 if(s.stopped||!s.energy.faults.link||s.energy.faults.leak||!s.liftPower||s.maintenance||s.probeState==='blocked'){cancelCycle(s,'故障或保护触发');return}
 c.stageTime+=dt;c.actionTimer+=dt;
 if(!s.energy.powerOn&&!['waiting-spare','swapping','charging'].includes(c.stage)){cancelCycle(s,'船载供电中断');return}
 if(s.energy.returnRequired&&!['return','dockcheck','waiting-spare','swapping','charging'].includes(c.stage)){stage(s,'return','电量达到返岸阈值，跳过剩余巡检。');controls.returnHome(s);return}
 if(c.stage==='precheck'&&c.stageTime>=2){
  c.checks=['船载供电与演示电量','通信链路模拟状态','卷扬供电与探头状态','舱内进水演练状态'];
  if(onboardPack(s).wh<=returnBudgetWh(s)){c.preparing=true;controls.returnHome(s);stage(s,'return','预检发现船载电量不足，先返岸补能，再开始巡检。')}
  else if(atBase(s)){if(Object.keys(s.energy.packs).some(id=>id!==s.energy.onboard&&s.energy.packs[id].status==='ready')){controls.departBase(s);stage(s,'depart')}else{c.waitingPurpose='launch';shutdown(s);stage(s,'waiting-spare','出发前等待岸站备用组就绪，未开始巡检。')}}
  else if(isInSample(s.x,s.z)){controls.deployProbe(s);s.targetTilt=0;stage(s,'deploy')}
  else{c.preparing=true;controls.returnHome(s);stage(s,'return','先返回岸边重新进入标准流程。')}
 }else if(c.stage==='depart'&&s.mode==='manual'&&isInSample(s.x,s.z)){controls.deployProbe(s);s.targetTilt=0;stage(s,'deploy')}
 else if(c.stage==='deploy'&&s.probeState==='ready'&&Math.abs(s.depth-.8)<.02&&Math.abs(s.speed)<.005){controls.beginSurvey(s);stage(s,'survey','沿五条折返线巡检；已知合成编号关联，未观测区域保留待核查。')}
 else if(c.stage==='survey'&&s.mode==='manual'){c.surveyComplete=true;controls.returnHome(s);stage(s,'return','预设路线完成；回收锁止后返岸。')}
 else if(c.stage==='return'&&atBase(s)&&s.mode==='manual'&&canSwap(s)){stage(s,'dockcheck','模拟检查：停驶、离水锁止、泊位与供电；无真实传感器确认。')}
 else if(c.stage==='dockcheck'&&c.stageTime>=2){c.waitingPurpose='swap';c.oldPack=s.energy.onboard;const ready=Object.keys(s.energy.packs).some(id=>id!==s.energy.onboard&&s.energy.packs[id].status==='ready');if(ready){stage(s,'swapping','人工换电步骤自动演示，非自动换电硬件。')}else{shutdown(s);stage(s,'waiting-spare','备用电池未就绪，已停机等待岸站充电。无日照时保持等待。')}}
 else if(c.stage==='waiting-spare'){if(Object.keys(s.energy.packs).some(id=>id!==s.energy.onboard&&s.energy.packs[id].status==='ready')){if(c.waitingPurpose==='launch'){s.energy.powerOn=true;controls.departBase(s);stage(s,'depart','备用组已就绪，驶入样区。')}else stage(s,'swapping','备用组就绪，进入人工换电自动演示。')}}
 else if(c.stage==='swapping'){
  if(c.actionTimer<.8)return;
  if(s.energy.swapStage==='idle'&&s.energy.onboard!==c.oldPack){shutdown(s);stage(s,'charging','新组已装船；停机等待旧组回充，可显式快进充电。');return}
  if(!['opening','removing','inserting','closing'].includes(s.energy.swapStage)){if(!swapAction(s)){cancelCycle(s,'换电条件不满足');return}c.actionTimer=0}
 }else if(c.stage==='charging'&&s.energy.packs[c.oldPack]?.wh>=s.energy.config.capacityWh-1e-8){s.energy.powerOn=true;s.energy.returnRequired=false;s.energy.alarm='';if(c.preparing){c.preparing=false;c.oldPack=null;controls.departBase(s);stage(s,'depart','出发前补能完成，开始进入样区巡检。');return}c.active=false;c.completedAt=s.time;stage(s,'complete',c.surveyComplete?'巡检、返岸、换电及旧组回充完成，停泊待命。未观测区域仍需核查。':'返岸补能完成；本次巡检航线未完成，需重新安排调查。');logEnergy(s,'完整巡检补能流程结束，未自动离岸')}
}
