import { restaurantPost } from './http';
import { unwrapApiResponse } from '@/utils/apiAdapters';
import type { CouponValidationRequest, CouponValidationResult } from '@/types/coupon';

/** POST /customer-web/coupons/validate */
export async function validateCoupon(
  payload: CouponValidationRequest
): Promise<CouponValidationResult> {
  const raw = await restaurantPost<unknown>('/customer-web/coupons/validate', payload);
  return normalizeCouponValidationResult(unwrapApiResponse<unknown>(raw));
}

export function normalizeCouponValidationResult(raw: unknown): CouponValidationResult {
  const data = asRecord(raw) ?? {};
  const coupon = normalizeCoupon(data.coupon);
  const discountAmount = readNumber(
    data.discount_amount ?? data.discountAmount ?? data.discount
  ) ?? 0;
  const valid =
    readBoolean(data.valid ?? data.is_valid ?? data.isValid ?? data.applicable) ??
    Boolean(coupon && discountAmount > 0);

  return {
    valid,
    reason: readString(data.reason ?? data.message ?? data.error),
    coupon,
    discountAmount,
    payableSubtotal: readNumber(data.payable_subtotal ?? data.payableSubtotal),
  };
}

export function normalizeCoupon(rawInput: unknown): CouponValidationResult['coupon'] | undefined {
  const raw = asRecord(rawInput);
  if (!raw) return undefined;

  const code = readString(raw.code ?? raw.coupon_code ?? raw.couponCode);
  const couponId = readNumber(raw.coupon_id ?? raw.couponId ?? raw.id) ?? 0;
  const discountType = normalizeDiscountType(raw.discount_type ?? raw.discountType);

  if (!code && !couponId) return undefined;

  return {
    couponId,
    code: code ?? '',
    title: readString(raw.title ?? raw.name),
    description: readString(raw.description),
    discountType,
    discountValue: readNumber(raw.discount_value ?? raw.discountValue),
    maxDiscount: readNumber(raw.max_discount ?? raw.maxDiscount),
    minOrderValue: readNumber(raw.min_order_value ?? raw.minOrderValue),
  };
}

function normalizeDiscountType(value: unknown) {
  const normalized = readString(value)?.toLowerCase();
  if (normalized === 'percentage' || normalized === 'percent') return 'percentage';
  if (normalized === 'flat' || normalized === 'fixed' || normalized === 'amount') return 'flat';
  return undefined;
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
    if (['true', '1', 'yes', 'valid', 'success', 'applicable'].includes(normalized)) return true;
    if (['false', '0', 'no', 'invalid', 'failed', 'not_applicable'].includes(normalized)) return false;
  }
  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}
