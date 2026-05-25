'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Clock, Store, Star } from 'lucide-react';
import type { SearchRestaurantResult } from '@/types/search';

interface RestaurantResultCardProps {
  restaurant: SearchRestaurantResult;
}

export function RestaurantResultCard({ restaurant }: RestaurantResultCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = restaurant.logo_url || restaurant.banner_url || restaurant.cover_image_url;
  const hasImage = Boolean(imageUrl && !imageFailed);

  return (
    <Link href={`/restaurants/${restaurant.id}`} className="block">
      <article className="flex items-center gap-4 rounded-2xl border border-[#F0DADA] bg-white p-3 shadow-[0_12px_30px_rgba(31,41,55,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(168,15,21,0.10)]">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#FFF0F0] sm:h-24 sm:w-24">
          {hasImage ? (
            <img
              src={imageUrl}
              alt={restaurant.name}
              loading="lazy"
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="food-placeholder flex h-full w-full items-center justify-center">
              <Store className="h-8 w-8 text-white/70" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-extrabold text-[#1F1A1A]">{restaurant.name}</h3>
          {restaurant.cuisine_types?.length ? (
            <p className="mt-1 truncate text-sm text-[#7B6B6B]">{restaurant.cuisine_types.join(' • ')}</p>
          ) : restaurant.area ? (
            <p className="mt-1 truncate text-sm text-[#7B6B6B]">{restaurant.area}</p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#6B5B5B]">
            <span className="inline-flex items-center gap-1 font-bold">
              <Star className="h-4 w-4 fill-[#A80F15] text-[#A80F15]" aria-hidden="true" />
              {restaurant.average_rating?.toFixed(1) ?? '4.0'}
            </span>
            {(restaurant.delivery_time || restaurant.estimated_delivery_time) && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-4 w-4 text-[#A80F15]" aria-hidden="true" />
                {restaurant.delivery_time || restaurant.estimated_delivery_time}
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="h-5 w-5 shrink-0 text-[#B9A2A2]" aria-hidden="true" />
      </article>
    </Link>
  );
}
