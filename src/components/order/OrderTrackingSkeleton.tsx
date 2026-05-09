'use client';

export function OrderTrackingSkeleton() {
  return (
    <main className="min-h-screen bg-[#FFF7F5]">
      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(380px,1fr)]">
          <div className="space-y-6">
            <SkeletonBlock className="h-[300px]" />
            <SkeletonBlock className="h-[160px]" />
            <SkeletonBlock className="h-[420px]" />
          </div>
          <div className="space-y-6">
            <SkeletonBlock className="h-[300px]" />
            <SkeletonBlock className="h-[420px]" />
          </div>
        </div>
      </div>
    </main>
  );
}

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`${className} animate-pulse rounded-2xl border border-[#F0DADA] bg-white shadow-[0_14px_38px_rgba(123,35,35,0.05)]`}
    />
  );
}
