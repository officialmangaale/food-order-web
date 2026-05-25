'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, Star, Utensils } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/components/ui/Toast';
import { formatMoney } from '@/utils/money';
import type { MenuItem } from '@/types/menu';

interface RestaurantMenuItemCardProps {
  item: MenuItem;
  restaurantId: number;
  restaurantName: string;
  restaurantSlug?: string;
  orderingDisabled?: boolean;
  disabledReason?: string;
  onCustomize: (item: MenuItem) => void;
  onConflict: (item: MenuItem) => void;
}

export function RestaurantMenuItemCard({
  item,
  restaurantId,
  restaurantName,
  restaurantSlug,
  orderingDisabled,
  disabledReason,
  onCustomize,
  onConflict,
}: RestaurantMenuItemCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const cartItems = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const setRestaurant = useCartStore((s) => s.setRestaurant);
  const isDifferentRestaurant = useCartStore((s) => s.isDifferentRestaurant(restaurantId));
  const { toast } = useToast();

  const hasCustomOptions =
    item.has_variants ||
    item.has_addons ||
    (item.variants?.length ?? 0) > 0 ||
    (item.addons?.length ?? 0) > 0;
  const simpleCartItem = cartItems.find(
    (cartItem) =>
      cartItem.item_id === item.id &&
      cartItem.variant_id == null &&
      cartItem.addons.length === 0
  );
  const quantity = simpleCartItem?.quantity ?? 0;
  const unavailable = item.is_available === false;
  const addDisabled = unavailable || orderingDisabled || !Number.isFinite(restaurantId);
  const imageUrl = item.image_url && !imageFailed ? item.image_url : undefined;
  const isVeg = getVegetarianState(item);
  const rating = item.rating && item.rating > 0 ? item.rating : undefined;

  const handleAdd = () => {
    if (unavailable) {
      toast('This item is unavailable right now.', 'error');
      return;
    }

    if (orderingDisabled) {
      toast(disabledReason ?? 'This restaurant is not accepting orders right now.', 'error');
      return;
    }

    if (!Number.isFinite(restaurantId)) {
      toast('Could not identify this restaurant.', 'error');
      return;
    }

    if (isDifferentRestaurant) {
      onConflict(item);
      return;
    }

    if (hasCustomOptions) {
      onCustomize(item);
      return;
    }

    setRestaurant(restaurantId, restaurantName, restaurantSlug);
    addItem({
      restaurant_id: restaurantId,
      restaurant_name: restaurantName,
      restaurant_slug: restaurantSlug,
      item_id: item.id,
      name: item.name,
      image_url: item.image_url,
      quantity: 1,
      base_price: item.price,
      category_id: item.category_id,
      category_name: item.category_name,
      is_taxable: item.is_taxable,
      addons: [],
    });
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex min-h-[148px] gap-4 rounded-2xl border bg-white p-4 shadow-[0_10px_26px_rgba(123,35,35,0.04)] transition sm:p-5 ${
        unavailable ? 'border-[#E8D8D8] opacity-70' : 'border-[#F0DADA] hover:border-[#E8BABA] hover:shadow-[0_14px_34px_rgba(123,35,35,0.08)]'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center gap-2">
          {isVeg != null && <FoodTypeIndicator vegetarian={isVeg} />}
          {item.is_bestseller && (
            <span className="rounded-full bg-[#FFF3D9] px-2 py-0.5 text-[11px] font-bold text-[#9A5A00]">
              Bestseller
            </span>
          )}
          {item.category_name && (
            <span className="hidden truncate text-xs font-medium text-[#9B7A7A] sm:inline">
              {item.category_name}
            </span>
          )}
        </div>

        <h3 className="text-lg font-extrabold leading-snug tracking-normal text-[#130F0F] sm:text-xl">
          {item.name}
        </h3>
        <p className="mt-1 text-sm font-extrabold text-[#241818]">
          {item.display_price ?? formatMoney(item.price)}
        </p>
        {rating && (
          <div className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[#916000]">
            <Star className="h-3.5 w-3.5 fill-current text-[#E5A300]" aria-hidden="true" />
            <span>{rating.toFixed(1)}</span>
            {item.rating_count && <span className="text-[#6D5555]">({item.rating_count})</span>}
          </div>
        )}
        {item.description && (
          <p className="mt-2 line-clamp-2 max-w-[760px] text-sm leading-6 text-[#4F3030] sm:text-base">
            {item.description}
          </p>
        )}
        {hasCustomOptions && (
          <p className="mt-2 text-xs font-semibold text-[#9C6B6B]">Customisable</p>
        )}
        {unavailable && (
          <p className="mt-2 text-xs font-bold uppercase tracking-normal text-[#B31317]">Unavailable</p>
        )}
      </div>

      <div className="flex w-[104px] shrink-0 flex-col items-center sm:w-[132px]">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-[#FCE4E0] sm:h-[120px] sm:w-[120px]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.name}
              loading="lazy"
              className={`h-full w-full object-cover img-fade-in ${imageFailed ? '' : 'loaded'}`}
              onLoad={(e) => e.currentTarget.classList.add('loaded')}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#FCE4E0] text-[#8D5F5F]">
              <Utensils className="h-8 w-8" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="-mt-4">
          {!hasCustomOptions && quantity > 0 ? (
            <div className="flex h-9 items-center rounded-lg bg-[#B4080B] text-white shadow-[0_8px_18px_rgba(180,8,11,0.22)]">
              <button
                type="button"
                onClick={() => updateQuantity(item.id, quantity - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-l-lg transition hover:bg-white/10"
                aria-label={`Decrease ${item.name}`}
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="min-w-7 text-center text-sm font-extrabold">{quantity}</span>
              <button
                type="button"
                onClick={handleAdd}
                className="flex h-9 w-9 items-center justify-center rounded-r-lg transition hover:bg-white/10"
                aria-label={`Increase ${item.name}`}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={addDisabled}
              onClick={handleAdd}
              className="h-9 min-w-24 rounded-lg border border-[#DCA6A6] bg-white px-3 text-xs font-extrabold text-[#A80F15] shadow-[0_6px_14px_rgba(123,35,35,0.08)] transition hover:border-[#B31317] hover:bg-[#B4080B] hover:text-white disabled:cursor-not-allowed disabled:border-[#E7D6D6] disabled:bg-white disabled:text-[#BFAAAA] sm:text-sm"
            >
              {unavailable ? 'Unavailable' : 'ADD'}
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function FoodTypeIndicator({ vegetarian }: { vegetarian: boolean }) {
  return (
    <span
      className={`flex h-[18px] w-[18px] items-center justify-center rounded-[4px] border-2 ${
        vegetarian ? 'border-[#1B9A51]' : 'border-[#D71920]'
      }`}
      aria-label={vegetarian ? 'Vegetarian' : 'Non-vegetarian'}
    >
      <span className={`h-2 w-2 rounded-full ${vegetarian ? 'bg-[#1B9A51]' : 'bg-[#D71920]'}`} />
    </span>
  );
}

function getVegetarianState(item: MenuItem) {
  if (item.is_vegetarian != null) return item.is_vegetarian;
  if (item.is_veg != null) return item.is_veg;
  const foodType = item.food_type?.toLowerCase();
  if (!foodType) return undefined;
  if (foodType === 'veg' || foodType === 'vegetarian') return true;
  if (foodType.includes('non')) return false;
  return undefined;
}
