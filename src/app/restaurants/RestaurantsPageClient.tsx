'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Loader2, LocateFixed, MapPin } from 'lucide-react';
import { LocationModal } from '@/components/location/LocationModal';
import { NearbyRestaurantCard } from '@/components/home/NearbyRestaurantCard';
import { Skeleton } from '@/components/ui/Skeleton';
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
    setPage(1);
    setRestaurants([]);
  }, [requestKey]);

  useEffect(() => {
    if (!nearbyQuery.data) return;

    setRestaurants((currentRestaurants) => {
      if (page === 1) return nearbyQuery.data.restaurants;
      return mergeUniqueRestaurants(currentRestaurants, nearbyQuery.data.restaurants);
    });
  }, [nearbyQuery.data, page]);

  const resultCountLabel = useMemo(() => {
    if (restaurants.length === 0) return '';
    return `${restaurants.length} restaurants`;
  }, [restaurants.length]);
  const firstPageLoading = page === 1 && restaurants.length === 0 && nearbyQuery.isLoading;
  const loadingMore = page > 1 && nearbyQuery.isFetching;
  const hasMore = Boolean(nearbyQuery.data?.meta.hasMore);

  if (!hasLocation) {
    return (
      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8">
        <PageHeader />
        <LocationPrompt onSetLocation={() => setLocationOpen(true)} />
        <LocationModal open={locationOpen} onClose={() => setLocationOpen(false)} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8">
      <PageHeader
        resultCountLabel={resultCountLabel}
        locationLabel={`Within ${radiusKm} km`}
      />

      {firstPageLoading ? (
        <RestaurantsPageSkeleton />
      ) : nearbyQuery.error && restaurants.length === 0 ? (
        <RestaurantsPageError onRetry={() => nearbyQuery.refetch()} />
      ) : restaurants.length === 0 ? (
        <RestaurantsPageEmpty onChangeLocation={() => setLocationOpen(true)} />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {restaurants.map((restaurant) => (
              <NearbyRestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setPage((currentPage) => currentPage + 1)}
                disabled={loadingMore}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#A80F15] px-6 py-3 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(168,15,21,0.18)] transition hover:bg-[#8F0D12] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {loadingMore ? 'Loading' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}

      <LocationModal open={locationOpen} onClose={() => setLocationOpen(false)} />
    </main>
  );
}

function PageHeader({
  resultCountLabel,
  locationLabel,
}: {
  resultCountLabel?: string;
  locationLabel?: string;
}) {
  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-[#F0DADA] bg-white px-4 py-2 text-sm font-bold text-[#1F1A1A] transition hover:border-[#A80F15] hover:text-[#A80F15]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Home
        </Link>
        {locationLabel && <p className="text-sm font-semibold text-[#7B6B6B]">{locationLabel}</p>}
      </div>

      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#A80F15]">Restaurants</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#1F1A1A] sm:text-3xl">Restaurants Near You</h1>
        </div>
        {resultCountLabel && (
          <p className="shrink-0 text-sm font-bold text-[#7B6B6B]">{resultCountLabel}</p>
        )}
      </div>
    </>
  );
}

function RestaurantsPageSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-[#F0DADA] bg-white">
          <Skeleton className="h-[168px] w-full rounded-none sm:h-[176px]" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function LocationPrompt({ onSetLocation }: { onSetLocation: () => void }) {
  return (
    <div className="rounded-2xl border border-[#F0DADA] bg-white px-5 py-6 shadow-[0_12px_30px_rgba(168,15,21,0.05)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF0F0] text-[#A80F15]">
            <LocateFixed className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-extrabold text-[#1F1A1A]">Find restaurants near you</h2>
            <p className="mt-1 text-sm leading-6 text-[#7B6B6B]">Set your location to discover restaurants within 7 km.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSetLocation}
          className="rounded-full bg-[#A80F15] px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#8F0D12]"
        >
          Set Location
        </button>
      </div>
    </div>
  );
}

function RestaurantsPageEmpty({ onChangeLocation }: { onChangeLocation: () => void }) {
  return (
    <div className="rounded-2xl border border-[#F0DADA] bg-white px-6 py-8 text-center shadow-[0_12px_30px_rgba(168,15,21,0.05)]">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0F0] text-[#A80F15]">
        <MapPin className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-extrabold text-[#1F1A1A]">No restaurants found within 7 km</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7B6B6B]">Try changing your delivery location.</p>
      <button
        type="button"
        onClick={onChangeLocation}
        className="mt-5 rounded-full bg-[#A80F15] px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#8F0D12]"
      >
        Change location
      </button>
    </div>
  );
}

function RestaurantsPageError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-[#F0DADA] bg-white px-6 py-10 text-center shadow-[0_12px_30px_rgba(168,15,21,0.05)]">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0F0] text-[#A80F15]">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-extrabold text-[#1F1A1A]">Could not load nearby restaurants</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7B6B6B]">Please try again in a moment.</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-full bg-[#A80F15] px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#8F0D12]"
      >
        Try again
      </button>
    </div>
  );
}

function mergeUniqueRestaurants(currentRestaurants: RestaurantCardData[], nextRestaurants: RestaurantCardData[]) {
  const seen = new Set(currentRestaurants.map((restaurant) => restaurant.id));
  const uniqueNextRestaurants = nextRestaurants.filter((restaurant) => {
    if (seen.has(restaurant.id)) return false;
    seen.add(restaurant.id);
    return true;
  });

  return [...currentRestaurants, ...uniqueNextRestaurants];
}
