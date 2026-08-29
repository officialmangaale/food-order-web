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
                /* Geometry is tight: at a 88-112px rail the icon and the label
                   share the row, so the circle stays small and the padding
                   minimal to leave the label a readable ~50px. */
                className={`group relative flex min-h-16 w-full items-center gap-1.5 rounded-r-control py-2 pl-2 pr-1 text-left transition-colors duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/25 sm:min-h-[76px] sm:gap-2.5 sm:pl-3 sm:pr-2 ${
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
                  className={`category-rail-icon relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 transition-colors duration-[var(--duration-fast)] ${
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
                      <CategoryIconGlyph category={category} className="h-[18px] w-[18px] sm:h-6 sm:w-6" />
                    </span>
                  )}
                </span>

                {/* `break-words` matters here: single long names ("Sandwiches")
                    would otherwise overflow the narrow label box and be clipped
                    mid-word by the line clamp. */}
                <span
                  className={`line-clamp-2 min-w-0 flex-1 break-words text-[11px] font-semibold leading-[14px] sm:text-[13px] sm:font-bold sm:leading-4 ${
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
        <div
          key={index}
          className="flex min-h-16 items-center gap-1.5 py-2 pl-2 pr-1 sm:min-h-[76px] sm:gap-2.5 sm:pl-3 sm:pr-2"
        >
          <Skeleton className="category-rail-icon shrink-0" rounded />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}
