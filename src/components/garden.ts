import { IMG, ROSES } from '../config/content';
import { reduced } from '../animations/tween';

type Rose = { src: string; x: number; b: number; h: number; ar: number; op?: number; r?: number; hy?: number };
type Group = 'far' | 'edges' | 'cluster' | 'near';

const S = ROSES.stemAR, O = ROSES.openAR;
const FAR: Rose[] = [
  { src: ROSES.stemBlur, x: 8, b: 2, h: 40, ar: S, op: 0.55, r: -6, hy: 16 },
  { src: ROSES.stemBlur, x: 28, b: -5, h: 31, ar: S, op: 0.38, r: 4, hy: 16 },
  { src: ROSES.stemBlur, x: 50, b: -7, h: 35, ar: S, op: 0.32, r: -2, hy: 16 },
  { src: ROSES.stemBlur, x: 72, b: -4, h: 32, ar: S, op: 0.4, r: 5, hy: 16 },
  { src: ROSES.stemBlur, x: 93, b: 1, h: 42, ar: S, op: 0.55, r: 8, hy: 16 },
  { src: ROSES.openBlur, x: 10, b: 50, h: 8, ar: O, op: 0.22, hy: 50 },
  { src: ROSES.openBlur, x: 88, b: 56, h: 7, ar: O, op: 0.2, hy: 50 },
];
const MID: Rose[] = [
  { src: ROSES.stem, x: 1, b: -6, h: 56, ar: S, r: -11, hy: 16 },
  { src: ROSES.stem, x: 99, b: -4, h: 60, ar: S, r: 10, hy: 16 },
  { src: ROSES.stem, x: 21, b: -20, h: 42, ar: S, r: -5, op: 0.9, hy: 16 },
  { src: ROSES.stem, x: 80, b: -22, h: 44, ar: S, r: 6, op: 0.9, hy: 16 },
];
const CLUSTER: Rose[] = [
  { src: ROSES.open, x: 29, b: 10, h: 12, ar: O, r: -8, hy: 50 },
  { src: ROSES.open, x: 51, b: 5, h: 15, ar: O, hy: 50 },
  { src: ROSES.open, x: 73, b: 11, h: 11, ar: O, r: 9, hy: 50 },
];
const NEAR: Rose[] = [
  { src: ROSES.openBlur, x: -4, b: -9, h: 30, ar: O, op: 0.85, hy: 50 },
  { src: ROSES.openBlur, x: 104, b: -11, h: 32, ar: O, op: 0.85, hy: 50 },
];

/* The garden is a stack of photographic layers. Each layer moves by its
   depth `d`, which gives parallax and the "camera" dolly between scenes. */
export class Garden {
  cam = { z: 0, y: 0 };
  private layers: { el: HTMLElement; d: number }[] = [];
  private halos: { el: HTMLElement; g: Group }[] = [];
  private clusterRoses: HTMLElement[] = [];
  private cluster!: HTMLElement;
  private veil: HTMLElement;
  private par = { x: 0, y: 0 };
  private parT = { x: 0, y: 0 };

  constructor(root: HTMLElement) {
    root.innerHTML = '<div class="sky"></div><div class="moon"></div><div class="beam"></div>';
    this.addLayer(root, 'far', 0.15, FAR, 'far');
    this.addLayer(root, 'mid', 0.35, MID, 'edges');
    this.cluster = this.addLayer(root, 'cluster', 0.5, CLUSTER, 'cluster');
    this.addLayer(root, 'near', 0.9, NEAR, 'near');
    this.veil = document.createElement('div');
    this.veil.className = 'veil';
    root.append(this.veil);

    if (!reduced) {
      addEventListener('pointermove', (e) => {
        this.parT = { x: (e.clientX / innerWidth - 0.5) * 2, y: (e.clientY / innerHeight - 0.5) * 2 };
      }, { passive: true });
      addEventListener('deviceorientation', (e) => {
        if (e.gamma == null || e.beta == null) return;
        this.parT = { x: Math.max(-1, Math.min(1, e.gamma / 25)), y: Math.max(-1, Math.min(1, (e.beta - 45) / 25)) };
      }, { passive: true });
    }
  }

  private addLayer(root: HTMLElement, cls: string, d: number, list: Rose[], g: Group) {
    const L = document.createElement('div');
    L.className = `layer ${cls}`;
    for (const r of list) {
      const e = document.createElement('div');
      e.className = 'rose';
      e.style.cssText = `left:${r.x}%;bottom:${r.b}%;height:${r.h}vh;width:${(r.h * r.ar).toFixed(2)}vh;opacity:${r.op ?? 1};--r:${r.r ?? 0}deg;--hy:${r.hy ?? 20}%`;
      e.innerHTML = `<div class="halo"></div><img alt="" draggable="false" decoding="async" src="${IMG(r.src)}">`;
      L.append(e);
      this.halos.push({ el: e.firstElementChild as HTMLElement, g });
      if (g === 'cluster') this.clusterRoses.push(e);
    }
    root.append(L);
    this.layers.push({ el: L, d });
    return L;
  }

  setVeil(v: number, ms: number) {
    this.veil.style.transitionDuration = `${ms}ms`;
    this.veil.style.opacity = String(v);
  }

  setGlow(v: number, groups: Group[] | 'all' = 'all') {
    for (const h of this.halos) if (groups === 'all' || groups.includes(h.g)) h.el.style.opacity = String(v);
  }

  showCluster(on: boolean) { this.cluster.classList.toggle('on', on); }

  /** Screen point on top of a cluster flower, for butterflies to land on. */
  perch(i: number) {
    const r = this.clusterRoses[i % this.clusterRoses.length].getBoundingClientRect();
    return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.36 };
  }

  reset() {
    this.cam = { z: 0, y: 0 };
    this.setVeil(1, 0);
    this.setGlow(0);
    this.showCluster(false);
  }

  update(t: number, dt: number) {
    const k = Math.min(1, dt * 2.5);
    this.par.x += (this.parT.x - this.par.x) * k;
    this.par.y += (this.parT.y - this.par.y) * k;
    const dx = reduced ? 0 : Math.sin(t * 0.21) * 0.35, dy = reduced ? 0 : Math.cos(t * 0.17) * 0.25;
    for (const { el, d } of this.layers) {
      const x = -(this.par.x + dx) * 22 * d, y = -(this.par.y + dy) * 14 * d + this.cam.y * d;
      el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${(1 + this.cam.z * d).toFixed(4)})`;
    }
  }
}
