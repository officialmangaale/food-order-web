'use client';

import {
  BadgePercent,
  Hamburger,
  IceCreamBowl,
  Leaf,
  Pizza,
  Soup,
  UtensilsCrossed,
} from 'lucide-react';
import { Thumbnail } from '@/components/ui/Thumbnail';
import type { HomeCategory } from '@/types/category';

interface CategoryPillProps {
  category: HomeCategory;
  active: boolean;
  onClick: (category: HomeCategory) => void;
  expanded?: boolean;
}

export function CategoryPill({ category, active, onClick, expanded }: CategoryPillProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-expanded={category.key === 'all' ? expanded : undefined}
      onClick={() => onClick(category)}
      className="group flex w-full min-w-0 flex-col items-center gap-2 rounded-control bg-transparent text-center text-xs font-semibold text-ink-muted transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25"
    >
      <span
        className={`relative flex h-[60px] w-[60px] shrink-0 items-center justify-center overflow-hidden rounded-full border-2 transition-[border-color,box-shadow,background-color] duration-[var(--duration-fast)] ${
          active
            ? 'border-brand-700 bg-brand-50 shadow-[0_6px_16px_rgba(15,157,138,0.14)]'
            : 'border-line bg-white shadow-card group-hover:border-brand-300'
        }`}
      >
        {category.imageUrl ? (
          <Thumbnail
            src={category.imageUrl}
            alt=""
            ratio="square"
            className="h-full w-full"
          />
        ) : (
          <span
            className={`flex h-full w-full items-center justify-center ${
              active ? 'bg-brand-100 text-brand-900' : 'bg-surface-muted text-ink-muted'
            }`}
          >
            <CategoryIconGlyph category={category} className="h-7 w-7" />
          </span>
        )}
      </span>
      <span className={`line-clamp-2 min-h-8 leading-4 ${active ? 'font-bold text-brand-700' : 'text-ink'}`}>
        {category.name}
      </span>
    </button>
  );
}

/** Icon fallback for a category with no backend image. Shared with the browse rail. */
export function CategoryIconGlyph({ category, className }: { category: HomeCategory; className: string }) {
  const text = `${category.key} ${category.name}`.toLowerCase();

  if (category.categoryType === 'offer' || text.includes('offer') || text.includes('deal')) {
    return <BadgePercent className={className} aria-hidden="true" />;
  }
  if (text.includes('pizza')) return <Pizza className={className} aria-hidden="true" />;
  if (text.includes('burger') || text.includes('hamburger')) {
    return <Hamburger className={className} aria-hidden="true" />;
  }
  if (
    text.includes('asian') ||
    text.includes('chinese') ||
    text.includes('thai') ||
    text.includes('noodle') ||
    text.includes('momo')
  ) {
    return <Soup className={className} aria-hidden="true" />;
  }
  if (
    text.includes('dessert') ||
    text.includes('sweet') ||
    text.includes('ice') ||
    text.includes('cake')
  ) {
    return <IceCreamBowl className={className} aria-hidden="true" />;
  }
  if (
    text.includes('healthy') ||
    text.includes('salad') ||
    text.includes('leaf') ||
    text.includes('vegan')
  ) {
    return <Leaf className={className} aria-hidden="true" />;
  }
  if (text.includes('rice') || text.includes('biryani') || text.includes('bowl')) {
    return <Soup className={className} aria-hidden="true" />;
  }

  return <UtensilsCrossed className={className} aria-hidden="true" />;
}
