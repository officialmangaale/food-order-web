'use client';

import { CategoryItemCard } from '@/components/home/CategoryItemCard';
import { CardRail } from '@/components/home/HomeSection';
import { SectionHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { MediaCardSkeleton } from '@/components/ui/Skeleton';
import type { CategoryFoodItem, CategoryItemsPagination, HomeCategory } from '@/types/category';

const HOME_PREVIEW_COUNT = 4;
const GRID = 'sm:grid-cols-2 lg:grid-cols-4';

interface CategoryItemsSectionProps {
  selectedCategory?: HomeCategory;
  items: CategoryFoodItem[];
  pagination?: CategoryItemsPagination;
  totalCount?: number;
  loading?: boolean;
  errorMessage?: string;
  hasLocation?: boolean;
  mode?: 'global' | 'locked';
  viewAllHref?: string;
  onRetry?: () => void;
  onAddItem: (item: CategoryFoodItem) => void;
  onSetLocation?: () => void;
}

export function CategoryItemsSection({
  selectedCategory,
  items,
  pagination,
  totalCount,
  loading,
  errorMessage,
  hasLocation,
  mode = 'global',
  viewAllHref,
  onRetry,
  onAddItem,
  onSetLocation,
}: CategoryItemsSectionProps) {
  const heading = getHeading(selectedCategory, mode);
  const visibleItems = items.slice(0, HOME_PREVIEW_COUNT);
  const knownTotalCount = totalCount ?? pagination?.totalCount;
  const hasMoreItems = Boolean(
    mode === 'global' &&
      viewAllHref &&
      (items.length > HOME_PREVIEW_COUNT ||
        pagination?.hasMore ||
        (knownTotalCount ?? 0) > HOME_PREVIEW_COUNT)
  );
  const needsLocation = mode === 'global' && !hasLocation;

  return (
    <section aria-live="polite">
      <SectionHeader
        title={heading}
        href={hasMoreItems ? viewAllHref : undefined}
      />

      {loading ? (
        <CategoryItemsSkeleton />
      ) : errorMessage ? (
        <ErrorState
          title="Dishes are taking a pause"
          message={errorMessage}
          onRetry={onRetry}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={needsLocation ? 'location' : 'dish'}
          title={
            needsLocation
              ? 'Set your location to see nearby dishes'
              : 'No items available in this category'
          }
          description={
            needsLocation
              ? 'Choose where to deliver and we will refresh nearby dishes.'
              : `${selectedCategory?.name ?? 'This category'} may be available again soon.`
          }
          actionLabel={needsLocation && onSetLocation ? 'Set location' : undefined}
          onAction={needsLocation ? onSetLocation : undefined}
        />
      ) : (
        <CardRail itemWidth="w-[168px]" gridClassName={GRID}>
          {visibleItems.map((item) => (
            <CategoryItemCard
              key={`${item.restaurantId}-${item.itemId}`}
              item={item}
              onAdd={onAddItem}
            />
          ))}
        </CardRail>
      )}
    </section>
  );
}

export function CategoryItemsSkeleton() {
  return (
    <CardRail itemWidth="w-[168px]" gridClassName={GRID}>
      {Array.from({ length: HOME_PREVIEW_COUNT }, (_, index) => (
        <MediaCardSkeleton key={index} />
      ))}
    </CardRail>
  );
}

function getHeading(selectedCategory?: HomeCategory, mode: 'global' | 'locked' = 'global') {
  if (!selectedCategory || selectedCategory.key === 'all') {
    return mode === 'locked' ? 'Popular Dishes' : 'Recommended for you';
  }

  return mode === 'locked' ? selectedCategory.name : `${selectedCategory.name} for you`;
}
