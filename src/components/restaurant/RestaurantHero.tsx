'use client';

import { Clock3, Heart, Navigation, Share2, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Rating } from '@/components/ui/FoodMeta';
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
      <section className="relative overflow-hidden">
        <Skeleton className="aspect-[16/9] w-full rounded-none sm:aspect-[21/9] lg:aspect-[24/9]" />
        <div className="page-container space-y-3 py-5">
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
  const ratingCount = restaurant?.total_ratings ?? restaurant?.review_count;
  const cuisine = getCuisineText(restaurant);
  const deliveryTime = restaurant?.estimated_delivery_time ?? restaurant?.delivery_time;
  const distance = getDistanceText(restaurant);
  const offerBadge = restaurant?.offer_badge;

  return (
    <section className="relative overflow-hidden">
      <div className="relative aspect-[16/9] overflow-hidden bg-surface-muted sm:aspect-[21/9] lg:aspect-[24/9]">
        <RestaurantHeroImage imageUrl={heroImageUrl} logoUrl={restaurant?.logo_url} name={name} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/35 via-transparent to-transparent" />

        <div className="absolute right-[var(--page-gutter)] top-3 z-10 flex items-center gap-2 sm:top-4">
          <HeroAction
            label={favorite ? 'Remove from favourites' : 'Add to favourites'}
            onClick={onFavoriteToggle}
          >
            <Heart
              className={`h-5 w-5 ${favorite ? 'fill-current text-brand-700' : ''}`}
              aria-hidden="true"
            />
          </HeroAction>
          <HeroAction label="Share restaurant" onClick={onShare}>
            <Share2 className="h-5 w-5" aria-hidden="true" />
          </HeroAction>
        </div>
      </div>

      <div className="page-container py-5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="min-w-0 text-title text-ink">{name}</h1>
          {rating && rating > 0 ? (
            <Rating value={rating} count={ratingCount} size="md" className="mt-1 shrink-0" />
          ) : (
            <Badge variant="default" className="mt-1 shrink-0">
              New
            </Badge>
          )}
        </div>

        {cuisine && <p className="mt-1.5 text-sm leading-6 text-ink-muted">{cuisine}</p>}

        {(deliveryTime || distance) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-ink-muted">
            {deliveryTime && (
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-4 w-4 shrink-0" aria-hidden="true" />
                {deliveryTime}
              </span>
            )}
            {distance && (
              <span className="inline-flex items-center gap-1.5">
                <Navigation className="h-4 w-4 shrink-0" aria-hidden="true" />
                {distance}
              </span>
            )}
          </div>
        )}

        {offerBadge && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-cherry-50 px-3 py-2 text-sm font-bold text-cherry-800">
            <Tag className="h-4 w-4 shrink-0" aria-hidden="true" />
            {offerBadge}
          </div>
        )}
      </div>
    </section>
  );
}

function HeroAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-card transition-colors hover:text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
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
  return unique.slice(0, 2).join(' · ');
}

function getDistanceText(restaurant?: Restaurant) {
  if (restaurant?.distance) return restaurant.distance;
  if (restaurant?.distance_km == null) return undefined;
  return `${restaurant.distance_km.toFixed(1)} km`;
}
