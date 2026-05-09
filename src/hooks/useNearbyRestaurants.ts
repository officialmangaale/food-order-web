'use client';

import { useQuery } from '@tanstack/react-query';
import { getNearbyRestaurants } from '@/services/restaurantApi';

const DEFAULT_RADIUS_KM = 7;
const DEFAULT_LIMIT = 20;

export function useNearbyRestaurants(params: {
  lat?: number | null;
  lng?: number | null;
  radiusKm?: number;
  page?: number;
  limit?: number;
  enabled?: boolean;
}) {
  const radiusKm = params.radiusKm ?? DEFAULT_RADIUS_KM;
  const page = params.page ?? 1;
  const limit = params.limit ?? DEFAULT_LIMIT;
  const hasLocation = params.lat != null && params.lng != null;

  return useQuery({
    queryKey: ['nearby-restaurants', params.lat ?? null, params.lng ?? null, radiusKm, page],
    queryFn: () =>
      getNearbyRestaurants({
        lat: params.lat as number,
        lng: params.lng as number,
        radiusKm,
        page,
        limit,
      }),
    enabled: hasLocation && (params.enabled ?? true),
    staleTime: 60 * 1000,
    retry: 1,
  });
}
