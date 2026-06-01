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
      merge: (persistedState, currentState) => mergePersistedCartState(persistedState, currentState),
    }
  )
);

function mergePersistedCartState(persistedState: unknown, currentState: CartState): CartState {
  const persisted = asRecord(persistedState);
  if (!persisted) return currentState;

  const items = normalizePersistedItems(persisted.items);
  const restaurantId =
    readPositiveNumber(persisted.restaurantId) ??
    getSingleRestaurantId(items);

  return {
    ...currentState,
    restaurantId,
    restaurantName: typeof persisted.restaurantName === 'string' ? persisted.restaurantName : '',
    restaurantSlug: typeof persisted.restaurantSlug === 'string' ? persisted.restaurantSlug : null,
    items,
    validatedTotals: null,
  };
}

function normalizePersistedItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((value) => normalizePersistedItem(value))
    .filter((item): item is CartItem => item !== null);
}

function normalizePersistedItem(value: unknown): CartItem | null {
  const item = asRecord(value);
  const itemId = readPositiveNumber(item?.item_id);
  const quantity = readPositiveNumber(item?.quantity);
  const basePrice = readNumber(item?.base_price) ?? readNumber(item?.variant_price);
  if (!item || !itemId || !quantity || basePrice == null) return null;

  return {
    ...item,
    item_id: itemId,
    name: typeof item.name === 'string' ? item.name : 'Item',
    quantity,
    base_price: basePrice,
    variant_id: readPositiveNumber(item.variant_id),
    variant_price: readNumber(item.variant_price),
    restaurant_id: readPositiveNumber(item.restaurant_id),
    addons: normalizePersistedAddons(item.addons),
  } as CartItem;
}

function normalizePersistedAddons(value: unknown): CartAddon[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((value) => {
      const addon = asRecord(value);
      const addonId = readPositiveNumber(addon?.addon_id);
      const price = readNumber(addon?.price);
      const quantity = readPositiveNumber(addon?.quantity);
      if (!addon || !addonId || price == null || !quantity) return null;

      return {
        addon_id: addonId,
        name: typeof addon.name === 'string' ? addon.name : 'Addon',
        price,
        quantity,
      };
    })
    .filter((addon): addon is CartAddon => addon !== null);
}

function getSingleRestaurantId(items: CartItem[]) {
  const ids = Array.from(new Set(items.map((item) => item.restaurant_id).filter(Boolean)));
  return ids.length === 1 ? ids[0] ?? null : null;
}

function readPositiveNumber(value: unknown) {
  const number = readNumber(value);
  return number != null && number > 0 ? number : undefined;
}

function readNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
