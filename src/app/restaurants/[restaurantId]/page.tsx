'use client';

import { useParams } from 'next/navigation';
import { RestaurantDetailPage } from '@/components/restaurant/RestaurantDetailPage';

export default function RestaurantRoutePage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();

  return <RestaurantDetailPage restaurantId={restaurantId} />;
}
