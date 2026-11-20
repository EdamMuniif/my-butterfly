import { IMG, ROSES } from '../config/content';
import { haptic, reduced } from '../animations/tween';
import type { FX } from './fx';

/* The finale garden: rows of real roses that open together on a loop.
   Touching one makes it bloom straight away and stay open for a moment.
   Bud -> bloom is a crossfade between the two photos with a small
   counter-rotation; only opacity and transform animate, so it stays
   smooth on phones even with ten roses moving at once. */

type Spot = { x: number; b: number; h: number; r: number; row: 'back' | 'mid' | 'front' };
const SPOTS: Spot[] = [
  { x: 14, b: 40, h: 17, r: -7, row: 'back' }, { x: 38, b: 42, h: 16, r: 4, row: 'back' },
  { x: 62, b: 41, h: 17, r: -3, row: 'back' }, { x: 86, b: 39, h: 16, r: 8, row: 'back' },
  { x: 26, b: 22, h: 23, r: -9, row: 'mid' }, { x: 50, b: 25, h: 22, r: 2, row: 'mid' }, { x: 74, b: 21, h: 23, r: 8, row: 'mid' },
  { x: 18, b: -6, h: 30, r: -6, row: 'front' }, { x: 50, b: -9, h: 31, r: 1, row: 'front' }, { x: 82, b: -6, h: 30, r: 7, row: 'front' },
];

const OPEN_FOR = 6.2, CYCLE = 11; // seconds open, full loop length

interface Rose { el: HTMLElement; head: HTMLElement; open: HTMLElement; glow: HTMLElement; p: number; pin: number; fast: boolean; delay: number }

const smooth = (t: number) => t * t * (3 - 2 * t);

export class BloomBed {
  private roses: Rose[] = [];
  private running = false;
  private t0 = 0;
  private now = 0;
  private lastC = CYCLE;

  constructor(private root: HTMLElement, private fx: FX) {
    const ob = ROSES.openBox, sp = ROSES.openSpiral;
    SPOTS.forEach((s, i) => {
      const el = document.createElement('div');
      el.className = `bl ${s.row}`;
      el.style.cssText = `left:${s.x}%;bottom:${s.b}%;--h:${s.h}vh;--r:${s.r}deg;transition-delay:${i * 90}ms`;
      el.innerHTML = `
        <div class="glow"></div>
        <img class="stem" alt="" draggable="false" src="${IMG(ROSES.stem)}">
        <img class="head" alt="" draggable="false" src="${IMG(ROSES.stem)}">
        <div class="ow" style="left:${ob.left}%;top:${ob.top}%;width:${ob.width}%;transform-origin:${sp.x}% ${sp.y}%"><img alt="" draggable="false" src="${IMG(ROSES.open)}"></div>
        <button class="tap" type="button" aria-label="Make this rose bloom"></button>`;
      root.append(el);
      const r: Rose = { el, head: el.querySelector('.head')!, open: el.querySelector('.ow')!, glow: el.querySelector('.glow')!, p: 0, pin: 0, fast: false, delay: Math.random() * 0.45 };
      el.querySelector('.tap')!.addEventListener('pointerdown', (e) => { e.preventDefault(); this.touch(r); });
      this.roses.push(r);
      this.render(r);
    });
  }

  show(on: boolean) { this.root.classList.toggle('on', on); }
  start() { this.running = true; this.t0 = this.now; this.lastC = CYCLE; }

  /** Screen position of a rose head, for butterflies to visit. */
  head(i: number) {
    const r = this.roses[i % this.roses.length].el.getBoundingClientRect();
    return { x: r.left + r.width * 0.46, y: r.top + r.height * 0.15 };
  }
  get count() { return this.roses.length; }

  private touch(r: Rose) {
    if (!this.root.classList.contains('on')) return;
    r.pin = this.now + 5;
    r.fast = true;
    const b = r.head.getBoundingClientRect();
    this.fx.burstPetals(b.left + b.width * 0.46, b.top + b.height * 0.15, reduced ? 5 : 12);
    haptic(14);
  }

  reset() {
    this.show(false);
    this.running = false;
    for (const r of this.roses) { r.p = 0; r.pin = 0; r.fast = false; this.render(r); }
  }

  private render(r: Rose) {
    const e = smooth(Math.min(1, Math.max(0, r.p)));
    r.open.style.opacity = String(Math.min(1, e * 1.4).toFixed(3));
    r.open.style.transform = `scale(${(0.7 + 0.3 * e).toFixed(4)}) rotate(${(-16 * (1 - e)).toFixed(2)}deg)`;
    r.head.style.opacity = String(Math.max(0, 1 - e * 1.6).toFixed(3));
    r.glow.style.opacity = String((e * 0.85).toFixed(3));
  }

  update(t: number, dt: number) {
    this.now = t;
    if (!this.running) return;
    const c = (t - this.t0) % CYCLE;
    if (c < this.lastC) this.fx.risePetals(reduced ? 4 : 12, 2500); // a new bloom wave
    this.lastC = c;
    for (const r of this.roses) {
      const ct = c - r.delay;
      const want = t < r.pin || (ct >= 0 && ct < OPEN_FOR) ? 1 : 0;
      const rate = want ? (r.fast ? 1 / 0.8 : 1 / 2.4) : 1 / 1.7;
      const prev = r.p;
      r.p += Math.sign(want - r.p) * Math.min(Math.abs(want - r.p), rate * dt);
      if (r.p >= 1) r.fast = false;
      if (r.p !== prev) this.render(r);
    }
  }
}
