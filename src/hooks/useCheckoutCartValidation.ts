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
  const taxAmount = response.tax_amount ?? response.taxes ?? 0;
  const platformFee = response.platform_fee_amount ?? response.platform_fee ?? 0;
  const discountAmount = response.discount_amount ?? response.discount ?? 0;
  const grandTotal = response.grand_total ?? response.exact_total_amount ?? response.total ?? 0;

  const totals: ValidatedTotals = {
    subtotal: response.subtotal ?? 0,
    cgst: response.cgst ?? 0,
    sgst: response.sgst ?? 0,
    tax_amount: taxAmount,
    taxes: taxAmount,
    platform_fee: platformFee,
    platform_fee_amount: platformFee,
    delivery_fee: response.delivery_fee ?? response.delivery_charge ?? 0,
    extra_charges: response.extra_charges ?? 0,
    discount: discountAmount,
    discount_amount: discountAmount,
    offer_discount_amount: response.offer_discount_amount ?? 0,
    round_off_amount: response.round_off_amount ?? 0,
    exact_total_amount: response.exact_total_amount ?? 0,
    grand_total: response.grand_total ?? 0,
    total: grandTotal,
  };

  return {
    valid: response.valid !== false,
    totals,
    message: response.message,
    couponValidation: response.coupon_validation,
    itemErrors: response.item_errors,
  };
}
