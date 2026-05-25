'use client';

import { useState } from 'react';
import { Flame, Leaf, Plus, Star } from 'lucide-react';
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
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#F0DADA] bg-white shadow-[0_14px_34px_rgba(31,41,55,0.055)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(168,15,21,0.10)]">
      <div className="relative h-[176px] overflow-hidden bg-[#FFF4F0] sm:h-[184px]">
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
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_25%_20%,#FFE9D9_0,#FFE9D9_24%,transparent_25%),linear-gradient(135deg,#A80F15_0%,#D71920_58%,#FFF0F0_100%)]">
            <Leaf className="h-11 w-11 text-white/80" aria-hidden="true" />
          </div>
        )}

        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#A80F15] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-white shadow-sm">
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

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 min-h-10 text-base font-extrabold leading-snug text-[#1F1A1A]">
          {item.name}
        </h3>

        {item.description ? (
          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-[#7B6B6B]">
            {item.description}
          </p>
        ) : (
          <p className="mt-2 min-h-10 text-sm leading-5 text-[#7B6B6B]">
            Fresh from {item.restaurantName}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-4 pt-4">
          <p className="text-xl font-extrabold text-[#1F1A1A]">{item.displayPrice}</p>
          <button
            type="button"
            aria-label={`Add ${item.name}`}
            onClick={(event) => {
              event.stopPropagation();
              onAdd(item);
            }}
            disabled={disabled}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFF0F0] text-[#A80F15] shadow-[0_10px_24px_rgba(168,15,21,0.10)] transition hover:bg-[#A80F15] hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B31317]/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
