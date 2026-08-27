'use client';

import { FoodCard } from '@/components/cards/FoodCard';
import { useCartItemQuantity } from '@/hooks/useCartItemQuantity';
import { useCartStore } from '@/store/cartStore';
import type { SearchDishResult } from '@/types/search';

interface DishResultCardProps {
  dish: SearchDishResult;
  onAdd: (dish: SearchDishResult) => void;
  priority?: boolean;
}

/** Adapts a search dish result onto the shared FoodCard. */
export function DishResultCard({ dish, onAdd, priority }: DishResultCardProps) {
  const quantity = useCartItemQuantity(dish.id);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const requiresCustomisation = Boolean(
    dish.has_variants ||
      dish.has_addons ||
      (dish.variants?.length ?? 0) > 0 ||
      (dish.addons?.length ?? 0) > 0
  );

  return (
    <FoodCard
      name={dish.name}
      description={dish.description}
      imageUrl={dish.image_url}
      displayPrice={dish.display_price}
      price={dish.price}
      vegetarian={dish.is_veg ?? dish.is_vegetarian}
      rating={dish.rating}
      ratingCount={dish.rating_count}
      deliveryTime={dish.delivery_time}
      restaurantName={dish.restaurant_name}
      restaurantHref={dish.restaurant_id ? `/restaurants/${dish.restaurant_id}` : undefined}
      unavailable={dish.is_available === false}
      requiresCustomisation={requiresCustomisation}
      quantity={quantity}
      onAdd={() => onAdd(dish)}
      onIncrease={() => updateQuantity(dish.id, quantity + 1)}
      onDecrease={() => updateQuantity(dish.id, quantity - 1)}
      priority={priority}
    />
  );
}
