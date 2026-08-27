'use client';

interface SkeletonProps {
  className?: string;
  rounded?: boolean;
}

export function Skeleton({ className = '', rounded }: SkeletonProps) {
  return (
    <div
      className={`skeleton-shimmer ${rounded ? 'rounded-full' : 'rounded-control'} ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * Skeletons below mirror the exact geometry of the components they stand in
 * for — same aspect ratio, same padding, same fixed heights — so swapping real
 * data in never shifts the layout.
 */

/** Matches FoodCard / RestaurantCard. */
export function MediaCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-2.5 p-3 sm:p-4">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3.5 w-3/5" />
        <div className="flex items-center justify-between gap-3 pt-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-10 w-[72px]" rounded />
        </div>
      </div>
    </div>
  );
}

/** Matches RestaurantMenuItemCard (text left, thumbnail right). */
export function MenuItemSkeleton() {
  return (
    <div className="flex gap-4 rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="flex-1 space-y-2.5">
        <Skeleton className="h-4 w-4" rounded />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-full" />
      </div>
      <div className="w-24 shrink-0 space-y-2 sm:w-[120px]">
        <Skeleton className="aspect-square w-full" />
        <Skeleton className="h-10 w-full" rounded />
      </div>
    </div>
  );
}

/** Matches a generic content panel (checkout sections, profile cards). */
export function PanelSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-card border border-line bg-surface p-5 shadow-card ${className}`}>
      <Skeleton className="h-5 w-40" />
      <div className="mt-5 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

/** Matches the shared ListingPageHeader so headers don't pop in. */
export function ListingHeaderSkeleton() {
  return (
    <div className="mb-6">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-8 w-64 max-w-full" />
      <Skeleton className="mt-3 h-4 w-44" />
    </div>
  );
}

interface CardGridSkeletonProps {
  count?: number;
  /** Must match the real grid's column classes to avoid a reflow on load. */
  className?: string;
  variant?: 'media' | 'menu';
}

export function CardGridSkeleton({
  count = 8,
  className = 'grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4',
  variant = 'media',
}: CardGridSkeletonProps) {
  const Item = variant === 'menu' ? MenuItemSkeleton : MediaCardSkeleton;

  return (
    <div className={className} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <Item key={index} />
      ))}
    </div>
  );
}

/** Screen-reader announcement to pair with any visual skeleton. */
export function LoadingAnnouncement({ label }: { label: string }) {
  return (
    <span role="status" aria-live="polite" className="sr-only">
      {label}
    </span>
  );
}
