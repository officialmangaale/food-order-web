'use client';

import { Suspense } from 'react';
import { SearchContent } from './SearchContent';

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-3 border-cherry-600 border-t-transparent rounded-full" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
