'use client';

import { useParams } from 'next/navigation';
import { RestaurantDetailPage } from '@/components/restaurant/RestaurantDetailPage';

export default function LockedRestaurantRoutePage() {
  const { slug } = useParams<{ slug: string }>();

  return <RestaurantDetailPage slug={slug} locked />;
}
