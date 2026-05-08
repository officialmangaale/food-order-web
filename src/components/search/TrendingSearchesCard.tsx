'use client';

import { TrendingUp } from 'lucide-react';

const TRENDING_SEARCHES = ['Healthy Bowls', 'Artisan Desserts', 'Pizza', 'Burgers', 'Biryani'];

interface TrendingSearchesCardProps {
  onSelect: (term: string) => void;
  compact?: boolean;
}

export function TrendingSearchesCard({ onSelect, compact }: TrendingSearchesCardProps) {
  if (compact) {
    return (
      <div className="space-y-3">
        <CardTitle>Trending Now</CardTitle>
        <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible">
          {TRENDING_SEARCHES.map((term) => (
            <TrendChip key={term} term={term} onSelect={onSelect} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-[#F0DADA] bg-white p-5 shadow-[0_12px_32px_rgba(168,15,21,0.06)]">
      <CardTitle>Trending Now</CardTitle>
      <div className="mt-4 flex flex-wrap gap-2">
        {TRENDING_SEARCHES.map((term) => (
          <TrendChip key={term} term={term} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}

function TrendChip({ term, onSelect }: { term: string; onSelect: (term: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(term)}
      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#E9CBCB] bg-[#FFFDFD] px-3.5 py-2 text-sm font-semibold text-[#4B3A3A] transition hover:border-[#B31317] hover:bg-[#FFF7F5] hover:text-[#A80F15]"
    >
      <TrendingUp className="h-3.5 w-3.5 text-[#A80F15]" aria-hidden="true" />
      {term}
    </button>
  );
}

function CardTitle({ children }: { children: string }) {
  return (
    <h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#A80F15]">
      {children}
    </h2>
  );
}
