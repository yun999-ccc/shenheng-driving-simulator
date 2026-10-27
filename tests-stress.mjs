import assert from 'node:assert/strict';
import * as sim from './simulation.mjs?v=fixes-10';
import * as energy from './energy.mjs?v=fixes-10';
import {canDrive} from './probe.mjs?v=fixes-10';
const world=sim.makeWorld(),r=sim.seeded(20261027);let actionAttempts=0;
for(let run=0;run<300;run++){
 const s=sim.makeState(),actions=[()=>sim.startCycle(s),()=>sim.manual(s),()=>sim.returnHome(s),()=>sim.retractProbe(s),()=>sim.deployProbe(s),()=>sim.requestMaintenance(s),()=>sim.toggleLiftPower(s),()=>sim.handRecover(s),()=>sim.setDepth(s,.3+r()*1.6),()=>sim.setTilt(s,r()*55),()=>sim.emergencyStop(s),()=>{if(s.stopped)sim.releaseStop(s)},()=>energy.setEnergyFault(s,'link',!s.energy.faults.link),()=>energy.setEnergyFault(s,'leak',!s.energy.faults.leak),()=>energy.swapAction(s),()=>energy.fastCharge(s),()=>energy.shorePower(s,!s.energy.powerOn),()=>sim.suspend(s)];
 for(let step=0;step<120;step++){actions[Math.floor(r()*actions.length)]();for(let j=0;j<5+Math.floor(r()*30);j++)sim.tick(s,.05,world);actionAttempts++;
  for(const k of ['time','x','z','depth','tilt','battery','speed'])assert(Number.isFinite(s[k]),k);
  for(const p of Object.values(s.energy.packs))assert(p.wh>=0&&p.wh<=s.energy.config.capacityWh);
  if(!s.stopped&&!canDrive(s)){assert.equal(s.speed,0);assert.equal(s.drive.left,0);assert.equal(s.drive.right,0)}
  if(s.energy.swapStage!=='idle')assert(!s.energy.powerOn);
  if(s.energy.ready)assert.equal(s.energy.packs[s.energy.ready].status,'ready');
 }
}
console.log({deterministicActionSequences:300,actionAttempts,status:'finite, energy bounded and motion interlocks consistent'});
