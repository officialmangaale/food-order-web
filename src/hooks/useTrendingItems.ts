'use client';

import { useQuery } from '@tanstack/react-query';
import { getTrendingItems } from '@/services/trendingApi';

const DEFAULT_RADIUS_KM = 7;
const DEFAULT_WINDOW_DAYS = 7;
const DEFAULT_LIMIT = 6;

export function useTrendingItems(params: {
  lat?: number | null;
  lng?: number | null;
  radiusKm?: number;
  windowDays?: number;
  limit?: number;
  vegOnly?: boolean;
  lockedRestaurantId?: number | null;
  enabled?: boolean;
} = {}) {
  const radiusKm = params.radiusKm ?? DEFAULT_RADIUS_KM;
  const windowDays = params.windowDays ?? DEFAULT_WINDOW_DAYS;
  const limit = params.limit ?? DEFAULT_LIMIT;

  return useQuery({
    queryKey: [
      'trending-items',
      params.lat ?? null,
      params.lng ?? null,
      radiusKm,
      windowDays,
      params.lockedRestaurantId ?? null,
      limit,
      params.vegOnly ?? false,
    ],
    queryFn: () =>
      getTrendingItems({
        lat: params.lat ?? undefined,
        lng: params.lng ?? undefined,
        radiusKm,
        windowDays,
        limit,
        vegOnly: params.vegOnly,
      }),
    enabled: params.enabled ?? true,
    staleTime: 60 * 1000,
    retry: 1,
  });
}
