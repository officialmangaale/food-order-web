'use client';

import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { formatMoney } from '@/utils/money';
import type { CouponValidationResult } from '@/types/coupon';

interface CouponValidationMessageProps {
  loading?: boolean;
  validation?: CouponValidationResult;
  error?: string;
  idleText?: string;
}

export function CouponValidationMessage({
  loading,
  validation,
  error,
  idleText,
}: CouponValidationMessageProps) {
  if (loading) {
    return (
      <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#8A5555]">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Checking coupon...
      </p>
    );
  }

  if (error) {
    return (
      <p className="mt-3 inline-flex items-start gap-2 text-sm font-semibold text-red-700">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{error}</span>
      </p>
    );
  }

  if (!validation) {
    return idleText ? <p className="mt-3 text-sm font-semibold text-[#7A5B5B]">{idleText}</p> : null;
  }

  if (validation.valid) {
    return (
      <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-green-700">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        Coupon applied
        {validation.discountAmount > 0 ? `: you save ${formatMoney(validation.discountAmount)}` : ''}
      </p>
    );
  }

  return (
    <p className="mt-3 inline-flex items-start gap-2 text-sm font-semibold text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{validation.reason || 'This coupon is not applicable.'}</span>
    </p>
  );
}
