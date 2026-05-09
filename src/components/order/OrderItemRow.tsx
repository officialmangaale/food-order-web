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
    <div className="grid grid-cols-[34px_minmax(0,1fr)_auto] items-start gap-3 py-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF0F0] text-sm font-extrabold text-[#5A3C3C]">
        {item.quantity}
      </span>
      <div className="min-w-0">
        <p className="truncate text-base font-extrabold tracking-[0.04em] text-[#1F1717]">{item.name}</p>
        {item.variantName && <p className="mt-0.5 text-sm font-medium text-[#6B4B4B]">{item.variantName}</p>}
        {addonText && <p className="mt-0.5 line-clamp-2 text-sm text-[#7B5C5C]">{addonText}</p>}
      </div>
      <p className="text-base font-extrabold text-[#1F1717]">{formatMoney(item.lineTotal)}</p>
    </div>
  );
}
