import '../styles/qr.css';
import QRCode from 'qrcode';
import { CONTENT, COLORS, IMG, BUTTERFLIES, ROSES } from '../config/content';

const W = 1200, H = 1600;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const input = $<HTMLInputElement>('url'), status = $<HTMLParagraphElement>('status');
const canvas = $<HTMLCanvasElement>('card'), dl = $<HTMLButtonElement>('dl');
const ctx = canvas.getContext('2d')!;

// default: the garden's own address (this page lives next to index.html)
input.value = new URL('./', location.href).href;

const load = (src: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
const assets = Promise.all([load(IMG(BUTTERFLIES.azure.src)), load(IMG(BUTTERFLIES.sky.src)), load(IMG(ROSES.open)), load(IMG(ROSES.openBlur))]);

function rng(seed: number) { return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646; }

function heartPath(cx: number, top: number, width: number) {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 240; i++) {
    const t = (i / 240) * Math.PI * 2;
    pts.push([16 * Math.sin(t) ** 3, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]);
  }
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const minY = Math.min(...ys), maxY = Math.max(...ys), sc = width / (Math.max(...xs) - Math.min(...xs));
  const path = new Path2D();
  pts.forEach(([x, y], i) => { const X = cx + x * sc, Y = top + (y - minY) * sc; if (i) path.lineTo(X, Y); else path.moveTo(X, Y); });
  path.closePath();
  return { path, bottom: top + (maxY - minY) * sc, sc };
}

/** Largest square (centred on cx) that fits inside the heart. */
function fitSquare(path: Path2D, cx: number, top: number, bottom: number) {
  for (let side = 760; side > 200; side -= 8) {
    for (let cy = top + side / 2; cy < bottom - side / 2; cy += 4) {
      const h = side / 2;
      const pts = [[-h, -h], [h, -h], [h, h], [-h, h], [0, -h], [0, h], [-h, 0], [h, 0]];
      if (pts.every(([dx, dy]) => ctx.isPointInPath(path, cx + dx, cy + dy))) return { side, cy };
    }
  }
  return { side: 400, cy: (top + bottom) / 2 };
}

async function draw(url: string) {
  const [bfA, bfB, rose, roseBlur] = await assets;
  await document.fonts.ready;
  const r = rng(7);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);

  // night background
  let g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#040a1a'); g.addColorStop(0.55, '#08183c'); g.addColorStop(1, COLORS.ocean);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  g = ctx.createRadialGradient(W * 0.82, 40, 0, W * 0.82, 40, 700);
  g.addColorStop(0, 'rgba(214,242,255,.28)'); g.addColorStop(1, 'rgba(214,242,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 46; i++) {
    const x = r() * W, y = r() * H, rad = 4 + r() * 26, gold = r() < 0.55;
    const b = ctx.createRadialGradient(x, y, 0, x, y, rad);
    b.addColorStop(0, gold ? 'rgba(233,201,152,.32)' : 'rgba(155,217,255,.26)'); b.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = b; ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 0.55;
  ctx.drawImage(roseBlur, -120, H - 330, 420, 420 / ROSES.openAR);
  ctx.drawImage(roseBlur, W - 300, H - 360, 440, 440 / ROSES.openAR);
  ctx.globalAlpha = 1;

  // heart frame
  const cx = W / 2, top = 285;
  const heart = heartPath(cx, top, 1100);
  g = ctx.createRadialGradient(cx, top + 380, 40, cx, top + 380, 620);
  g.addColorStop(0, 'rgba(40,100,197,.42)'); g.addColorStop(1, 'rgba(16,42,86,.25)');
  ctx.fillStyle = g; ctx.fill(heart.path);
  ctx.save();
  ctx.shadowColor = COLORS.sky; ctx.shadowBlur = 48; ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(155,217,255,.55)'; ctx.stroke(heart.path);
  ctx.shadowBlur = 16; ctx.lineWidth = 4; ctx.strokeStyle = COLORS.ice; ctx.stroke(heart.path);
  ctx.restore();

  // QR: standard modules, H error correction, 4-module quiet zone, dark on white
  const qr = QRCode.create(url, { errorCorrectionLevel: 'H' });
  const n = qr.modules.size;
  const fit = fitSquare(heart.path, cx, top, heart.bottom);
  const m = Math.max(4, Math.floor((fit.side * 0.95) / (n + 8)));
  const S = m * (n + 8), x0 = Math.round(cx - S / 2), y0 = Math.round(fit.cy - S / 2);
  ctx.save();
  ctx.shadowColor = 'rgba(155,217,255,.6)'; ctx.shadowBlur = 30;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.roundRect(x0, y0, S, S, m * 1.6); ctx.fill();
  ctx.restore();
  ctx.fillStyle = COLORS.navy;
  for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) {
    if (qr.modules.get(row, col)) ctx.fillRect(x0 + (col + 4) * m, y0 + (row + 4) * m, m, m);
  }

  // decorations, kept outside the white panel
  const deco = (img: HTMLImageElement, x: number, y: number, w: number, rot: number) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
    ctx.drawImage(img, -w / 2, -(w * img.height / img.width) / 2, w, w * img.height / img.width);
    ctx.restore();
  };
  deco(bfA, cx - 395, top + 60, 230, -0.42);
  deco(bfB, cx + 430, top + 40, 150, 0.5);
  deco(rose, cx, heart.bottom - 40, 250, 0);

  // words
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.ice;
  ctx.shadowColor = 'rgba(5,12,30,.9)'; ctx.shadowBlur = 20;
  ctx.font = "italic 600 78px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText(CONTENT.qr.title, cx, 190);
  ctx.font = "italic 500 50px 'Cormorant Garamond', Georgia, serif";
  ctx.fillStyle = COLORS.sky;
  ctx.fillText(CONTENT.qr.sub, cx, H - 150);
  ctx.font = "500 24px Inter, system-ui, sans-serif";
  ctx.fillStyle = COLORS.gold;
  ctx.letterSpacing = '8px';
  ctx.fillText(CONTENT.title.toUpperCase(), cx, H - 86);
  ctx.letterSpacing = '0px';
  ctx.shadowBlur = 0;

  return { version: qr.version, n, m };
}

async function make() {
  let url = input.value.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try { new URL(url); } catch { status.textContent = 'That link does not look right.'; status.className = 'muted warn'; return; }
  const info = await draw(url);
  const local = /localhost|127\.0\.0\.1|192\.168\.|\.local\b/.test(url);
  status.className = local ? 'muted warn' : 'muted';
  status.textContent = local
    ? 'This is a local address. It will not open on her phone. Paste the GitHub Pages link instead.'
    : `QR version ${info.version}, ${info.n}×${info.n} modules at ${info.m}px each, error correction H. Points to ${url}`;
  dl.disabled = false;
  dl.dataset.url = url;
}

dl.addEventListener('click', () => {
  canvas.toBlob((b) => {
    if (!b) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = 'a-little-blue-garden-qr.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }, 'image/png');
});
$('make').addEventListener('click', make);
input.addEventListener('keydown', (e) => { if (e.key === 'Enter') void make(); });
void make();
