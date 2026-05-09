'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { validateCart } from '@/services/customerWebApi';
import type { CartItem, CartValidateRequest, CartValidateResponse, ValidatedTotals } from '@/types/cart';
import type { CheckoutAddress, CheckoutValidationResult } from '@/components/checkout/checkoutTypes';
import { buildCartItemsPayload, getAddressLocation } from '@/components/checkout/checkoutTypes';

interface UseCheckoutCartValidationParams {
  restaurantId: number | null;
  items: CartItem[];
  couponCode?: string;
  address?: CheckoutAddress | null;
  fallbackLocation?: { latitude: number | null; longitude: number | null };
}

export function useCheckoutCartValidation({
  restaurantId,
  items,
  couponCode,
  address,
  fallbackLocation,
}: UseCheckoutCartValidationParams) {
  const payload = useMemo(
    () => buildCartValidatePayload({ restaurantId, items, couponCode, address, fallbackLocation }),
    [address, couponCode, fallbackLocation, items, restaurantId]
  );
  const queryKey = useMemo(() => JSON.stringify(payload), [payload]);

  const query = useQuery({
    queryKey: ['checkout-cart-validation', queryKey],
    queryFn: async () => toValidationResult(await validateCart(payload as CartValidateRequest)),
    enabled: Boolean(restaurantId && items.length > 0),
    retry: false,
  });

  return {
    ...query,
    payload,
    validateNow: async () => toValidationResult(await validateCart(payload as CartValidateRequest)),
  };
}

export function buildCartValidatePayload({
  restaurantId,
  items,
  couponCode,
  address,
  fallbackLocation,
}: UseCheckoutCartValidationParams): Partial<CartValidateRequest> {
  const addressLocation = getAddressLocation(address);
  const fallback =
    fallbackLocation?.latitude != null && fallbackLocation.longitude != null
      ? { latitude: fallbackLocation.latitude, longitude: fallbackLocation.longitude }
      : undefined;
  const customerLocation = addressLocation ?? fallback;

  return {
    restaurant_id: restaurantId ?? 0,
    ...(couponCode ? { coupon_code: couponCode } : {}),
    ...(customerLocation ? { customer_location: customerLocation } : {}),
    items: buildCartItemsPayload(items),
    payment_method: 'cash',
  };
}

export function toValidationResult(response: CartValidateResponse): CheckoutValidationResult {
  const totals: ValidatedTotals = {
    subtotal: response.subtotal ?? 0,
    taxes: response.taxes ?? response.tax_amount ?? (response.cgst ?? 0) + (response.sgst ?? 0),
    delivery_fee: response.delivery_fee ?? response.delivery_charge ?? 0,
    discount: response.discount ?? response.discount_amount ?? 0,
    total: response.total ?? response.grand_total ?? 0,
  };

  return {
    valid: response.valid !== false,
    totals,
    message: response.message,
    couponValidation: response.coupon_validation,
    itemErrors: response.item_errors,
  };
}
