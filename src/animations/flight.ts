/* Butterfly flight: a damped spring toward a moving target plus smooth,
   layered sine "flutter" so paths drift and wobble like a real insect
   instead of gliding on rails. Pure maths, no DOM. */

export type V = { x: number; y: number };
export type Target = (t: number) => V;

export interface FlightState { x: number; y: number; vx: number; vy: number; heading: number; p: number }
export interface FlightParams { k: number; c: number; max: number; flutter: number }

export function steer(s: FlightState, tx: number, ty: number, dt: number, t: number, o: FlightParams) {
  const nx = Math.sin(t * 2.3 + s.p) * 0.6 + Math.sin(t * 5.1 + s.p * 2) * 0.4;
  const ny = Math.cos(t * 1.9 + s.p * 1.7) * 0.6 + Math.sin(t * 4.3 + s.p) * 0.4;
  const f = o.max * 1.3 * o.flutter;
  s.vx += ((tx - s.x) * o.k - s.vx * o.c + nx * f) * dt;
  s.vy += ((ty - s.y) * o.k - s.vy * o.c + ny * f) * dt;
  const sp = Math.hypot(s.vx, s.vy);
  if (sp > o.max) { s.vx *= o.max / sp; s.vy *= o.max / sp; }
  s.x += s.vx * dt;
  s.y += s.vy * dt;
  if (sp > 10) {
    let d = Math.atan2(s.vy, s.vx) + Math.PI / 2 - s.heading;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    s.heading += d * Math.min(1, dt * 2.6);
  }
  return sp;
}

/** Loose figure-of-eight drift around an anchor. */
export const wander = (ax: number, ay: number, rx: number, ry: number, p = 0): Target => (t) => ({
  x: ax + rx * Math.sin(t * 0.37 + p) + rx * 0.35 * Math.sin(t * 0.91 + p * 2),
  y: ay + ry * Math.sin(t * 0.29 + p * 1.3) + ry * 0.3 * Math.cos(t * 0.77 + p),
});

export const fixed = (x: number, y: number): Target => () => ({ x, y });

/** Circle around a moving point. */
export const orbit = (centre: () => V, rx: number, ry: number, speed: number, p = 0): Target => (t) => {
  const c = centre();
  return { x: c.x + Math.cos(t * speed + p) * rx, y: c.y + Math.sin(t * speed + p) * ry };
};
