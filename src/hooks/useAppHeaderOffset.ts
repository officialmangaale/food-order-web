'use client';

import { useEffect, useState } from 'react';

/**
 * Live height of the sticky app header in pixels.
 *
 * The `--header-height` token is a design constant; the real header is taller
 * on listing routes, where it also carries the location pill and the search
 * field. Anything pinned directly under it (the browse-menu category rail) has
 * to follow the measured height or it ends up sliding behind the header.
 *
 * Returns `null` until measured, so callers can fall back to the token during
 * server rendering and the first paint.
 */
export function useAppHeaderOffset(): number | null {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const header = document.querySelector<HTMLElement>('[data-app-header]');
    if (!header) return;

    const measure = () => setHeight(header.getBoundingClientRect().height);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(header);
    window.addEventListener('resize', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  return height;
}
