'use client';

import { Heart, Share2, Star, Tag } from 'lucide-react';
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
      <section className="relative h-[260px] overflow-hidden bg-[#2B090B] sm:h-[340px] lg:h-[420px]">
        <Skeleton className="absolute inset-0 h-full w-full rounded-none bg-white/10" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-[1280px] px-4 pb-8 sm:px-6 lg:px-8">
          <Skeleton className="mb-4 h-10 w-72 bg-white/20" />
          <Skeleton className="h-8 w-96 max-w-full bg-white/20" />
        </div>
      </section>
    );
  }

  const name = restaurant?.name ?? 'Restaurant';
  const heroImageUrl = getHeroImageUrl(restaurant);
  const rating = restaurant?.average_rating ?? restaurant?.rating;
  const cuisine = getCuisineText(restaurant);
  const deliveryTime = restaurant?.estimated_delivery_time ?? restaurant?.delivery_time;
  const offerBadge = restaurant?.offer_badge;

  return (
    <section className="relative isolate h-[260px] overflow-hidden bg-[#210607] sm:h-[340px] lg:h-[420px]">
      <RestaurantHeroImage imageUrl={heroImageUrl} logoUrl={restaurant?.logo_url} name={name} />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-[1280px] items-end justify-between gap-4 px-4 pb-7 sm:px-6 sm:pb-8 lg:px-8 lg:pb-10">
        <div className="min-w-0 text-white">
          <h1 className="max-w-[850px] text-4xl font-extrabold leading-tight tracking-normal drop-shadow-sm sm:text-5xl lg:text-[52px]">
            {name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-medium text-white sm:text-base">
            {rating && rating > 0 ? (
              <span className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#1F7A3A] px-3 font-bold text-white shadow-sm">
                <Star className="h-4 w-4 fill-current" aria-hidden="true" />
                {rating.toFixed(1)}
              </span>
            ) : (
              <span className="inline-flex h-9 items-center rounded-lg bg-white/16 px-3 font-bold text-white ring-1 ring-white/20">
                New
              </span>
            )}
            {cuisine && <span>{cuisine}</span>}
            {cuisine && deliveryTime && <span className="text-white/80">{'\u2022'}</span>}
            {deliveryTime && <span>{deliveryTime}</span>}
          </div>
          {offerBadge && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#B4080B] px-4 py-3 text-sm font-extrabold tracking-normal text-white shadow-lg sm:text-base">
              <Tag className="h-5 w-5" aria-hidden="true" />
              {offerBadge}
            </div>
          )}
        </div>

        <div className="mb-1 flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={onShare}
            className="hidden h-12 w-12 items-center justify-center rounded-full bg-black/35 text-white ring-1 ring-white/25 backdrop-blur-md transition hover:bg-white hover:text-[#A80F15] focus:outline-none focus:ring-4 focus:ring-white/30 sm:flex"
            aria-label="Share restaurant"
            title="Share"
          >
            <Share2 className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onFavoriteToggle}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-black/35 text-white ring-1 ring-white/25 backdrop-blur-md transition hover:bg-white hover:text-[#A80F15] focus:outline-none focus:ring-4 focus:ring-white/30"
            aria-label={favorite ? 'Remove favorite' : 'Favorite restaurant'}
            title="Favorite"
          >
            <Heart className={`h-6 w-6 ${favorite ? 'fill-current text-white' : ''}`} aria-hidden="true" />
          </button>
        </div>
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
  return unique.slice(0, 2).join(' & ');
}
