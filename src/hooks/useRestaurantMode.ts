'use client';

import { usePathname } from 'next/navigation';
import { useRestaurantModeStore } from '@/store/restaurantModeStore';

export function useRestaurantMode() {
  const pathname = usePathname();
  const store = useRestaurantModeStore();

  const isLockedRoute = pathname.startsWith('/r/');
  const isLockedFlowRoute =
    pathname === '/cart' ||
    pathname === '/checkout' ||
    pathname.startsWith('/orders/');
  const lockedMode = store.lockedMode && (isLockedRoute || isLockedFlowRoute);

  return {
    lockedMode,
    lockedRestaurantId: store.lockedRestaurantId,
    lockedRestaurantSlug: store.lockedRestaurantSlug,
    lockedRestaurantName: store.lockedRestaurantName,
    isLockedRoute,
    enterLockedMode: store.enterLockedMode,
    exitLockedMode: store.exitLockedMode,

    homeLink: lockedMode && store.lockedRestaurantSlug
      ? `/r/${store.lockedRestaurantSlug}`
      : '/',
  };
}
