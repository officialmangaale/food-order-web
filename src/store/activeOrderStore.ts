'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ActiveOrder, OrderStatus } from '@/types/order';
import { isTerminalStatus } from '@/types/order';

interface ActiveOrderState {
  activeOrder: ActiveOrder | null;

  setActiveOrder: (order: ActiveOrder) => void;
  updateStatus: (status: OrderStatus) => void;
  clearActiveOrder: () => void;
  hasActiveOrder: () => boolean;
}

export const useActiveOrderStore = create<ActiveOrderState>()(
  persist(
    (set, get) => ({
      activeOrder: null,

      setActiveOrder: (order) => set({ activeOrder: order }),

      updateStatus: (status) => {
        const { activeOrder } = get();
        if (!activeOrder) return;

        if (isTerminalStatus(status)) {
          // Keep for a short while so user can see final state
          set({ activeOrder: { ...activeOrder, status } });
        } else {
          set({ activeOrder: { ...activeOrder, status } });
        }
      },

      clearActiveOrder: () => set({ activeOrder: null }),

      hasActiveOrder: () => {
        const { activeOrder } = get();
        if (!activeOrder) return false;
        return !isTerminalStatus(activeOrder.status);
      },
    }),
    {
      name: 'mangaale-active-order',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
