import { IMG, ROSES } from '../config/content';
import { ease, tween } from '../animations/tween';

type State = 'hidden' | 'center' | 'top';

/* The blue rose. Closed state is the stemmed half-open rose. Blooming
   crossfades the head into the fully open rose with a radial unfurl from
   the spiral outward plus a small counter-rotation. It is an honest
   reveal between two real photographs, not a petal simulation. */
export class Hero {
  bloomed = false;
  private wrap: HTMLElement;
  private stem: HTMLImageElement;
  private open: HTMLElement;
  private hit: HTMLButtonElement;
  private onTouch: (() => void) | null = null;

  constructor(private el: HTMLElement) {
    const b = ROSES.openBox, sp = ROSES.openSpiral, ss = ROSES.stemSpiral;
    el.dataset.state = 'hidden';
    el.innerHTML = `
      <div class="moonlight"></div>
      <div class="stemwrap" style="--sx:${ss.x}%;--sy:${ss.y}%">
        <div class="aura"></div>
        <img class="stem" alt="" draggable="false" src="${IMG(ROSES.stem)}">
        <div class="openwrap" style="left:${b.left}%;top:${b.top}%;width:${b.width}%;transform-origin:${sp.x}% ${sp.y}%">
          <img alt="" draggable="false" src="${IMG(ROSES.open)}">
          <i class="dew" style="left:30%;top:56%"></i><i class="dew s" style="left:67%;top:41%"></i>
          <i class="dew" style="left:47%;top:72%"></i><i class="dew s" style="left:79%;top:62%"></i>
          <i class="dew s" style="left:21%;top:39%"></i><i class="dew" style="left:58%;top:23%"></i>
        </div>
        <div class="ring"></div><div class="hint-ring"></div>
        <button class="hit" type="button" aria-label="Touch the rose"></button>
      </div>`;
    this.wrap = el.querySelector('.stemwrap')!;
    this.stem = el.querySelector('.stem')!;
    this.open = el.querySelector('.openwrap')!;
    this.hit = el.querySelector('.hit')!;
    this.hit.addEventListener('pointerdown', (e) => { e.preventDefault(); this.touch(); });
  }

  setState(s: State) { this.el.dataset.state = s; }

  /** Rose spiral centre in screen pixels. */
  head() {
    const r = this.wrap.getBoundingClientRect();
    return { x: r.left + r.width * (ROSES.stemSpiral.x / 100), y: r.top + r.height * (ROSES.stemSpiral.y / 100), w: r.width };
  }

  arm(cb: () => void) { this.onTouch = cb; this.el.classList.add('armed'); }
  touch() {
    if (!this.onTouch) return;
    const cb = this.onTouch; this.onTouch = null;
    this.el.classList.remove('armed');
    cb();
  }

  private mask(el: HTMLElement, v: string) {
    el.style.setProperty('-webkit-mask-image', v);
    el.style.setProperty('mask-image', v);
  }

  async bloom() {
    if (this.bloomed) return;
    this.bloomed = true;
    this.el.classList.add('blooming');
    const sp = ROSES.openSpiral;
    await tween(3600, (p) => {
      const r = 4 + p * 96;
      this.mask(this.open, `radial-gradient(circle farthest-corner at ${sp.x}% ${sp.y}%, #000 ${(r * 0.7).toFixed(1)}%, transparent ${r.toFixed(1)}%)`);
      this.open.style.opacity = String(Math.min(1, p * 1.8));
      this.open.style.transform = `scale(${(0.78 + 0.22 * p).toFixed(4)}) rotate(${(-18 * (1 - p)).toFixed(2)}deg)`;
      const a = Math.max(0, 1 - p * 1.5).toFixed(3);
      this.mask(this.stem, `linear-gradient(to bottom, rgba(0,0,0,${a}) 0%, rgba(0,0,0,${a}) 41%, #000 53%)`);
    }, ease.outCubic);
    this.mask(this.open, 'none');
    this.el.classList.add('bloomed');
  }

  setBloomed() {
    this.bloomed = true;
    this.open.style.opacity = '1';
    this.open.style.transform = 'none';
    this.mask(this.stem, 'linear-gradient(to bottom, transparent 0%, transparent 41%, #000 53%)');
    this.el.classList.add('blooming', 'bloomed');
  }

  reset() {
    this.bloomed = false;
    this.onTouch = null;
    this.el.classList.remove('blooming', 'bloomed', 'armed');
    this.open.style.opacity = '0';
    this.open.style.transform = '';
    this.mask(this.open, 'none');
    this.mask(this.stem, 'none');
    this.setState('hidden');
  }
}
