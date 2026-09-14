// Best-effort background audio; playing media does not guarantee page execution.
export class SilentPlayer {
    constructor(src, notify, createAudio = () => document.createElement('audio')) {
        this.audio = createAudio();
        this.audio.src = src;
        this.audio.loop = true;
        this.audio.preload = 'none';
        this.audio.setAttribute('playsinline', '');
        this.notify = notify;
        this.state = 'off';
        this.wanted = false;
        this.revision = 0;
        this.disposed = false;
        this.handlers = ['pause', 'ended', 'error', 'waiting', 'stalled'].map(type => {
            const handler = () => {
                if (this.wanted && !this.disposed) this.setState('interrupted');
            };
            this.audio.addEventListener(type, handler);
            return [type, handler];
        });
        const playing = () => {
            if (this.wanted && !this.disposed) this.setState('playing');
        };
        this.audio.addEventListener('playing', playing);
        this.handlers.push(['playing', playing]);
    }
    setState(state) {
        if (this.state === state) return;
        this.state = state;
        this.notify(state);
    }
    start() {
        if (this.disposed) return;
        this.wanted = true;
        const revision = ++this.revision;
        this.setState('starting');
        // Call play synchronously inside the user's second pointerup gesture.
        try {
            const result = this.audio.play();
            Promise.resolve(result).then(() => {
                if (revision === this.revision && this.wanted && !this.disposed) {
                    this.setState(this.audio.paused ? 'interrupted' : 'playing');
                }
            }, () => {
                if (revision === this.revision && this.wanted && !this.disposed) this.setState('interrupted');
            });
        } catch {
            this.setState('interrupted');
        }
    }
    toggle() {
        if (this.state === 'playing' || this.state === 'starting') this.stop();
        else this.start();
    }
    resume() {
        if (this.wanted && (this.audio.paused || this.state === 'interrupted')) this.start();
    }
    stop() {
        this.wanted = false;
        ++this.revision;
        this.audio.pause();
        this.setState('off');
    }
    destroy() {
        this.stop();
        this.disposed = true;
        for (const [type, handler] of this.handlers) this.audio.removeEventListener(type, handler);
        this.audio.removeAttribute('src');
        this.audio.load();
    }
}
