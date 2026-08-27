'use client';

import { useCartStore } from '@/store/cartStore';

/**
 * Read-only selector for how many of a menu item are currently in the cart.
 * Used by cards to decide between the ADD button and the quantity stepper.
 * Sums across variant lines so an item split over several variants still
 * reports a sensible total.
 */
export function useCartItemQuantity(itemId: number | null | undefined): number {
  return useCartStore((state) => {
    if (itemId == null) return 0;
    return state.items.reduce(
      (total, item) => (item.item_id === itemId ? total + item.quantity : total),
      0
    );
  });
}
