import { CONTENT } from '../config/content';
import { wander } from '../animations/flight';
import { haptic } from '../animations/tween';
import { fill, hide, show, type Ctx } from './director';

const C = CONTENT.scene4;

export async function scene4(c: Ctx) {
  const s = c.section('s4', `
    <div class="top">
      <p class="line hint" data-t="hint"></p>
      <p class="line count"></p>
    </div>
    <div class="sheet" role="dialog" aria-live="polite">
      <p class="k"></p><p class="t"></p>
      <button class="ghost close" type="button" data-t="close"></button>
    </div>
    <div class="bottom done">
      <p class="line" data-t="done"></p>
      <div class="line ctaw"><button class="cta" type="button" data-t="cta"></button></div>
    </div>`);
  fill(s, { hint: C.hint, close: C.close, done: C.done, cta: C.cta });
  const $ = (q: string) => s.querySelector(q) as HTMLElement;
  const count = $('.count'), sheet = $('.sheet');
  const total = C.butterflies.length;
  count.textContent = C.counter(0, total);

  c.hero.setState('hidden');
  c.garden.showCluster(true);
  c.garden.setVeil(0.02, 1800);
  c.garden.setGlow(0.3, ['cluster']);
  c.flock.dismiss();

  const W = c.W(), H = c.H();
  const anchors = [[0.3, 0.36], [0.7, 0.47], [0.4, 0.6]];
  const birds = C.butterflies.map((m, i) => {
    const [ax, ay] = anchors[i];
    const b = c.flock.spawn(m.kind, {
      x: i === 1 ? W + 100 : -100, y: H * (0.3 + i * 0.18), w: 112, max: 60, flap: 0.3 + i * 0.05, tag: 'msg',
      target: wander(W * ax, H * ay, W * 0.13, H * 0.05, i * 2.1),
    });
    b.flutter = 0.6;
    return b;
  });

  let found = 0, open = false;
  const opened = new Set<number>();

  const reveal = (i: number) => {
    if (open || opened.has(i)) return;
    haptic(14);
    opened.add(i); found++; open = true;
    const b = birds[i];
    b.setTappable(false);
    b.setGlow(1);
    b.max = 85;
    b.perch = true;
    b.target = () => c.garden.perch(i);
    $('.k').textContent = C.butterflies[i].title;
    $('.t').textContent = C.butterflies[i].text;
    count.textContent = C.counter(found, total);
    s.classList.add('reading');
    show(sheet);
  };

  $('.close').addEventListener('click', () => {
    hide(sheet);
    s.classList.remove('reading');
    open = false;
    if (found === total) {
      hide($('.hint')); hide(count);
      setTimeout(() => { if (c.alive()) { show($('.done .line')); setTimeout(() => c.alive() && show($('.done .ctaw')), 1300); } }, 500);
    }
  });
  $('.done .cta').addEventListener('click', () => { haptic(); c.go(5); }, { once: true });

  await c.sleep(1200); show($('.hint'));
  await c.sleep(700); show(count);
  birds.forEach((b, i) => { b.onTap = () => reveal(i); b.setTappable(true); });
}
