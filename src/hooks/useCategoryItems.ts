'use client';

import { useQuery } from '@tanstack/react-query';
import { getCustomerWebCategoryItems } from '@/services/categoryApi';

const DEFAULT_RADIUS_KM = 7;
const DEFAULT_LIMIT = 20;

export function useCategoryItems(params: {
  categoryKey?: string | null;
  lat?: number | null;
  lng?: number | null;
  radiusKm?: number;
  page?: number;
  limit?: number;
  vegOnly?: boolean;
  sort?: string;
  enabled?: boolean;
}) {
  const radiusKm = params.radiusKm ?? DEFAULT_RADIUS_KM;
  const page = params.page ?? 1;
  const limit = params.limit ?? DEFAULT_LIMIT;
  const categoryKey = params.categoryKey ?? '';

  return useQuery({
    queryKey: [
      'customer-web-category-items',
      categoryKey,
      params.lat ?? null,
      params.lng ?? null,
      radiusKm,
      page,
      params.sort ?? 'recommended',
      params.vegOnly ?? false,
    ],
    queryFn: () =>
      getCustomerWebCategoryItems({
        categoryKey,
        lat: params.lat ?? undefined,
        lng: params.lng ?? undefined,
        radiusKm,
        page,
        limit,
        vegOnly: params.vegOnly,
        sort: params.sort,
      }),
    enabled: Boolean(categoryKey) && (params.enabled ?? true),
    staleTime: 60 * 1000,
  });
}
