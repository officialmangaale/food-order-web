'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageShell } from '@/components/layout/PageShell';
import { OfferSlider } from '@/components/home/OfferSlider';
import { CategoryScroller } from '@/components/home/CategoryScroller';
import { NearbyRestaurants } from '@/components/home/NearbyRestaurants';
import { ActiveOrderCard } from '@/components/home/ActiveOrderCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { MapPin } from 'lucide-react';
import { useLocationStore } from '@/store/locationStore';
import { fetchHomeFeed, fetchNearbyRestaurants, fetchOffers } from '@/services/restaurantApi';
import type { HomeFeedCategory } from '@/types/restaurant';

export default function HomePage() {
  const lat = useLocationStore((s) => s.latitude);
  const lng = useLocationStore((s) => s.longitude);
  const perm = useLocationStore((s) => s.permissionStatus);
  const requestLoc = useLocationStore((s) => s.requestBrowserLocation);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);

  // Soft location prompt on mount
  useEffect(() => {
    if (perm === 'unknown') {
      // Don't auto-request, let user click
    }
  }, [perm]);

  const { data: homeFeed, isLoading: homeLoading, error: homeError, refetch } = useQuery({
    queryKey: ['homeFeed', lat, lng],
    queryFn: () => fetchHomeFeed(lat ?? undefined, lng ?? undefined),
  });

  const { data: offers } = useQuery({
    queryKey: ['offers'],
    queryFn: fetchOffers,
  });

  const { data: restaurants, isLoading: restLoading } = useQuery({
    queryKey: ['nearby', lat, lng],
    queryFn: () => fetchNearbyRestaurants(lat!, lng!),
    enabled: lat != null && lng != null,
  });

  const categories: HomeFeedCategory[] = homeFeed?.categories ?? [];

  if (homeError) {
    return (
      <PageShell>
        <ErrorState message="Could not load restaurants" onRetry={() => refetch()} />
      </PageShell>
    );
  }

  return (
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

      {/* Offers */}
      {homeLoading ? (
        <div className="flex gap-3 mb-6 overflow-hidden">
          <Skeleton className="h-32 w-[280px] flex-shrink-0" />
          <Skeleton className="h-32 w-[280px] flex-shrink-0" />
        </div>
      ) : (
        <OfferSlider offers={offers ?? homeFeed?.offers ?? []} />
      )}

      {/* Categories */}
      {homeLoading ? (
        <div className="flex gap-3 mb-6">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="w-20 h-24 flex-shrink-0" />)}
        </div>
      ) : (
        <CategoryScroller categories={categories} selectedId={selectedCat} onSelect={setSelectedCat} />
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
  );
}
