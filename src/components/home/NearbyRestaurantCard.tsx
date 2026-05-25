'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clock, MapPin, Star, Store } from 'lucide-react';
import type { RestaurantCardData } from '@/types/restaurant';

interface NearbyRestaurantCardProps {
  restaurant: RestaurantCardData;
}

export function NearbyRestaurantCard({ restaurant }: NearbyRestaurantCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const canShowImage = Boolean(restaurant.imageUrl && !imageFailed);
  const subtitle = restaurant.cuisine || restaurant.category || restaurant.tags?.join(' • ') || 'Restaurant';
  const overlayMeta = [
    restaurant.rating != null ? restaurant.rating.toFixed(1) : 'New',
    restaurant.deliveryTime,
  ].filter(Boolean).join(' • ');
  const badge = restaurant.offerBadge ?? 'Nearby';

  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      className="group block h-full overflow-hidden rounded-2xl border border-[#F0DADA] bg-white shadow-[0_14px_34px_rgba(31,41,55,0.055)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(168,15,21,0.10)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B31317]/10"
    >
      <article className="flex h-full flex-col overflow-hidden">
        <div className="relative h-[168px] overflow-hidden bg-[#FFF4F0] sm:h-[176px]">
          {canShowImage ? (
            <img
              src={restaurant.imageUrl}
              alt={restaurant.name}
              loading="lazy"
              className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.03] img-fade-in ${imageFailed ? '' : 'loaded'}`}
              onLoad={(e) => e.currentTarget.classList.add('loaded')}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_25%_20%,#FFE9D9_0,#FFE9D9_24%,transparent_25%),linear-gradient(135deg,#A80F15_0%,#D71920_58%,#FFF0F0_100%)]">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/18 text-2xl font-extrabold text-white shadow-inner">
                {getInitials(restaurant.name)}
              </span>
            </div>
          )}

          <span className="absolute left-3 top-3 rounded-full bg-[#A80F15] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-white shadow-sm">
            {badge}
          </span>

          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-extrabold text-[#1F1A1A] shadow-sm">
            {restaurant.rating != null ? (
              <Star className="h-3.5 w-3.5 fill-[#FFC247] text-[#FFC247]" aria-hidden="true" />
            ) : (
              <Store className="h-3.5 w-3.5 text-[#A80F15]" aria-hidden="true" />
            )}
            {overlayMeta}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-1 text-lg font-extrabold leading-snug text-[#1F1A1A]">
            {restaurant.name}
          </h3>
          <p className="mt-1 line-clamp-1 text-sm text-[#7B6B6B]">{subtitle}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-[#7B6B6B]">
            {restaurant.distance && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {restaurant.distance}
              </span>
            )}
            {restaurant.deliveryTime && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {restaurant.deliveryTime}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'M';
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
}
