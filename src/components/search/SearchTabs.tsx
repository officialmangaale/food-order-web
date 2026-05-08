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
    <div className="flex w-full items-center rounded-2xl border border-[#F0DADA] bg-white p-1 sm:w-auto">
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
      onClick={onClick}
      className={`relative flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition sm:flex-none ${
        active ? 'bg-[#A80F15] text-white shadow-[0_8px_18px_rgba(168,15,21,0.18)]' : 'text-[#6B5B5B] hover:text-[#A80F15]'
      }`}
    >
      {label}
      {count != null && <span className="ml-1 text-xs opacity-75">{count}</span>}
    </button>
  );
}
