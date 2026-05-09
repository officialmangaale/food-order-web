'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import { CartConflictModal } from '@/components/cart/CartConflictModal';
import { CategoryItemCard } from '@/components/home/CategoryItemCard';
import { ItemCustomizeModal } from '@/components/modals/ItemCustomizeModal';
import { Skeleton } from '@/components/ui/Skeleton';
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

export function CategoryListingClient({
  categoryKey: categoryKeyProp,
  initialName,
  initialLat,
  initialLng,
  initialRadiusKm,
}: CategoryListingClientProps) {
  const categoryKey = normalizeCategoryKey(categoryKeyProp);
  const categoryName = normalizeCategoryName(categoryKey, initialName);
  const heading = categoryKey === 'all' ? 'Popular Dishes Near You' : `${categoryName} Near You`;

  const storeLat = useLocationStore((state) => state.latitude);
  const storeLng = useLocationStore((state) => state.longitude);
  const lat = initialLat ?? storeLat;
  const lng = initialLng ?? storeLng;
  const radiusKm = initialRadiusKm ?? DEFAULT_RADIUS_KM;
  const requestKey = `${categoryKey}:${lat ?? ''}:${lng ?? ''}:${radiusKm}`;

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
    vegOnly: false,
    enabled: Boolean(categoryKey),
  });

  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [requestKey]);

  useEffect(() => {
    if (!itemsQuery.data) return;

    setItems((currentItems) => {
      if (page === 1) return itemsQuery.data.items;
      return mergeUniqueItems(currentItems, itemsQuery.data.items);
    });
  }, [itemsQuery.data, page]);

  const categoryMenuItem = customizeItem ? categoryItemToMenuItem(customizeItem) : null;
  const totalCount = itemsQuery.data?.totalCount ?? itemsQuery.data?.pagination.totalCount;
  const hasMoreItems = Boolean(
    itemsQuery.data?.pagination.hasMore || (totalCount != null && items.length < totalCount)
  );
  const firstPageLoading = page === 1 && items.length === 0 && itemsQuery.isLoading;
  const loadingMore = page > 1 && itemsQuery.isFetching;
  const errorMessage = getErrorMessage(itemsQuery.error);

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
    Boolean(item.hasVariants || item.hasAddons || (item.variants?.length ?? 0) > 0 || (item.addons?.length ?? 0) > 0);

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

  const resultCountLabel = useMemo(() => {
    if (items.length === 0) return '';
    if (totalCount != null && totalCount > items.length) return `${items.length} of ${totalCount} dishes`;
    return `${items.length} dishes`;
  }, [items.length, totalCount]);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-[#F0DADA] bg-white px-4 py-2 text-sm font-bold text-[#1F1A1A] transition hover:border-[#A80F15] hover:text-[#A80F15]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Home
        </Link>
        <p className="text-sm font-semibold text-[#7B6B6B]">
          {lat != null && lng != null ? `Within ${radiusKm} km of your location` : `Showing ${categoryName.toLowerCase()} from available restaurants`}
        </p>
      </div>

      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#A80F15]">Category</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#1F1A1A] sm:text-3xl">{heading}</h1>
        </div>
        {resultCountLabel && (
          <p className="shrink-0 text-sm font-bold text-[#7B6B6B]">{resultCountLabel}</p>
        )}
      </div>

      {firstPageLoading ? (
        <ListingSkeleton />
      ) : errorMessage && items.length === 0 ? (
        <ListingError message={errorMessage} onRetry={() => itemsQuery.refetch()} />
      ) : items.length === 0 ? (
        <ListingEmpty />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {items.map((item) => (
              <CategoryItemCard
                key={`${item.restaurantId}-${item.itemId}`}
                item={item}
                onAdd={handleAddItem}
              />
            ))}
          </div>

          {hasMoreItems && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setPage((currentPage) => currentPage + 1)}
                disabled={loadingMore}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#A80F15] px-6 py-3 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(168,15,21,0.18)] transition hover:bg-[#8F0D12] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {loadingMore ? 'Loading' : 'Load more'}
              </button>
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
    </main>
  );
}

function ListingSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-xl border border-[#F0DADA] bg-white">
          <Skeleton className="h-[160px] w-full rounded-none sm:h-[172px] lg:h-[180px]" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-10 w-full" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-11 w-11 rounded-full" rounded />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ListingError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-[#F0DADA] bg-white px-6 py-10 text-center shadow-[0_12px_30px_rgba(168,15,21,0.05)]">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0F0] text-[#A80F15]">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-extrabold text-[#1F1A1A]">Could not load dishes</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7B6B6B]">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-full bg-[#A80F15] px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#8F0D12]"
      >
        Try again
      </button>
    </div>
  );
}

function ListingEmpty() {
  return (
    <div className="rounded-2xl border border-[#F0DADA] bg-white px-6 py-8 text-center shadow-[0_12px_30px_rgba(168,15,21,0.05)]">
      <h2 className="text-base font-extrabold text-[#1F1A1A]">No items available in this category.</h2>
      <p className="mt-2 text-sm leading-6 text-[#7B6B6B]">Try another category from the home page.</p>
    </div>
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
  if (typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message ?? '');
  }
  return 'Something went wrong. Please try again.';
}
