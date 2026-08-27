'use client';

import { Badge } from '@/components/ui/Badge';
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
      {/* Desktop: vertical category rail. */}
      <aside className="hidden lg:row-span-2 lg:row-start-1 lg:block">
        <nav
          className="sticky top-[calc(var(--header-height)+1.5rem)] border-r border-line pr-5"
          aria-label="Menu categories"
        >
          <ul className="space-y-1">
            {categories.map((category) => {
              const active = category.key === activeKey;
              return (
                <li key={category.key}>
                  <button
                    type="button"
                    onClick={() => onSelect(category.key)}
                    aria-current={active ? 'true' : undefined}
                    className={`flex min-h-12 w-full items-center justify-between gap-2 rounded-l-control border-r-2 px-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25 ${
                      active
                        ? 'border-brand-700 bg-brand-50 font-bold text-brand-900'
                        : 'border-transparent font-medium text-ink-muted hover:bg-surface-muted hover:text-ink'
                    }`}
                  >
                    <span className="min-w-0 truncate">{category.name}</span>
                    {category.categoryType === 'offer' && (
                      <Badge variant="offer" size="sm">
                        Offer
                      </Badge>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Mobile: sticky horizontal tab strip under the header. Bleeds past the
          page gutter so the divider reaches both screen edges. */}
      <div className="order-2 sticky top-[var(--header-height)] z-30 -mx-[var(--page-gutter)] border-b border-line bg-canvas/95 backdrop-blur-xl lg:hidden">
        <div className="hide-scrollbar snap-row overflow-x-auto px-[var(--page-gutter)]">
          <div role="tablist" aria-label="Menu categories" className="flex min-w-max">
            {categories.map((category) => {
              const active = category.key === activeKey;
              return (
                <button
                  key={category.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onSelect(category.key)}
                  className={`relative h-12 shrink-0 whitespace-nowrap border-b-2 px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-700 ${
                    active
                      ? 'border-brand-700 text-brand-900'
                      : 'border-transparent text-ink-muted hover:text-brand-800'
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
