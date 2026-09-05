import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const url=new URL('../pet-renderer.js',import.meta.url);
const source=(await readFile(url,'utf8')).replaceAll('import.meta.url',JSON.stringify(url.href));
const {getListeningPose:listen,getWavePose:greet,getNuzzlePoint:point,WAVE_DURATION_MS}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
let previous;
for(let i=0;i<=WAVE_DURATION_MS;i+=10){
 const pose=greet(i/1000);
 for(const [x,y] of [[150,310],[180,370],[210,460],[275,460]])assert.deepEqual(point(x,y,pose),{x,y},'legs and paws pinned');
 const a=point(140,150,pose),b=point(200,130,pose);
 assert.ok(Math.abs(Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(60,20))<1e-9,'face stays rigid');
 if(previous){assert.ok(Math.abs(pose.lean-previous.lean)<.004,'smooth tilt');assert.ok(Math.abs(pose.close-previous.close)<.10,'smooth eyelid');}
 previous=pose;
 assert.ok(pose.close>=0 && pose.close<=1);
}
for(const t of [0,WAVE_DURATION_MS/1000,5]){assert.ok(Math.abs(greet(t).lean)<1e-12);assert.equal(greet(t).close,0);}
assert.equal(greet(.6).close,0,'tilt before wink');assert.equal(greet(1).close,1,'hold wink');assert.equal(greet(1.6).close,0,'reopen before returning');
assert.ok(Math.abs(greet(1.6).lean)>.09);
assert.deepEqual(greet(0,true),greet(9,true));
assert.deepEqual(listen(0,true),listen(9,true));
assert.ok(Math.abs(listen(.8).left-listen(.35).left)>.2);
assert.ok(Math.abs(listen(1.925).right-listen(1.45).right)>.2);
console.log('PASS: tilt/wink/reopen/return, rigid face, fully stationary legs and paws, reduced motion and approved ears.');
