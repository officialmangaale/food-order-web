'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, CartAddon, ValidatedTotals } from '@/types/cart';

interface CartState {
  restaurantId: number | null;
  restaurantName: string;
  restaurantSlug: string | null;
  items: CartItem[];
  validatedTotals: ValidatedTotals | null;

  // Actions
  setRestaurant: (id: number, name: string, slug?: string) => void;
  addItem: (item: CartItem) => void;
  removeItem: (itemId: number, variantId?: number) => void;
  updateQuantity: (itemId: number, quantity: number, variantId?: number) => void;
  clearCart: () => void;
  setValidatedTotals: (totals: ValidatedTotals) => void;
  clearValidatedTotals: () => void;

  // Computed
  totalItems: () => number;
  estimatedSubtotal: () => number;
  isDifferentRestaurant: (restaurantId: number) => boolean;
}

function cartItemKey(itemId: number, variantId?: number): string {
  return variantId ? `${itemId}-${variantId}` : `${itemId}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      restaurantName: '',
      restaurantSlug: null,
      items: [],
      validatedTotals: null,

      setRestaurant: (id, name, slug) =>
        set({ restaurantId: id, restaurantName: name, restaurantSlug: slug ?? null }),

      addItem: (item) => {
        const { items } = get();
        const key = cartItemKey(item.item_id, item.variant_id);
        const existingIdx = items.findIndex(
          (i) => cartItemKey(i.item_id, i.variant_id) === key
        );

        if (existingIdx >= 0) {
          const updated = [...items];
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: updated[existingIdx].quantity + item.quantity,
          };
          set({ items: updated, validatedTotals: null });
        } else {
          set({ items: [...items, item], validatedTotals: null });
        }
      },

      removeItem: (itemId, variantId) => {
        const key = cartItemKey(itemId, variantId);
        set((state) => ({
          items: state.items.filter(
            (i) => cartItemKey(i.item_id, i.variant_id) !== key
          ),
          validatedTotals: null,
        }));
      },

      updateQuantity: (itemId, quantity, variantId) => {
        if (quantity <= 0) {
          get().removeItem(itemId, variantId);
          return;
        }
        const key = cartItemKey(itemId, variantId);
        set((state) => ({
          items: state.items.map((i) =>
            cartItemKey(i.item_id, i.variant_id) === key
              ? { ...i, quantity }
              : i
          ),
          validatedTotals: null,
        }));
      },

      clearCart: () =>
        set({
          restaurantId: null,
          restaurantName: '',
          restaurantSlug: null,
          items: [],
          validatedTotals: null,
        }),

      setValidatedTotals: (totals) => set({ validatedTotals: totals }),
      clearValidatedTotals: () => set({ validatedTotals: null }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      estimatedSubtotal: () =>
        get().items.reduce((sum, item) => {
          const itemPrice = item.variant_price ?? item.base_price;
          const addonTotal = item.addons.reduce(
            (a, addon) => a + addon.price * addon.quantity,
            0
          );
          return sum + (itemPrice + addonTotal) * item.quantity;
        }, 0),

      isDifferentRestaurant: (restaurantId) => {
        const { restaurantId: current, items } = get();
        return current !== null && items.length > 0 && current !== restaurantId;
      },
    }),
    {
      name: 'mangaale-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        restaurantId: state.restaurantId,
        restaurantName: state.restaurantName,
        restaurantSlug: state.restaurantSlug,
        items: state.items,
        validatedTotals: state.validatedTotals,
      }),
    }
  )
);
