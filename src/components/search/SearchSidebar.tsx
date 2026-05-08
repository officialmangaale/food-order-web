'use client';

import { RecentSearchesCard } from './RecentSearchesCard';
import { TrendingSearchesCard } from './TrendingSearchesCard';

interface SearchSidebarProps {
  recentSearches: string[];
  onSearchSelect: (term: string) => void;
}

export function SearchSidebar({ recentSearches, onSearchSelect }: SearchSidebarProps) {
  return (
    <>
      <aside className="hidden w-[260px] shrink-0 space-y-5 lg:block">
        <RecentSearchesCard searches={recentSearches} onSelect={onSearchSelect} />
        <TrendingSearchesCard onSelect={onSearchSelect} />
      </aside>

      <div className="space-y-5 rounded-2xl border border-[#F0DADA] bg-white p-4 shadow-[0_10px_28px_rgba(168,15,21,0.05)] lg:hidden">
        <RecentSearchesCard searches={recentSearches} onSelect={onSearchSelect} compact />
        <TrendingSearchesCard onSelect={onSearchSelect} compact />
      </div>
    </>
  );
}
