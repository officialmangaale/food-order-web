'use client';

import { RestaurantRow } from '@/components/cards/RestaurantCard';
import type { SearchRestaurantResult } from '@/types/search';

interface RestaurantResultCardProps {
  restaurant: SearchRestaurantResult;
}

/** Adapts a search restaurant result onto the shared RestaurantRow. */
export function RestaurantResultCard({ restaurant }: RestaurantResultCardProps) {
  const imageUrl = restaurant.logo_url || restaurant.banner_url || restaurant.cover_image_url;
  const subtitle = restaurant.cuisine_types?.length
    ? restaurant.cuisine_types.join(' • ')
    : restaurant.area || restaurant.cuisine || null;

  return (
    <RestaurantRow
      href={`/restaurants/${restaurant.id}`}
      name={restaurant.name}
      subtitle={subtitle}
      imageUrl={imageUrl}
      rating={restaurant.average_rating ?? restaurant.rating}
      ratingCount={restaurant.total_ratings ?? restaurant.review_count}
      deliveryTime={restaurant.delivery_time || restaurant.estimated_delivery_time}
      distance={restaurant.distance}
    />
  );
}
