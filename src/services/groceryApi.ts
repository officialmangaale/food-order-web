import { restaurantGet, restaurantPost } from '@/services/http';
import {
  normalizeGroceryCartValidation,
  normalizeGroceryMerchants,
  normalizeGroceryOrderResponse,
  normalizeGroceryProducts,
  normalizeGroceryTrackingOrder,
} from '@/utils/groceryAdapter';
import type {
  GroceryCartValidateRequest,
  GroceryCartValidateResponse,
  GroceryMerchant,
  GroceryMerchantProducts,
  GroceryPlaceOrderRequest,
  GroceryPlaceOrderResponse,
  GroceryTrackingOrder,
} from '@/types/grocery';

export async function fetchGroceryMerchants(params: {
  lat: number;
  lng: number;
  radiusKm?: number;
}): Promise<GroceryMerchant[]> {
  const query = new URLSearchParams();
  query.set('lat', String(params.lat));
  query.set('lng', String(params.lng));
  query.set('radius_km', String(params.radiusKm ?? 7));

  const raw = await restaurantGet<unknown>(`/customer-web/grocery/merchants?${query.toString()}`);
  return normalizeGroceryMerchants(raw);
}

export async function fetchGroceryMerchantProducts(params: {
  merchantId: number | string;
  lat: number;
  lng: number;
}): Promise<GroceryMerchantProducts> {
  const query = new URLSearchParams();
  query.set('lat', String(params.lat));
  query.set('lng', String(params.lng));

  const raw = await restaurantGet<unknown>(
    `/customer-web/grocery/merchants/${encodeURIComponent(String(params.merchantId))}/products?${query.toString()}`
  );
  return normalizeGroceryProducts(raw, Number(params.merchantId));
}

export async function validateGroceryCart(
  payload: GroceryCartValidateRequest
): Promise<GroceryCartValidateResponse> {
  const raw = await restaurantPost<unknown>('/customer-web/grocery/cart/validate', payload);
  return normalizeGroceryCartValidation(raw);
}

export async function placeGroceryOrder(
  payload: GroceryPlaceOrderRequest,
  options: { token?: string; idempotencyKey?: string } = {}
): Promise<GroceryPlaceOrderResponse> {
  const raw = await restaurantPost<unknown>('/customer-web/grocery/orders', payload, {
    token: options.token,
    headers: options.idempotencyKey ? { 'Idempotency-Key': options.idempotencyKey } : undefined,
  });
  return normalizeGroceryOrderResponse(raw);
}

export async function trackGroceryOrder(
  orderId: number | string,
  token?: string
): Promise<GroceryTrackingOrder> {
  const raw = await restaurantGet<unknown>(
    `/customer-web/grocery/orders/${encodeURIComponent(String(orderId))}/track`,
    token
  );
  return normalizeGroceryTrackingOrder(raw);
}
