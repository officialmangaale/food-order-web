'use client';

import { AlertTriangle, MapPin } from 'lucide-react';
import { CategoryItemCard } from '@/components/home/CategoryItemCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { CategoryFoodItem, HomeCategory } from '@/types/category';

interface CategoryItemsSectionProps {
  selectedCategory?: HomeCategory;
  items: CategoryFoodItem[];
  loading?: boolean;
  errorMessage?: string;
  hasLocation?: boolean;
  mode?: 'global' | 'locked';
  onRetry?: () => void;
  onAddItem: (item: CategoryFoodItem) => void;
  onSetLocation?: () => void;
}

export function CategoryItemsSection({
  selectedCategory,
  items,
  loading,
  errorMessage,
  hasLocation,
  mode = 'global',
  onRetry,
  onAddItem,
  onSetLocation,
}: CategoryItemsSectionProps) {
  const heading = getHeading(selectedCategory, mode);

  return (
    <section className="mt-8" aria-live="polite">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-xl font-extrabold text-[#1F1A1A] sm:text-2xl">{heading}</h3>
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
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <CategoryItemCard
              key={`${item.restaurantId}-${item.itemId}`}
              item={item}
              onAdd={onAddItem}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function CategoryItemsSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="overflow-hidden rounded-2xl border border-[#F0DADA] bg-white">
          <Skeleton className="h-[168px] w-full rounded-none sm:h-[178px]" />
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
    <div className="rounded-2xl border border-[#F0DADA] bg-white px-6 py-10 text-center shadow-[0_12px_30px_rgba(168,15,21,0.05)]">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0F0] text-[#A80F15]">
        <MapPin className="h-6 w-6" aria-hidden="true" />
      </div>
      <h4 className="mt-4 text-base font-extrabold text-[#1F1A1A]">
        {needsLocation ? 'Set your location to see nearby dishes.' : `No ${categoryName} items available near you`}
      </h4>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7B6B6B]">
        {needsLocation ? 'Choose where to deliver and we will refresh nearby dishes.' : 'Try another category.'}
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
