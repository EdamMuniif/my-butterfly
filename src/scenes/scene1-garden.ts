import { CONTENT } from '../config/content';
import { wander } from '../animations/flight';
import { haptic } from '../animations/tween';
import { fill, hide, show, type Ctx } from './director';

const C = CONTENT.scene1;

export async function scene1(c: Ctx) {
  const s = c.section('s1', `
    <p class="brand line" data-t="sub"></p>
    <div class="center">
      <h1 class="greet line" data-t="greet"></h1>
      <div class="slot"><p class="line" data-t="l0"></p><p class="line" data-t="l1"></p></div>
      <div class="line ctaw"><button class="cta" type="button" data-t="cta"></button></div>
    </div>`);
  fill(s, { greet: C.greeting, l0: C.lines[0], l1: C.lines[1], cta: C.cta, sub: CONTENT.subtitle });
  const $ = (q: string) => s.querySelector(q) as HTMLElement;

  c.hero.setState('hidden');
  c.garden.setVeil(1, 0);
  c.fx.fade('fireflies', 0, 0);
  c.fx.fade('bokeh', 0, 0);

  $('.cta').addEventListener('click', () => { haptic(); c.go(2); }, { once: true });

  await c.sleep(300);
  c.fx.fade('fireflies', 1, 2600);
  await c.sleep(1500);
  c.garden.setVeil(0.03, 5000);
  c.fx.fade('bokeh', 1, 5000);
  await c.sleep(1700);
  show($('.brand'));
  c.flock.spawn('azure', { x: -90, y: c.H() * 0.62, w: 94, max: 130, tag: 'first', target: wander(c.W() * 0.64, c.H() * 0.26, c.W() * 0.16, c.H() * 0.06, 1) });
  if (!c.flock.tagged('amb').length) {
    ([['royal', 0.25, 0.42, 44], ['indigo', 0.75, 0.62, 38], ['sky', 0.5, 0.78, 34]] as const).forEach(([k, ax, ay, w], i) => {
      const b = c.flock.spawn(k, { x: i % 2 ? c.W() + 60 : -60, y: c.H() * ay, w, max: 55, tag: 'amb', target: wander(c.W() * ax, c.H() * ay, c.W() * 0.3, c.H() * 0.1, i * 3) });
      b.flutter = 0.7;
    });
  }
  await c.sleep(1500);
  show($('.greet'));
  await c.sleep(1800); show($('[data-t="l0"]'));
  await c.sleep(2800); hide($('[data-t="l0"]'));
  await c.sleep(700); show($('[data-t="l1"]'));
  await c.sleep(1500); show($('.ctaw'));
}
