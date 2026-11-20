import { reduced } from '../animations/tween';
import type { V } from '../animations/flight';

interface Fly { x: number; y: number; a: number; sp: number; p: number; s: number }
interface Bok { x: number; y: number; r: number; vy: number; gold: boolean; a: number; p: number }
interface Pet { x: number; y: number; vx: number; vy: number; rot: number; vr: number; s: number; life: number; max: number; rise: boolean }
interface Spark { x: number; y: number; vx: number; vy: number; life: number; max: number; s: number }
interface HP { sx: number; sy: number; tx: number; ty: number; s: number; p: number }

const sprite = (size: number, draw: (c: CanvasRenderingContext2D, s: number) => void) => {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d')!, size);
  return c;
};
const radial = (stops: [number, string][]) => (c: CanvasRenderingContext2D, s: number) => {
  const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  c.fillStyle = g; c.fillRect(0, 0, s, s);
};
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/* One full-screen canvas for everything made of light:
   fireflies, bokeh, glowing petals, the light trail and the heart. */
export class FX {
  private ctx: CanvasRenderingContext2D;
  private W = 0; private H = 0;
  private flies: Fly[] = [];
  private bokeh: Bok[] = [];
  private petals: Pet[] = [];
  private sparks: Spark[] = [];
  private alpha = { fireflies: { cur: 0, to: 0, rate: 1 }, bokeh: { cur: 0, to: 0, rate: 1 } };
  private trail: { from: () => V; to: () => V; u: number } | null = null;
  private heart: { t: number; parts: HP[]; cx: number; cy: number; size: number } | null = null;

  private gold = sprite(64, radial([[0, 'rgba(255,240,210,1)'], [0.18, 'rgba(233,201,152,.75)'], [0.45, 'rgba(233,201,152,.12)'], [1, 'rgba(233,201,152,0)']]));
  private blue = sprite(64, radial([[0, 'rgba(240,250,255,1)'], [0.2, 'rgba(155,217,255,.8)'], [0.5, 'rgba(40,100,197,.18)'], [1, 'rgba(40,100,197,0)']]));
  private bokGold = sprite(128, radial([[0, 'rgba(233,201,152,.9)'], [0.72, 'rgba(233,201,152,.55)'], [1, 'rgba(233,201,152,0)']]));
  private bokBlue = sprite(128, radial([[0, 'rgba(155,217,255,.9)'], [0.72, 'rgba(155,217,255,.5)'], [1, 'rgba(155,217,255,0)']]));
  private petal = sprite(64, (c, s) => {
    c.translate(s / 2, s / 2);
    const g = c.createLinearGradient(0, -s * 0.4, 0, s * 0.4);
    g.addColorStop(0, 'rgba(236,248,255,.95)'); g.addColorStop(0.55, 'rgba(155,217,255,.85)'); g.addColorStop(1, 'rgba(40,100,197,.75)');
    c.shadowColor = 'rgba(155,217,255,.9)'; c.shadowBlur = 8;
    c.beginPath(); c.moveTo(0, s * 0.36);
    c.bezierCurveTo(-s * 0.36, s * 0.1, -s * 0.28, -s * 0.36, 0, -s * 0.3);
    c.bezierCurveTo(s * 0.28, -s * 0.36, s * 0.36, s * 0.1, 0, s * 0.36);
    c.fillStyle = g; c.fill();
  });

  constructor(private cv: HTMLCanvasElement) {
    this.ctx = cv.getContext('2d')!;
    addEventListener('resize', () => this.resize());
    this.resize();
    const nf = reduced ? 12 : 34;
    for (let i = 0; i < nf; i++) this.flies.push({ x: rnd(0, this.W), y: rnd(this.H * 0.15, this.H), a: rnd(0, 6.28), sp: rnd(8, 22), p: rnd(0, 9), s: rnd(14, 30) });
    const nb = reduced ? 6 : 16;
    for (let i = 0; i < nb; i++) this.bokeh.push({ x: rnd(0, this.W), y: rnd(0, this.H), r: rnd(18, 70), vy: rnd(-6, -2), gold: Math.random() < 0.55, a: rnd(0.05, 0.13), p: rnd(0, 9) });
  }

  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.W = innerWidth; this.H = innerHeight;
    this.cv.width = this.W * dpr; this.cv.height = this.H * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  fade(k: 'fireflies' | 'bokeh', to: number, ms: number) {
    const a = this.alpha[k];
    a.to = to; a.rate = ms <= 0 ? 1e9 : Math.abs(to - a.cur) / (ms / 1000) || 1;
  }

  trailOn(from: () => V, to: () => V) { this.trail = { from, to, u: 0 }; }
  trailOff() { this.trail = null; }

  burstPetals(x: number, y: number, n: number) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, 6.28), v = rnd(60, 230);
      this.petals.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, rot: rnd(0, 6.28), vr: rnd(-2, 2), s: rnd(10, 22), life: 0, max: rnd(3.2, 5.5), rise: false });
    }
  }

  risePetals(n: number, overMs: number) {
    for (let i = 0; i < n; i++) {
      setTimeout(() => this.petals.push({ x: rnd(0, this.W), y: this.H + 20, vx: rnd(-14, 14), vy: rnd(-95, -45), rot: rnd(0, 6.28), vr: rnd(-1.5, 1.5), s: rnd(10, 24), life: 0, max: rnd(7, 11), rise: true }), Math.random() * overMs);
    }
  }

  showHeart(cx: number, cy: number, size: number) {
    const N = reduced ? 70 : 150, sc = size / 34, parts: HP[] = [];
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      const hx = 16 * Math.sin(t) ** 3;
      const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      parts.push({ sx: cx + rnd(-size, size), sy: cy + rnd(-size, size), tx: cx + hx * sc, ty: cy + hy * sc + size * 0.05, s: rnd(9, 17), p: rnd(0, 6.28) });
    }
    this.heart = { t: 0, parts, cx, cy, size };
  }

  clear() { this.petals = []; this.sparks = []; this.trail = null; this.heart = null; }

  frame(t: number, dt: number) {
    const c = this.ctx, W = this.W, H = this.H;
    for (const a of Object.values(this.alpha)) {
      const d = a.to - a.cur, step = a.rate * dt;
      a.cur = Math.abs(d) <= step ? a.to : a.cur + Math.sign(d) * step;
    }
    c.clearRect(0, 0, W, H);

    // bokeh
    const ba = this.alpha.bokeh.cur;
    if (ba > 0) {
      for (const b of this.bokeh) {
        b.y += b.vy * dt; if (b.y < -b.r) { b.y = H + b.r; b.x = rnd(0, W); }
        c.globalAlpha = ba * b.a * (0.75 + 0.25 * Math.sin(t * 0.5 + b.p));
        c.drawImage(b.gold ? this.bokGold : this.bokBlue, b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
      }
    }
    c.globalCompositeOperation = 'lighter';

    // fireflies
    const fa = this.alpha.fireflies.cur;
    if (fa > 0) {
      for (const f of this.flies) {
        f.a += Math.sin(t * 0.7 + f.p) * 1.1 * dt;
        f.x += Math.cos(f.a) * f.sp * dt; f.y += Math.sin(f.a) * f.sp * dt;
        if (f.x < -30) f.x = W + 30; if (f.x > W + 30) f.x = -30;
        if (f.y < -30) f.y = H + 30; if (f.y > H + 30) f.y = -30;
        const blink = Math.pow(0.5 + 0.5 * Math.sin(t * (1.1 + (f.p % 1)) + f.p), 3);
        c.globalAlpha = fa * (0.15 + 0.85 * blink);
        c.drawImage(this.gold, f.x - f.s / 2, f.y - f.s / 2, f.s, f.s);
      }
    }

    // light trail
    if (this.trail) {
      const tr = this.trail, a = tr.from(), b = tr.to();
      tr.u = (tr.u + dt * 0.42) % 1;
      const cx = (a.x + b.x) / 2 - (b.y - a.y) * 0.3, cy = (a.y + b.y) / 2 + (b.x - a.x) * 0.15;
      const u = tr.u, iu = 1 - u;
      const hx = iu * iu * a.x + 2 * iu * u * cx + u * u * b.x, hy = iu * iu * a.y + 2 * iu * u * cy + u * u * b.y;
      for (let i = 0; i < (reduced ? 1 : 3); i++) this.sparks.push({ x: hx + rnd(-3, 3), y: hy + rnd(-3, 3), vx: rnd(-8, 8), vy: rnd(-12, 4), life: 0, max: rnd(0.9, 1.6), s: rnd(8, 16) });
      c.globalAlpha = 0.9; c.drawImage(this.blue, hx - 14, hy - 14, 28, 28);
    }
    this.sparks = this.sparks.filter((s) => (s.life += dt) < s.max);
    for (const s of this.sparks) {
      s.x += s.vx * dt; s.y += s.vy * dt;
      c.globalAlpha = 1 - s.life / s.max;
      c.drawImage(this.blue, s.x - s.s / 2, s.y - s.s / 2, s.s, s.s);
    }

    // petals
    c.globalCompositeOperation = 'source-over';
    this.petals = this.petals.filter((p) => (p.life += dt) < p.max && p.y > -60);
    for (const p of this.petals) {
      if (p.rise) { p.x += (p.vx + Math.sin(t * 1.2 + p.rot) * 18) * dt; p.y += p.vy * dt; }
      else { p.vx *= 1 - 0.9 * dt; p.vy = p.vy * (1 - 0.9 * dt) + 14 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
      p.rot += p.vr * dt;
      c.globalAlpha = Math.min(1, p.life * 3, (p.max - p.life) / 1.2) * 0.9;
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.drawImage(this.petal, -p.s / 2, -p.s / 2, p.s, p.s); c.restore();
    }

    // heart of light
    if (this.heart) {
      const h = this.heart; h.t += dt;
      const gather = Math.min(1, h.t / 1.7), e = 1 - Math.pow(1 - gather, 3);
      const fadeA = h.t < 4.6 ? 1 : Math.max(0, 1 - (h.t - 4.6) / 1.6);
      if (fadeA <= 0) this.heart = null;
      else {
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = 0.35 * e * fadeA;
        const R = h.size * 1.1;
        c.drawImage(this.blue, h.cx - R, h.cy - R, R * 2, R * 2);
        const pulse = 1 + 0.12 * Math.sin(h.t * 4);
        for (const p of h.parts) {
          const x = p.sx + (p.tx - p.sx) * e, y = p.sy + (p.ty - p.sy) * e;
          c.globalAlpha = fadeA * (0.55 + 0.45 * Math.sin(h.t * 3 + p.p)) * Math.min(1, h.t * 2);
          const s = p.s * pulse;
          c.drawImage(this.blue, x - s / 2, y - s / 2, s, s);
        }
      }
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  }
}
