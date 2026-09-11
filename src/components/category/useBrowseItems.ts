'use client';

import { useQueries } from '@tanstack/react-query';
import { useState } from 'react';
import { getCustomerWebCategoryItems } from '@/services/categoryApi';
import type { CategoryFoodItem } from '@/types/category';

export function useBrowseItems({ categoryKey, lat, lng, radiusKm }: {
  categoryKey: string; lat: number | null; lng: number | null; radiusKm: number;
}) {
  const [pages, setPages] = useState(1);
  const queries = useQueries({ queries: Array.from({ length: pages }, (_, index) => ({
    // Same keys, page size, service and freshness as useCategoryItems.
    queryKey: ['customer-web-category-items', categoryKey, lat, lng, radiusKm, index + 1, 20, 'recommended', false],
    queryFn: () => getCustomerWebCategoryItems({ categoryKey, lat: lat ?? undefined,
      lng: lng ?? undefined, radiusKm, page: index + 1, limit: 20, sort: 'recommended', vegOnly: false }),
    staleTime: 60_000,
  })) });
  const unique = new Map<string, CategoryFoodItem>();
  for (const query of queries) for (const item of query.data?.items ?? []) {
    unique.set(`${item.restaurantId}:${item.itemId}`, item);
  }
  const items = [...unique.values()];
  const last = queries.at(-1)!;
  const total = queries[0].data?.totalCount ?? queries[0].data?.pagination.totalCount;
  // Page metadata (not filtered/deduplicated item count) determines exhaustion.
  const hasMore = Boolean(last.data && (last.data.pagination.hasMore ||
    (total != null && last.data.pagination.page * last.data.pagination.limit < total)));
  return { items, total, name: queries[0].data?.category?.name,
    loading: queries[0].isPending, loadingMore: pages > 1 && last.isFetching,
    error: last.error, retry: () => last.refetch(), hasMore,
    loadMore: () => { if (hasMore && !last.isFetching && !last.isError) setPages((p) => p + 1); },
  };
}
