'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
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

const HOME_TRENDING_LIMIT = 6;
const HOME_TRENDING_VISIBLE = 3;
const RADIUS_KM = 7;
const WINDOW_DAYS = 7;

export function TrendingNowSection() {
  const pathname = usePathname();
  const isLockedRoute = pathname.startsWith('/r/');
  const lockedRestaurantId = useRestaurantModeStore((state) => state.lockedRestaurantId);
  const lat = useLocationStore((state) => state.latitude);
  const lng = useLocationStore((state) => state.longitude);
  const [customizeItem, setCustomizeItem] = useState<TrendingItem | null>(null);
  const [pendingItem, setPendingItem] = useState<TrendingItem | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const setRestaurant = useCartStore((state) => state.setRestaurant);
  const isDifferentRestaurant = useCartStore((state) => state.isDifferentRestaurant);

  const trendingQuery = useTrendingItems({
    lat,
    lng,
    radiusKm: RADIUS_KM,
    windowDays: WINDOW_DAYS,
    limit: HOME_TRENDING_LIMIT,
    lockedRestaurantId,
    enabled: !isLockedRoute,
  });

  const items = trendingQuery.data?.items ?? [];
  const visibleItems = items.slice(0, HOME_TRENDING_VISIBLE);
  const total = trendingQuery.data?.meta.total;
  const hasMoreItems = Boolean(
    items.length > HOME_TRENDING_VISIBLE ||
      trendingQuery.data?.meta.hasMore ||
      (total != null && total > HOME_TRENDING_VISIBLE)
  );
  const viewAllHref = useMemo(() => {
    const query = new URLSearchParams();
    if (typeof lat === 'number' && Number.isFinite(lat)) query.set('lat', String(lat));
    if (typeof lng === 'number' && Number.isFinite(lng)) query.set('lng', String(lng));
    query.set('radius_km', String(RADIUS_KM));
    query.set('window_days', String(WINDOW_DAYS));
    return `/trending?${query.toString()}`;
  }, [lat, lng]);
  const categoryMenuItem = customizeItem ? trendingItemToMenuItem(customizeItem) : null;

  if (isLockedRoute) return null;

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

  if (trendingQuery.isLoading) {
    return (
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Trending dishes loading">
        <SectionHeading />
        <TrendingSkeleton />
      </section>
    );
  }

  if (trendingQuery.error && items.length === 0) {
    return (
      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8" aria-labelledby="trending-now-heading">
        <SectionHeading />
        <TrendingError onRetry={() => trendingQuery.refetch()} />
      </section>
    );
  }

  if (visibleItems.length === 0) return null;

  return (
    <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8" aria-labelledby="trending-now-heading">
      <SectionHeading showViewAll={hasMoreItems} viewAllHref={viewAllHref} />

      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 hide-scrollbar sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-3 lg:gap-6">
        {visibleItems.map((item) => (
          <div key={`${item.restaurantId}-${item.itemId}`} className="w-[280px] shrink-0 sm:w-auto">
            <TrendingItemCard item={item} onAdd={handleAddItem} />
          </div>
        ))}
      </div>

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
    </section>
  );
}

function SectionHeading({
  showViewAll,
  viewAllHref = '/trending',
}: {
  showViewAll?: boolean;
  viewAllHref?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 id="trending-now-heading" className="text-xl font-extrabold text-[#1F1A1A] sm:text-2xl">
        Trending Now
      </h2>
      {showViewAll && (
        <Link
          href={viewAllHref}
          className="shrink-0 text-sm font-bold text-[#A80F15] transition hover:text-[#7C1118] hover:underline"
        >
          View All
        </Link>
      )}
    </div>
  );
}

function TrendingSkeleton() {
  return (
    <div className="-mx-4 flex gap-4 overflow-hidden px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:px-0 lg:grid-cols-3 lg:gap-6">
      {[1, 2, 3].map((item) => (
        <div key={item} className="w-[280px] shrink-0 overflow-hidden rounded-2xl border border-[#F0DADA] bg-white sm:w-auto">
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

function TrendingError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-[#F0DADA] bg-white px-5 py-6 shadow-[0_12px_30px_rgba(168,15,21,0.05)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF0F0] text-[#A80F15]">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-base font-extrabold text-[#1F1A1A]">Trending dishes are unavailable</h3>
            <p className="mt-1 text-sm leading-6 text-[#7B6B6B]">Please try again in a moment.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-[#A80F15] px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#8F0D12]"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
