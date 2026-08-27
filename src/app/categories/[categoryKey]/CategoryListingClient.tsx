'use client';

import { useEffect, useMemo, useState } from 'react';
import { CartConflictModal } from '@/components/cart/CartConflictModal';
import { CategoryItemCard } from '@/components/home/CategoryItemCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { LocationModal } from '@/components/location/LocationModal';
import { ItemCustomizeModal } from '@/components/modals/ItemCustomizeModal';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { VegIndicator } from '@/components/ui/FoodMeta';
import { CardGridSkeleton, LoadingAnnouncement } from '@/components/ui/Skeleton';
import { SortMenu, type SortOption } from '@/components/ui/SortMenu';
import { useCategoryItems } from '@/hooks/useCategoryItems';
import { useCartStore } from '@/store/cartStore';
import { useLocationStore } from '@/store/locationStore';
import { categoryItemToMenuItem } from '@/utils/categoryAdapter';
import type { CategoryFoodItem } from '@/types/category';

interface CategoryListingClientProps {
  categoryKey: string;
  initialName?: string;
  initialLat?: number;
  initialLng?: number;
  initialRadiusKm?: number;
}

const PAGE_LIMIT = 20;
const DEFAULT_RADIUS_KM = 7;

/** Grid geometry is shared with the skeleton so loading never shifts the page. */
const GRID_CLASSNAME = 'grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4';

/**
 * Sorting is applied client-side over the dishes already loaded. The backend
 * `sort` parameter is left at its original 'recommended' value because no other
 * value is known to be supported by /customer-web/categories/{key}/items, and
 * guessing one risks breaking the listing. Ordering therefore covers everything
 * fetched so far, and stays correct as more pages are appended.
 */
const SORT_OPTIONS: SortOption[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price_low', label: 'Price: low to high' },
  { value: 'price_high', label: 'Price: high to low' },
  { value: 'distance', label: 'Nearest first' },
];

function sortItems(items: CategoryFoodItem[], sort: string) {
  if (sort === 'recommended') return items;

  const sorted = [...items];
  if (sort === 'price_low') return sorted.sort((a, b) => a.price - b.price);
  if (sort === 'price_high') return sorted.sort((a, b) => b.price - a.price);
  if (sort === 'distance') {
    return sorted.sort(
      (a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY)
    );
  }
  return sorted;
}

export function CategoryListingClient({
  categoryKey: categoryKeyProp,
  initialName,
  initialLat,
  initialLng,
  initialRadiusKm,
}: CategoryListingClientProps) {
  const categoryKey = normalizeCategoryKey(categoryKeyProp);
  const categoryName = normalizeCategoryName(categoryKey, initialName);
  const heading = categoryKey === 'all' ? 'Popular dishes near you' : `${categoryName} near you`;

  const storeLat = useLocationStore((state) => state.latitude);
  const storeLng = useLocationStore((state) => state.longitude);
  const lat = initialLat ?? storeLat;
  const lng = initialLng ?? storeLng;
  const radiusKm = initialRadiusKm ?? DEFAULT_RADIUS_KM;

  const [sort, setSort] = useState('recommended');
  const [vegOnly, setVegOnly] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  // `sort` is deliberately absent: it is applied client-side and must not
  // discard already-fetched pages.
  const requestKey = `${categoryKey}:${lat ?? ''}:${lng ?? ''}:${radiusKm}:${vegOnly}`;

  const [page, setPage] = useState(1);
  const [items, setItems] = useState<CategoryFoodItem[]>([]);
  const [customizeItem, setCustomizeItem] = useState<CategoryFoodItem | null>(null);
  const [pendingItem, setPendingItem] = useState<CategoryFoodItem | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const setRestaurant = useCartStore((state) => state.setRestaurant);
  const isDifferentRestaurant = useCartStore((state) => state.isDifferentRestaurant);

  const itemsQuery = useCategoryItems({
    categoryKey,
    lat,
    lng,
    radiusKm,
    page,
    limit: PAGE_LIMIT,
    sort: 'recommended',
    vegOnly,
    enabled: Boolean(categoryKey),
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setItems([]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [requestKey]);

  useEffect(() => {
    if (!itemsQuery.data) return;

    const nextItems = itemsQuery.data.items;
    const timer = window.setTimeout(() => {
      setItems((currentItems) => {
        if (page === 1) return nextItems;
        return mergeUniqueItems(currentItems, nextItems);
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [itemsQuery.data, page]);

  const categoryMenuItem = customizeItem ? categoryItemToMenuItem(customizeItem) : null;
  const totalCount = itemsQuery.data?.totalCount ?? itemsQuery.data?.pagination.totalCount;
  const hasMoreItems = Boolean(
    itemsQuery.data?.pagination.hasMore || (totalCount != null && items.length < totalCount)
  );
  const firstPageLoading = page === 1 && items.length === 0 && itemsQuery.isLoading;
  const loadingMore = page > 1 && itemsQuery.isFetching;
  const errorMessage = getErrorMessage(itemsQuery.error);
  const hasFilters = vegOnly || sort !== 'recommended';

  const addItemDirectly = (item: CategoryFoodItem) => {
    setRestaurant(item.restaurantId, item.restaurantName, item.restaurantSlug);
    addItem({
      restaurant_id: item.restaurantId,
      restaurant_name: item.restaurantName,
      restaurant_slug: item.restaurantSlug,
      item_id: item.itemId,
      name: item.name,
      image_url: item.imageUrl,
      quantity: 1,
      base_price: item.price,
      category_id: item.categoryId,
      category_name: item.categoryName,
      is_taxable: item.isTaxable,
      addons: [],
    });
  };

  const hasCustomOptions = (item: CategoryFoodItem) =>
    Boolean(
      item.hasVariants ||
        item.hasAddons ||
        (item.variants?.length ?? 0) > 0 ||
        (item.addons?.length ?? 0) > 0
    );

  const handleAddItem = (item: CategoryFoodItem) => {
    if (isDifferentRestaurant(item.restaurantId)) {
      setPendingItem(item);
      setConflictOpen(true);
      return;
    }

    if (hasCustomOptions(item)) {
      setCustomizeItem(item);
      return;
    }

    addItemDirectly(item);
  };

  const handleCartCleared = () => {
    if (!pendingItem) return;

    const item = pendingItem;
    setPendingItem(null);

    if (hasCustomOptions(item)) {
      setCustomizeItem(item);
      return;
    }

    addItemDirectly(item);
  };

  const visibleItems = useMemo(() => sortItems(items, sort), [items, sort]);

  const resultCountLabel = useMemo(() => {
    if (firstPageLoading) return undefined;
    if (items.length === 0) return undefined;
    if (totalCount != null && totalCount > items.length) {
      return `${items.length} of ${totalCount} dishes`;
    }
    return `${items.length} ${items.length === 1 ? 'dish' : 'dishes'}`;
  }, [firstPageLoading, items.length, totalCount]);

  return (
    <main id="main-content" className="page-main page-container">
      <PageHeader
        eyebrow="Category"
        title={heading}
        count={resultCountLabel}
        backHref="/"
        meta={
          lat != null && lng != null ? (
            <button
              type="button"
              onClick={() => setLocationOpen(true)}
              className="rounded-full font-semibold underline-offset-4 transition-colors hover:text-brand-800 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25"
            >
              Within {radiusKm} km of your location
            </button>
          ) : (
            `Showing ${categoryName.toLowerCase()} from available restaurants`
          )
        }
      >
        {/* Filters and sort. Horizontally scrollable on mobile so they never wrap
            into a crowded two-row block. */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar sm:flex-wrap sm:overflow-visible">
          <Chip active={vegOnly} onClick={() => setVegOnly((current) => !current)}>
            <VegIndicator vegetarian size="sm" />
            Veg only
          </Chip>

          <SortMenu options={SORT_OPTIONS} value={sort} onChange={setSort} />

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setVegOnly(false);
                setSort('recommended');
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </PageHeader>

      {firstPageLoading ? (
        <>
          <LoadingAnnouncement label="Loading dishes" />
          <CardGridSkeleton count={8} className={GRID_CLASSNAME} />
        </>
      ) : errorMessage && items.length === 0 ? (
        <ErrorState
          title="Could not load dishes"
          message={errorMessage}
          onRetry={() => itemsQuery.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon="dish"
          title={hasFilters ? 'No dishes match these filters' : 'No dishes in this category yet'}
          description={
            hasFilters
              ? 'Try clearing your filters or picking another category.'
              : 'Try another category from the home page.'
          }
          actionLabel={hasFilters ? 'Clear filters' : undefined}
          onAction={
            hasFilters
              ? () => {
                  setVegOnly(false);
                  setSort('recommended');
                }
              : undefined
          }
        />
      ) : (
        <>
          <div className={GRID_CLASSNAME}>
            {visibleItems.map((item, index) => (
              <CategoryItemCard
                key={`${item.restaurantId}-${item.itemId}`}
                item={item}
                onAdd={handleAddItem}
                priority={index < 4}
              />
            ))}
          </div>

          {hasMoreItems && (
            <div className="mt-8 flex justify-center">
              <Button
                variant="outline"
                size="md"
                loading={loadingMore}
                onClick={() => setPage((currentPage) => currentPage + 1)}
              >
                {loadingMore ? 'Loading' : 'Load more dishes'}
              </Button>
            </div>
          )}
        </>
      )}

      <ItemCustomizeModal
        item={categoryMenuItem}
        restaurantId={customizeItem?.restaurantId ?? 0}
        restaurantName={customizeItem?.restaurantName ?? ''}
        restaurantSlug={customizeItem?.restaurantSlug}
        onClose={() => setCustomizeItem(null)}
      />
      <CartConflictModal
        open={conflictOpen}
        onClose={() => setConflictOpen(false)}
        newRestaurantName={pendingItem?.restaurantName ?? ''}
        onCleared={handleCartCleared}
      />
      <LocationModal open={locationOpen} onClose={() => setLocationOpen(false)} />
    </main>
  );
}

function mergeUniqueItems(currentItems: CategoryFoodItem[], nextItems: CategoryFoodItem[]) {
  const seen = new Set(currentItems.map((item) => `${item.restaurantId}-${item.itemId}`));
  const uniqueNextItems = nextItems.filter((item) => {
    const key = `${item.restaurantId}-${item.itemId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return [...currentItems, ...uniqueNextItems];
}

function normalizeCategoryKey(value: string) {
  try {
    return decodeURIComponent(value).trim().toLowerCase() || 'all';
  } catch {
    return value.trim().toLowerCase() || 'all';
  }
}

function normalizeCategoryName(categoryKey: string, initialName?: string) {
  const name = initialName?.trim();
  if (name && categoryKey !== 'all') return name;
  if (categoryKey === 'all') return 'Popular Dishes';

  return categoryKey
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getErrorMessage(error: unknown) {
  if (!error) return '';
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message?: unknown }).message ?? '');
  }
  return 'Something went wrong. Please try again.';
}
