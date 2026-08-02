'use client';

import type { RestaurantCategoryNavItem } from '@/components/restaurant/restaurantMenuTypes';

interface RestaurantCategorySidebarProps {
  categories: RestaurantCategoryNavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
}

export function RestaurantCategorySidebar({
  categories,
  activeKey,
  onSelect,
}: RestaurantCategorySidebarProps) {
  if (categories.length === 0) return null;

  return (
    <>
      <aside className="hidden lg:row-span-2 lg:row-start-1 lg:block">
        <nav
          className="sticky top-28 border-r border-[#F0DDDD] pr-5"
          aria-label="Menu categories"
        >
          <CategoryList categories={categories} activeKey={activeKey} onSelect={onSelect} />
        </nav>
      </aside>

      <div className="order-2 sticky top-[72px] z-30 border-b border-[#D8DDE3] bg-white lg:hidden">
        <div className="overflow-x-auto px-3 hide-scrollbar sm:px-6">
          <div className="flex min-w-max">
            {categories.map((category) => {
              const active = category.key === activeKey;
              return (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => onSelect(category.key)}
                  className={`relative h-10 shrink-0 whitespace-nowrap border-b-2 px-5 text-[13px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#14B8A6] ${
                    active
                      ? 'border-[#14B8A6] text-[#14B8A6]'
                      : 'border-transparent text-[#172033] hover:text-[#0F766E]'
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function CategoryList({
  categories,
  activeKey,
  onSelect,
}: RestaurantCategorySidebarProps) {
  return (
    <ul className="space-y-1">
      {categories.map((category) => {
        const active = category.key === activeKey;
        return (
          <li key={category.key}>
            <button
              type="button"
              onClick={() => onSelect(category.key)}
              className={`flex min-h-12 w-full items-center justify-between rounded-l-lg border-r-2 px-3 py-2 text-left text-base transition ${
                active
                  ? 'border-[#16B8A6] bg-[#E8F8F5] font-bold text-[#0E4B47]'
                  : 'border-transparent text-[#737B8C] hover:bg-[#F3FBF9] hover:text-[#0E4B47]'
              }`}
            >
              <span className="min-w-0 truncate">{category.name}</span>
              {category.categoryType === 'offer' && (
                <span className="ml-2 rounded-full bg-[#FEF2F2] px-2 py-0.5 text-[11px] font-bold uppercase text-[#EF4444]">
                  Offer
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
