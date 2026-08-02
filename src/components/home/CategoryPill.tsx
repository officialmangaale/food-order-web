'use client';

import { useState } from 'react';
import {
  Hamburger,
  IceCreamBowl,
  Leaf,
  Pizza,
  Soup,
  UtensilsCrossed,
} from 'lucide-react';
import type { HomeCategory } from '@/types/category';

interface CategoryPillProps {
  category: HomeCategory;
  active: boolean;
  onClick: (category: HomeCategory) => void;
}

export function CategoryPill({ category, active, onClick }: CategoryPillProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const canShowImage = Boolean(category.imageUrl && !imageFailed);

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onClick(category)}
      className={`group flex w-[66px] shrink-0 flex-col items-center gap-1.5 bg-transparent text-xs font-bold tracking-normal text-[#737B8C] transition focus:outline-none focus:ring-4 focus:ring-[#16B8A6]/10 sm:w-[82px] sm:gap-2 sm:text-sm ${
        active
          ? 'text-[#0E4B47]'
          : 'hover:text-[#172033]'
      }`}
    >
      <span
        className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border shadow-[0_8px_22px_rgba(23,32,51,0.035)] transition sm:h-[72px] sm:w-[72px] sm:rounded-[22px] ${
          active ? 'border-[#16B8A6] bg-[#E8F8F5] text-[#0E4B47]' : 'border-[#E3E7EA] bg-[#F3FBF9] text-[#172033] group-hover:border-[#B9DCD7]'
        }`}
      >
        {canShowImage ? (
          <img
            src={category.imageUrl ?? ''}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <CategoryIconGlyph category={category} className="h-7 w-7 sm:h-8 sm:w-8" />
        )}
      </span>
      <span className="whitespace-nowrap">{category.name}</span>
    </button>
  );
}

function CategoryIconGlyph({ category, className }: { category: HomeCategory; className: string }) {
  const text = `${category.key} ${category.name}`.toLowerCase();

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
