'use client';

import { Clock3, Heart, Navigation, Share2, Star, Tag } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { RestaurantHeroImage } from '@/components/restaurant/RestaurantHeroImage';
import type { Restaurant } from '@/types/restaurant';

interface RestaurantHeroProps {
  restaurant?: Restaurant;
  loading?: boolean;
  favorite: boolean;
  onFavoriteToggle: () => void;
  onShare: () => void;
}

export function RestaurantHero({
  restaurant,
  loading,
  favorite,
  onFavoriteToggle,
  onShare,
}: RestaurantHeroProps) {
  if (loading && !restaurant) {
    return (
      <section className="relative overflow-hidden bg-[#F7F8FA]">
        <Skeleton className="h-[212px] w-full rounded-none sm:h-[340px] lg:h-[420px]" />
        <div className="space-y-3 px-3 py-5 sm:px-6 lg:mx-auto lg:max-w-[1280px] lg:px-8">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-48" />
        </div>
      </section>
    );
  }

  const name = restaurant?.name ?? 'Restaurant';
  const heroImageUrl = getHeroImageUrl(restaurant);
  const rating = restaurant?.average_rating ?? restaurant?.rating;
  const cuisine = getCuisineText(restaurant);
  const deliveryTime = restaurant?.estimated_delivery_time ?? restaurant?.delivery_time;
  const distance = getDistanceText(restaurant);
  const offerBadge = restaurant?.offer_badge;

  return (
    <section className="relative overflow-hidden bg-[#F7F8FA]">
      <div className="relative h-[212px] overflow-hidden bg-[#E8ECEF] sm:h-[340px] lg:h-[420px]">
        <RestaurantHeroImage imageUrl={heroImageUrl} logoUrl={restaurant?.logo_url} name={name} />
        <div className="absolute inset-0 hidden bg-gradient-to-t from-black/25 to-transparent lg:block" />
        <div className="fixed right-3 top-3 z-50 flex items-center gap-2 sm:right-6 sm:top-4 lg:absolute lg:z-10">
          <button
            type="button"
            onClick={onFavoriteToggle}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/95 text-[#172033] shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-[#0F766E] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#14B8A6]/25"
            aria-label={favorite ? 'Remove favorite' : 'Favorite restaurant'}
            title="Favorite"
          >
            <Heart className={`h-6 w-6 ${favorite ? 'fill-current text-[#14B8A6]' : ''}`} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onShare}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/95 text-[#172033] shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-[#0F766E] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#14B8A6]/25"
            aria-label="Share restaurant"
            title="Share"
          >
            <Share2 className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="px-3 py-4 sm:px-6 sm:py-6 lg:mx-auto lg:max-w-[1280px] lg:px-8">
        <div className="flex items-start justify-between gap-3">
          <h1 className="min-w-0 text-[20px] font-extrabold leading-tight tracking-[-0.02em] text-[#172033] sm:text-3xl">
            {name}
          </h1>
          {rating && rating > 0 ? (
            <span className="inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-[#EAF9EF] px-1.5 text-[12px] font-bold text-[#16733B]">
              <Star className="h-3 w-3 fill-current" aria-hidden="true" />
              {rating.toFixed(1)}
            </span>
          ) : (
            <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-[#EDF1F4] px-2 text-[12px] font-bold text-[#586275]">
              New
            </span>
          )}
        </div>
        {cuisine && <p className="mt-1 text-[13px] leading-5 text-[#7B8497] sm:text-[15px] sm:leading-6">{cuisine}</p>}
        {(deliveryTime || distance) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-4 text-[12px] font-medium text-[#7B8497] sm:text-[14px]">
            {deliveryTime && (
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-[#172033]" aria-hidden="true" />
                {deliveryTime}
              </span>
            )}
            {distance && (
              <span className="inline-flex items-center gap-2">
                <Navigation className="h-4 w-4 text-[#172033]" aria-hidden="true" />
                {distance}
              </span>
            )}
          </div>
        )}
        {offerBadge && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#E8F8F5] px-3 py-2 text-sm font-bold text-[#0F766E]">
            <Tag className="h-4 w-4" aria-hidden="true" />
            {offerBadge}
          </div>
        )}
      </div>
    </section>
  );
}

function getHeroImageUrl(restaurant?: Restaurant) {
  return (
    restaurant?.background_image_url ??
    restaurant?.background_url ??
    restaurant?.image_url ??
    restaurant?.banner_url ??
    restaurant?.cover_image_url
  );
}

function getCuisineText(restaurant?: Restaurant) {
  const values =
    restaurant?.cuisine_types && restaurant.cuisine_types.length > 0
      ? restaurant.cuisine_types
      : [restaurant?.cuisine, restaurant?.category, restaurant?.type, ...(restaurant?.tags ?? [])];

  const unique = Array.from(
    new Set(values.filter((value): value is string => Boolean(value && value.trim())))
  );
  return unique.slice(0, 2).join(' \u00B7 ');
}

function getDistanceText(restaurant?: Restaurant) {
  if (restaurant?.distance) return restaurant.distance;
  if (restaurant?.distance_km == null) return undefined;
  return `${restaurant.distance_km.toFixed(1)} km`;
}
