export class SoundManager {
  private ctx: AudioContext | null = null;
  private bgGain: GainNode | null = null;
  private bgOsc1: OscillatorNode | null = null;
  private enabled = true;
  private volume = 0.5;

  private ensureCtx() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new Ctx();
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) this.stopBackground();
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.bgGain) this.bgGain.gain.value = this.volume * 0.06;
  }

  resume() {
    this.ensureCtx();
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  startBackground() {
    if (!this.enabled) return;
    this.ensureCtx();
    if (!this.ctx) return;
    if (this.bgOsc1) return; // already running

    this.bgGain = this.ctx.createGain();
    this.bgGain.gain.value = this.volume * 0.06; // subtle
    this.bgGain.connect(this.ctx.destination);

    this.bgOsc1 = this.ctx.createOscillator();
    this.bgOsc1.type = "sine";
    this.bgOsc1.frequency.value = 40; // low hum
    this.bgOsc1.connect(this.bgGain);

    // slight detuned second oscillator for richness
    const osc2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    g2.gain.value = this.volume * 0.02;
    osc2.type = "sine";
    osc2.frequency.value = 43;
    osc2.connect(g2);
    g2.connect(this.bgGain);

    this.bgOsc1.start();
    osc2.start();
    // keep reference to second oscillator by attaching to bgOsc1 (cleanup uses stopBackground)
    (this.bgOsc1 as any)._extra = osc2;
  }

  stopBackground() {
    if (!this.ctx || !this.bgOsc1) return;
    try {
      (this.bgOsc1 as any)._extra?.stop();
      this.bgOsc1.stop();
    } catch (e) { }
    this.bgOsc1.disconnect();
    this.bgGain?.disconnect();
    this.bgOsc1 = null;
    this.bgGain = null;
  }

  playPass() {
    if (!this.enabled) return;
    this.ensureCtx();
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(700, t0);
    o.frequency.exponentialRampToValueAtTime(1400, t0 + 0.12);
    g.gain.setValueAtTime(this.volume * 0.18, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t0);
    o.stop(t0 + 0.2);
  }

  playHit() {
    if (!this.enabled) return;
    this.ensureCtx();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.02));
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    g.gain.value = this.volume * 0.25;
    src.connect(g);
    g.connect(ctx.destination);
    src.start();
  }
}

export default SoundManager;
