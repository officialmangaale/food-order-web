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
      <aside className="hidden lg:block">
        <nav
          className="sticky top-28 border-r border-[#F0DDDD] pr-5"
          aria-label="Menu categories"
        >
          <CategoryList categories={categories} activeKey={activeKey} onSelect={onSelect} />
        </nav>
      </aside>

      <div className="lg:hidden">
        <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6">
          <div className="flex min-w-max gap-2">
            {categories.map((category) => {
              const active = category.key === activeKey;
              return (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => onSelect(category.key)}
                  className={`h-10 rounded-full border px-4 text-sm font-semibold transition ${
                    active
                      ? 'border-[#B31317] bg-[#B31317] text-white'
                      : 'border-[#E8C7C7] bg-white text-[#4A3030]'
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
                  ? 'border-[#B31317] bg-[#FFF0F0] font-bold text-[#A80F15]'
                  : 'border-transparent text-[#5B3737] hover:bg-[#FFF7F7] hover:text-[#A80F15]'
              }`}
            >
              <span className="min-w-0 truncate">{category.name}</span>
              {category.categoryType === 'offer' && (
                <span className="ml-2 rounded-full bg-[#FBE8E8] px-2 py-0.5 text-[11px] font-bold uppercase text-[#B31317]">
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
