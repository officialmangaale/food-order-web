'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, Star, Clock, Store, WifiOff } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { MenuItemCard } from '@/components/restaurant/MenuItemCard';
import { ItemCustomizeModal } from '@/components/modals/ItemCustomizeModal';
import { CartConflictModal } from '@/components/cart/CartConflictModal';
import { Badge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/ErrorState';
import { MenuItemSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { ActiveOrderCard } from '@/components/home/ActiveOrderCard';
import { useRestaurantModeStore } from '@/store/restaurantModeStore';
import { useCartStore } from '@/store/cartStore';
import { useDebounce } from '@/hooks/useDebounce';
import { resolveRestaurantIdentifier, fetchRestaurantMenu } from '@/services/restaurantApi';
import { slugifyRestaurantName } from '@/utils/slug';
import type { MenuItem, MenuCategory } from '@/types/menu';
import type { Restaurant } from '@/types/restaurant';

export default function LockedRestaurantPage() {
  const { slug } = useParams<{ slug: string }>();
  const enterLocked = useRestaurantModeStore((s) => s.enterLockedMode);
  const isDiff = useCartStore((s) => s.isDifferentRestaurant);
  const [customizeItem, setCustomizeItem] = useState<MenuItem | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState<number | null>(null);
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

  // Check if cart belongs to another restaurant
  useEffect(() => {
    if (restaurant && isDiff(restaurant.id)) setConflictOpen(true);
  }, [restaurant, isDiff]);

  const filteredMenu = useMemo(() => {
    if (!menu) return [];
    let cats: MenuCategory[] = activeCat ? menu.filter(c => c.id === activeCat) : menu;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      cats = cats.map(c => ({
        ...c,
        items: (c.items ?? []).filter(i => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)),
      })).filter(c => (c.items?.length ?? 0) > 0);
    }
    return cats;
  }, [menu, activeCat, debouncedSearch]);

  const handleCustomize = (item: MenuItem) => {
    if (restaurant && isDiff(restaurant.id)) { setConflictOpen(true); return; }
    setCustomizeItem(item);
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

        {/* Category tabs */}
        {menu && menu.length > 1 && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-4 -mx-4 px-4">
            <button onClick={() => setActiveCat(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium ${!activeCat ? 'bg-cherry-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}>All</button>
            {menu.map(c => (
              <button key={c.id} onClick={() => setActiveCat(c.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium ${activeCat === c.id ? 'bg-cherry-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}>{c.name}</button>
            ))}
          </div>
        )}

        {/* Menu */}
        <div className="space-y-4 pb-8">
          {mLoading ? [1,2,3].map(i => <MenuItemSkeleton key={i} />) :
            filteredMenu.length === 0 ? (
              <div className="text-center py-12"><p className="text-gray-500">{debouncedSearch ? 'No items match your search' : 'Menu is being updated'}</p></div>
            ) : filteredMenu.map(cat => (
              <div key={cat.id}>
                <h2 className="text-lg font-bold text-gray-900 mb-3">{cat.name}</h2>
                <div className="space-y-4">
                  {(cat.items ?? []).filter(i => i.is_available !== false).map(item => (
                    <MenuItemCard key={item.id} item={item} restaurantId={restaurant!.id}
                      restaurantName={restaurant!.name} restaurantSlug={restaurant?.slug} onCustomize={handleCustomize} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>

      <ItemCustomizeModal item={customizeItem} onClose={() => setCustomizeItem(null)}
        restaurantId={restaurant?.id ?? 0} restaurantName={restaurant?.name ?? ''} restaurantSlug={restaurant?.slug} />
      <CartConflictModal open={conflictOpen} onClose={() => setConflictOpen(false)} newRestaurantName={restaurant?.name ?? ''}
        onCleared={() => setConflictOpen(false)} />
    </PageShell>
  );
}
