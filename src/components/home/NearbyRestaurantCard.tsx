'use client';

import { RestaurantCard } from '@/components/cards/RestaurantCard';
import type { RestaurantCardData } from '@/types/restaurant';

interface NearbyRestaurantCardProps {
  restaurant: RestaurantCardData;
  priority?: boolean;
}

/** Adapts RestaurantCardData onto the shared RestaurantCard. */
export function NearbyRestaurantCard({ restaurant, priority }: NearbyRestaurantCardProps) {
  const subtitle =
    restaurant.cuisine || restaurant.category || restaurant.tags?.join(' • ') || 'Restaurant';

  return (
    <RestaurantCard
      href={`/restaurants/${restaurant.id}`}
      name={restaurant.name}
      subtitle={subtitle}
      imageUrl={restaurant.imageUrl}
      rating={restaurant.rating}
      ratingCount={restaurant.reviewCount}
      deliveryTime={restaurant.deliveryTime}
      distance={restaurant.distance}
      offerBadge={restaurant.offerBadge}
      priority={priority}
      variant="home"
    />
  );
}
