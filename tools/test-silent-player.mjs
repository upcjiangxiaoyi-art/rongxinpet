import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../silent-player.js', import.meta.url), 'utf8');
const { SilentPlayer } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
class AudioMock extends EventTarget {
    paused = true;
    calls = 0;
    setAttribute() {}
    removeAttribute() { this.src = ''; }
    load() {}
    play() {
        this.calls++;
        this.paused = false;
        return new Promise((resolve, reject) => { this.resolve = resolve; this.reject = reject; });
    }
    pause() { this.paused = true; this.dispatchEvent(new Event('pause')); }
}
const audio = new AudioMock();
const states = [];
const p = new SilentPlayer('silence.wav', s => states.push(s), () => audio);
assert.equal(audio.calls, 0, 'no autoplay at initialization');
p.toggle();
assert.equal(audio.calls, 1, 'play called synchronously in gesture');
p.toggle(); audio.resolve(); await Promise.resolve();
assert.equal(p.state, 'off', 'late play completion cannot reactivate stopped player');
p.toggle(); audio.reject(new Error('NotAllowedError')); await Promise.resolve();
assert.equal(p.state, 'interrupted');
p.toggle(); audio.resolve(); await Promise.resolve();
assert.equal(p.state, 'playing');
audio.pause(); assert.equal(p.state, 'interrupted');
p.resume(); audio.resolve(); await Promise.resolve(); assert.equal(p.state, 'playing');
p.stop(); p.resume(); assert.equal(p.state, 'off', 'returning does not enable deliberately stopped audio');
p.start(); const done = audio.resolve; p.destroy(); done(); await Promise.resolve();
assert.equal(p.state, 'off'); assert.equal(audio.src, '');
audio.dispatchEvent(new Event('playing')); assert.equal(p.state, 'off');
assert.equal(audio.paused, true);
const wav = await readFile(new URL('../assets/silence.wav', import.meta.url));
assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
assert.ok(wav.subarray(44).every(x => x === 128), '8-bit PCM silence has midpoint samples');
console.log('PASS: gesture start, stop race, rejection/retry, interruption/resume, cleanup and silent asset.');
