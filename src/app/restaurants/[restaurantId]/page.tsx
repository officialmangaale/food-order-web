'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Star, Clock, MapPin, Share2 } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { MenuItemCard } from '@/components/restaurant/MenuItemCard';
import { ItemCustomizeModal } from '@/components/modals/ItemCustomizeModal';
import { CartConflictModal } from '@/components/cart/CartConflictModal';
import { Badge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/ErrorState';
import { MenuItemSkeleton } from '@/components/ui/Skeleton';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/components/ui/Toast';
import { fetchRestaurantDetail, fetchRestaurantMenu } from '@/services/restaurantApi';
import { slugifyRestaurantName } from '@/utils/slug';
import { formatDistance } from '@/utils/distance';
import type { MenuItem } from '@/types/menu';

export default function RestaurantDetailPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [customizeItem, setCustomizeItem] = useState<MenuItem | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const isDiff = useCartStore((s) => s.isDifferentRestaurant(Number(restaurantId)));
  const { toast } = useToast();

  const { data: restaurant, isLoading: detailLoading, error: detailErr } = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: () => fetchRestaurantDetail(restaurantId),
  });

  const { data: menu, isLoading: menuLoading } = useQuery({
    queryKey: ['menu', restaurantId],
    queryFn: () => fetchRestaurantMenu(restaurantId),
    enabled: !!restaurantId,
  });

  const handleCustomize = (item: MenuItem) => {
    if (isDiff) { setConflictOpen(true); return; }
    setCustomizeItem(item);
  };

  const shareLink = () => {
    const slug = restaurant?.slug ?? slugifyRestaurantName(restaurant?.name ?? '');
    const url = `${window.location.origin}/r/${slug || restaurantId}`;
    navigator.clipboard?.writeText(url);
    toast('Restaurant link copied!', 'success');
  };

  if (detailErr) return <PageShell><ErrorState message="Restaurant not found" /></PageShell>;

  const cats = menu ?? [];
  const filteredCats = activeCategory ? cats.filter(c => c.id === activeCategory) : cats;

  return (
    <PageShell noPadding>
      {/* Hero */}
      <div className="h-48 relative">
        {restaurant?.banner_url || restaurant?.logo_url ? (
          <img src={restaurant.banner_url || restaurant.logo_url} alt={restaurant?.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full food-placeholder" />
        )}
        {restaurant?.is_open === false && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold bg-black/60 px-4 py-2 rounded-full">Currently Closed</span>
          </div>
        )}
      </div>

      <div className="px-4 -mt-6 relative z-10">
        {/* Info card */}
        <div className="bg-white rounded-2xl shadow-elevated p-4 mb-4">
          {detailLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-2/3" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between">
                <h1 className="text-xl font-bold text-gray-900">{restaurant?.name}</h1>
                <button onClick={shareLink} className="p-2 rounded-xl hover:bg-gray-100">
                  <Share2 className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              {restaurant?.cuisine_types?.length ? (
                <p className="text-sm text-gray-500 mt-0.5">{restaurant.cuisine_types.join(', ')}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {restaurant?.average_rating != null && restaurant.average_rating > 0 && (
                  <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded-lg text-xs font-bold">
                    <Star className="w-3 h-3 fill-current" />{restaurant.average_rating.toFixed(1)}
                  </div>
                )}
                {restaurant?.estimated_delivery_time && (
                  <Badge><Clock className="w-3 h-3" /> {restaurant.estimated_delivery_time}</Badge>
                )}
                {restaurant?.distance_km != null && (
                  <Badge><MapPin className="w-3 h-3" /> {formatDistance(restaurant.distance_km)}</Badge>
                )}
                {restaurant?.delivery_available && <Badge variant="success" dot>Delivery</Badge>}
              </div>
            </>
          )}
        </div>

        {/* Category tabs */}
        {cats.length > 1 && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-4 -mx-4 px-4">
            <button onClick={() => setActiveCategory(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${!activeCategory ? 'bg-cherry-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}>
              All
            </button>
            {cats.map(c => (
              <button key={c.id} onClick={() => setActiveCategory(c.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === c.id ? 'bg-cherry-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}>
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Menu items */}
        <div className="space-y-4 pb-8">
          {menuLoading ? (
            [1,2,3,4].map(i => <MenuItemSkeleton key={i} />)
          ) : filteredCats.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Menu is being updated</p>
            </div>
          ) : (
            filteredCats.map(cat => (
              <div key={cat.id}>
                <h2 className="text-lg font-bold text-gray-900 mb-3 mt-2">{cat.name}</h2>
                <div className="space-y-4">
                  {(cat.items ?? []).filter(i => i.is_available !== false).map(item => (
                    <MenuItemCard key={item.id} item={item}
                      restaurantId={Number(restaurantId)} restaurantName={restaurant?.name ?? ''}
                      restaurantSlug={restaurant?.slug} onCustomize={handleCustomize} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ItemCustomizeModal item={customizeItem} onClose={() => setCustomizeItem(null)}
        restaurantId={Number(restaurantId)} restaurantName={restaurant?.name ?? ''} restaurantSlug={restaurant?.slug} />
      <CartConflictModal open={conflictOpen} onClose={() => setConflictOpen(false)}
        newRestaurantName={restaurant?.name ?? ''} />
    </PageShell>
  );
}
