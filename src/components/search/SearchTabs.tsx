'use client';

import type { SearchTab } from '@/types/search';

interface SearchTabsProps {
  activeTab: SearchTab;
  onChange: (tab: SearchTab) => void;
  dishCount?: number;
  restaurantCount?: number;
}

export function SearchTabs({ activeTab, onChange, dishCount, restaurantCount }: SearchTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Search result type"
      className="flex w-full items-center rounded-full border border-line bg-surface p-1 sm:w-auto"
    >
      <TabButton
        label="Dishes"
        count={dishCount}
        active={activeTab === 'dishes'}
        onClick={() => onChange('dishes')}
      />
      <TabButton
        label="Restaurants"
        count={restaurantCount}
        active={activeTab === 'restaurants'}
        onClick={() => onChange('restaurants')}
      />
    </div>
  );
}

function TabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`relative h-10 flex-1 rounded-full px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25 sm:flex-none ${
        active ? 'bg-brand-700 text-white' : 'text-ink-muted hover:text-brand-800'
      }`}
    >
      {label}
      {count != null && <span className="ml-1 text-xs opacity-75">{count}</span>}
    </button>
  );
}
