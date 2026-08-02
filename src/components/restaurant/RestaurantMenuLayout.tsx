'use client';

import { useEffect } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { MenuItemSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { RestaurantCategorySidebar } from '@/components/restaurant/RestaurantCategorySidebar';
import { RestaurantFilterChips } from '@/components/restaurant/RestaurantFilterChips';
import { RestaurantMenuSearch } from '@/components/restaurant/RestaurantMenuSearch';
import { RestaurantMenuSection, getSectionDomId } from '@/components/restaurant/RestaurantMenuSection';
import type {
  RestaurantCategoryNavItem,
  RestaurantMenuFilters,
  RestaurantMenuSectionData,
} from '@/components/restaurant/restaurantMenuTypes';
import type { MenuItem } from '@/types/menu';

interface RestaurantMenuLayoutProps {
  categories: RestaurantCategoryNavItem[];
  sections: RestaurantMenuSectionData[];
  activeCategoryKey: string;
  onActiveCategoryChange: (key: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  filters: RestaurantMenuFilters;
  onFiltersChange: (filters: RestaurantMenuFilters) => void;
  hasBestsellerData: boolean;
  hasRatingData: boolean;
  loading?: boolean;
  noResults: boolean;
  restaurantId: number;
  restaurantName: string;
  restaurantSlug?: string;
  orderingDisabled?: boolean;
  disabledReason?: string;
  onCustomize: (item: MenuItem) => void;
  onConflict: (item: MenuItem) => void;
}

export function RestaurantMenuLayout({
  categories,
  sections,
  activeCategoryKey,
  onActiveCategoryChange,
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  hasBestsellerData,
  hasRatingData,
  loading,
  noResults,
  restaurantId,
  restaurantName,
  restaurantSlug,
  orderingDisabled,
  disabledReason,
  onCustomize,
  onConflict,
}: RestaurantMenuLayoutProps) {
  useEffect(() => {
    if (sections.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const key = visible?.target.getAttribute('data-menu-section-key');
        if (key) onActiveCategoryChange(key);
      },
      { rootMargin: '-140px 0px -60% 0px', threshold: [0.1, 0.35, 0.6] }
    );

    for (const section of sections) {
      const element = document.getElementById(getSectionDomId(section.key));
      if (!element) continue;
      element.setAttribute('data-menu-section-key', section.key);
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [sections, onActiveCategoryChange]);

  const handleCategorySelect = (key: string) => {
    onActiveCategoryChange(key);
    document.getElementById(getSectionDomId(key))?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <section id="restaurant-menu" className="bg-[#F7F8FA]">
      <div className="mx-auto grid max-w-[1280px] lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-x-8 lg:px-8 lg:py-8">
        <div className="order-1 flex min-w-0 gap-2 overflow-x-auto px-3 pb-5 pt-2 hide-scrollbar sm:px-6 lg:col-start-2 lg:px-0 lg:pb-7 lg:pt-0">
          <RestaurantMenuSearch value={search} onChange={onSearchChange} />
          <RestaurantFilterChips
            filters={filters}
            onChange={onFiltersChange}
            hasBestsellerData={hasBestsellerData}
            hasRatingData={hasRatingData}
          />
        </div>

        {loading ? (
          <MenuSidebarSkeleton />
        ) : (
          <RestaurantCategorySidebar
            categories={categories}
            activeKey={activeCategoryKey}
            onSelect={handleCategorySelect}
          />
        )}

        <div className="order-3 min-w-0 px-3 py-3 sm:px-6 lg:col-start-2 lg:px-0 lg:py-0">
          {loading ? (
            <MenuContentSkeleton />
          ) : noResults ? (
            <div className="rounded-2xl border border-[#F0DADA] bg-white">
              <EmptyState
                icon="search"
                title={search ? 'No items found in this menu' : 'Menu is being updated'}
                description={
                  search
                    ? 'Try a different item name or clear the filters.'
                    : 'Please check back shortly.'
                }
              />
            </div>
          ) : (
            <div className="space-y-8">
              {sections.map((section) => (
                <RestaurantMenuSection
                  key={section.key}
                  section={section}
                  restaurantId={restaurantId}
                  restaurantName={restaurantName}
                  restaurantSlug={restaurantSlug}
                  orderingDisabled={orderingDisabled}
                  disabledReason={disabledReason}
                  onCustomize={onCustomize}
                  onConflict={onConflict}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function MenuSidebarSkeleton() {
  return (
    <aside className="hidden lg:row-span-2 lg:row-start-1 lg:block">
      <div className="sticky top-28 space-y-4 border-r border-[#F0DDDD] pr-5">
        {[1, 2, 3, 4, 5].map((item) => (
          <Skeleton key={item} className="h-10 w-full" />
        ))}
      </div>
    </aside>
  );
}

function MenuContentSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-56" />
      {[1, 2, 3].map((item) => (
        <MenuItemSkeleton key={item} />
      ))}
    </div>
  );
}
