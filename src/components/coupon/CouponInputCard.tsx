'use client';

import { type FormEvent } from 'react';
import { Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
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
  title = 'Apply coupon',
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
    <Card as="section">
      <CardHeader
        title={title}
        description={description}
        icon={<Tag className="h-5 w-5" aria-hidden="true" />}
      />

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Input
          id={id}
          aria-label="Coupon code"
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          placeholder="Enter code"
          disabled={disabled || loading}
          className="uppercase placeholder:normal-case"
          rightSlot={
            canRemove ? (
              <button
                type="button"
                onClick={onRemove}
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink-subtle transition-colors hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/25"
                aria-label="Remove coupon"
                title="Remove coupon"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : undefined
          }
        />
        <Button
          type="submit"
          loading={loading}
          disabled={disabled || !value.trim()}
          className="sm:w-28 sm:shrink-0"
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
    </Card>
  );
}
