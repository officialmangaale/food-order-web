import { restaurantPost, restaurantGet } from './http';
import { unwrapApiResponse } from '@/utils/apiAdapters';
import type { CartValidateRequest, CartValidateResponse } from '@/types/cart';
import type { PlaceOrderRequest, PlaceOrderResponse, OrderTrackingResponse } from '@/types/order';

/** POST /customer-web/cart/validate */
export async function validateCart(payload: CartValidateRequest): Promise<CartValidateResponse> {
  const raw = await restaurantPost<unknown>('/customer-web/cart/validate', payload);
  return unwrapApiResponse<CartValidateResponse>(raw);
}

/** POST /customer-web/orders (requires JWT + Idempotency-Key) */
export async function placeOrder(
  payload: PlaceOrderRequest,
  token: string,
  idempotencyKey: string
): Promise<PlaceOrderResponse> {
  const raw = await restaurantPost<unknown>('/customer-web/orders', payload, {
    token,
    headers: { 'Idempotency-Key': idempotencyKey },
  });
  return unwrapApiResponse<PlaceOrderResponse>(raw);
}

/** GET /customer-web/orders/:id/track (requires JWT) */
export async function trackOrder(orderId: number, token: string): Promise<OrderTrackingResponse> {
  const raw = await restaurantGet<unknown>(`/customer-web/orders/${orderId}/track`, token);
  return unwrapApiResponse<OrderTrackingResponse>(raw);
}
