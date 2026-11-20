import { CONTENT, IMG, BUTTERFLIES, type BfKind } from '../config/content';
import { fixed, orbit } from '../animations/flight';
import { haptic, reduced } from '../animations/tween';
import { fill, hide, show, type Ctx } from './director';

const C = CONTENT.scene5;

export async function scene5(c: Ctx) {
  const s = c.section('s5', `
    <div class="env" role="button" tabindex="0" aria-label="Open the letter">
      <div class="back"></div>
      <div class="paper"><span data-t="label"></span></div>
      <div class="front"></div>
      <div class="flap"></div>
      <div class="seal"><img alt="" src="${IMG(BUTTERFLIES.azure.src)}"></div>
    </div>
    <p class="line seal-hint" data-t="sealHint"></p>
    <article class="letter" aria-label="Letter">
      <div class="inner">
        <p class="greet-l" data-t="greeting"></p>
        <div class="body"></div>
        <p class="closing" data-t="closing"></p>
        <p class="signoff" data-t="signoff"></p>
        <button class="cta dark" type="button" data-t="cta"></button>
      </div>
    </article>
    <div class="finale">
      <p class="line final" data-t="final"></p>
      <div class="line"><button class="ghost replay" type="button" data-t="replay"></button></div>
    </div>`);
  fill(s, { label: C.envelopeLabel, sealHint: C.sealHint, greeting: C.greeting, closing: C.closing, signoff: C.signoff, cta: C.cta, final: C.final, replay: C.replay });
  const body = s.querySelector('.body') as HTMLElement;
  for (const para of C.letter) { const p = document.createElement('p'); p.textContent = para; body.append(p); }
  const $ = (q: string) => s.querySelector(q) as HTMLElement;
  const env = $('.env'), letter = $('.letter');

  // the garden grows quieter; roses glow at the edges
  c.garden.showCluster(true);
  c.garden.setVeil(0.28, 2600);
  c.garden.setGlow(0.55, ['edges', 'cluster']);
  c.garden.cam = { z: c.garden.cam.z, y: 0 };
  c.hero.setState('top');

  // butterflies gather around the central flower
  let gather = c.flock.tagged('msg');
  c.flock.dismiss(gather);
  if (!gather.length) {
    gather = (['azure', 'sky', 'royal'] as BfKind[]).map((k, i) =>
      c.flock.spawn(k, { x: i % 2 ? c.W() + 90 : -90, y: c.H() * (0.2 + i * 0.2), w: 84, max: 90, tag: 'msg', target: fixed(0, 0) }));
  }
  const head = () => c.hero.head();
  gather.forEach((b, i) => {
    b.unrest(); b.setTappable(false); b.setGlow(0.7);
    b.max = 90; b.flutter = 0.5;
    b.target = orbit(head, 78 + i * 26, 46 + i * 12, 0.35 + i * 0.07, i * 2.1);
  });

  await c.sleep(1100);
  show(env);
  await c.sleep(1200);
  show($('.seal-hint'));

  await new Promise<void>((res) => {
    const go = () => { env.removeEventListener('click', go); res(); };
    env.addEventListener('click', go);
    env.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') go(); });
  });
  if (!c.alive()) return;
  haptic(16);
  hide($('.seal-hint'));
  env.classList.add('open');
  await c.sleep(2000);
  env.classList.add('gone');
  await c.sleep(300);
  letter.scrollTop = 0;
  document.body.classList.add('reading-letter');
  show(letter);

  await new Promise<void>((res) => $('.letter .cta').addEventListener('click', () => res(), { once: true }));
  if (!c.alive()) return;
  haptic([20, 50, 20]);
  hide(letter);
  document.body.classList.remove('reading-letter');

  // grand finale
  c.garden.setVeil(0, 1800);
  c.garden.setGlow(1, 'all');
  c.fx.risePetals(reduced ? 12 : 40, 5000);
  gather.forEach((b, i) => { b.max = 160; b.flutter = 1; b.target = orbit(head, 110 + i * 34, 64 + i * 16, 0.9 + i * 0.12, i * 2.1); });
  void (async () => {
    const kinds: BfKind[] = ['indigo', 'azure', 'royal', 'sky', 'indigo', 'royal'];
    for (let i = 0; i < (reduced ? 2 : 6); i++) {
      const ltr = i % 2 === 0;
      const b = c.flock.spawn(kinds[i], {
        x: ltr ? -70 : c.W() + 70, y: c.H() * (0.95 - Math.random() * 0.25), w: 52 + Math.random() * 40, max: 210,
        target: fixed(ltr ? c.W() + 150 : -150, c.H() * (0.08 + Math.random() * 0.3)),
      });
      b.exitOnArrive = true;
      await c.sleep(480);
    }
  })();

  await c.sleep(1300);
  c.fx.showHeart(c.W() / 2, c.H() * 0.47, Math.min(c.W() * 0.7, 300));
  haptic(30);
  await c.sleep(2600);
  show($('.final'));
  await c.sleep(2600);
  show($('.finale .line:last-child'));
  $('.replay').addEventListener('click', () => { haptic(); c.restart(); }, { once: true });
}
