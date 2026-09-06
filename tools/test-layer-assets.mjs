// Optional native Canvas regression checks: node tools/test-layer-assets.mjs
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {createCanvas,loadImage}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas' : '@napi-rs/canvas');
const root=new URL('../assets/',import.meta.url);
async function pixels(name){const im=await loadImage(new URL('rongxin-'+name+'.png',root).pathname);assert.equal(im.width,1185);assert.equal(im.height,1327);const c=createCanvas(1185,1327),ctx=c.getContext('2d');ctx.drawImage(im,0,0);return ctx.getImageData(0,0,1185,1327).data;}
const [base,body,wave,left,right]=await Promise.all(['base-v1','body-v3','wave-body-v3','ear-left-v2','ear-right-v2'].map(pixels));
for(const plate of [body,wave])for(let y=0;y<160;y++)for(let x=0;x<800;x++)assert.equal(plate[(y*1185+x)*4+3],0,'no stationary ear tips or rims in the body');
for(const [x0,y0,w,h] of [[360,390,60,40],[505,360,55,35],[440,410,65,65]])for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){
 const i=(y*1185+x)*4;assert.deepEqual(body.slice(i,i+4),base.slice(i,i+4),'original eyes and nose stay untouched');
}
let originalTips=0,separatedTips=0;
for(let y=0;y<160;y++)for(let x=0;x<800;x++){const i=(y*1185+x)*4+3;originalTips+=base[i];separatedTips+=Math.max(left[i],right[i]);}
assert.ok(separatedTips/originalTips>0.995,'complete outer ear fur travels with the moving layers');
console.log('PASS: original eye/nose pixels, clean seated and wave crown, complete moving ear tips.');
