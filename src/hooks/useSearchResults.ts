'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchGlobalSearch, fetchLockedRestaurantSearch } from '@/services/searchApi';
import { resolveRestaurantIdentifier } from '@/services/restaurantApi';
import { useLocationStore } from '@/store/locationStore';
import type { SearchFilters, SearchTab } from '@/types/search';

interface UseSearchResultsParams {
  query: string;
  tab: SearchTab;
  filters: SearchFilters;
  locked?: boolean;
  restaurantId?: number | null;
  restaurantIdentifier?: string | null;
  restaurantName?: string | null;
}

export function useSearchResults({
  query,
  tab,
  filters,
  locked,
  restaurantId,
  restaurantIdentifier,
  restaurantName,
}: UseSearchResultsParams) {
  const lat = useLocationStore((s) => s.latitude);
  const lng = useLocationStore((s) => s.longitude);
  const cleanQuery = query.trim();

  const resolverQuery = useQuery({
    queryKey: ['search-restaurant-resolve', restaurantIdentifier ?? restaurantId],
    queryFn: () => resolveRestaurantIdentifier(String(restaurantIdentifier ?? restaurantId)),
    enabled: Boolean(locked && !restaurantName && (restaurantIdentifier || restaurantId)),
    staleTime: 5 * 60 * 1000,
  });

  const effectiveRestaurantId = restaurantId ?? resolverQuery.data?.id ?? null;
  const effectiveRestaurantName = restaurantName ?? resolverQuery.data?.name ?? null;

  const searchQuery = useQuery({
    queryKey: [
      locked ? 'locked-search' : 'global-search',
      cleanQuery,
      tab,
      filters,
      lat,
      lng,
      effectiveRestaurantId,
    ],
    queryFn: () => {
      if (locked) {
        return fetchLockedRestaurantSearch({
          restaurantId: effectiveRestaurantId!,
          query: cleanQuery,
          page: 1,
          limit: 20,
          filters,
        });
      }

      return fetchGlobalSearch({
        query: cleanQuery,
        lat,
        lng,
        radiusKm: 7,
        tab: tab === 'dishes' ? 'all' : 'restaurants',
        page: 1,
        limit: 20,
        filters,
      });
    },
    enabled: Boolean(cleanQuery && (!locked || effectiveRestaurantId)),
  });

  return useMemo(
    () => ({
      ...searchQuery,
      isResolvingRestaurant: resolverQuery.isLoading,
      restaurantName: effectiveRestaurantName,
      restaurantId: effectiveRestaurantId,
    }),
    [searchQuery, resolverQuery.isLoading, effectiveRestaurantName, effectiveRestaurantId]
  );
}
