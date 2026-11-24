/** Curtain page-transition timings (ms). Keep in sync with CSS. */
export const CURTAIN_CLOSE_MS = 520;
export const CURTAIN_OPEN_MS = 780;
export const CURTAIN_SWAP_DELAY_MS = 480;

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
