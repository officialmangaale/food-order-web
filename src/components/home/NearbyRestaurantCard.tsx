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
  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      className="group block h-full overflow-hidden rounded-card border border-line bg-surface shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15"
    >
      <article className="flex h-full flex-col overflow-hidden">
        <div className="relative h-28 overflow-hidden bg-brand-50 sm:h-[176px]">
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
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_25%_20%,#E8F8F5_0,#E8F8F5_24%,transparent_25%),linear-gradient(135deg,#0E4B47_0%,#16B8A6_60%,#E8F8F5_100%)]">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/18 text-2xl font-extrabold text-white shadow-inner">
                {getInitials(restaurant.name)}
              </span>
            </div>
          )}

          {restaurant.offerBadge && (
            <span className="absolute left-3 top-3 rounded-full bg-brand-900 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.06em] text-white shadow-sm">
              {restaurant.offerBadge}
            </span>
          )}

          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-extrabold text-ink shadow-sm sm:bottom-3 sm:right-3 sm:gap-1.5 sm:px-2.5 sm:text-xs">
            {restaurant.rating != null ? (
              <Star className="h-3.5 w-3.5 fill-[#FFC247] text-[#FFC247]" aria-hidden="true" />
            ) : (
              <Store className="h-3.5 w-3.5 text-brand-900" aria-hidden="true" />
            )}
            {overlayMeta}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-3 sm:p-4">
          <h3 className="line-clamp-1 text-[15px] font-extrabold leading-snug text-ink sm:text-lg">
            {restaurant.name}
          </h3>
          <p className="mt-1 line-clamp-1 text-xs text-ink-muted sm:text-sm">{subtitle}</p>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold text-ink-muted sm:mt-3 sm:gap-x-3 sm:text-xs">
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
