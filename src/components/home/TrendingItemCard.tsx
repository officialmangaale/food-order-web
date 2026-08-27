'use client';

import { FoodCard } from '@/components/cards/FoodCard';
import { useCartItemQuantity } from '@/hooks/useCartItemQuantity';
import { useCartStore } from '@/store/cartStore';
import { formatDistance } from '@/utils/distance';
import type { TrendingItem } from '@/types/trending';

interface TrendingItemCardProps {
  item: TrendingItem;
  onAdd: (item: TrendingItem) => void;
  priority?: boolean;
}

/** Adapts TrendingItem onto the shared FoodCard. */
export function TrendingItemCard({ item, onAdd, priority }: TrendingItemCardProps) {
  const quantity = useCartItemQuantity(item.itemId);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const requiresCustomisation = Boolean(
    item.hasVariants ||
      item.hasAddons ||
      (item.variants?.length ?? 0) > 0 ||
      (item.addons?.length ?? 0) > 0
  );

  return (
    <FoodCard
      name={item.name}
      description={item.description || `Fresh from ${item.restaurantName}`}
      imageUrl={item.imageUrl}
      displayPrice={item.displayPrice}
      price={item.price}
      vegetarian={item.isVegetarian}
      rating={item.rating}
      ratingCount={item.ratingCount}
      deliveryTime={item.deliveryTime}
      distance={item.distanceKm != null ? formatDistance(item.distanceKm) : null}
      restaurantName={item.restaurantName}
      restaurantHref={`/restaurants/${item.restaurantId}`}
      badge={item.badge}
      badgeTone="inverse"
      closed={item.restaurantIsOpen === false}
      unavailable={!item.isAvailable}
      requiresCustomisation={requiresCustomisation}
      quantity={quantity}
      onAdd={() => onAdd(item)}
      onIncrease={() => updateQuantity(item.itemId, quantity + 1)}
      onDecrease={() => updateQuantity(item.itemId, quantity - 1)}
      priority={priority}
    />
  );
}
