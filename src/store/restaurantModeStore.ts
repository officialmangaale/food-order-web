'use client';

import { create } from 'zustand';

interface RestaurantModeState {
  lockedMode: boolean;
  lockedRestaurantId: number | null;
  lockedRestaurantSlug: string | null;
  lockedRestaurantName: string | null;

  enterLockedMode: (id: number, slug: string, name: string) => void;
  exitLockedMode: () => void;
}

export const useRestaurantModeStore = create<RestaurantModeState>()((set) => ({
  lockedMode: false,
  lockedRestaurantId: null,
  lockedRestaurantSlug: null,
  lockedRestaurantName: null,

  enterLockedMode: (id, slug, name) =>
    set({
      lockedMode: true,
      lockedRestaurantId: id,
      lockedRestaurantSlug: slug,
      lockedRestaurantName: name,
    }),

  exitLockedMode: () =>
    set({
      lockedMode: false,
      lockedRestaurantId: null,
      lockedRestaurantSlug: null,
      lockedRestaurantName: null,
    }),
}));
