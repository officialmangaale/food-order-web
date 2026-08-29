'use client';

import { useEffect, useRef } from 'react';
import { CategoryIconGlyph } from '@/components/home/CategoryPill';
import { Skeleton } from '@/components/ui/Skeleton';
import { Thumbnail } from '@/components/ui/Thumbnail';
import type { HomeCategory } from '@/types/category';

interface CategoryRailProps {
  categories: HomeCategory[];
  selectedKey: string | null;
  onSelect: (category: HomeCategory) => void;
  className?: string;
}

/**
 * The vertical category column on the browse-menu screen. Every entry comes
 * from the categories endpoint (plus the Offers entry the page derives from the
 * offers endpoint) — nothing here is hard-coded.
 *
 * The rail sticks under the app header and scrolls on its own, so categories
 * stay reachable however long the item list gets.
 */
export function CategoryRail({
  categories,
  selectedKey,
  onSelect,
  className = '',
}: CategoryRailProps) {
  const listRef = useRef<HTMLUListElement>(null);

  // Keep the selected category in view when the selection comes from the URL
  // rather than from a tap on a visible row.
  useEffect(() => {
    if (!selectedKey) return;
    const selected = listRef.current?.querySelector<HTMLElement>('[data-selected="true"]');
    selected?.scrollIntoView({ block: 'nearest' });
  }, [selectedKey]);

  return (
    <nav aria-label="Food categories" className={`category-rail hide-scrollbar ${className}`}>
      <ul ref={listRef} role="radiogroup" aria-label="Food categories" className="space-y-1 pr-1">
        {categories.map((category) => {
          const selected = category.key === selectedKey;

          return (
            <li key={category.key}>
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                data-selected={selected}
                onClick={() => onSelect(category)}
                className={`group relative flex w-full items-center gap-2 rounded-r-control py-2 pl-2.5 pr-1.5 text-left transition-colors duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/25 sm:gap-2.5 sm:pl-3 sm:pr-2 ${
                  selected ? 'bg-brand-50' : 'bg-transparent hover:bg-surface-muted'
                }`}
              >
                {/* Teal selection indicator. Always rendered so the label never
                    shifts sideways between states. */}
                <span
                  aria-hidden="true"
                  className={`absolute inset-y-1.5 left-0 w-[3px] rounded-full transition-colors duration-[var(--duration-fast)] ${
                    selected ? 'bg-brand-700' : 'bg-transparent'
                  }`}
                />

                <span
                  className={`relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 transition-colors duration-[var(--duration-fast)] sm:h-12 sm:w-12 ${
                    selected
                      ? 'border-brand-700 bg-brand-100'
                      : 'border-line bg-surface group-hover:border-brand-300'
                  }`}
                >
                  {category.imageUrl ? (
                    <Thumbnail src={category.imageUrl} alt="" ratio="square" className="h-full w-full" />
                  ) : (
                    <span
                      className={`flex h-full w-full items-center justify-center ${
                        selected ? 'text-brand-800' : 'text-ink-muted'
                      }`}
                    >
                      <CategoryIconGlyph category={category} className="h-5 w-5 sm:h-6 sm:w-6" />
                    </span>
                  )}
                </span>

                <span
                  className={`line-clamp-2 min-w-0 text-[11px] font-bold leading-4 sm:text-[13px] ${
                    selected ? 'text-brand-800' : 'text-ink'
                  }`}
                >
                  {category.name}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Mirrors the rail geometry so switching to real categories never shifts it. */
export function CategoryRailSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-1 ${className}`} aria-hidden="true">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="flex items-center gap-2 py-2 pl-2.5 pr-1.5 sm:gap-2.5 sm:pl-3">
          <Skeleton className="h-11 w-11 shrink-0 sm:h-12 sm:w-12" rounded />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}
