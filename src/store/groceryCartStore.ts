'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GroceryCartItem, GroceryCartTotals } from '@/types/grocery';

interface GroceryCartState {
  groceryMerchantId: number | null;
  merchantName: string;
  merchantSlug: string | null;
  items: GroceryCartItem[];
  validatedTotals: GroceryCartTotals | null;

  setMerchant: (id: number, name: string, slug?: string) => void;
  addItem: (item: GroceryCartItem) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  setValidatedTotals: (totals: GroceryCartTotals) => void;
  clearValidatedTotals: () => void;

  totalItems: () => number;
  estimatedSubtotal: () => number;
  isDifferentMerchant: (merchantId: number) => boolean;
}

export const useGroceryCartStore = create<GroceryCartState>()(
  persist(
    (set, get) => ({
      groceryMerchantId: null,
      merchantName: '',
      merchantSlug: null,
      items: [],
      validatedTotals: null,

      setMerchant: (id, name, slug) =>
        set({ groceryMerchantId: id, merchantName: name, merchantSlug: slug ?? null }),

      addItem: (item) => {
        const current = get().items;
        const existingIndex = current.findIndex(
          (cartItem) => cartItem.grocery_product_id === item.grocery_product_id
        );

        if (existingIndex >= 0) {
          const updated = [...current];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + item.quantity,
          };
          set({ items: updated, validatedTotals: null });
          return;
        }

        set({ items: [...current, item], validatedTotals: null });
      },

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.grocery_product_id !== productId),
          validatedTotals: null,
        })),

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.grocery_product_id === productId ? { ...item, quantity } : item
          ),
          validatedTotals: null,
        }));
      },

      clearCart: () =>
        set({
          groceryMerchantId: null,
          merchantName: '',
          merchantSlug: null,
          items: [],
          validatedTotals: null,
        }),

      setValidatedTotals: (totals) => set({ validatedTotals: totals }),
      clearValidatedTotals: () => set({ validatedTotals: null }),

      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

      estimatedSubtotal: () =>
        get().items.reduce(
          (sum, item) => sum + item.selling_price * item.quantity,
          0
        ),

      isDifferentMerchant: (merchantId) => {
        const { groceryMerchantId, items } = get();
        return groceryMerchantId !== null && items.length > 0 && groceryMerchantId !== merchantId;
      },
    }),
    {
      name: 'mangaale-grocery-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        groceryMerchantId: state.groceryMerchantId,
        merchantName: state.merchantName,
        merchantSlug: state.merchantSlug,
        items: state.items,
        validatedTotals: state.validatedTotals,
      }),
    }
  )
);
