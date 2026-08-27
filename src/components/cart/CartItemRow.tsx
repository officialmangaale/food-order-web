'use client';

import { Trash2 } from 'lucide-react';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { Thumbnail } from '@/components/ui/Thumbnail';
import { Price } from '@/components/ui/FoodMeta';
import { getCartLineTotal, getVariantAddonSummary } from '@/components/cart/cartUtils';
import type { CartItem } from '@/types/cart';

interface CartItemRowProps {
  item: CartItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

export function CartItemRow({ item, onIncrease, onDecrease, onRemove }: CartItemRowProps) {
  const details = getVariantAddonSummary(item);

  return (
    <article className="flex gap-3 py-4 sm:gap-4 sm:py-5">
      <div className="h-20 w-20 shrink-0 sm:h-24 sm:w-24">
        <Thumbnail
          src={item.image_url}
          alt={item.name}
          ratio="square"
          className="h-full rounded-control"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="text-sm font-extrabold leading-snug text-ink sm:text-base">{item.name}</h3>

        {details ? (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-muted sm:text-sm">{details}</p>
        ) : item.category_name ? (
          <p className="mt-1 text-xs leading-5 text-ink-muted sm:text-sm">{item.category_name}</p>
        ) : null}

        {/* Price and controls share one row so the card height is constant. */}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
          <Price amount={getCartLineTotal(item)} size="md" />

          <div className="flex items-center gap-2">
            <QuantityStepper
              quantity={item.quantity}
              onIncrease={onIncrease}
              onDecrease={onDecrease}
              itemName={item.name}
              size="sm"
            />
            <button
              type="button"
              onClick={onRemove}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-subtle transition-colors hover:bg-danger-tint hover:text-danger focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25"
              aria-label={`Remove ${item.name} from cart`}
            >
              <Trash2 className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
