'use client';

import { type FormEvent } from 'react';
import { Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CouponValidationMessage } from '@/components/coupon/CouponValidationMessage';
import type { CouponValidationResult } from '@/types/coupon';

interface CouponInputCardProps {
  id?: string;
  title?: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  onApply: () => void | Promise<void>;
  onRemove?: () => void;
  validation?: CouponValidationResult;
  loading?: boolean;
  error?: string;
  disabled?: boolean;
  idleText?: string;
}

export function CouponInputCard({
  id = 'coupon-code',
  title = 'Apply Coupon',
  description,
  value,
  onChange,
  onApply,
  onRemove,
  validation,
  loading,
  error,
  disabled,
  idleText,
}: CouponInputCardProps) {
  const canRemove = Boolean(value.trim() && onRemove);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onApply();
  };

  return (
    <section className="rounded-2xl border border-[#EAC4BE] bg-[#FFF8F3] p-5 shadow-[0_16px_40px_rgba(123,35,35,0.05)] sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#B4080B] text-white shadow-[0_8px_18px_rgba(180,8,11,0.18)]">
          <Tag className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold tracking-normal text-[#1F1717]">{title}</h2>
          {description && <p className="mt-1 text-sm font-medium text-[#7A5B5B]">{description}</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_112px]">
        <label htmlFor={id} className="sr-only">
          Coupon code
        </label>
        <div className="relative min-w-0">
          <input
            id={id}
            value={value}
            onChange={(event) => onChange(event.target.value.toUpperCase())}
            placeholder="Enter code"
            disabled={disabled || loading}
            className="h-[52px] w-full min-w-0 rounded-full border border-[#E7B8B3] bg-white px-5 pr-12 text-base font-bold uppercase tracking-normal text-[#2B2020] outline-none transition placeholder:font-medium placeholder:normal-case placeholder:text-[#B29B9B] focus:border-[#B31317] focus:ring-4 focus:ring-[#B31317]/10 disabled:bg-[#F6EEEE]"
          />
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#8A5555] transition hover:bg-[#FFF0F0] hover:text-[#A80F15]"
              aria-label="Remove coupon"
              title="Remove coupon"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <Button
          type="submit"
          loading={loading}
          disabled={disabled || !value.trim()}
          className="h-[52px] w-full rounded-full bg-[#A80F15] px-6 hover:bg-[#8F0D12]"
        >
          Apply
        </Button>
      </form>

      <CouponValidationMessage
        loading={loading}
        validation={validation}
        error={error}
        idleText={idleText}
      />
    </section>
  );
}
