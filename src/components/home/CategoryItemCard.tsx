'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clock, Leaf, MapPin } from 'lucide-react';
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
    <article className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-[#E3E7EA] bg-white shadow-[0_12px_34px_rgba(23,32,51,0.055)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(14,75,71,0.10)]">
      <div className="relative h-24 overflow-hidden bg-[#F3FBF9] sm:h-[172px] lg:h-[180px]">
        {canShowImage ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
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
            className={`absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-extrabold shadow-sm sm:left-3 sm:top-3 sm:px-2.5 sm:text-xs ${
              item.isVegetarian ? 'text-[#22C55E]' : 'text-[#EF4444]'
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

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <h3 className="line-clamp-2 min-h-9 text-sm font-extrabold leading-snug text-[#172033] sm:min-h-10 sm:text-base">
            {item.name}
          </h3>
          {canCustomize && (
            <span className="hidden shrink-0 rounded-full bg-[#E8F8F5] px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#0E4B47] sm:inline-flex">
              Custom
            </span>
          )}
        </div>

        <Link
          href={`/restaurants/${item.restaurantId}`}
          className="mt-2 hidden truncate text-sm font-bold text-[#737B8C] transition hover:text-[#0E4B47] sm:block"
        >
          {item.restaurantName}
        </Link>

        {item.description && (
          <p className="mt-1.5 line-clamp-1 min-h-5 text-xs leading-5 text-[#737B8C] sm:mt-2 sm:line-clamp-2 sm:min-h-10 sm:text-sm">
            {item.description}
          </p>
        )}

        <div className="mt-3 hidden flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-[#737B8C] sm:flex">
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

        <div className="mt-auto flex items-end justify-between gap-2 pt-3 sm:gap-4 sm:pt-4">
          <p className="text-sm font-extrabold text-[#172033] sm:text-xl">
            {item.displayPrice || formatMoney(item.price)}
          </p>
          <button
            type="button"
            aria-label={`Add ${item.name}`}
            onClick={() => onAdd(item)}
            disabled={disabled}
            className="flex h-9 min-w-[64px] shrink-0 items-center justify-center rounded-full border border-[#16B8A6] bg-white px-3 text-xs font-extrabold text-[#16B8A6] transition hover:bg-[#16B8A6] hover:text-white focus:outline-none focus:ring-4 focus:ring-[#16B8A6]/10 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:min-w-[86px] sm:px-5 sm:text-sm"
          >
            ADD
          </button>
        </div>
      </div>
    </article>
  );
}
