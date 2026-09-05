// Native Canvas QA: node tools/render-gesture-check.mjs OUTPUT_DIRECTORY
import fs from 'node:fs';import assert from 'node:assert/strict';import path from 'node:path';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {createCanvas:C,loadImage}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas':'@napi-rs/canvas');
const root=new URL('../',import.meta.url),out=process.argv[2];if(!out)throw new Error('Provide output directory');fs.mkdirSync(out,{recursive:true});
globalThis.document={createElement:()=>C(1,1)};
const url=new URL('pet-renderer.js',root),source=fs.readFileSync(url,'utf8').replaceAll('import.meta.url',JSON.stringify(url.href));
const mod=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const r=Object.create(mod.NuojiRenderer.prototype);
Object.assign(r,{state:'idle',stateStartedAt:0,reducedMotion:false,pulseUntil:0,formTransitionFold:0,walkReady:false,walkLayersReady:false,walkDirection:-1,layersReady:true,skinReady:true,closedEyesReady:true,lyingReady:false,ballReady:false,layerImages:{}});
const read=async name=>loadImage(new URL('assets/nuoji-'+name+'.png',root).pathname);
for(const [key,name]of Object.entries({body:'body-v3',tail:'tail-v1',underpaint:'underpaint-v1',leftEar:'ear-left-v2',rightEar:'ear-right-v2'}))r.layerImages[key]=await read(name);
r.skinImage=await read('base-v1');r.closedEyesImage=await read('closed-eyes-v2');r.winkImage=r.createWinkSkin(r.closedEyesImage);r.currentFormWeights=()=>({sitting:1,lying:0,ball:0,walking:0});
function frame(state,ms,size=500){r.state=state;const c=C(size,size),ctx=c.getContext('2d');ctx.scale(size/500,size/500);ctx.fillStyle='#343b45';ctx.fillRect(0,0,500,500);r.drawPaintedSkin(ctx,ms);return c;}
const blink=r.drawClosedEyesOverlay;r.drawClosedEyesOverlay=()=>{};
let reference;for(let i=0;i<=102;i++){const d=frame('listening',i/15*1000).getContext('2d').getImageData(108,140,152,80).data;if(reference)assert.deepEqual(d,reference,'face/forehead move during listening');else reference=d;}
r.drawClosedEyesOverlay=blink;
let feet;for(let i=0;i<=84;i++){const d=frame('wave',i/30*1000).getContext('2d').getImageData(125,315,108,152).data;if(feet)assert.deepEqual(d,feet,'forelegs or paws move during greeting');else feet=d;}
// Compare wink with the same posed face and no eyelid; the other eye and nose
// must be byte-identical, even at full closure. Check at stable held tilt.
r.drawClosedEyesOverlay=()=>{};const open=frame('wave',1000);r.drawClosedEyesOverlay=blink;const closed=frame('wave',1000);
const oc=open.getContext('2d'),cc=closed.getContext('2d');
const pose=mod.getWavePose(1),scale=472/1327,left=250-1185*scale/2,top=20;
const pixel=(x,y)=>mod.getNuzzlePoint(left+x*scale,top+y*scale,pose);
for(const [x,y,w,h]of [[520,370,30,20],[475,425,14,12]]){
 const q=pixel(x,y);assert.deepEqual(cc.getImageData(Math.round(q.x),Math.round(q.y),w*scale|0,h*scale|0).data,oc.getImageData(Math.round(q.x),Math.round(q.y),w*scale|0,h*scale|0).data,'other eye/nose altered');
}
let changed=0;const od=oc.getImageData(0,0,500,500).data,cd=cc.getImageData(0,0,500,500).data;for(let i=0;i<od.length;i+=4)if(Math.abs(od[i]-cd[i])+Math.abs(od[i+1]-cd[i+1])+Math.abs(od[i+2]-cd[i+2])>25)changed++;
assert.ok(changed>400 && changed<2500,'one local eye visibly closes');
for(let i=0;i<120;i++){
 const ms=i/30*1000,state=ms<mod.WAVE_DURATION_MS?'wave':'idle',time=ms<mod.WAVE_DURATION_MS?ms:ms-mod.WAVE_DURATION_MS;
 const c=C(1100,450),ctx=c.getContext('2d');ctx.fillStyle='#343b45';ctx.fillRect(0,0,1100,450);
 const greeting=frame(state,time);
 ctx.drawImage(frame('listening',ms),0,30,400,400);ctx.drawImage(greeting,400,30,400,400);
 ctx.drawImage(greeting,95,55,180,155,800,85,288,248);
 ctx.fillStyle='#dfd3c9';ctx.font='16px sans-serif';ctx.fillText('EAR',20,24);ctx.fillText('HELLO + WINK',420,24);ctx.fillText('FACE DETAIL',820,24);
 fs.writeFileSync(path.join(out,i+'.png'),c.toBuffer('image/png'));
}
fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify({listeningFaceStationary:true,greetingForelegsAndPawsStationary:true,otherEyeAndNoseUnchanged:true,winkChangedPixels:changed,frames:120,fps:30,renderer:'native Canvas; not browser tested'},null,2));
console.log('PASS: approved ears, stationary forelegs/paws, single-eye-only overlay; 120 production/face-detail frames.');
