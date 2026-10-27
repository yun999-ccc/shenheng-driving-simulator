// Artistic coefficients, not measured visibility or optical scattering.
export function underwaterLook(turbidity=0.25,inspection=false){const t=Math.max(0,Math.min(1,turbidity));return{color:inspection?'#66877b':'#526f5d',fog:inspection?.085+t*.13:.12+t*.28,exposure:1.12,blur:0,saturation:.94,particleOpacity:.10+t*.16}}
