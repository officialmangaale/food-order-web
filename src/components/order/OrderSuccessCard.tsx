'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { TrackingOrder } from '@/types/order';
import { isNegativeStatus } from '@/types/order';
import { getTrackingCopy } from '@/utils/orderStatus';

interface OrderSuccessCardProps {
  order: TrackingOrder;
}

export function OrderSuccessCard({ order }: OrderSuccessCardProps) {
  const copy = getTrackingCopy(order);
  const negative = isNegativeStatus(order.orderStatus);

  return (
    <Card as="section" className="px-5 py-8 text-center sm:px-8 sm:py-10">
      <span
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
          negative ? 'bg-danger-tint text-danger' : 'bg-success-tint text-success'
        }`}
        aria-hidden="true"
      >
        {negative ? <XCircle className="h-8 w-8" /> : <CheckCircle2 className="h-8 w-8" />}
      </span>

      <h1 className="mt-5 text-title text-ink">{copy.title}</h1>
      <p className="mt-2 text-sm leading-6 text-ink-muted sm:text-base">{copy.subtitle}</p>

      <p className="mt-5 inline-flex items-center rounded-full bg-surface-muted px-4 py-2 text-sm font-bold text-ink">
        Order {order.displayOrderId}
      </p>

      {order.cancellationReason && (
        <p className="mx-auto mt-4 max-w-md rounded-control bg-surface-sunken px-4 py-3 text-sm font-semibold text-ink-muted">
          {order.cancellationReason}
        </p>
      )}
    </Card>
  );
}
