'use client';

import Link from 'next/link';
import { AlertTriangle, MapPin } from 'lucide-react';
import { CategoryItemCard } from '@/components/home/CategoryItemCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { CategoryFoodItem, CategoryItemsPagination, HomeCategory } from '@/types/category';

const HOME_PREVIEW_COUNT = 4;

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
      (items.length > HOME_PREVIEW_COUNT || pagination?.hasMore || (knownTotalCount ?? 0) > HOME_PREVIEW_COUNT)
  );

  return (
    <section className="mt-8" aria-live="polite">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-xl font-extrabold text-[#1F1A1A] sm:text-2xl">{heading}</h3>
        {hasMoreItems && viewAllHref && (
          <Link
            href={viewAllHref}
            className="shrink-0 text-sm font-bold text-[#A80F15] transition hover:text-[#7C1118] hover:underline"
          >
            View All
          </Link>
        )}
      </div>

      {loading ? (
        <CategoryItemsSkeleton />
      ) : errorMessage ? (
        <CategoryItemsError message={errorMessage} onRetry={onRetry} />
      ) : items.length === 0 ? (
        <CategoryItemsEmpty
          categoryName={selectedCategory?.name ?? 'this category'}
          hasLocation={hasLocation}
          mode={mode}
          onSetLocation={onSetLocation}
        />
      ) : (
        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 hide-scrollbar sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-4 lg:gap-6">
          {visibleItems.map((item) => (
            <div key={`${item.restaurantId}-${item.itemId}`} className="w-[260px] shrink-0 sm:w-auto">
              <CategoryItemCard
                item={item}
                onAdd={onAddItem}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function CategoryItemsSkeleton() {
  return (
    <div className="-mx-4 flex gap-4 overflow-hidden px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:px-0 lg:grid-cols-4 lg:gap-6">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="w-[260px] shrink-0 overflow-hidden rounded-xl border border-[#F0DADA] bg-white sm:w-auto">
          <Skeleton className="h-[160px] w-full rounded-none sm:h-[172px] lg:h-[180px]" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-10 w-full" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-11 w-11 rounded-full" rounded />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryItemsError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[#F0DADA] bg-white px-6 py-10 text-center shadow-[0_12px_30px_rgba(168,15,21,0.05)]">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0F0] text-[#A80F15]">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h4 className="mt-4 text-base font-extrabold text-[#1F1A1A]">Dishes are taking a pause</h4>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7B6B6B]">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-full bg-[#A80F15] px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#8F0D12]"
        >
          Try again
        </button>
      )}
    </div>
  );
}

function CategoryItemsEmpty({
  categoryName,
  hasLocation,
  mode,
  onSetLocation,
}: {
  categoryName: string;
  hasLocation?: boolean;
  mode: 'global' | 'locked';
  onSetLocation?: () => void;
}) {
  const needsLocation = mode === 'global' && !hasLocation;

  return (
    <div className="rounded-2xl border border-[#F0DADA] bg-white px-6 py-8 text-center shadow-[0_12px_30px_rgba(168,15,21,0.05)]">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0F0] text-[#A80F15]">
        <MapPin className="h-6 w-6" aria-hidden="true" />
      </div>
      <h4 className="mt-4 text-base font-extrabold text-[#1F1A1A]">
        {needsLocation ? 'Set your location to see nearby dishes.' : 'No items available in this category.'}
      </h4>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7B6B6B]">
        {needsLocation ? 'Choose where to deliver and we will refresh nearby dishes.' : `${categoryName} may be available again soon.`}
      </p>
      {needsLocation && onSetLocation && (
        <button
          type="button"
          onClick={onSetLocation}
          className="mt-5 rounded-full bg-[#A80F15] px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#8F0D12]"
        >
          Set location
        </button>
      )}
    </div>
  );
}

function getHeading(selectedCategory?: HomeCategory, mode: 'global' | 'locked' = 'global') {
  if (!selectedCategory || selectedCategory.key === 'all') {
    return mode === 'locked' ? 'Popular Dishes' : 'Popular Dishes Near You';
  }

  return mode === 'locked' ? selectedCategory.name : `${selectedCategory.name} Near You`;
}
