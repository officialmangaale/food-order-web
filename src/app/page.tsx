'use client';

import { Suspense } from 'react';
import { HomeOfferSlider } from '@/components/home/HomeOfferSlider';
import { ExploreCategories } from '@/components/home/ExploreCategories';
import { TrendingNowSection } from '@/components/home/TrendingNowSection';
import { NearbyRestaurantsSection } from '@/components/home/NearbyRestaurantsSection';
import { ActiveOrderCard } from '@/components/home/ActiveOrderCard';
import { Skeleton } from '@/components/ui/Skeleton';

export default function HomePage() {
  return (
    <>
      <HomeOfferSlider />
      <Suspense fallback={<ExploreCategoriesFallback />}>
        <ExploreCategories />
      </Suspense>
      <TrendingNowSection />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ActiveOrderCard />
      </div>
      <NearbyRestaurantsSection />
    </>
  );
}

function ExploreCategoriesFallback() {
  return (
    <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Loading categories">
      <Skeleton className="mb-4 h-8 w-56" />
      <div className="flex gap-3 overflow-hidden pb-2">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Skeleton key={item} className="h-12 w-28 shrink-0 rounded-2xl" />
        ))}
      </div>
    </section>
  );
}
