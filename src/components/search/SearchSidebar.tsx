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
      <aside className="hidden w-[248px] shrink-0 space-y-5 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:block lg:self-start">
        <RecentSearchesCard searches={recentSearches} onSelect={onSearchSelect} />
        <TrendingSearchesCard onSelect={onSearchSelect} />
      </aside>

      <div className="space-y-5 rounded-card border border-line bg-surface p-4 shadow-card lg:hidden">
        <RecentSearchesCard searches={recentSearches} onSelect={onSearchSelect} compact />
        <TrendingSearchesCard onSelect={onSearchSelect} compact />
      </div>
    </>
  );
}
