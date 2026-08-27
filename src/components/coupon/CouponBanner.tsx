'use client';

import { ButtonLink } from '@/components/ui/Button';
import { AlertCircle, CheckCircle2, Tag, X } from 'lucide-react';
import { formatMoney } from '@/utils/money';
import type { CouponValidationResult } from '@/types/coupon';

interface CouponBannerProps {
  couponCode: string;
  validation?: CouponValidationResult;
  checkoutHref?: string;
  onDismiss?: () => void;
}

export function CouponBanner({
  couponCode,
  validation,
  checkoutHref = '/checkout',
  onDismiss,
}: CouponBannerProps) {
  const title = getTitle(couponCode, validation);
  const description = getDescription(validation);
  const isInvalid = validation?.valid === false;
  const isValid = validation?.valid === true;

  return (
    <section className="page-container pt-6">
      <div className="relative overflow-hidden rounded-card border border-cherry-200 bg-cherry-50 px-5 py-4 shadow-card sm:px-6">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-cherry-800" aria-hidden="true" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-cherry-800 text-white">
              {isValid ? (
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              ) : isInvalid ? (
                <AlertCircle className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Tag className="h-5 w-5" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-base font-extrabold text-ink">{title}</p>
              <p className="mt-1 text-sm text-ink-muted">{description}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="rounded-full border border-dashed border-cherry-700 bg-surface px-4 py-2 text-sm font-extrabold text-cherry-800">
              {couponCode}
            </span>
            <ButtonLink href={checkoutHref} variant="offer" size="sm">
              Apply at checkout
            </ButtonLink>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="flex h-10 w-10 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface hover:text-cherry-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25"
                aria-label="Dismiss coupon"
                title="Dismiss coupon"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function getTitle(couponCode: string, validation?: CouponValidationResult) {
  if (validation?.valid && validation.discountAmount > 0) {
    return `${couponCode} applied: you save ${formatMoney(validation.discountAmount)}`;
  }

  if (validation?.valid === false) {
    return `${couponCode} is not applicable`;
  }

  return `Coupon ${couponCode} is ready for checkout`;
}

function getDescription(validation?: CouponValidationResult) {
  if (validation?.valid === false) {
    return validation.reason || 'This coupon cannot be used for the current cart.';
  }

  if (validation?.valid) {
    return 'Discount is confirmed by backend validation.';
  }

  return 'Discount will be validated at checkout.';
}
