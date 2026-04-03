// hooks/useScrollReveal.ts
'use client';

import { useEffect, useRef } from 'react';

/**
 * Adds the `revealed` class when the element scrolls into view.
 * Pair with the `.scroll-reveal` or `.scroll-reveal-stagger` CSS classes.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.15
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed');
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}
