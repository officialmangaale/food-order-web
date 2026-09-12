'use client';

import { useEffect, useRef } from 'react';
import styles from './RestaurantExperience.module.css';

export function RestaurantCategoryTabs({ label, entries, activeKey, disabled, onSelect }: {
  label: string; entries: { key: string; title: string }[]; activeKey?: string;
  disabled?: boolean; onSelect: (key: string) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = ref.current;
    if (!nav) return;
    const reveal = () => {
      const active = nav.querySelector<HTMLElement>('[aria-pressed="true"]');
      if (!active) return;
      const bounds = active.getBoundingClientRect();
      nav.scrollTo({ left: nav.scrollLeft + bounds.left - nav.getBoundingClientRect().left - (nav.clientWidth - bounds.width) / 2, behavior: 'instant' });
    };
    reveal();
    const observer = new ResizeObserver(reveal);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [activeKey]);
  return <nav ref={ref} className={styles.tabs} aria-label={label}>
    {entries.map((entry) => <button key={entry.key} type="button" aria-pressed={entry.key === activeKey}
      disabled={disabled} onClick={() => onSelect(entry.key)}>{entry.title}</button>)}
  </nav>;
}
