'use client';

import { Tag } from 'lucide-react';
import { formatMoneyDecimal } from '@/utils/money';

interface AppliedCouponRowProps {
  code: string;
  discountAmount: number;
}

export function AppliedCouponRow({ code, discountAmount }: AppliedCouponRowProps) {
  if (discountAmount <= 0) return null;

  return (
    <div className="flex items-baseline justify-between gap-4 text-sm font-bold text-success">
      <dt className="inline-flex min-w-0 items-center gap-1.5">
        <Tag className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">Coupon {code}</span>
      </dt>
      <dd className="shrink-0 tabular-nums">-{formatMoneyDecimal(discountAmount)}</dd>
    </div>
  );
}
