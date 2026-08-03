'use client';

interface SkeletonProps {
  className?: string;
  rounded?: boolean;
}

export function Skeleton({ className = '', rounded }: SkeletonProps) {
  return (
    <div
      className={`skeleton-shimmer
        ${rounded ? 'rounded-full' : 'rounded-control'}
        ${className}
      `}
    />
  );
}

/** Card-shaped skeleton for restaurant/menu cards */
export function CardSkeleton() {
  return (
    <div className="space-y-3 rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16" rounded />
        <Skeleton className="h-6 w-20" rounded />
      </div>
    </div>
  );
}

/** Horizontal menu item skeleton */
export function MenuItemSkeleton() {
  return (
    <div className="flex gap-4 rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-4" rounded />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-full" />
      </div>
      <Skeleton className="h-24 w-24 rounded-xl flex-shrink-0" />
    </div>
  );
}
