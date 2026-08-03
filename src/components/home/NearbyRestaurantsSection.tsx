'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
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
      <motion.section
        className="order-3 mx-auto mt-9 w-full max-w-7xl px-4 sm:px-6 lg:px-8"
        aria-labelledby="nearby-restaurants-heading"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <SectionHeading />
        <LocationPrompt onSetLocation={() => setLocationOpen(true)} />
        <LocationModal open={locationOpen} onClose={() => setLocationOpen(false)} />
      </motion.section>
    );
  }

  if (nearbyQuery.isLoading) {
    return (
      <motion.section
        className="order-3 mx-auto mt-9 w-full max-w-7xl px-4 sm:px-6 lg:px-8"
        aria-label="Loading nearby restaurants"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <SectionHeading />
        <NearbyRestaurantsSkeleton />
      </motion.section>
    );
  }

  if (nearbyQuery.error && restaurants.length === 0) {
    return (
      <motion.section
        className="order-3 mx-auto mt-9 w-full max-w-7xl px-4 sm:px-6 lg:px-8"
        aria-labelledby="nearby-restaurants-heading"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <SectionHeading />
        <NearbyRestaurantsError onRetry={() => nearbyQuery.refetch()} />
      </motion.section>
    );
  }

  if (visibleRestaurants.length === 0) {
    return (
      <motion.section
        className="order-3 mx-auto mt-9 w-full max-w-7xl px-4 sm:px-6 lg:px-8"
        aria-labelledby="nearby-restaurants-heading"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <SectionHeading />
        <NearbyRestaurantsEmpty onChangeLocation={() => setLocationOpen(true)} />
        <LocationModal open={locationOpen} onClose={() => setLocationOpen(false)} />
      </motion.section>
    );
  }

  return (
    <motion.section
      className="order-3 mx-auto mt-9 w-full max-w-7xl px-4 sm:px-6 lg:px-8"
      aria-labelledby="nearby-restaurants-heading"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <SectionHeading showViewAll={hasMoreRestaurants} viewAllHref={viewAllHref} />

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 hide-scrollbar sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-3 lg:gap-6">
        {visibleRestaurants.map((restaurant) => (
          <div key={restaurant.id} className="w-[220px] shrink-0 sm:w-auto">
            <NearbyRestaurantCard restaurant={restaurant} />
          </div>
        ))}
      </div>
    </motion.section>
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
    <div className="relative mb-4">
      <div className="pr-16">
        <h2 id="nearby-restaurants-heading" className="text-lg font-extrabold tracking-[-0.025em] text-ink sm:text-3xl">
          Popular near you
        </h2>
        <p className="mt-1 whitespace-nowrap text-xs font-medium text-ink-muted sm:text-sm">Loved around your neighbourhood</p>
      </div>
      {showViewAll && (
        <Link
          href={viewAllHref}
          className="absolute right-0 top-1 shrink-0 rounded-full px-1 text-sm font-bold text-brand-500 transition hover:text-brand-600 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15"
        >
          View All
        </Link>
      )}
    </div>
  );
}

function NearbyRestaurantsSkeleton() {
  return (
    <div className="-mx-4 flex gap-3 overflow-hidden px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:px-0 lg:grid-cols-3 lg:gap-6">
      {[1, 2, 3].map((item) => (
        <div key={item} className="w-[220px] shrink-0 overflow-hidden rounded-card border border-line bg-surface sm:w-auto">
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
    <div className="rounded-card border border-line bg-surface px-5 py-6 shadow-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-900">
            <LocateFixed className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-base font-extrabold text-ink">Find restaurants near you</h3>
            <p className="mt-1 text-sm leading-6 text-ink-muted">Set your location to discover restaurants within 7 km.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSetLocation}
          className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:opacity-50"
        >
          Set Location
        </button>
      </div>
    </div>
  );
}

function NearbyRestaurantsEmpty({ onChangeLocation }: { onChangeLocation: () => void }) {
  return (
    <div className="rounded-card border border-line bg-surface px-6 py-8 text-center shadow-card">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-900">
        <MapPin className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-extrabold text-ink">No restaurants found within 7 km</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-muted">Try changing your delivery location.</p>
      <button
        type="button"
        onClick={onChangeLocation}
        className="mt-5 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:opacity-50"
      >
        Change location
      </button>
    </div>
  );
}

function NearbyRestaurantsError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-card border border-line bg-surface px-5 py-6 shadow-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cherry-50 text-danger">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-base font-extrabold text-ink">Could not load nearby restaurants</h3>
            <p className="mt-1 text-sm leading-6 text-ink-muted">Please try again in a moment.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:opacity-50"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
