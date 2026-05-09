'use client';

import Link from 'next/link';
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
    <section className="mx-auto max-w-[1280px] px-4 pt-6 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-2xl border border-[#E9B6A8] bg-[#FFF4EA] px-5 py-4 shadow-[0_14px_34px_rgba(123,35,35,0.08)] sm:px-6">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-[#B4080B]" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#B4080B] text-white">
              {isValid ? (
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              ) : isInvalid ? (
                <AlertCircle className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Tag className="h-5 w-5" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-base font-extrabold text-[#1F1717] sm:text-lg">{title}</p>
              <p className="mt-1 text-sm font-medium text-[#6B4B4B]">{description}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="rounded-full border border-dashed border-[#B4080B] bg-white px-4 py-2 text-sm font-extrabold tracking-normal text-[#A80F15]">
              {couponCode}
            </span>
            <Link
              href={checkoutHref}
              className="rounded-full bg-[#A80F15] px-4 py-2 text-sm font-extrabold text-white shadow-[0_10px_20px_rgba(168,15,21,0.16)] transition hover:bg-[#8F0D12]"
            >
              Apply at checkout
            </Link>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#7A5B5B] transition hover:bg-white hover:text-[#A80F15]"
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
