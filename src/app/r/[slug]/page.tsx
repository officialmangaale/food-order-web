'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, Star, Clock, Store } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { CartConflictModal } from '@/components/cart/CartConflictModal';
import { ExploreCategories } from '@/components/home/ExploreCategories';
import { Badge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/ErrorState';
import { MenuItemSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { ActiveOrderCard } from '@/components/home/ActiveOrderCard';
import { useRestaurantModeStore } from '@/store/restaurantModeStore';
import { useCartStore } from '@/store/cartStore';
import { useDebounce } from '@/hooks/useDebounce';
import { resolveRestaurantIdentifier, fetchRestaurantMenu } from '@/services/restaurantApi';
import { slugifyRestaurantName } from '@/utils/slug';
import type { MenuCategory } from '@/types/menu';

export default function LockedRestaurantPage() {
  const { slug } = useParams<{ slug: string }>();
  const enterLocked = useRestaurantModeStore((s) => s.enterLockedMode);
  const isDiff = useCartStore((s) => s.isDifferentRestaurant);
  const [dismissedConflictRestaurantId, setDismissedConflictRestaurantId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);

  const { data: restaurant, isLoading: rLoading, error: rErr } = useQuery({
    queryKey: ['resolveRestaurant', slug],
    queryFn: () => resolveRestaurantIdentifier(slug),
  });

  const { data: menu, isLoading: mLoading } = useQuery({
    queryKey: ['menu', restaurant?.id],
    queryFn: () => fetchRestaurantMenu(restaurant!.id),
    enabled: !!restaurant?.id,
  });

  // Enter locked mode when restaurant resolves
  useEffect(() => {
    if (restaurant) {
      const s = restaurant.slug ?? slugifyRestaurantName(restaurant.name);
      enterLocked(restaurant.id, s, restaurant.name);
    }
  }, [restaurant, enterLocked]);

  const filteredMenu = useMemo(() => {
    if (!menu) return [];
    let cats: MenuCategory[] = menu;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      cats = cats.map(c => ({
        ...c,
        items: (c.items ?? []).filter(i => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)),
      })).filter(c => (c.items?.length ?? 0) > 0);
    }
    return cats;
  }, [menu, debouncedSearch]);

  const lockedRestaurant = useMemo(() => {
    if (!restaurant) return undefined;

    return {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug ?? slugifyRestaurantName(restaurant.name),
      logoUrl: restaurant.logo_url,
      deliveryTime: restaurant.estimated_delivery_time,
      distanceKm: restaurant.distance_km,
      isOpen: restaurant.is_open,
    };
  }, [restaurant]);

  const conflictOpen = Boolean(
    restaurant && isDiff(restaurant.id) && dismissedConflictRestaurantId !== restaurant.id
  );
  const closeConflict = () => {
    if (restaurant) setDismissedConflictRestaurantId(restaurant.id);
  };

  // Error states
  if (rErr || (!rLoading && !restaurant)) {
    return <PageShell><ErrorState title="Restaurant unavailable" message="This restaurant link is unavailable or has been removed." /></PageShell>;
  }

  if (restaurant && restaurant.is_active === false) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <Store className="w-12 h-12 text-gray-300 mb-4" />
          <h2 className="text-lg font-bold text-gray-900">Not accepting orders</h2>
          <p className="text-sm text-gray-500 mt-1">{restaurant.name} is not accepting orders right now. Please check back later.</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell noPadding>
      {/* Restaurant banner */}
      <div className="h-40 relative">
        {restaurant?.banner_url || restaurant?.logo_url ? (
          <img src={restaurant.banner_url || restaurant.logo_url} alt={restaurant?.name} className="w-full h-full object-cover" />
        ) : <div className="w-full h-full food-placeholder" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 text-white">
          {rLoading ? <Skeleton className="h-6 w-48 bg-white/20" /> : (
            <>
              <h1 className="text-xl font-bold">{restaurant?.name}</h1>
              <p className="text-xs opacity-80 mt-0.5">You&apos;re ordering directly from this restaurant</p>
            </>
          )}
        </div>
      </div>

      <div className="px-4 pt-3">
        {/* Badges */}
        {restaurant && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {restaurant.is_open !== false ? <Badge variant="success" dot>Open</Badge> : <Badge variant="error" dot>Closed</Badge>}
            {restaurant.delivery_available ? <Badge variant="success">Delivery Available</Badge> : <Badge variant="error">No Delivery</Badge>}
            {restaurant.estimated_delivery_time && <Badge><Clock className="w-3 h-3" /> {restaurant.estimated_delivery_time}</Badge>}
            {restaurant.average_rating != null && restaurant.average_rating > 0 && (
              <Badge variant="cherry"><Star className="w-3 h-3" /> {restaurant.average_rating.toFixed(1)}</Badge>
            )}
          </div>
        )}

        <ActiveOrderCard />

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder={`Search ${restaurant?.name ?? 'menu'}...`}
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-cherry-500" />
        </div>

        {/* Restaurant-locked categories and items */}
        <div className="pb-8">
          {mLoading ? (
            [1,2,3].map(i => <MenuItemSkeleton key={i} />)
          ) : filteredMenu.length === 0 ? (
            <div className="text-center py-12"><p className="text-gray-500">{debouncedSearch ? 'No items match your search' : 'Menu is being updated'}</p></div>
          ) : lockedRestaurant ? (
            <Suspense fallback={<LockedExploreFallback />}>
              <ExploreCategories
                mode="locked"
                embedded
                lockedCategories={filteredMenu}
                lockedRestaurant={lockedRestaurant}
              />
            </Suspense>
          ) : null}
        </div>
      </div>

      <CartConflictModal open={conflictOpen} onClose={closeConflict} newRestaurantName={restaurant?.name ?? ''}
        onCleared={closeConflict} />
    </PageShell>
  );
}

function LockedExploreFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-56" />
      <div className="flex gap-3 overflow-hidden pb-2">
        {[1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-12 w-28 shrink-0 rounded-2xl" />
        ))}
      </div>
      {[1, 2, 3].map((item) => (
        <MenuItemSkeleton key={item} />
      ))}
    </div>
  );
}
