'use client';

import { useQuery } from '@tanstack/react-query';
import { getCustomerWebCategories } from '@/services/categoryApi';

const DEFAULT_RADIUS_KM = 7;

export function useExploreCategories(params: {
  lat?: number | null;
  lng?: number | null;
  radiusKm?: number;
  includeAll?: boolean;
  enabled?: boolean;
} = {}) {
  const radiusKm = params.radiusKm ?? DEFAULT_RADIUS_KM;

  return useQuery({
    queryKey: [
      'customer-web-categories',
      params.lat ?? null,
      params.lng ?? null,
      radiusKm,
    ],
    queryFn: () =>
      getCustomerWebCategories({
        lat: params.lat ?? undefined,
        lng: params.lng ?? undefined,
        radiusKm,
        includeAll: params.includeAll ?? true,
      }),
    enabled: params.enabled ?? true,
    staleTime: 2 * 60 * 1000,
  });
}
