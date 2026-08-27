'use client';

import { Suspense } from 'react';
import { SearchContent } from './SearchContent';

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center py-20">
          <span className="sr-only">Loading search</span>
          <span
            className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-700"
            aria-hidden="true"
          />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
