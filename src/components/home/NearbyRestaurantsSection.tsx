'use client';

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CardRail, HomeSection } from '@/components/home/HomeSection';
import { NearbyRestaurantCard } from '@/components/home/NearbyRestaurantCard';
import { LocationModal } from '@/components/location/LocationModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { MediaCardSkeleton } from '@/components/ui/Skeleton';
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
      (nearbyQuery.data?.meta.total != null &&
        nearbyQuery.data.meta.total > HOME_RESTAURANTS_VISIBLE)
  );
  const viewAllHref = useMemo(() => {
    const query = new URLSearchParams();
    if (typeof lat === 'number' && Number.isFinite(lat)) query.set('lat', String(lat));
    if (typeof lng === 'number' && Number.isFinite(lng)) query.set('lng', String(lng));
    query.set('radius_km', String(RADIUS_KM));
    return `/restaurants?${query.toString()}`;
  }, [lat, lng]);

  if (isLockedRoute) return null;

  return (
    <HomeSection
      id="nearby-restaurants"
      title="Popular near you"
      description="Loved around your neighbourhood"
      viewAllHref={hasLocation && hasMoreRestaurants ? viewAllHref : undefined}
    >
      {!hasLocation ? (
        <EmptyState
          icon="location"
          title="Find restaurants near you"
          description={`Set your delivery location to discover restaurants within ${RADIUS_KM} km.`}
          actionLabel="Set location"
          onAction={() => setLocationOpen(true)}
        />
      ) : nearbyQuery.isLoading ? (
        <CardRail>
          {Array.from({ length: HOME_RESTAURANTS_VISIBLE }, (_, index) => (
            <MediaCardSkeleton key={index} />
          ))}
        </CardRail>
      ) : nearbyQuery.error && restaurants.length === 0 ? (
        <ErrorState
          title="Could not load nearby restaurants"
          message="Please try again in a moment."
          onRetry={() => nearbyQuery.refetch()}
        />
      ) : visibleRestaurants.length === 0 ? (
        <EmptyState
          icon="restaurant"
          title={`No restaurants found within ${RADIUS_KM} km`}
          description="Try changing your delivery location."
          actionLabel="Change location"
          onAction={() => setLocationOpen(true)}
        />
      ) : (
        <CardRail itemWidth="w-[208px]">
          {visibleRestaurants.map((restaurant) => (
            <NearbyRestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </CardRail>
      )}

      <LocationModal open={locationOpen} onClose={() => setLocationOpen(false)} />
    </HomeSection>
  );
}
