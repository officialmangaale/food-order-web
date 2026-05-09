'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { CartConflictModal } from '@/components/cart/CartConflictModal';
import { TrendingItemCard } from '@/components/home/TrendingItemCard';
import { ItemCustomizeModal } from '@/components/modals/ItemCustomizeModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTrendingItems } from '@/hooks/useTrendingItems';
import { useCartStore } from '@/store/cartStore';
import { useLocationStore } from '@/store/locationStore';
import { useRestaurantModeStore } from '@/store/restaurantModeStore';
import { trendingItemToMenuItem } from '@/utils/trendingAdapter';
import type { TrendingItem } from '@/types/trending';

interface TrendingPageClientProps {
  initialLat?: number;
  initialLng?: number;
  initialRadiusKm?: number;
  initialWindowDays?: number;
}

const PAGE_LIMIT = 20;
const DEFAULT_RADIUS_KM = 7;
const DEFAULT_WINDOW_DAYS = 7;

export function TrendingPageClient({
  initialLat,
  initialLng,
  initialRadiusKm,
  initialWindowDays,
}: TrendingPageClientProps) {
  const storeLat = useLocationStore((state) => state.latitude);
  const storeLng = useLocationStore((state) => state.longitude);
  const lockedRestaurantId = useRestaurantModeStore((state) => state.lockedRestaurantId);
  const lat = initialLat ?? storeLat;
  const lng = initialLng ?? storeLng;
  const radiusKm = initialRadiusKm ?? DEFAULT_RADIUS_KM;
  const windowDays = initialWindowDays ?? DEFAULT_WINDOW_DAYS;
  const [customizeItem, setCustomizeItem] = useState<TrendingItem | null>(null);
  const [pendingItem, setPendingItem] = useState<TrendingItem | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const setRestaurant = useCartStore((state) => state.setRestaurant);
  const isDifferentRestaurant = useCartStore((state) => state.isDifferentRestaurant);

  const trendingQuery = useTrendingItems({
    lat,
    lng,
    radiusKm,
    windowDays,
    limit: PAGE_LIMIT,
    lockedRestaurantId,
  });

  const items = trendingQuery.data?.items ?? [];
  const total = trendingQuery.data?.meta.total;
  const categoryMenuItem = customizeItem ? trendingItemToMenuItem(customizeItem) : null;
  const resultCountLabel = useMemo(() => {
    if (items.length === 0) return '';
    if (total != null && total > items.length) return `${items.length} of ${total} dishes`;
    return `${items.length} dishes`;
  }, [items.length, total]);

  const addItemDirectly = (item: TrendingItem) => {
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

  const hasCustomOptions = (item: TrendingItem) =>
    Boolean(item.hasVariants || item.hasAddons || (item.variants?.length ?? 0) > 0 || (item.addons?.length ?? 0) > 0);

  const handleAddItem = (item: TrendingItem) => {
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
          {lat != null && lng != null ? `Within ${radiusKm} km from the last ${windowDays} days` : `Top dishes from the last ${windowDays} days`}
        </p>
      </div>

      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#A80F15]">Trending</p>
          <h1 className="mt-1 text-2xl font-extrabold text-[#1F1A1A] sm:text-3xl">Trending Now Near You</h1>
        </div>
        {resultCountLabel && (
          <p className="shrink-0 text-sm font-bold text-[#7B6B6B]">{resultCountLabel}</p>
        )}
      </div>

      {trendingQuery.isLoading ? (
        <TrendingPageSkeleton />
      ) : trendingQuery.error && items.length === 0 ? (
        <TrendingPageError onRetry={() => trendingQuery.refetch()} />
      ) : items.length === 0 ? (
        <TrendingPageEmpty />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-6">
          {items.map((item) => (
            <TrendingItemCard
              key={`${item.restaurantId}-${item.itemId}`}
              item={item}
              onAdd={handleAddItem}
            />
          ))}
        </div>
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

function TrendingPageSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-6">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-[#F0DADA] bg-white">
          <Skeleton className="h-[176px] w-full rounded-none sm:h-[184px]" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-10 w-full" />
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-11 w-11 rounded-full" rounded />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendingPageError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-[#F0DADA] bg-white px-6 py-10 text-center shadow-[0_12px_30px_rgba(168,15,21,0.05)]">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0F0] text-[#A80F15]">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-extrabold text-[#1F1A1A]">Could not load trending dishes</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7B6B6B]">Please try again in a moment.</p>
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

function TrendingPageEmpty() {
  return (
    <div className="rounded-2xl border border-[#F0DADA] bg-white px-6 py-8 text-center shadow-[0_12px_30px_rgba(168,15,21,0.05)]">
      <h2 className="text-base font-extrabold text-[#1F1A1A]">Trending dishes will appear here soon.</h2>
      <p className="mt-2 text-sm leading-6 text-[#7B6B6B]">Check back after more nearby orders come in.</p>
    </div>
  );
}
