'use client';

import { useEffect, useMemo, useState } from 'react';
import { NearbyRestaurantCard } from '@/components/home/NearbyRestaurantCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { LocationModal } from '@/components/location/LocationModal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { CardGridSkeleton, LoadingAnnouncement } from '@/components/ui/Skeleton';
import { useNearbyRestaurants } from '@/hooks/useNearbyRestaurants';
import { useLocationStore } from '@/store/locationStore';
import type { RestaurantCardData } from '@/types/restaurant';

interface RestaurantsPageClientProps {
  initialLat?: number;
  initialLng?: number;
  initialRadiusKm?: number;
}

const PAGE_LIMIT = 20;
const DEFAULT_RADIUS_KM = 7;

/** Shared by the grid and its skeleton so loading never reflows the page. */
const GRID_CLASSNAME = 'grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3';

export function RestaurantsPageClient({
  initialLat,
  initialLng,
  initialRadiusKm,
}: RestaurantsPageClientProps) {
  const storeLat = useLocationStore((state) => state.latitude);
  const storeLng = useLocationStore((state) => state.longitude);
  const lat = initialLat ?? storeLat;
  const lng = initialLng ?? storeLng;
  const radiusKm = initialRadiusKm ?? DEFAULT_RADIUS_KM;
  const hasLocation = lat != null && lng != null;
  const requestKey = `${lat ?? ''}:${lng ?? ''}:${radiusKm}`;
  const [page, setPage] = useState(1);
  const [restaurants, setRestaurants] = useState<RestaurantCardData[]>([]);
  const [locationOpen, setLocationOpen] = useState(false);

  const nearbyQuery = useNearbyRestaurants({
    lat,
    lng,
    radiusKm,
    page,
    limit: PAGE_LIMIT,
    enabled: hasLocation,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setRestaurants([]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [requestKey]);

  useEffect(() => {
    if (!nearbyQuery.data) return;

    const nextRestaurants = nearbyQuery.data.restaurants;
    const timer = window.setTimeout(() => {
      setRestaurants((currentRestaurants) => {
        if (page === 1) return nextRestaurants;
        return mergeUniqueRestaurants(currentRestaurants, nextRestaurants);
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [nearbyQuery.data, page]);

  const firstPageLoading = page === 1 && restaurants.length === 0 && nearbyQuery.isLoading;
  const loadingMore = page > 1 && nearbyQuery.isFetching;
  const hasMore = Boolean(nearbyQuery.data?.meta.hasMore);
  const resultCountLabel = useMemo(() => {
    if (firstPageLoading || restaurants.length === 0) return undefined;
    return `${restaurants.length} ${restaurants.length === 1 ? 'restaurant' : 'restaurants'}`;
  }, [firstPageLoading, restaurants.length]);

  return (
    <main id="main-content" className="page-main page-container">
      <PageHeader
        eyebrow="Restaurants"
        title="Restaurants near you"
        count={resultCountLabel}
        backHref="/"
        meta={
          hasLocation ? (
            <button
              type="button"
              onClick={() => setLocationOpen(true)}
              className="rounded-full font-semibold underline-offset-4 transition-colors hover:text-brand-800 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25"
            >
              Within {radiusKm} km of your location
            </button>
          ) : undefined
        }
      />

      {!hasLocation ? (
        <EmptyState
          icon="location"
          title="Find restaurants near you"
          description={`Set your delivery location to discover restaurants within ${radiusKm} km.`}
          actionLabel="Set location"
          onAction={() => setLocationOpen(true)}
        />
      ) : firstPageLoading ? (
        <>
          <LoadingAnnouncement label="Loading nearby restaurants" />
          <CardGridSkeleton count={6} className={GRID_CLASSNAME} />
        </>
      ) : nearbyQuery.error && restaurants.length === 0 ? (
        <ErrorState
          title="Could not load nearby restaurants"
          message="Please try again in a moment."
          onRetry={() => nearbyQuery.refetch()}
        />
      ) : restaurants.length === 0 ? (
        <EmptyState
          icon="restaurant"
          title={`No restaurants found within ${radiusKm} km`}
          description="Try changing your delivery location."
          actionLabel="Change location"
          onAction={() => setLocationOpen(true)}
        />
      ) : (
        <>
          <div className={GRID_CLASSNAME}>
            {restaurants.map((restaurant, index) => (
              <NearbyRestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                priority={index < 3}
              />
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <Button
                variant="outline"
                size="md"
                loading={loadingMore}
                onClick={() => setPage((currentPage) => currentPage + 1)}
              >
                {loadingMore ? 'Loading' : 'Load more restaurants'}
              </Button>
            </div>
          )}
        </>
      )}

      <LocationModal open={locationOpen} onClose={() => setLocationOpen(false)} />
    </main>
  );
}

function mergeUniqueRestaurants(
  currentRestaurants: RestaurantCardData[],
  nextRestaurants: RestaurantCardData[]
) {
  const seen = new Set(currentRestaurants.map((restaurant) => restaurant.id));
  const uniqueNextRestaurants = nextRestaurants.filter((restaurant) => {
    if (seen.has(restaurant.id)) return false;
    seen.add(restaurant.id);
    return true;
  });

  return [...currentRestaurants, ...uniqueNextRestaurants];
}
