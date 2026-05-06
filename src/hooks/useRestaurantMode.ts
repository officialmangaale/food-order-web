'use client';

import { usePathname } from 'next/navigation';
import { useRestaurantModeStore } from '@/store/restaurantModeStore';

export function useRestaurantMode() {
  const pathname = usePathname();
  const store = useRestaurantModeStore();

  // Route-driven: /r/* is locked, everything else is global
  const isLockedRoute = pathname.startsWith('/r/');

  return {
    lockedMode: isLockedRoute && store.lockedMode,
    lockedRestaurantId: store.lockedRestaurantId,
    lockedRestaurantSlug: store.lockedRestaurantSlug,
    lockedRestaurantName: store.lockedRestaurantName,
    isLockedRoute,
    enterLockedMode: store.enterLockedMode,
    exitLockedMode: store.exitLockedMode,

    /** Get the home link — respects locked mode */
    homeLink: isLockedRoute && store.lockedRestaurantSlug
      ? `/r/${store.lockedRestaurantSlug}`
      : '/',
  };
}
