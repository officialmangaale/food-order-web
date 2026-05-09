'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clock, Leaf, MapPin, Plus } from 'lucide-react';
import { formatDistance } from '@/utils/distance';
import { formatMoney } from '@/utils/money';
import type { CategoryFoodItem } from '@/types/category';

interface CategoryItemCardProps {
  item: CategoryFoodItem;
  onAdd: (item: CategoryFoodItem) => void;
}

export function CategoryItemCard({ item, onAdd }: CategoryItemCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const canShowImage = Boolean(item.imageUrl && !imageFailed);
  const isClosed = item.restaurantIsOpen === false;
  const disabled = !item.isAvailable || isClosed;
  const canCustomize = Boolean(
    item.hasVariants || item.hasAddons || (item.variants?.length ?? 0) > 0 || (item.addons?.length ?? 0) > 0
  );

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#F0DADA] bg-white shadow-[0_14px_34px_rgba(31,41,55,0.055)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(168,15,21,0.10)]">
      <div className="relative h-[160px] overflow-hidden bg-[#FFF0F0] sm:h-[172px] lg:h-[180px]">
        {canShowImage ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="food-placeholder flex h-full w-full items-center justify-center">
            <Leaf className="h-10 w-10 text-white/70" aria-hidden="true" />
          </div>
        )}

        {item.isVegetarian != null && (
          <span
            className={`absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-extrabold shadow-sm ${
              item.isVegetarian ? 'text-[#237A3B]' : 'text-[#A80F15]'
            }`}
          >
            {item.isVegetarian ? 'Veg' : 'Non-veg'}
          </span>
        )}

        {isClosed && (
          <span className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-extrabold text-white">
            Closed
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-4">
          <h3 className="line-clamp-2 min-h-10 text-base font-extrabold leading-snug text-[#1F1A1A]">
            {item.name}
          </h3>
          {canCustomize && (
            <span className="shrink-0 rounded-full bg-[#FFF0F0] px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#A80F15]">
              Custom
            </span>
          )}
        </div>

        <Link
          href={`/restaurants/${item.restaurantId}`}
          className="mt-2 truncate text-sm font-bold text-[#7B6B6B] transition hover:text-[#A80F15]"
        >
          {item.restaurantName}
        </Link>

        {item.description && (
          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-[#7B6B6B]">
            {item.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-[#7B6B6B]">
          {item.deliveryTime && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {item.deliveryTime}
            </span>
          )}
          {item.distanceKm != null && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {formatDistance(item.distanceKm)}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-4 pt-4">
          <p className="text-xl font-extrabold text-[#1F1A1A]">
            {item.displayPrice || formatMoney(item.price)}
          </p>
          <button
            type="button"
            aria-label={`Add ${item.name}`}
            onClick={() => onAdd(item)}
            disabled={disabled}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFF0F0] text-[#A80F15] shadow-[0_10px_24px_rgba(168,15,21,0.10)] transition hover:bg-[#A80F15] hover:text-white focus:outline-none focus:ring-4 focus:ring-[#B31317]/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
