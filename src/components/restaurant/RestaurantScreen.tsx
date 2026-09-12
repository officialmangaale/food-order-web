'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import styles from './RestaurantExperience.module.css';

export function RestaurantScreen({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    const previous = new Map<HTMLElement, { inert: boolean; hidden: string | null }>();
    const hideChrome = () => {
      for (const node of Array.from(element?.parentElement?.children ?? [])) {
        if (!(node instanceof HTMLElement) || node === element || previous.has(node) ||
          ['SCRIPT', 'STYLE', 'LINK', 'NEXTJS-PORTAL'].includes(node.tagName)) continue;
        previous.set(node, { inert: node.inert, hidden: node.getAttribute('aria-hidden') });
        node.inert = true;
        node.setAttribute('aria-hidden', 'true');
      }
    };
    hideChrome();
    const observer = new MutationObserver(hideChrome);
    if (element?.parentElement) observer.observe(element.parentElement, { childList: true });
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      observer.disconnect();
      previous.forEach((value, node) => {
        node.inert = value.inert;
        if (value.hidden == null) node.removeAttribute('aria-hidden'); else node.setAttribute('aria-hidden', value.hidden);
      });
      document.body.style.overflow = overflow;
    };
  }, []);
  return <div ref={root} className={styles.screen} data-restaurant-screen>{children}</div>;
}
