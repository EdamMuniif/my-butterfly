import { CONTENT, type BfKind } from '../config/content';
import { fixed, wander } from '../animations/flight';
import { ease, haptic, tween } from '../animations/tween';
import { show, type Ctx } from './director';

const C = CONTENT.scene2;

export async function scene2(c: Ctx) {
  const s = c.section('s2', `
    <div class="stack"></div>
    <div class="foot"><div class="line ctaw"><button class="cta" type="button"></button></div></div>`);
  const stack = s.querySelector('.stack') as HTMLElement;
  const cta = s.querySelector('.cta') as HTMLButtonElement;
  cta.textContent = C.cta;

  c.garden.setVeil(0.04, 2500);
  const z0 = c.garden.cam.z;
  void tween(9000, (p) => { if (!c.alive()) return; c.garden.cam.z = z0 + p * 0.38; c.garden.cam.y = -p * 40; }, ease.inOutSine);

  c.flock.dismiss();
  const guide = c.flock.spawn('sky', { x: c.W() + 90, y: c.H() * 0.12, w: 82, max: 150, tag: 'guide', target: wander(c.W() * 0.74, c.H() * 0.17, 16, 10, 2) });
  guide.setGlow(1);

  // butterflies drifting past through the garden
  void (async () => {
    const kinds: BfKind[] = ['indigo', 'royal', 'azure'];
    for (let i = 0; i < 3; i++) {
      await c.sleep(1300 + i * 900);
      const ltr = i % 2 === 0;
      const b = c.flock.spawn(kinds[i], {
        x: ltr ? -80 : c.W() + 80, y: c.H() * (0.42 + i * 0.16), w: 56 + i * 16, max: 95 + i * 25,
        target: fixed(ltr ? c.W() + 160 : -160, c.H() * (0.3 + i * 0.12)),
      });
      b.exitOnArrive = true;
    }
  })();

  await c.sleep(900);
  for (const text of C.lines) {
    const p = document.createElement('p');
    p.className = 'line';
    p.textContent = text;
    stack.querySelectorAll('.line').forEach((e) => e.classList.add('past'));
    stack.append(p);
    await c.sleep(50);
    show(p);
    await c.sleepOrTap(2300 + text.length * 34, s);
  }

  c.fx.trailOn(() => ({ x: c.W() * 0.16, y: c.H() * 0.88 }), () => ({ x: guide.st.x, y: guide.st.y }));
  show(s.querySelector('.foot .line'));
  cta.addEventListener('click', () => {
    haptic();
    c.fx.trailOff();
    guide.max = 230;
    guide.target = () => { const h = c.hero.head(); return { x: h.x + 60, y: h.y - 40 }; };
    c.go(3);
  }, { once: true });
}
