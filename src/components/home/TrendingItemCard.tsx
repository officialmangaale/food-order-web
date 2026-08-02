'use client';

import { useState } from 'react';
import { Flame, Leaf, Star } from 'lucide-react';
import type { TrendingItem } from '@/types/trending';

interface TrendingItemCardProps {
  item: TrendingItem;
  onAdd: (item: TrendingItem) => void;
}

export function TrendingItemCard({ item, onAdd }: TrendingItemCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const canShowImage = Boolean(item.imageUrl && !imageFailed);
  const isClosed = item.restaurantIsOpen === false;
  const disabled = !item.isAvailable || isClosed;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-[#E3E7EA] bg-white shadow-[0_12px_34px_rgba(23,32,51,0.055)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(14,75,71,0.10)]">
      <div className="relative h-24 overflow-hidden bg-[#F3FBF9] sm:h-[184px]">
        {canShowImage ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.03] img-fade-in ${imageFailed ? '' : 'loaded'}`}
            onLoad={(e) => e.currentTarget.classList.add('loaded')}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_25%_20%,#E8F8F5_0,#E8F8F5_24%,transparent_25%),linear-gradient(135deg,#0E4B47_0%,#16B8A6_58%,#E8F8F5_100%)]">
            <Leaf className="h-11 w-11 text-white/80" aria-hidden="true" />
          </div>
        )}

        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#0E4B47] px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] text-white shadow-sm sm:left-3 sm:top-3 sm:px-3 sm:py-1.5 sm:text-[10px]">
          <Flame className="h-3 w-3" aria-hidden="true" />
          {item.badge}
        </span>

        {item.rating != null && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-extrabold text-[#1F1A1A] shadow-sm">
            <Star className="h-3.5 w-3.5 fill-[#FFC247] text-[#FFC247]" aria-hidden="true" />
            {item.rating.toFixed(1)}
          </span>
        )}

        {isClosed && (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-extrabold text-white">
            Closed
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="line-clamp-2 min-h-9 text-sm font-extrabold leading-snug text-[#172033] sm:min-h-10 sm:text-base">
          {item.name}
        </h3>

        {item.description ? (
          <p className="mt-1.5 line-clamp-1 min-h-5 text-xs leading-5 text-[#737B8C] sm:mt-2 sm:line-clamp-2 sm:min-h-10 sm:text-sm">
            {item.description}
          </p>
        ) : (
          <p className="mt-1.5 line-clamp-1 min-h-5 text-xs leading-5 text-[#737B8C] sm:mt-2 sm:min-h-10 sm:text-sm">
            Fresh from {item.restaurantName}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3 sm:gap-4 sm:pt-4">
          <p className="text-sm font-extrabold text-[#172033] sm:text-xl">{item.displayPrice}</p>
          <button
            type="button"
            aria-label={`Add ${item.name}`}
            onClick={(event) => {
              event.stopPropagation();
              onAdd(item);
            }}
            disabled={disabled}
            className="flex h-9 min-w-[64px] shrink-0 items-center justify-center rounded-full border border-[#16B8A6] bg-white px-3 text-xs font-extrabold text-[#16B8A6] transition hover:bg-[#16B8A6] hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#16B8A6]/10 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:min-w-[86px] sm:px-5 sm:text-sm"
          >
            ADD
          </button>
        </div>
      </div>
    </article>
  );
}
