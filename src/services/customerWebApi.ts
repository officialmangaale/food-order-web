import { restaurantPost, restaurantGet } from './http';
import { normalizeCoupon } from './couponApi';
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

  const summary = getBillingSummary(data);
  const cgst = readBillingNumber(summary.record, data, ['cgst', 'cgst_amount', 'cgstAmount']);
  const sgst = readBillingNumber(summary.record, data, ['sgst', 'sgst_amount', 'sgstAmount']);
  const taxAmount = readBillingNumber(summary.record, data, ['tax_amount', 'taxAmount', 'taxes']);
  const taxes = readBillingNumber(summary.record, data, ['taxes']) ?? taxAmount;
  const platformFee = readBillingNumber(summary.record, data, [
    'platform_fee_amount',
    'platformFeeAmount',
    'platform_fee',
    'platformFee',
  ]);
  const deliveryFee = readBillingNumber(summary.record, data, [
    'delivery_fee',
    'deliveryFee',
    'delivery_fee_amount',
    'deliveryFeeAmount',
    'delivery_charge',
    'deliveryCharge',
  ]);
  const extraCharges = readBillingNumber(summary.record, data, [
    'extra_charges',
    'extraCharges',
    'extra_charges_amount',
    'extraChargesAmount',
  ]);
  const discount = readBillingNumber(summary.record, data, [
    'discount_amount',
    'discountAmount',
    'coupon_discount',
    'couponDiscount',
    'discount',
  ]);
  const offerDiscount = readBillingNumber(summary.record, data, ['offer_discount_amount', 'offerDiscountAmount']);
  const couponValidation = normalizeCartCouponValidation(data, discount);
  const subtotal = readBillingNumber(summary.record, data, ['subtotal', 'item_subtotal', 'itemSubtotal']) ?? 0;
  const exactTotal = readBillingNumber(summary.record, data, ['exact_total_amount', 'exactTotalAmount', 'exact_total']);
  const roundOff = readBillingNumber(summary.record, data, [
    'round_off_amount',
    'roundOffAmount',
    'round_off',
    'roundOff',
  ]);
  const explicitTotal = readBillingNumber(summary.record, data, [
    'grand_total',
    'grandTotal',
    'total_amount',
    'totalAmount',
    'exact_total_amount',
    'exactTotalAmount',
    'exact_total',
    'total',
    'payable_total',
    'payableTotal',
  ]);
  const mappedSnapshot = {
    subtotal,
    discount_amount: discount,
    offer_discount_amount: offerDiscount,
    delivery_fee: deliveryFee,
    extra_charges: extraCharges,
    cgst,
    sgst,
    tax_amount: taxAmount,
    platform_fee_amount: platformFee,
    round_off_amount: roundOff,
    exact_total_amount: exactTotal,
    grand_total: explicitTotal,
  };
  const missingFields = Object.entries(mappedSnapshot)
    .filter(([, value]) => value == null)
    .map(([field]) => field);
  const snapshotComplete = missingFields.length === 0;

  debugBillingSummary('validate', data, summary, mappedSnapshot, missingFields);

  return {
    valid:
      (readBoolean(data.is_valid ?? data.isValid ?? data.valid ?? data.success) ?? true) &&
      snapshotComplete,
    billing_snapshot_complete: snapshotComplete,
    billing_snapshot_missing_fields: missingFields,
    subtotal,
    cgst,
    sgst,
    tax_amount: taxAmount,
    taxes: taxes ?? 0,
    platform_fee: platformFee ?? 0,
    platform_fee_amount: platformFee ?? 0,
    delivery_charge: deliveryFee,
    delivery_fee: deliveryFee ?? 0,
    extra_charges: extraCharges ?? 0,
    discount_amount: discount,
    offer_discount_amount: offerDiscount ?? 0,
    discount: discount ?? 0,
    coupon_validation: couponValidation,
    exact_total_amount: exactTotal,
    round_off_amount: roundOff ?? 0,
    grand_total: explicitTotal,
    total: explicitTotal,
    message:
      readString(data.message ?? data.error) ??
      (snapshotComplete ? undefined : `Incomplete billing summary: ${missingFields.join(', ')}`),
    item_errors: Array.isArray(data.item_errors)
      ? (data.item_errors as CartValidateResponse['item_errors'])
      : Array.isArray(data.itemErrors)
        ? (data.itemErrors as CartValidateResponse['item_errors'])
        : undefined,
  };
}

function normalizeCartCouponValidation(
  data: Record<string, unknown>,
  discount: number | undefined
): CartValidateResponse['coupon_validation'] {
  const couponRaw =
    asRecord(data.coupon) ??
    asRecord(data.applied_coupon) ??
    asRecord(data.appliedCoupon);
  const coupon = normalizeCoupon(couponRaw);
  const couponCode = readString(
    data.coupon_code ?? data.couponCode ?? couponRaw?.code ?? couponRaw?.coupon_code
  );
  const couponValid = readBoolean(
    data.coupon_valid ??
      data.couponValid ??
      data.is_coupon_valid ??
      data.isCouponValid ??
      couponRaw?.valid ??
      couponRaw?.is_valid
  );
  const reason = readString(
    data.coupon_reason ??
      data.couponReason ??
      data.coupon_error ??
      data.couponError ??
      couponRaw?.reason ??
      couponRaw?.message
  );
  const payableSubtotal = readNumber(data.payable_subtotal ?? data.payableSubtotal);
  const hasCouponSignal =
    Boolean(coupon || couponCode || reason || payableSubtotal != null || couponValid != null);

  if (!hasCouponSignal) return undefined;

  return {
    valid: couponValid ?? Boolean((discount ?? 0) > 0 || coupon),
    reason,
    coupon,
    discountAmount: discount ?? 0,
    payableSubtotal,
  };
}

function normalizePlaceOrderResponse(raw: unknown): PlaceOrderResponse {
  const data = asRecord(raw);
  const order = asRecord(data?.order) ?? asRecord(data?.data) ?? data ?? {};
  const fallback = data && data !== order ? mergeRecords(data, order) : order;
  const summary = getBillingSummary(fallback);
  const total = readBillingNumber(summary.record, fallback, [
    'grand_total',
    'grandTotal',
    'total_amount',
    'totalAmount',
    'exact_total_amount',
    'exactTotalAmount',
    'exact_total',
    'total',
    'payable_total',
    'payableTotal',
  ]);

  const deliveryFee = readBillingNumber(summary.record, fallback, [
    'delivery_fee',
    'deliveryFee',
    'delivery_fee_amount',
    'deliveryFeeAmount',
    'delivery_charge',
    'deliveryCharge',
  ]);

  debugBillingSummary('place-order', fallback, summary, {
    subtotal: readBillingNumber(summary.record, fallback, ['subtotal', 'item_subtotal', 'itemSubtotal']),
    discount_amount: readBillingNumber(summary.record, fallback, [
      'discount_amount',
      'discountAmount',
      'coupon_discount',
      'couponDiscount',
      'discount',
    ]),
    offer_discount_amount: readBillingNumber(summary.record, fallback, ['offer_discount_amount', 'offerDiscountAmount']),
    delivery_fee: deliveryFee,
    extra_charges: readBillingNumber(summary.record, fallback, [
      'extra_charges',
      'extraCharges',
      'extra_charges_amount',
      'extraChargesAmount',
    ]),
    cgst: readBillingNumber(summary.record, fallback, ['cgst', 'cgst_amount', 'cgstAmount']),
    sgst: readBillingNumber(summary.record, fallback, ['sgst', 'sgst_amount', 'sgstAmount']),
    tax_amount: readBillingNumber(summary.record, fallback, ['tax_amount', 'taxAmount', 'taxes']),
    platform_fee_amount: readBillingNumber(summary.record, fallback, [
      'platform_fee_amount',
      'platformFeeAmount',
      'platform_fee',
      'platformFee',
    ]),
    round_off_amount: readBillingNumber(summary.record, fallback, ['round_off_amount', 'roundOffAmount', 'round_off']),
    exact_total_amount: readBillingNumber(summary.record, fallback, ['exact_total_amount', 'exactTotalAmount', 'exact_total']),
    grand_total: total,
  });

  return {
    order_id: readNumber(order.order_id ?? order.orderId ?? order.id) ?? 0,
    order_number: readString(order.order_number ?? order.orderNumber),
    status: (readString(order.status) ?? 'placed') as PlaceOrderResponse['status'],
    payment_status: readString(order.payment_status ?? order.paymentStatus),
    subtotal: readBillingNumber(summary.record, fallback, ['subtotal', 'item_subtotal', 'itemSubtotal']),
    cgst: readBillingNumber(summary.record, fallback, ['cgst', 'cgst_amount', 'cgstAmount']),
    sgst: readBillingNumber(summary.record, fallback, ['sgst', 'sgst_amount', 'sgstAmount']),
    tax_amount: readBillingNumber(summary.record, fallback, ['tax_amount', 'taxAmount', 'taxes']),
    discount_amount: readBillingNumber(summary.record, fallback, [
      'discount_amount',
      'discountAmount',
      'coupon_discount',
      'couponDiscount',
      'discount',
    ]),
    offer_discount_amount: readBillingNumber(summary.record, fallback, ['offer_discount_amount', 'offerDiscountAmount']),
    delivery_fee: deliveryFee,
    platform_fee_amount: readBillingNumber(summary.record, fallback, [
      'platform_fee_amount',
      'platformFeeAmount',
      'platform_fee',
      'platformFee',
    ]),
    extra_charges: readBillingNumber(summary.record, fallback, [
      'extra_charges',
      'extraCharges',
      'extra_charges_amount',
      'extraChargesAmount',
    ]),
    round_off_amount: readBillingNumber(summary.record, fallback, ['round_off_amount', 'roundOffAmount', 'round_off']),
    exact_total_amount: readBillingNumber(summary.record, fallback, ['exact_total_amount', 'exactTotalAmount', 'exact_total']),
    grand_total: total,
    total,
    tracking_url: readString(order.tracking_url ?? order.trackingUrl),
    message: readString(order.message),
  };
}

function mergeRecords(base: Record<string, unknown>, override: Record<string, unknown>) {
  return { ...base, ...override };
}

function getBillingSummary(data: Record<string, unknown>) {
  const billBreakdown =
    asRecord(data.bill_breakdown) ??
    asRecord(data.billBreakdown) ??
    asRecord(data.billing_breakdown) ??
    asRecord(data.billingBreakdown);
  if (billBreakdown) return { source: 'bill_breakdown', record: billBreakdown };

  const billBreakdownRows =
    asBillingRows(data.bill_breakdown) ??
    asBillingRows(data.billBreakdown) ??
    asBillingRows(data.billing_breakdown) ??
    asBillingRows(data.billingBreakdown);
  if (billBreakdownRows) return { source: 'bill_breakdown', record: billBreakdownRows };

  const summary = asRecord(data.summary);
  if (summary) return { source: 'summary', record: summary };

  const pricing = asRecord(data.pricing);
  if (pricing) return { source: 'pricing', record: pricing };

  return { source: 'root', record: data };
}

function asBillingRows(value: unknown): Record<string, unknown> | null {
  if (!Array.isArray(value)) return null;

  const result: Record<string, unknown> = {};
  for (const rowValue of value) {
    const row = asRecord(rowValue);
    if (!row) continue;

    const key = readString(row.key ?? row.code ?? row.type ?? row.name ?? row.label ?? row.title);
    if (!key) continue;

    result[normalizeBillingKey(key)] =
      row.amount ?? row.value ?? row.price ?? row.total ?? row.fee ?? row.charge ?? row.discount_amount;
  }

  return Object.keys(result).length > 0 ? result : null;
}

function normalizeBillingKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function readBillingNumber(
  summary: Record<string, unknown>,
  fallback: Record<string, unknown>,
  keys: string[]
) {
  for (const key of keys) {
    const value = readNumber(summary[key]);
    if (value != null) return value;
  }

  if (summary !== fallback) {
    for (const key of keys) {
      const value = readNumber(fallback[key]);
      if (value != null) return value;
    }
  }

  return undefined;
}

function debugBillingSummary(
  source: 'validate' | 'place-order',
  root: Record<string, unknown>,
  summary: { source: string; record: Record<string, unknown> },
  mapped: Record<string, number | undefined>,
  missingFields: string[] = []
) {
  if (process.env.NODE_ENV === 'production') return;

  const renderedFields = Object.entries(mapped)
    .filter(([, value]) => value != null && value !== 0)
    .map(([key]) => key);

  console.debug('[checkout-billing]', {
    source,
    summaryObject: summary.source,
    rootKeys: Object.keys(root),
    summaryKeys: Object.keys(summary.record),
    renderedFields,
    missingFields,
  });
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
