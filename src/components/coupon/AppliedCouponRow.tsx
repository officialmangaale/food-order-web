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
    <div className="flex justify-between gap-4 text-base font-bold text-green-700">
      <span className="inline-flex min-w-0 items-center gap-2">
        <Tag className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">Discount {code}</span>
      </span>
      <span>-{formatMoneyDecimal(discountAmount)}</span>
    </div>
  );
}
