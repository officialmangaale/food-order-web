'use client';

import type { TrackingOrderItem } from '@/types/order';
import { formatMoney } from '@/utils/money';

interface OrderItemRowProps {
  item: TrackingOrderItem;
}

export function OrderItemRow({ item }: OrderItemRowProps) {
  const addonText = item.addons
    .map((addon) => `${addon.quantity && addon.quantity > 1 ? `${addon.quantity}x ` : ''}${addon.name}`)
    .join(', ');

  return (
    <div className="flex items-start gap-3 py-3 text-sm">
      <span className="mt-0.5 flex h-5 min-w-5 shrink-0 items-center justify-center rounded bg-surface-muted px-1 text-xs font-bold tabular-nums text-ink-muted">
        {item.quantity}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{item.name}</p>
        {item.variantName && <p className="mt-0.5 text-xs text-ink-subtle">{item.variantName}</p>}
        {addonText && <p className="mt-0.5 line-clamp-2 text-xs text-ink-subtle">{addonText}</p>}
      </div>
      <p className="shrink-0 font-bold text-ink">{formatMoney(item.lineTotal)}</p>
    </div>
  );
}
