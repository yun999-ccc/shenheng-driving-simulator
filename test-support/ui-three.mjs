export class Timer{constructor(){this.t=0}connect(){}update(){this.t+=1/60}getDelta(){return 1/60}getElapsed(){return this.t}}
