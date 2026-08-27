'use client';

import { PanelSkeleton } from '@/components/ui/Skeleton';

export function OrderTrackingSkeleton() {
  return (
    <main className="page-main page-container">
      <span role="status" aria-live="polite" className="sr-only">
        Loading order
      </span>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,1fr)] lg:gap-8">
        <div className="space-y-6">
          <PanelSkeleton className="h-[280px]" />
          <PanelSkeleton className="h-[160px]" />
          <PanelSkeleton className="h-[380px]" />
        </div>
        <div className="space-y-6">
          <PanelSkeleton className="h-[280px]" />
          <PanelSkeleton className="h-[380px]" />
        </div>
      </div>
    </main>
  );
}
