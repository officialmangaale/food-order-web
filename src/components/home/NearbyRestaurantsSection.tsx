'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertTriangle, LocateFixed, MapPin } from 'lucide-react';
import { LocationModal } from '@/components/location/LocationModal';
import { NearbyRestaurantCard } from '@/components/home/NearbyRestaurantCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { useNearbyRestaurants } from '@/hooks/useNearbyRestaurants';
import { useLocationStore } from '@/store/locationStore';

const HOME_RESTAURANTS_VISIBLE = 3;
const RADIUS_KM = 7;

export function NearbyRestaurantsSection() {
  const pathname = usePathname();
  const isLockedRoute = pathname.startsWith('/r/');
  const [locationOpen, setLocationOpen] = useState(false);
  const lat = useLocationStore((state) => state.latitude);
  const lng = useLocationStore((state) => state.longitude);
  const hasLocation = lat != null && lng != null;

  const nearbyQuery = useNearbyRestaurants({
    lat,
    lng,
    radiusKm: RADIUS_KM,
    page: 1,
    limit: 20,
    enabled: !isLockedRoute,
  });

  const restaurants = nearbyQuery.data?.restaurants ?? [];
  const visibleRestaurants = restaurants.slice(0, HOME_RESTAURANTS_VISIBLE);
  const hasMoreRestaurants = Boolean(
    restaurants.length > HOME_RESTAURANTS_VISIBLE ||
      nearbyQuery.data?.meta.hasMore ||
      (nearbyQuery.data?.meta.total != null && nearbyQuery.data.meta.total > HOME_RESTAURANTS_VISIBLE)
  );
  const viewAllHref = useMemo(() => {
    const query = new URLSearchParams();
    if (typeof lat === 'number' && Number.isFinite(lat)) query.set('lat', String(lat));
    if (typeof lng === 'number' && Number.isFinite(lng)) query.set('lng', String(lng));
    query.set('radius_km', String(RADIUS_KM));
    return `/restaurants?${query.toString()}`;
  }, [lat, lng]);

  if (isLockedRoute) return null;

  if (!hasLocation) {
    return (
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8" aria-labelledby="nearby-restaurants-heading">
        <SectionHeading />
        <LocationPrompt onSetLocation={() => setLocationOpen(true)} />
        <LocationModal open={locationOpen} onClose={() => setLocationOpen(false)} />
      </section>
    );
  }

  if (nearbyQuery.isLoading) {
    return (
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Loading nearby restaurants">
        <SectionHeading />
        <NearbyRestaurantsSkeleton />
      </section>
    );
  }

  if (nearbyQuery.error && restaurants.length === 0) {
    return (
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8" aria-labelledby="nearby-restaurants-heading">
        <SectionHeading />
        <NearbyRestaurantsError onRetry={() => nearbyQuery.refetch()} />
      </section>
    );
  }

  if (visibleRestaurants.length === 0) {
    return (
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8" aria-labelledby="nearby-restaurants-heading">
        <SectionHeading />
        <NearbyRestaurantsEmpty onChangeLocation={() => setLocationOpen(true)} />
        <LocationModal open={locationOpen} onClose={() => setLocationOpen(false)} />
      </section>
    );
  }

  return (
    <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8" aria-labelledby="nearby-restaurants-heading">
      <SectionHeading showViewAll={hasMoreRestaurants} viewAllHref={viewAllHref} />

      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 hide-scrollbar sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-3 lg:gap-6">
        {visibleRestaurants.map((restaurant) => (
          <div key={restaurant.id} className="w-[280px] shrink-0 sm:w-auto">
            <NearbyRestaurantCard restaurant={restaurant} />
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionHeading({
  showViewAll,
  viewAllHref = '/restaurants',
}: {
  showViewAll?: boolean;
  viewAllHref?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 id="nearby-restaurants-heading" className="text-xl font-extrabold text-[#1F1A1A] sm:text-2xl">
        Nearby Restaurants
      </h2>
      {showViewAll && (
        <Link
          href={viewAllHref}
          className="shrink-0 text-sm font-bold text-[#A80F15] transition hover:text-[#7C1118] hover:underline"
        >
          View All
        </Link>
      )}
    </div>
  );
}

function NearbyRestaurantsSkeleton() {
  return (
    <div className="-mx-4 flex gap-4 overflow-hidden px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:px-0 lg:grid-cols-3 lg:gap-6">
      {[1, 2, 3].map((item) => (
        <div key={item} className="w-[280px] shrink-0 overflow-hidden rounded-2xl border border-[#F0DADA] bg-white sm:w-auto">
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
            <h3 className="text-base font-extrabold text-[#1F1A1A]">Find restaurants near you</h3>
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

function NearbyRestaurantsEmpty({ onChangeLocation }: { onChangeLocation: () => void }) {
  return (
    <div className="rounded-2xl border border-[#F0DADA] bg-white px-6 py-8 text-center shadow-[0_12px_30px_rgba(168,15,21,0.05)]">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0F0] text-[#A80F15]">
        <MapPin className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-extrabold text-[#1F1A1A]">No restaurants found within 7 km</h3>
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

function NearbyRestaurantsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-[#F0DADA] bg-white px-5 py-6 shadow-[0_12px_30px_rgba(168,15,21,0.05)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF0F0] text-[#A80F15]">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-base font-extrabold text-[#1F1A1A]">Could not load nearby restaurants</h3>
            <p className="mt-1 text-sm leading-6 text-[#7B6B6B]">Please try again in a moment.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-[#A80F15] px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#8F0D12]"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
