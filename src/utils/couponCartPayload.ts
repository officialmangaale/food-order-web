import type { CartItem } from '@/types/cart';
import type { CouponCartPayload } from '@/types/coupon';

type CartLike = CartItem[] | { items?: unknown[]; subtotal?: number };

export function buildCouponCartPayload(cart: CartLike): CouponCartPayload {
  const rawItems = Array.isArray(cart) ? cart : cart.items ?? [];
  const items = rawItems
    .map((item) => normalizeCouponCartItem(item))
    .filter((item): item is NonNullable<ReturnType<typeof normalizeCouponCartItem>> => Boolean(item));
  const explicitSubtotal = !Array.isArray(cart) ? readNumber(cart.subtotal) : undefined;
  const subtotal =
    explicitSubtotal ??
    items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  return {
    subtotal,
    items,
  };
}

function normalizeCouponCartItem(rawInput: unknown) {
  const raw = asRecord(rawInput);
  if (!raw) return null;

  const itemId = readNumber(raw.item_id ?? raw.itemId ?? raw.id);
  if (!itemId) return null;

  const quantity = Math.max(0, readNumber(raw.quantity ?? raw.qty) ?? 0);
  const unitPrice = readUnitPrice(raw);

  return {
    item_id: itemId,
    category_id: readNumber(raw.category_id ?? raw.categoryId),
    quantity,
    unit_price: unitPrice,
  };
}

function readUnitPrice(raw: Record<string, unknown>) {
  const direct =
    readNumber(raw.unit_price ?? raw.unitPrice) ??
    readNumber(raw.final_unit_price ?? raw.finalUnitPrice);
  if (direct != null) return direct;

  const base =
    readNumber(raw.variant_price ?? raw.variantPrice) ??
    readNumber(raw.price) ??
    readNumber(raw.base_price ?? raw.basePrice) ??
    0;
  const addons = Array.isArray(raw.addons)
    ? raw.addons.reduce((sum, addon) => {
        const addonRaw = asRecord(addon);
        if (!addonRaw) return sum;
        const price = readNumber(addonRaw.price ?? addonRaw.unit_price ?? addonRaw.unitPrice) ?? 0;
        const quantity = readNumber(addonRaw.quantity ?? addonRaw.qty) ?? 1;
        return sum + price * quantity;
      }, 0)
    : 0;

  return base + addons;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}
