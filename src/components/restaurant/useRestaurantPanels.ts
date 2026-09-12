'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export type RestaurantPanel = { kind: 'menu' } | {
  kind: 'customize' | 'selections' | 'conflict'; itemId: number;
  edit?: boolean; variantId?: number;
};
const eventName = 'mangaale:restaurant-panels';
const serverSnapshot = () => '';
export function hasRestaurantBackEntry() {
  // Navigation entries exclude the initial about:blank page in a new tab.
  const navigation = (window as Window & { navigation?: { currentEntry?: { index: number }; entries: () => { url?: string }[] } }).navigation;
  if (navigation?.currentEntry) {
    const previous = navigation.entries()[navigation.currentEntry.index - 1]?.url;
    return Boolean(previous && new URL(previous).origin === window.location.origin);
  }
  return window.history.length > 1;
}
const snapshot = () => JSON.stringify(window.history.state?.restaurantPanels ?? null);
const subscribe = (listener: () => void) => {
  window.addEventListener('popstate', listener);
  window.addEventListener(eventName, listener);
  return () => { window.removeEventListener('popstate', listener); window.removeEventListener(eventName, listener); };
};

/** Same-URL entries let browser Back close a panel before leaving the restaurant. */
export function useRestaurantPanels() {
  const path = usePathname();
  const router = useRouter();
  const value = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const panels: RestaurantPanel[] = useMemo(() => {
    const data = value ? JSON.parse(value) : null;
    return data?.path === path && Array.isArray(data.panels) ? data.panels : [];
  }, [path, value]);
  const write = (next: RestaurantPanel[], replace = false) => {
    const state = { ...window.history.state, restaurantPanels: { path, panels: next } };
    if (replace) window.history.replaceState(state, ''); else window.history.pushState(state, '');
    window.dispatchEvent(new Event(eventName));
  };
  return {
    panels, top: panels.at(-1),
    open: (panel: RestaurantPanel) => write([...panels, panel]),
    replace: (panel: RestaurantPanel) => write([...panels.slice(0, -1), panel], true),
    close: () => { if (panels.length) window.history.back(); },
    back: () => {
      if (panels.length) window.history.back();
      else if (hasRestaurantBackEntry()) router.back();
      else router.replace('/');
    },
  };
}
