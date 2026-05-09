import { restaurantPost, restaurantGet } from './http';
import { unwrapApiResponse } from '@/utils/apiAdapters';
import type { CartValidateRequest, CartValidateResponse } from '@/types/cart';
import type { PlaceOrderRequest, PlaceOrderResponse, TrackingOrder } from '@/types/order';
import { normalizeTrackingOrder } from '@/utils/orderTrackingAdapter';

/** POST /customer-web/cart/validate */
export async function validateCart(payload: CartValidateRequest): Promise<CartValidateResponse> {
  const raw = await restaurantPost<unknown>('/customer-web/cart/validate', payload);
  return normalizeCartValidateResponse(unwrapApiResponse<unknown>(raw));
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
  return normalizePlaceOrderResponse(unwrapApiResponse<unknown>(raw));
}

/** GET /customer-web/orders/:id/track (requires JWT) */
export async function trackOrder(orderId: number, token: string): Promise<TrackingOrder> {
  const raw = await restaurantGet<unknown>(`/customer-web/orders/${orderId}/track`, token);
  return normalizeTrackingOrder(unwrapApiResponse<unknown>(raw));
}

function normalizeCartValidateResponse(raw: unknown): CartValidateResponse {
  const data = asRecord(raw);
  if (!data) return { valid: false, message: 'Cart validation failed.' };

  const cgst = readNumber(data.cgst);
  const sgst = readNumber(data.sgst);
  const taxAmount = readNumber(data.tax_amount ?? data.taxAmount);
  const taxes = readNumber(data.taxes) ?? taxAmount ?? sumDefined(cgst, sgst);
  const deliveryFee = readNumber(
    data.delivery_fee ?? data.deliveryFee ?? data.delivery_charge ?? data.deliveryCharge
  );
  const discount = readNumber(
    data.discount ?? data.discount_amount ?? data.discountAmount
  );
  const subtotal = readNumber(data.subtotal) ?? 0;
  const explicitTotal = readNumber(
    data.total ?? data.grand_total ?? data.grandTotal ?? data.payable_total ?? data.payableTotal
  );
  const computedTotal = Math.max(0, subtotal + (taxes ?? 0) + (deliveryFee ?? 0) - (discount ?? 0));
  const total = explicitTotal ?? computedTotal;

  return {
    valid: readBoolean(data.valid ?? data.success) ?? true,
    subtotal,
    cgst,
    sgst,
    tax_amount: taxAmount,
    taxes: taxes ?? 0,
    delivery_charge: deliveryFee,
    delivery_fee: deliveryFee ?? 0,
    discount_amount: discount,
    discount: discount ?? 0,
    grand_total: total,
    total,
    message: readString(data.message ?? data.error),
    item_errors: Array.isArray(data.item_errors)
      ? (data.item_errors as CartValidateResponse['item_errors'])
      : Array.isArray(data.itemErrors)
        ? (data.itemErrors as CartValidateResponse['item_errors'])
        : undefined,
  };
}

function normalizePlaceOrderResponse(raw: unknown): PlaceOrderResponse {
  const data = asRecord(raw);
  const order = asRecord(data?.order) ?? asRecord(data?.data) ?? data ?? {};

  return {
    order_id: readNumber(order.order_id ?? order.orderId ?? order.id) ?? 0,
    order_number: readString(order.order_number ?? order.orderNumber),
    status: (readString(order.status) ?? 'placed') as PlaceOrderResponse['status'],
    total: readNumber(order.total ?? order.grand_total ?? order.grandTotal),
    message: readString(order.message),
  };
}

function sumDefined(...values: (number | undefined)[]) {
  const present = values.filter((value): value is number => value != null);
  if (present.length === 0) return undefined;
  return present.reduce((sum, value) => sum + value, 0);
}

function readString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'valid', 'success'].includes(normalized)) return true;
    if (['false', '0', 'no', 'invalid', 'failed'].includes(normalized)) return false;
  }
  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}
