'use client';

import { Suspense } from 'react';
import { SearchContent } from './SearchContent';

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center bg-[#FFF7F5] py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-cherry-600 border-t-transparent" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
