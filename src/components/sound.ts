/* Optional ambient sound, synthesised with Web Audio (no audio files).
   A soft low-passed pad plus occasional chimes through a shimmering delay.
   Never starts without a tap. */
export class Ambient {
  on = false;
  private ctx?: AudioContext;
  private master?: GainNode;
  private bus?: GainNode;
  private timer = 0;

  private init() {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 0.4; lp.connect(master);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lfoAmt = ctx.createGain(); lfoAmt.gain.value = 320; lfo.connect(lfoAmt).connect(lp.frequency); lfo.start();
    for (const f of [110, 220, 277.18, 329.63, 493.88]) {
      for (const [type, det, g] of [['sine', 0, 0.06], ['triangle', 6, 0.025]] as const) {
        const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = det;
        const gn = ctx.createGain(); gn.gain.value = g; o.connect(gn).connect(lp); o.start();
      }
    }
    // chime bus with feedback delay
    const bus = ctx.createGain(); bus.gain.value = 0.5;
    const delay = ctx.createDelay(2); delay.delayTime.value = 0.42;
    const fb = ctx.createGain(); fb.gain.value = 0.45;
    const dl = ctx.createBiquadFilter(); dl.type = 'lowpass'; dl.frequency.value = 2600;
    bus.connect(master); bus.connect(delay); delay.connect(dl).connect(fb).connect(delay); dl.connect(master);
    this.ctx = ctx; this.master = master; this.bus = bus;
  }

  private chime() {
    if (!this.ctx || !this.bus || !this.on) return;
    const notes = [880, 987.77, 1108.73, 1318.51, 1479.98, 1760];
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(); o.type = 'sine'; o.frequency.value = notes[Math.floor(Math.random() * notes.length)];
    const g = this.ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.07, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    o.connect(g).connect(this.bus); o.start(t); o.stop(t + 2.7);
    this.timer = window.setTimeout(() => this.chime(), 2500 + Math.random() * 3500);
  }

  async toggle() {
    if (!this.ctx) this.init();
    const ctx = this.ctx!, m = this.master!;
    this.on = !this.on;
    if (this.on) {
      await ctx.resume();
      m.gain.cancelScheduledValues(ctx.currentTime);
      m.gain.setTargetAtTime(0.5, ctx.currentTime, 0.8);
      this.chime();
    } else {
      clearTimeout(this.timer);
      m.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
    }
    return this.on;
  }
}
