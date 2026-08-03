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
    <main className="flex min-h-screen flex-col pb-6">
      <div className="order-0 mx-auto mt-4 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <ActiveOrderCard />
      </div>
      <HomeOfferSlider />
      <Suspense fallback={<ExploreCategoriesFallback />}>
        <ExploreCategories />
      </Suspense>
      <NearbyRestaurantsSection />
      <TrendingNowSection />
    </main>
  );
}

function ExploreCategoriesFallback() {
  return (
    <section className="order-1 mx-auto mt-4 w-full max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Loading categories">
      <Skeleton className="mb-4 hidden h-8 w-56 sm:block" />
      <div className="flex gap-2 overflow-hidden pb-2 sm:gap-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <Skeleton key={item} className="h-[76px] w-[60px] shrink-0 rounded-[18px] sm:h-[98px] sm:w-[82px] sm:rounded-[22px]" />
        ))}
      </div>
    </section>
  );
}
