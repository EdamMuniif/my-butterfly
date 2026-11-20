import { CONTENT } from '../config/content';
import { wander } from '../animations/flight';
import { haptic } from '../animations/tween';
import { fill, show, type Ctx } from './director';

const C = CONTENT.scene1;

export async function scene1(c: Ctx) {
  const s = c.section('s1', `
    <p class="brand line" data-t="title"></p>
    <div class="center">
      <h1 class="greet line" data-t="greet"></h1>
      <p class="line" data-t="l0"></p>
      <p class="line" data-t="l1"></p>
      <div class="line ctaw"><button class="cta" type="button" data-t="cta"></button></div>
      <p class="line subtitle" data-t="sub"></p>
    </div>`);
  fill(s, { title: CONTENT.title, greet: C.greeting, l0: C.lines[0], l1: C.lines[1], cta: C.cta, sub: CONTENT.subtitle });
  const $ = (q: string) => s.querySelector(q) as HTMLElement;

  c.hero.setState('hidden');
  c.garden.setVeil(1, 0);
  c.fx.fade('fireflies', 0, 0);
  c.fx.fade('bokeh', 0, 0);

  $('.cta').addEventListener('click', () => { haptic(); c.go(2); }, { once: true });

  await c.sleep(300);
  c.fx.fade('fireflies', 1, 2600);
  await c.sleep(1500);
  c.garden.setVeil(0.14, 5000);
  c.fx.fade('bokeh', 1, 5000);
  await c.sleep(1700);
  show($('.brand'));
  c.flock.spawn('azure', { x: -90, y: c.H() * 0.62, w: 94, max: 130, tag: 'first', target: wander(c.W() * 0.64, c.H() * 0.26, c.W() * 0.16, c.H() * 0.06, 1) });
  await c.sleep(1500);
  const lines = s.querySelectorAll('.center .line');
  const gaps = [0, 1900, 1800, 1500, 500];
  for (let i = 0; i < lines.length; i++) { await c.sleep(gaps[i] || 1); show(lines[i]); }
}
