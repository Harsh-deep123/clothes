import { useEffect } from 'react';

/** Fallback scroll-reveal for browsers without animation-timeline support. */
export function useScrollReveal(selector = '.zayro-reveal') {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (CSS.supports?.('animation-timeline', 'view()')) return;

    const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector));
    if (!nodes.length) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      nodes.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    nodes.forEach((el) => {
      el.classList.add('zayro-reveal-fallback');
      io.observe(el);
    });

    return () => io.disconnect();
  }, [selector]);
}
