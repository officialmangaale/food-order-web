'use client';

import { useState } from 'react';
import { Leaf, Plus, Star } from 'lucide-react';
import { formatMoney } from '@/utils/money';
import type { SearchDishResult } from '@/types/search';

interface DishResultCardProps {
  dish: SearchDishResult;
  onAdd: (dish: SearchDishResult) => void;
}

export function DishResultCard({ dish, onAdd }: DishResultCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = Boolean(dish.image_url && !imageFailed);

  return (
    <article className="overflow-hidden rounded-2xl border border-[#F0DADA] bg-white shadow-[0_14px_34px_rgba(31,41,55,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(168,15,21,0.10)]">
      <div className="relative aspect-[4/3] bg-[#FFF0F0]">
        {hasImage ? (
          <img
            src={dish.image_url}
            alt={dish.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="food-placeholder flex h-full w-full items-center justify-center">
            <Leaf className="h-10 w-10 text-white/70" aria-hidden="true" />
          </div>
        )}
        {dish.is_veg != null && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-[#314D2D] shadow-sm">
            {dish.is_veg ? 'Veg' : 'Non-veg'}
          </span>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-4">
          <h3 className="line-clamp-2 text-base font-extrabold text-[#1F1A1A]">{dish.name}</h3>
          <p className="shrink-0 text-base font-extrabold text-[#1F1A1A]">{formatMoney(dish.price)}</p>
        </div>

        <div className="min-h-5">
          <p className="truncate text-sm font-semibold text-[#7B6B6B]">
            {dish.restaurant_name || 'Mangaale partner'}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-sm text-[#7B6B6B]">
            <Star className="h-4 w-4 fill-[#A80F15] text-[#A80F15]" aria-hidden="true" />
            <span className="font-bold text-[#4B3A3A]">{dish.rating?.toFixed(1) ?? '4.0'}</span>
            {dish.delivery_time && <span className="truncate">{dish.delivery_time}</span>}
          </div>

          <button
            type="button"
            onClick={() => onAdd(dish)}
            disabled={dish.is_available === false}
            className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-[#A80F15] px-4 text-sm font-extrabold text-white shadow-[0_10px_22px_rgba(168,15,21,0.22)] transition hover:bg-[#8F0D12] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add
          </button>
        </div>
      </div>
    </article>
  );
}
