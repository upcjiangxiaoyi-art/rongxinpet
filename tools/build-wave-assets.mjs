// Offline asset build. Requires @napi-rs/canvas; not loaded by SillyTavern.
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {createCanvas,loadImage}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES
 ? process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas' : '@napi-rs/canvas');
const root=new URL('../',import.meta.url);
const source=fs.readFileSync(new URL('pet-renderer.js',root),'utf8').replaceAll('import.meta.url',JSON.stringify(new URL('pet-renderer.js',root).href));
const {RongxinRenderer}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
globalThis.document={createElement:()=>createCanvas(1,1)};
const renderer=Object.create(RongxinRenderer.prototype);
const bodyImage=await loadImage(new URL('assets/rongxin-body-v3.png',root).pathname);
const repair=await loadImage(new URL('assets/rongxin-wave-repair-green-v1.png',root).pathname);
const width=1185,height=1327,make=()=>createCanvas(width,height);
function outline(ctx){
 ctx.beginPath();ctx.moveTo(338,668);ctx.bezierCurveTo(375,640,435,660,462,720);
 ctx.bezierCurveTo(467,804,458,875,448,960);ctx.bezierCurveTo(445,1065,452,1145,465,1195);
 ctx.bezierCurveTo(475,1260,363,1264,379,1190);ctx.bezierCurveTo(385,1125,370,1050,359,958);
 ctx.bezierCurveTo(349,871,328,801,323,740);ctx.closePath();
}
const mask=make(),mc=mask.getContext('2d');outline(mc);mc.fillStyle='#fff';mc.fill();
const feather=make(),fc=feather.getContext('2d');fc.filter='blur(3px)';fc.drawImage(mask,0,0);
const limb=make(),lc=limb.getContext('2d');lc.drawImage(bodyImage,0,0,width,height);
lc.globalCompositeOperation='destination-in';lc.drawImage(feather,0,0);
const gradient=lc.createLinearGradient(0,658,0,768);gradient.addColorStop(0,'transparent');gradient.addColorStop(1,'white');
lc.fillStyle=gradient;lc.fillRect(0,0,width,height);
const repairMask=make(),rc=repairMask.getContext('2d');rc.fillStyle='white';rc.beginPath();
rc.moveTo(295,660);rc.bezierCurveTo(365,630,485,640,505,750);
rc.bezierCurveTo(516,890,505,1035,487,1130);rc.lineTo(487,1255);rc.lineTo(365,1255);
rc.bezierCurveTo(340,1150,285,1045,275,935);rc.bezierCurveTo(255,825,270,740,295,660);rc.closePath();rc.fill();
const repairFeather=make(),rf=repairFeather.getContext('2d');rf.filter='blur(13px)';rf.drawImage(repairMask,0,0);
const patch=make(),pc=patch.getContext('2d');pc.drawImage(renderer.removeGreenScreen(repair),0,0,width,height);
pc.globalCompositeOperation='destination-in';pc.drawImage(repairFeather,0,0);
const body=make(),bc=body.getContext('2d');bc.drawImage(bodyImage,0,0,width,height);
bc.globalCompositeOperation='destination-out';bc.drawImage(repairFeather,0,0);
bc.globalCompositeOperation='lighter';bc.drawImage(patch,0,0);
fs.writeFileSync(new URL('assets/rongxin-wave-body-v3.png',root),body.toBuffer('image/png'));
fs.writeFileSync(new URL('assets/rongxin-wave-leg-v1.png',root),limb.toBuffer('image/png'));
console.log('Wave body and foreground limb baked; all original assets preserved.');
// A purpose-painted folded forearm supplies the foreshortened fur and relaxed wrist.
const raised=await loadImage(new URL('assets/rongxin-raised-paw-green-v1.png',root).pathname);
const raisedMask=make(),rm=raisedMask.getContext('2d');rm.fillStyle='white';rm.beginPath();
rm.moveTo(252,610);rm.bezierCurveTo(275,565,317,548,363,574);
rm.bezierCurveTo(405,586,433,621,433,655);rm.bezierCurveTo(430,686,405,694,402,727);
rm.bezierCurveTo(416,771,397,820,355,840);rm.bezierCurveTo(302,831,265,802,248,740);rm.closePath();rm.fill();
const softRaisedMask=make(),sm=softRaisedMask.getContext('2d');sm.filter='blur(3px)';sm.drawImage(raisedMask,0,0);
const forearm=make(),fa=forearm.getContext('2d');fa.drawImage(renderer.removeGreenScreen(raised),0,0,width,height);fa.globalCompositeOperation='destination-in';fa.drawImage(softRaisedMask,0,0);
const rootFade=fa.createLinearGradient(0,795,0,842);rootFade.addColorStop(0,'white');rootFade.addColorStop(1,'transparent');fa.fillStyle=rootFade;fa.fillRect(0,0,width,height);
fs.writeFileSync(new URL('assets/rongxin-wave-folded-v1.png',root),forearm.toBuffer('image/png'));
for(const [name,upper] of [['upper',true],['lower',false]]){
 const c=make(),ctx=c.getContext('2d');ctx.drawImage(limb,0,0);
 const fade=ctx.createLinearGradient(0,930,0,990);
 fade.addColorStop(0,upper?'white':'transparent');fade.addColorStop(1,upper?'transparent':'white');
 ctx.globalCompositeOperation='destination-in';ctx.fillStyle=fade;ctx.fillRect(0,0,width,height);
 fs.writeFileSync(new URL('assets/rongxin-wave-'+name+'-v1.png',root),c.toBuffer('image/png'));
}

// A paw is a single rigid piece. Neither forearm texture contains any toes.
const paw=make(),pw=paw.getContext('2d');pw.drawImage(limb,0,0);
pw.globalCompositeOperation='destination-in';const pf=pw.createLinearGradient(0,1148,0,1190);pf.addColorStop(0,'transparent');pf.addColorStop(1,'white');pw.fillStyle=pf;pw.fillRect(0,0,width,height);
const roundPaw=make(),rp=roundPaw.getContext('2d');rp.fillStyle='white';rp.beginPath();rp.ellipse(420,1210,53,42,0,0,Math.PI*2);rp.fill();
pw.drawImage(roundPaw,0,0);
fs.writeFileSync(new URL('assets/rongxin-wave-paw-v1.png',root),paw.toBuffer('image/png'));
const shaft=make(),sc=shaft.getContext('2d');sc.drawImage(limb,0,0);sc.globalCompositeOperation='destination-in';
const sf=sc.createLinearGradient(0,1148,0,1190);sf.addColorStop(0,'white');sf.addColorStop(1,'transparent');sc.fillStyle=sf;sc.fillRect(0,0,width,height);
const ef=sc.createLinearGradient(0,925,0,985);ef.addColorStop(0,'transparent');ef.addColorStop(1,'white');sc.fillStyle=ef;sc.fillRect(0,0,width,height);
fs.writeFileSync(new URL('assets/rongxin-wave-shaft-v1.png',root),shaft.toBuffer('image/png'));
const cuff=make(),cf=cuff.getContext('2d');cf.drawImage(forearm,0,0);cf.globalCompositeOperation='destination-in';
cf.globalCompositeOperation='destination-out';cf.fillStyle='white';cf.beginPath();cf.ellipse(378,625,79,72,0,0,Math.PI*2);cf.fill();cf.globalCompositeOperation='source-over';cf.clearRect(0,0,width,640);
fs.writeFileSync(new URL('assets/rongxin-wave-cuff-v1.png',root),cuff.toBuffer('image/png'));
