import { CONTENT } from '../config/content';
import { orbit } from '../animations/flight';
import { ease, haptic, reduced, tween } from '../animations/tween';
import { fill, hide, show, type Ctx } from './director';

const C = CONTENT.scene3;

export async function scene3(c: Ctx) {
  const s = c.section('s3', `
    <div class="top">
      <div class="slot"><p class="line" data-t="l0"></p><p class="line" data-t="l1"></p></div>
      <button class="line prompt" type="button" data-t="prompt"></button>
    </div>
    <div class="bottom">
      <p class="line quote" data-t="reveal"></p>
      <div class="line ctaw"><button class="cta" type="button" data-t="cta"></button></div>
    </div>`);
  fill(s, { l0: C.lines[0], l1: C.lines[1], prompt: C.prompt, reveal: C.reveal, cta: C.cta });
  const $ = (q: string) => s.querySelector(q) as HTMLElement;

  c.garden.setVeil(0.06, 2200);
  const z0 = c.garden.cam.z, y0 = c.garden.cam.y;
  void tween(2600, (p) => { if (!c.alive()) return; c.garden.cam.z = z0 + (0.12 - z0) * p; c.garden.cam.y = y0 * (1 - p); });
  c.hero.setState('center');

  let guide = c.flock.tagged('guide')[0];
  c.flock.dismiss(guide ? [guide] : []);
  if (!guide) guide = c.flock.spawn('sky', { x: c.W() + 80, y: c.H() * 0.2, w: 80, tag: 'guide', target: () => ({ x: 0, y: 0 }) });
  guide.max = 120;
  guide.setGlow(0.8);
  guide.target = orbit(() => c.hero.head(), c.W() * 0.36, c.H() * 0.09, 0.42);

  $('.cta').addEventListener('click', () => { haptic(); c.go(4); }, { once: true });

  await c.sleep(1500); show($('[data-t="l0"]'));
  await c.sleep(2600); hide($('[data-t="l0"]'));
  await c.sleep(700); show($('[data-t="l1"]'));
  await c.sleep(1700); show($('.prompt'));

  await new Promise<void>((res) => {
    c.hero.arm(res);
    $('.prompt').addEventListener('click', () => c.hero.touch(), { once: true });
  });
  if (!c.alive()) return;

  haptic([18, 40, 18]);
  hide($('.prompt')); hide($('[data-t="l1"]'));
  const h = c.hero.head();
  const blooming = c.hero.bloom();
  await c.sleep(500);
  c.fx.burstPetals(h.x, h.y, reduced ? 10 : 28);
  c.garden.setGlow(0.4, ['edges']);
  void tween(3000, (p) => { if (c.alive()) c.garden.setVeil(0.06 * (1 - p), 0); }, ease.outCubic);
  await blooming;
  await c.sleep(400); show($('.quote'));
  await c.sleep(2400); show($('.bottom .ctaw'));
}
