// Offline registration and layer masks. Requires @napi-rs/canvas.
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {createCanvas,loadImage}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas' : '@napi-rs/canvas');
const root=new URL('../',import.meta.url);
const source=fs.readFileSync(new URL('pet-renderer.js',root),'utf8').replaceAll('import.meta.url',JSON.stringify(new URL('pet-renderer.js',root).href));
const {NuojiRenderer}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
globalThis.document={createElement:()=>createCanvas(1,1)};
const renderer=Object.create(NuojiRenderer.prototype);
const read=async name=>loadImage(new URL('assets/nuoji-'+name+'.png',root).pathname);
const [base,oldBody,repair]=await Promise.all([read('base-v1'),read('body-v2'),read('crown-repair-green-v1')]);
const w=1185,h=1327,make=()=>createCanvas(w,h);
function mask(path,blur=10){const c=make(),ctx=c.getContext('2d');ctx.fillStyle='white';ctx.beginPath();path(ctx);ctx.closePath();ctx.fill();const f=make(),fc=f.getContext('2d');fc.filter=`blur(${blur}px)`;fc.drawImage(c,0,0);const pixels=fc.getImageData(0,0,w,h);for(let i=3;i<pixels.data.length;i+=4){if(pixels.data[i]>=253)pixels.data[i]=255;else if(pixels.data[i]<=2)pixels.data[i]=0;}fc.putImageData(pixels,0,0);return f;}
const crownMask=mask(c=>{c.moveTo(-100,-100);c.lineTo(1300,-100);c.lineTo(1300,330);c.lineTo(680,330);c.bezierCurveTo(590,345,490,315,420,318);c.bezierCurveTo(320,332,270,385,180,438);c.lineTo(-100,438)},8);
const cap=crownMask.getContext('2d');cap.fillStyle='white';cap.fillRect(0,0,w,170);
const body=make(),bc=body.getContext('2d');bc.drawImage(oldBody,0,0);
// Restore original face pixels before replacing only the crown and ear sockets.
bc.clearRect(0,0,w,500);bc.drawImage(base,0,0,w,500,0,0,w,500);
bc.globalCompositeOperation='destination-out';bc.drawImage(crownMask,0,0);
const patch=make(),pc=patch.getContext('2d');pc.drawImage(renderer.removeGreenScreen(repair),0,0,w,h);pc.globalCompositeOperation='destination-in';pc.drawImage(crownMask,0,0);
bc.globalCompositeOperation='lighter';bc.drawImage(patch,0,0);
// The crown begins below y=180; discard quantized alpha dust at the old ear tips.
bc.clearRect(0,0,w,170);
const masks={
 'ear-left-v2':mask(c=>{c.moveTo(-100,-100);c.lineTo(310,-100);c.lineTo(340,160);c.bezierCurveTo(365,235,387,275,401,315);c.bezierCurveTo(347,326,271,369,205,407);c.lineTo(-100,390)},7),
 'ear-right-v2':mask(c=>{c.moveTo(440,-100);c.lineTo(900,-100);c.lineTo(900,338);c.bezierCurveTo(650,362,550,318,425,322);c.bezierCurveTo(420,250,445,190,450,140)},7)
};
for(const [name,m] of Object.entries(masks)){const c=make(),ctx=c.getContext('2d');ctx.drawImage(base,0,0);ctx.globalCompositeOperation='destination-in';ctx.drawImage(m,0,0);fs.writeFileSync(new URL('assets/nuoji-'+name+'.png',root),c.toBuffer('image/png'));}
fs.writeFileSync(new URL('assets/nuoji-body-v3.png',root),body.toBuffer('image/png'));
console.log('Clean crown underpaint and complete ears baked.');
