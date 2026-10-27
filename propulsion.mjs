// Normalized demonstration commands, not measured thrust, power or motor RPM.
export const THRUSTERS=[{side:'left',x:-.71,y:-.36,z:.85,hand:1},{side:'right',x:.71,y:-.36,z:.85,hand:-1}];
export function mixDrive(forward,turn){
 const divisor=Math.max(1,Math.abs(forward+turn),Math.abs(forward-turn));
 return{left:(forward+turn)/divisor,right:(forward-turn)/divisor};
}
export function stopDrive(s){s.drive={left:0,right:0};s.driveCommand={left:0,right:0}}
export function updateDrive(s,forward,turn,dt){
 s.driveCommand=mixDrive(forward,turn);
 for(const side of ['left','right']){
  const next=s.drive[side]+(s.driveCommand[side]-s.drive[side])*(1-Math.exp(-dt/.16));
  s.drive[side]=Math.abs(next)<.005&&s.driveCommand[side]===0?0:next;
 }
 return{forward:(s.drive.left+s.drive.right)/2,turn:(s.drive.left-s.drive.right)/2};
}
export function jetPoint(index,count,phase,command){
 const progress=((index/count+phase)%1+1)%1,theta=index*2.39996+progress*3;
 const radius=.025+progress*.12,direction=Math.sign(command)||1;
 return{x:Math.cos(theta)*radius,y:Math.sin(theta)*radius,z:direction*(.17+progress*(.25+Math.abs(command)*1.25))};
}
