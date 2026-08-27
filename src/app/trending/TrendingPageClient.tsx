'use client';

import { useMemo, useState } from 'react';
import { CartConflictModal } from '@/components/cart/CartConflictModal';
import { TrendingItemCard } from '@/components/home/TrendingItemCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { ItemCustomizeModal } from '@/components/modals/ItemCustomizeModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { CardGridSkeleton, LoadingAnnouncement } from '@/components/ui/Skeleton';
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

/** Shared by the grid and its skeleton so loading never reflows the page. */
const GRID_CLASSNAME = 'grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4';

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
    if (trendingQuery.isLoading || items.length === 0) return undefined;
    if (total != null && total > items.length) return `${items.length} of ${total} dishes`;
    return `${items.length} ${items.length === 1 ? 'dish' : 'dishes'}`;
  }, [items.length, total, trendingQuery.isLoading]);

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
    Boolean(
      item.hasVariants ||
        item.hasAddons ||
        (item.variants?.length ?? 0) > 0 ||
        (item.addons?.length ?? 0) > 0
    );

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
    <main id="main-content" className="page-main page-container">
      <PageHeader
        eyebrow="Trending"
        title="Trending now near you"
        count={resultCountLabel}
        backHref="/"
        meta={
          lat != null && lng != null
            ? `Within ${radiusKm} km from the last ${windowDays} days`
            : `Top dishes from the last ${windowDays} days`
        }
      />

      {trendingQuery.isLoading ? (
        <>
          <LoadingAnnouncement label="Loading trending dishes" />
          <CardGridSkeleton count={8} className={GRID_CLASSNAME} />
        </>
      ) : trendingQuery.error && items.length === 0 ? (
        <ErrorState
          title="Could not load trending dishes"
          message="Please try again in a moment."
          onRetry={() => trendingQuery.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon="dish"
          title="Trending dishes will appear here soon"
          description="Check back after more nearby orders come in."
        />
      ) : (
        <div className={GRID_CLASSNAME}>
          {items.map((item, index) => (
            <TrendingItemCard
              key={`${item.restaurantId}-${item.itemId}`}
              item={item}
              onAdd={handleAddItem}
              priority={index < 4}
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
