import type { Garden } from '../components/garden';
import type { Hero } from '../components/hero';
import type { FX } from '../components/fx';
import type { Flock } from '../components/butterfly';
import type { BloomBed } from '../components/bloombed';
import { scene1 } from './scene1-garden';
import { scene2 } from './scene2-journey';
import { scene3 } from './scene3-rose';
import { scene4 } from './scene4-butterflies';
import { scene5 } from './scene5-garden';

export interface Parts { garden: Garden; hero: Hero; fx: FX; flock: Flock; bed: BloomBed; ui: HTMLElement }
export interface Ctx extends Parts {
  W(): number; H(): number;
  alive(): boolean;
  sleep(ms: number): Promise<void>;
  sleepOrTap(ms: number, el: HTMLElement): Promise<void>;
  section(cls: string, html: string): HTMLElement;
  go(n: number): void;
  restart(): void;
}

export const show = (el: Element | null | undefined) => el?.classList.add('on');
export const hide = (el: Element | null | undefined) => el?.classList.remove('on');
/** Fill [data-t] elements with plain text (never innerHTML for content). */
export const fill = (root: HTMLElement, map: Record<string, string>) => {
  for (const [k, v] of Object.entries(map)) root.querySelectorAll(`[data-t="${k}"]`).forEach((e) => (e.textContent = v));
};

const SCENES = [scene1, scene2, scene3, scene4, scene5];

/* Runs one scene at a time. Every switch bumps `epoch`; pending sleeps from
   an older scene never resolve, so a replay can't be hijacked by old timers. */
export class Director {
  private epoch = 0;
  private cur: HTMLElement | null = null;
  constructor(private p: Parts) {}

  private ctx(): Ctx {
    const my = this.epoch;
    const alive = () => my === this.epoch;
    return {
      ...this.p,
      W: () => innerWidth,
      H: () => innerHeight,
      alive,
      sleep: (ms) => new Promise((r) => setTimeout(() => alive() && r(), ms)),
      sleepOrTap: (ms, el) => new Promise((r) => {
        let done = false;
        const fin = () => {
          if (done) return; done = true;
          el.removeEventListener('pointerdown', fin);
          if (alive()) r();
        };
        setTimeout(fin, ms);
        el.addEventListener('pointerdown', fin);
      }),
      section: (cls, html) => {
        const s = document.createElement('section');
        s.className = `scene ${cls}`;
        s.innerHTML = html;
        this.p.ui.append(s);
        this.cur = s;
        requestAnimationFrame(() => requestAnimationFrame(() => s.classList.add('on')));
        return s;
      },
      go: (n) => this.go(n),
      restart: () => this.restart(),
    };
  }

  go(n: number) {
    this.epoch++;
    const old = this.cur;
    if (old) { old.classList.remove('on'); old.classList.add('leaving'); setTimeout(() => old.remove(), 1000); }
    document.body.dataset.scene = String(n);
    void SCENES[n - 1](this.ctx());
  }

  start(n: number) {
    if (n >= 4) this.p.hero.setBloomed();
    this.go(n);
  }

  restart() {
    this.p.flock.clearNow();
    this.p.fx.clear();
    this.p.hero.reset();
    this.p.garden.reset();
    this.p.bed.reset();
    this.go(1);
  }
}
