'use client';

import { useState } from 'react';
import { Minus, Plus, Trash2, Utensils } from 'lucide-react';
import { formatMoney } from '@/utils/money';
import { getCartLineTotal, getVariantAddonSummary } from '@/components/cart/cartUtils';
import type { CartItem } from '@/types/cart';

interface CartItemRowProps {
  item: CartItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

export function CartItemRow({ item, onIncrease, onDecrease, onRemove }: CartItemRowProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = item.image_url && !imageFailed ? item.image_url : undefined;
  const details = getVariantAddonSummary(item);

  return (
    <article className="grid gap-4 py-5 sm:grid-cols-[104px_minmax(0,1fr)_auto] sm:items-center">
      <div className="flex gap-4 sm:contents">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#FCE4E0] sm:h-[104px] sm:w-[104px]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.name}
              className="h-full w-full object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <Utensils className="h-8 w-8 text-[#8D5F5F]" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-extrabold leading-snug tracking-normal text-[#1F1717] sm:text-xl">
            {item.name}
          </h3>
          {details && <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#6B4B4B]">{details}</p>}
          {!details && item.category_name && (
            <p className="mt-1 text-sm leading-6 text-[#6B4B4B]">{item.category_name}</p>
          )}
          <p className="mt-3 text-2xl font-extrabold tracking-normal text-[#1F1717]">
            {formatMoney(getCartLineTotal(item))}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <div className="flex h-11 items-center rounded-full border border-[#E5A8A8] bg-white text-[#A80F15]">
          <button
            type="button"
            onClick={onDecrease}
            className="flex h-11 w-11 items-center justify-center rounded-l-full transition hover:bg-[#FFF0F0]"
            aria-label={`Decrease ${item.name}`}
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="min-w-9 text-center text-base font-extrabold text-[#1F1717]">{item.quantity}</span>
          <button
            type="button"
            onClick={onIncrease}
            className="flex h-11 w-11 items-center justify-center rounded-r-full transition hover:bg-[#FFF0F0]"
            aria-label={`Increase ${item.name}`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FCEBE9] text-[#7A3B3B] transition hover:bg-[#F7D8D4] hover:text-[#A80F15]"
          aria-label={`Remove ${item.name}`}
        >
          <Trash2 className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
