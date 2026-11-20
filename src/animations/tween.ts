export const reduced =
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export const ease = {
  linear: (t: number) => t,
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
};

/** rAF tween. `fn` gets eased progress 0..1. Resolves when done. */
export function tween(ms: number, fn: (p: number) => void, e: (t: number) => number = ease.inOutCubic) {
  return new Promise<void>((resolve) => {
    const dur = reduced ? Math.min(ms, 600) : ms;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      fn(e(p));
      if (p < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

export const haptic = (pattern: number | number[] = 12) => {
  try { navigator.vibrate?.(pattern); } catch { /* not supported */ }
};
