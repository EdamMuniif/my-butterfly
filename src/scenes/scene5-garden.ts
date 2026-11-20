import { CONTENT } from '../config/content';
import { orbit } from '../animations/flight';
import { haptic } from '../animations/tween';
import { fill, show, type Ctx } from './director';

const C = CONTENT.scene5;

/* Finale: the whole garden blooms together on a loop.
   Touching any rose makes it bloom right away. */
export async function scene5(c: Ctx) {
  const s = c.section('s5', `
    <div class="top">
      <p class="line final" data-t="final"></p>
      <p class="line hint5" data-t="hint"></p>
    </div>
    <div class="foot"><div class="line"><button class="ghost replay" type="button" data-t="replay"></button></div></div>`);
  fill(s, { final: C.final, hint: C.hint, replay: C.replay });
  const $ = (q: string) => s.querySelector(q) as HTMLElement;

  c.hero.setState('hidden');
  c.garden.showCluster(false);
  c.garden.setVeil(0, 1600);
  c.garden.setGlow(0.5, ['edges']);
  c.bed.show(true);

  // butterflies drift between the roses
  let birds = c.flock.tagged('msg');
  c.flock.dismiss(birds);
  if (!birds.length) {
    birds = (['azure', 'sky', 'royal'] as const).map((k, i) =>
      c.flock.spawn(k, { x: i % 2 ? c.W() + 90 : -90, y: c.H() * (0.3 + i * 0.15), w: 80, max: 90, tag: 'msg', target: () => ({ x: c.W() / 2, y: c.H() / 2 }) }));
  }
  birds.forEach((b, i) => {
    b.unrest(); b.setTappable(false); b.setGlow(0.7); b.max = 110; b.flutter = 0.8;
    const k = [5, 1, 6][i % 3];
    b.target = orbit(() => c.bed.head(k), 70 + i * 20, 40 + i * 10, 0.5 + i * 0.1, i * 2);
  });

  $('.replay').addEventListener('click', () => { haptic(); c.restart(); }, { once: true });

  await c.sleep(1800);
  c.bed.start();
  haptic([20, 50, 20]);
  await c.sleep(1400);
  c.fx.showHeart(c.W() / 2, c.H() * 0.34, Math.min(c.W() * 0.6, 260));
  await c.sleep(2600); show($('.final'));
  await c.sleep(1800); show($('.hint5'));
  await c.sleep(1500); show($('.foot .line'));
}
