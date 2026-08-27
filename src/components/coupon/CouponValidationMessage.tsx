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
      <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-ink-muted">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Checking coupon...
      </p>
    );
  }

  if (error) {
    return (
      <p className="mt-3 inline-flex items-start gap-2 text-sm font-semibold text-danger">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{error}</span>
      </p>
    );
  }

  if (!validation) {
    return idleText ? <p className="mt-3 text-sm font-semibold text-ink-muted">{idleText}</p> : null;
  }

  if (validation.valid) {
    return (
      <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-success">
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        Coupon applied
        {validation.discountAmount > 0 ? `: you save ${formatMoney(validation.discountAmount)}` : ''}
      </p>
    );
  }

  return (
    <p className="mt-3 inline-flex items-start gap-2 text-sm font-semibold text-danger">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{validation.reason || 'This coupon is not applicable.'}</span>
    </p>
  );
}
