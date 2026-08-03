'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
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
      <motion.section
        className="order-5 mx-auto mt-9 w-full max-w-7xl px-4 sm:px-6 lg:px-8"
        aria-label="Trending dishes loading"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <SectionHeading />
        <TrendingSkeleton />
      </motion.section>
    );
  }

  if (trendingQuery.error && items.length === 0) {
    return (
      <motion.section
        className="order-5 mx-auto mt-9 w-full max-w-7xl px-4 sm:px-6 lg:px-8"
        aria-labelledby="trending-now-heading"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <SectionHeading />
        <TrendingError onRetry={() => trendingQuery.refetch()} />
      </motion.section>
    );
  }

  if (visibleItems.length === 0) return null;

  return (
    <motion.section
      className="order-5 mx-auto mt-9 w-full max-w-7xl px-4 sm:px-6 lg:px-8"
      aria-labelledby="trending-now-heading"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <SectionHeading showViewAll={hasMoreItems} viewAllHref={viewAllHref} />

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 hide-scrollbar sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-3 lg:gap-6">
        {visibleItems.map((item) => (
          <div key={`${item.restaurantId}-${item.itemId}`} className="w-[140px] shrink-0 sm:w-auto">
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
    </motion.section>
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
    <div className="relative mb-4">
      <div className="pr-16">
        <h2 id="trending-now-heading" className="text-lg font-extrabold tracking-[-0.025em] text-ink sm:text-3xl">
          Trending favourites
        </h2>
        <p className="mt-1 whitespace-nowrap text-xs font-medium text-ink-muted sm:text-sm">Popular dishes people are ordering</p>
      </div>
      {showViewAll && (
        <Link
          href={viewAllHref}
          className="absolute right-0 top-1 shrink-0 rounded-full px-1 text-sm font-bold text-brand-500 transition hover:text-brand-600 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15"
        >
          View All
        </Link>
      )}
    </div>
  );
}

function TrendingSkeleton() {
  return (
    <div className="-mx-4 flex gap-3 overflow-hidden px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:px-0 lg:grid-cols-3 lg:gap-6">
      {[1, 2, 3].map((item) => (
        <div key={item} className="w-[140px] shrink-0 overflow-hidden rounded-card border border-line bg-surface sm:w-auto">
          <Skeleton className="h-[92px] w-full rounded-none sm:h-[184px]" />
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
    <div className="rounded-card border border-line bg-surface px-5 py-6 shadow-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cherry-50 text-danger">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-base font-extrabold text-ink">Trending dishes are unavailable</h3>
            <p className="mt-1 text-sm leading-6 text-ink-muted">Please try again in a moment.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:opacity-50"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
