'use client';

interface SkeletonProps {
  className?: string;
  rounded?: boolean;
}

export function Skeleton({ className = '', rounded }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]
        ${rounded ? 'rounded-full' : 'rounded-xl'}
        ${className}
      `}
    />
  );
}

/** Card-shaped skeleton for restaurant/menu cards */
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4 space-y-3">
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
    <div className="flex gap-4 bg-white rounded-2xl shadow-card border border-gray-100 p-4">
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
