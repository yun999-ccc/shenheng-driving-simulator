// Only tests use this loader. Production scene and WebGL are deliberately not rendered.
export async function resolve(specifier,context,next){
 if(context.parentURL?.includes('/app.js')&&specifier.startsWith('./scene.js'))return{url:new URL('./ui-scene.mjs',import.meta.url).href,shortCircuit:true};
 if(context.parentURL?.includes('/app.js')&&specifier==='three')return{url:new URL('./ui-three.mjs',import.meta.url).href,shortCircuit:true};
 return next(specifier,context);
}
