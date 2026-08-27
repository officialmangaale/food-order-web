'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { MetaRow, Price, VegIndicator } from '@/components/ui/FoodMeta';
import { AddToCartControl } from '@/components/ui/QuantityStepper';
import { Thumbnail } from '@/components/ui/Thumbnail';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/components/ui/Toast';
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
  const reduceMotion = useReducedMotion();
  const cartItems = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const setRestaurant = useCartStore((s) => s.setRestaurant);
  const isDifferentRestaurant = useCartStore((s) => s.isDifferentRestaurant(restaurantId));
  const { toast } = useToast();

  const hasCustomOptions = Boolean(
    item.has_variants ||
      item.has_addons ||
      (item.variants?.length ?? 0) > 0 ||
      (item.addons?.length ?? 0) > 0
  );
  const simpleCartItem = cartItems.find(
    (cartItem) =>
      cartItem.item_id === item.id && cartItem.variant_id == null && cartItem.addons.length === 0
  );
  const quantity = simpleCartItem?.quantity ?? 0;
  const unavailable = item.is_available === false;
  const addDisabled = unavailable || orderingDisabled || !Number.isFinite(restaurantId);
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
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      className={`card-hover flex gap-3 rounded-card border bg-surface p-3 shadow-card sm:gap-4 sm:p-5 ${
        unavailable ? 'border-line opacity-70' : 'border-line'
      }`}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-1.5 flex min-h-[18px] flex-wrap items-center gap-1.5">
          <VegIndicator vegetarian={isVeg} />
          {item.is_bestseller && (
            <Badge
              variant="bestseller"
              size="sm"
              icon={<Flame className="h-3 w-3 shrink-0" aria-hidden="true" />}
            >
              Bestseller
            </Badge>
          )}
        </div>

        <h3 className="text-sm font-extrabold leading-snug text-ink sm:text-base">{item.name}</h3>

        <div className="mt-1">
          <Price display={item.display_price} amount={item.price} size="sm" />
        </div>

        {item.description && (
          <p className="mt-1.5 line-clamp-2 max-w-[60ch] text-xs leading-5 text-ink-muted sm:text-sm sm:leading-6">
            {item.description}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <MetaRow rating={rating} ratingCount={item.rating_count} />
          {hasCustomOptions && (
            <span className="text-xs font-semibold text-brand-800">Customisable</span>
          )}
        </div>

        {unavailable && (
          <p className="mt-2 text-xs font-bold uppercase tracking-wide text-danger">Unavailable</p>
        )}
      </div>

      {/* Fixed-width media column so every row in a menu list aligns. */}
      <div className="flex w-24 shrink-0 flex-col items-center gap-2 sm:w-[120px]">
        <Thumbnail
          src={item.image_url}
          alt={item.name}
          ratio="square"
          className="rounded-control"
        />
        <AddToCartControl
          quantity={quantity}
          onAdd={handleAdd}
          onIncrease={() => updateQuantity(item.id, quantity + 1)}
          onDecrease={() => updateQuantity(item.id, quantity - 1)}
          itemName={item.name}
          unavailable={addDisabled}
          unavailableLabel={unavailable ? 'Sold out' : 'Closed'}
          requiresCustomisation={hasCustomOptions}
          size="sm"
          width="full"
          className="-mt-1"
        />
      </div>
    </motion.article>
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
