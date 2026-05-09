import type { CustomerAddress, CustomerAddressPayload } from '@/services/profileApi';
import type { CartItem, CartValidateRequest, ValidatedTotals } from '@/types/cart';
import type { CouponValidationResult } from '@/types/coupon';

export type CheckoutAddress = CustomerAddress;
export type CheckoutAddressPayload = CustomerAddressPayload;

export interface CheckoutValidationResult {
  valid: boolean;
  totals: ValidatedTotals;
  message?: string;
  couponValidation?: CouponValidationResult;
  itemErrors?: { item_id: number; message: string }[];
}

export function buildCartItemsPayload(items: CartItem[]): CartValidateRequest['items'] {
  return items.map((item) => ({
    item_id: item.item_id,
    quantity: item.quantity,
    variant_id: item.variant_id,
    addons: item.addons.map((addon) => ({
      addon_id: addon.addon_id,
      quantity: addon.quantity,
    })),
  }));
}

export function getAddressLocation(address?: CheckoutAddress | null) {
  if (address?.latitude != null && address.longitude != null) {
    return {
      latitude: address.latitude,
      longitude: address.longitude,
    };
  }

  return undefined;
}
