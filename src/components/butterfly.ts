import { BUTTERFLIES, IMG, type BfKind } from '../config/content';
import { steer, type FlightState, type Target } from '../animations/flight';

export interface BfOpts { x: number; y: number; w: number; max?: number; flap?: number; target: Target; tag?: string }

/* A photographic butterfly sprite split down the body line into two wing
   halves. Each half hinges on the body with a 3D rotateY, which gives a
   real wing-beat silhouette instead of a flat squash. */
export class Butterfly {
  el: HTMLDivElement;
  st: FlightState;
  target: Target;
  max: number;
  tag: string;
  dead = false;
  exitOnArrive = false;
  perch = false;
  resting = false;
  flutter = 1;
  onTap?: () => void;

  constructor(parent: HTMLElement, kind: BfKind, o: BfOpts) {
    const spec = BUTTERFLIES[kind];
    const el = document.createElement('div');
    el.className = 'bf';
    el.style.setProperty('--w', `${o.w}px`);
    el.style.setProperty('--h', `${o.w * spec.ar}px`);
    el.style.setProperty('--img', `url("${IMG(spec.src)}")`);
    el.style.setProperty('--flap', `${o.flap ?? 0.24 + Math.random() * 0.1}s`);
    el.innerHTML = '<div class="halo"></div><div class="rig"><div class="wing l"></div><div class="wing r"></div></div>';
    el.addEventListener('pointerdown', (e) => {
      if (this.onTap && el.classList.contains('tap')) { e.preventDefault(); this.onTap(); }
    });
    parent.append(el);
    this.el = el;
    this.st = { x: o.x, y: o.y, vx: 0, vy: 0, heading: 0, p: Math.random() * 10 };
    this.target = o.target;
    this.max = o.max ?? 120;
    this.tag = o.tag ?? '';
  }

  update(t: number, dt: number) {
    const tg = this.target(t);
    const s = this.st;
    if (this.perch) {
      const d = Math.hypot(tg.x - s.x, tg.y - s.y);
      if (!this.resting && d < 16) { this.resting = true; this.el.classList.add('rest'); }
      if (this.resting) {
        const k = Math.min(1, dt * 4);
        s.x += (tg.x - s.x) * k; s.y += (tg.y - s.y) * k;
        s.heading += (-0.2 - s.heading) * Math.min(1, dt * 2);
        s.vx = s.vy = 0;
        return;
      }
    }
    steer(s, tg.x, tg.y, dt, t, { k: 1.6, c: 1.5, max: this.max, flutter: this.perch ? 0.25 : this.flutter });
    if (this.exitOnArrive && Math.hypot(tg.x - s.x, tg.y - s.y) < 50) this.remove();
  }

  render(t: number) {
    const s = this.st;
    const bob = this.resting ? 0 : Math.sin(t * 13 + s.p) * 1.6;
    this.el.style.transform = `translate3d(${s.x.toFixed(1)}px,${(s.y + bob).toFixed(1)}px,0) rotate(${s.heading.toFixed(3)}rad)`;
  }

  setGlow(v: number) { this.el.style.setProperty('--glow', String(v)); }
  setTappable(on: boolean) { this.el.classList.toggle('tap', on); }
  unrest() { this.perch = false; this.resting = false; this.el.classList.remove('rest'); }

  exit() {
    const s = this.st;
    const toX = s.x < innerWidth / 2 ? -160 : innerWidth + 160;
    const toY = s.y - 120;
    this.unrest();
    this.target = () => ({ x: toX, y: toY });
    this.max = Math.max(this.max, 190);
    this.exitOnArrive = true;
  }

  remove() { this.dead = true; this.el.remove(); }
}

export class Flock {
  list: Butterfly[] = [];
  constructor(private layer: HTMLElement) {}

  spawn(kind: BfKind, o: BfOpts) {
    const b = new Butterfly(this.layer, kind, o);
    b.render(0);
    this.list.push(b);
    return b;
  }

  update(t: number, dt: number) {
    for (const b of this.list) { b.update(t, dt); if (!b.dead) b.render(t); }
    this.list = this.list.filter((b) => !b.dead);
  }

  tagged(tag: string) { return this.list.filter((b) => b.tag === tag); }
  dismiss(keep: Butterfly[] = []) { for (const b of this.list) if (!keep.includes(b)) b.exit(); }
  clearNow() { this.list.forEach((b) => b.remove()); this.list = []; }
}
