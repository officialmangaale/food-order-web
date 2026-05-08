'use client';

import { Suspense, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageShell } from '@/components/layout/PageShell';
import { HomeOfferSlider } from '@/components/home/HomeOfferSlider';
import { ExploreCategories } from '@/components/home/ExploreCategories';
import { NearbyRestaurants } from '@/components/home/NearbyRestaurants';
import { ActiveOrderCard } from '@/components/home/ActiveOrderCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { MapPin } from 'lucide-react';
import { useLocationStore } from '@/store/locationStore';
import { fetchHomeFeed, fetchNearbyRestaurants } from '@/services/restaurantApi';

export default function HomePage() {
  const lat = useLocationStore((s) => s.latitude);
  const lng = useLocationStore((s) => s.longitude);
  const perm = useLocationStore((s) => s.permissionStatus);
  const requestLoc = useLocationStore((s) => s.requestBrowserLocation);

  // Soft location prompt on mount
  useEffect(() => {
    if (perm === 'unknown') {
      // Don't auto-request, let user click
    }
  }, [perm]);

  const { data: homeFeed, isLoading: homeLoading } = useQuery({
    queryKey: ['homeFeed', lat, lng],
    queryFn: () => fetchHomeFeed(lat ?? undefined, lng ?? undefined),
  });

  const { data: restaurants, isLoading: restLoading } = useQuery({
    queryKey: ['nearby', lat, lng],
    queryFn: () => fetchNearbyRestaurants(lat!, lng!),
    enabled: lat != null && lng != null,
  });

  return (
    <>
      <HomeOfferSlider />
      <Suspense fallback={<ExploreCategoriesFallback />}>
        <ExploreCategories />
      </Suspense>

      <PageShell>
        {/* Active Order */}
        <ActiveOrderCard />

        {/* Location prompt */}
        {perm !== 'granted' && (
          <button onClick={requestLoc}
            className="w-full flex items-center gap-3 bg-cherry-50 border border-cherry-200 rounded-2xl p-4 mb-4 text-left hover:bg-cherry-100 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-cherry-100 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-cherry-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Enable location</p>
              <p className="text-xs text-gray-500">See restaurants delivering to you</p>
            </div>
          </button>
        )}

        {/* Nearby Restaurants */}
        {lat == null && !restLoading && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">Set your location to see restaurants near you</p>
          </div>
        )}

        <NearbyRestaurants
          restaurants={restaurants ?? homeFeed?.restaurants ?? []}
          loading={restLoading || homeLoading}
        />
      </PageShell>
    </>
  );
}

function ExploreCategoriesFallback() {
  return (
    <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Loading categories">
      <Skeleton className="mb-4 h-8 w-56" />
      <div className="flex gap-3 overflow-hidden pb-2">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Skeleton key={item} className="h-12 w-28 shrink-0 rounded-2xl" />
        ))}
      </div>
    </section>
  );
}
