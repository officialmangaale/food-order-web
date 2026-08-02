'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Leaf, Minus, Plus, Star, Utensils } from 'lucide-react';
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
      className={`flex min-h-[141px] gap-2.5 rounded-2xl border bg-white px-2.5 py-2 shadow-[0_2px_5px_rgba(23,32,51,0.03)] transition sm:gap-4 sm:p-5 ${
        unavailable ? 'border-[#DCE1E7] opacity-70' : 'border-[#DCE1E7] hover:border-[#AEB7C4] hover:shadow-[0_8px_22px_rgba(23,32,51,0.08)]'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex min-h-[18px] items-center gap-1.5">
          {isVeg != null && <FoodTypeIndicator vegetarian={isVeg} />}
          {item.is_bestseller && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF5DE] px-2 py-0.5 text-[10px] font-bold text-[#946200] sm:px-2.5 sm:py-1 sm:text-[11px]">
              <Flame className="h-3 w-3" aria-hidden="true" />
              Bestseller
            </span>
          )}
          {item.category_name && (
            <span className="hidden truncate text-xs font-medium text-[#9B7A7A] sm:inline">
              {item.category_name}
            </span>
          )}
        </div>

        <h3 className="text-[13px] font-extrabold leading-[18px] tracking-[-0.01em] text-[#172033] sm:text-xl">
          {item.name}
        </h3>
        <p className="mt-0.5 text-[12px] font-bold text-[#7B8497] sm:mt-1 sm:text-[14px]">
          {item.display_price ?? formatMoney(item.price)}
        </p>
        {item.description && (
          <p className="mt-1 line-clamp-2 max-w-[760px] text-[11px] leading-4 text-[#7B8497] sm:mt-2 sm:text-base sm:leading-6">
            {item.description}
          </p>
        )}
        {(rating || hasCustomOptions) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] font-semibold sm:mt-2 sm:text-[12px]">
            {rating && (
              <span className="inline-flex items-center gap-1 text-[#7B8497]">
                <Star className="h-3.5 w-3.5 fill-current text-[#F59E0B]" aria-hidden="true" />
                {rating.toFixed(1)}
                {item.rating_count && <span>({item.rating_count})</span>}
              </span>
            )}
            {hasCustomOptions && <span className="text-[#0F5E58]">Customisable</span>}
          </div>
        )}
        {unavailable && (
          <p className="mt-2 text-xs font-bold uppercase tracking-normal text-[#B31317]">Unavailable</p>
        )}
      </div>

      <div className="flex w-[96px] shrink-0 flex-col items-center sm:w-[132px]">
        <div className="flex h-[86px] w-[96px] items-center justify-center overflow-hidden rounded-2xl bg-[#EDF1F4] sm:h-[120px] sm:w-[120px]">
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
            <div className="flex h-full w-full items-center justify-center bg-[#EDF1F4] text-[#7B8497]">
              <Utensils className="h-8 w-8" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="mt-1.5">
          {!hasCustomOptions && quantity > 0 ? (
            <div className="flex h-8 items-center rounded-xl bg-[#14B8A6] text-white shadow-[0_6px_14px_rgba(20,184,166,0.2)]">
              <button
                type="button"
                onClick={() => updateQuantity(item.id, quantity - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-l-xl transition hover:bg-white/10"
                aria-label={`Decrease ${item.name}`}
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="min-w-7 text-center text-sm font-extrabold">{quantity}</span>
              <button
                type="button"
                onClick={handleAdd}
                className="flex h-8 w-8 items-center justify-center rounded-r-xl transition hover:bg-white/10"
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
              className="h-8 min-w-[58px] rounded-xl border border-[#14B8A6] bg-white px-3 text-[14px] font-extrabold text-[#14B8A6] transition hover:bg-[#14B8A6] hover:text-white disabled:cursor-not-allowed disabled:border-[#D8DDE3] disabled:bg-white disabled:text-[#AEB7C4] sm:h-9 sm:min-w-24"
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
      className="flex h-[18px] w-[18px] items-center justify-center"
      aria-label={vegetarian ? 'Vegetarian' : 'Non-vegetarian'}
    >
      {vegetarian ? (
        <Leaf className="h-4 w-4 fill-current text-[#22C55E]" aria-hidden="true" />
      ) : (
        <span className="h-2.5 w-2.5 rounded-full bg-[#F6464D]" />
      )}
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
