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
      className={`group inline-flex h-12 shrink-0 items-center gap-2.5 rounded-2xl border px-4 text-sm font-extrabold tracking-normal shadow-[0_10px_24px_rgba(168,15,21,0.05)] transition focus:outline-none focus:ring-4 focus:ring-[#B31317]/10 sm:h-[52px] sm:px-5 ${
        active
          ? 'border-[#A80F15] bg-[#A80F15] text-white shadow-[0_14px_30px_rgba(168,15,21,0.20)]'
          : 'border-[#E9CBCB] bg-white text-[#211818] hover:border-[#D99A9A] hover:bg-[#FFF9F9]'
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full ${
          active ? 'bg-white/15 text-white' : 'bg-[#FFF0F0] text-[#A80F15]'
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
          <CategoryIconGlyph category={category} className="h-4 w-4" />
        )}
      </span>
      <span className="whitespace-nowrap">{category.name}</span>
      {category.itemCount != null && category.itemCount > 0 && (
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
            active ? 'bg-white/15 text-white/90' : 'bg-[#FFF0F0] text-[#A80F15]'
          }`}
        >
          {category.itemCount}
        </span>
      )}
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
