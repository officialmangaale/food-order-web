'use client';

import { Suspense } from 'react';
import { HomeOfferSlider } from '@/components/home/HomeOfferSlider';
import { ExploreCategories } from '@/components/home/ExploreCategories';
import { TrendingNowSection } from '@/components/home/TrendingNowSection';
import { NearbyRestaurantsSection } from '@/components/home/NearbyRestaurantsSection';
import { ActiveOrderCard } from '@/components/home/ActiveOrderCard';
import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Sections render in visual order. The previous implementation relied on
 * `order-*` utilities to reshuffle a flex column, which meant DOM order and
 * reading order disagreed for keyboard and screen-reader users.
 */
export default function HomePage() {
  return (
    <main id="main-content" className="page-main">
      <div className="page-container">
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
    <section className="page-container page-section" aria-label="Loading categories">
      <Skeleton className="h-6 w-56" />
      <div className="mt-4 flex gap-3 overflow-hidden pb-1">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="w-[68px] shrink-0 sm:w-[84px]">
            <Skeleton className="h-[68px] w-[68px] sm:h-[84px] sm:w-[84px]" />
            <Skeleton className="mt-2 h-3 w-full" />
          </div>
        ))}
      </div>
    </section>
  );
}
