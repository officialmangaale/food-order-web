'use client';

import { FoodCard } from '@/components/cards/FoodCard';
import { useCartItemQuantity } from '@/hooks/useCartItemQuantity';
import { useCartStore } from '@/store/cartStore';
import { formatDistance } from '@/utils/distance';
import type { CategoryFoodItem } from '@/types/category';

interface CategoryItemCardProps {
  item: CategoryFoodItem;
  onAdd: (item: CategoryFoodItem) => void;
  priority?: boolean;
}

/** Adapts CategoryFoodItem onto the shared FoodCard. */
export function CategoryItemCard({ item, onAdd, priority }: CategoryItemCardProps) {
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
      description={item.description}
      imageUrl={item.imageUrl}
      displayPrice={item.displayPrice}
      price={item.price}
      vegetarian={item.isVegetarian}
      deliveryTime={item.deliveryTime}
      distance={item.distanceKm != null ? formatDistance(item.distanceKm) : null}
      restaurantName={item.restaurantName}
      restaurantHref={`/restaurants/${item.restaurantId}`}
      closed={item.restaurantIsOpen === false}
      unavailable={!item.isAvailable}
      requiresCustomisation={requiresCustomisation}
      quantity={quantity}
      onAdd={() => onAdd(item)}
      onIncrease={() => updateQuantity(item.itemId, quantity + 1)}
      onDecrease={() => updateQuantity(item.itemId, quantity - 1)}
      priority={priority}
      variant="home"
    />
  );
}
