import type { CartItem } from '@/types/cart';

export function getCartItemKey(item: CartItem) {
  return `${item.item_id}-${item.variant_id ?? 'base'}`;
}

export function getCartLineTotal(item: CartItem) {
  const itemPrice = safeNumber(item.variant_price ?? item.base_price);
  const addonTotal = item.addons.reduce(
    (sum, addon) => sum + safeNumber(addon.price) * safeNumber(addon.quantity),
    0
  );
  return (itemPrice + addonTotal) * safeNumber(item.quantity);
}

export function getCartEstimatedSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + getCartLineTotal(item), 0);
}

export function hasInvalidCartPrice(items: CartItem[]) {
  return items.some((item) => !Number.isFinite(item.variant_price ?? item.base_price));
}

export function getVariantAddonSummary(item: CartItem) {
  const addons = item.addons
    .map((addon) => `${addon.name}${addon.quantity > 1 ? ` x${addon.quantity}` : ''}`)
    .join(', ');
  return [item.variant_name, addons].filter(Boolean).join(' / ');
}

function safeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
