import './styles/main.css';
import { CONTENT, IMG, PRELOAD } from './config/content';
import { Garden } from './components/garden';
import { Hero } from './components/hero';
import { FX } from './components/fx';
import { Flock } from './components/butterfly';
import { Ambient } from './components/sound';
import { Director } from './scenes/director';

document.title = CONTENT.title;

const preload = (files: string[]) => Promise.all(files.map((f) => new Promise<void>((res) => {
  const im = new Image();
  im.onload = im.onerror = () => res();
  im.src = IMG(f);
})));

const garden = new Garden(document.getElementById('garden')!);
const hero = new Hero(document.getElementById('hero')!);
const fx = new FX(document.getElementById('fx') as HTMLCanvasElement);
const flock = new Flock(document.getElementById('flock')!);
const director = new Director({ garden, hero, fx, flock, ui: document.getElementById('ui')! });

// optional ambient sound, off until she taps it
const ambient = new Ambient();
const soundBtn = document.getElementById('sound') as HTMLButtonElement;
soundBtn.addEventListener('click', async () => {
  const on = await ambient.toggle();
  soundBtn.setAttribute('aria-pressed', String(on));
});

let last = performance.now();
const loop = (now: number) => {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const t = now / 1000;
  garden.update(t, dt);
  flock.update(t, dt);
  fx.frame(t, dt);
  requestAnimationFrame(loop);
};
requestAnimationFrame(loop);

// ?scene=3 jumps straight to a scene (handy while editing)
const start = Math.min(5, Math.max(1, Number(new URLSearchParams(location.search).get('scene')) || 1));
Promise.race([preload(PRELOAD), new Promise((r) => setTimeout(r, 6000))]).then(() => {
  document.body.classList.add('ready');
  director.start(start);
});
