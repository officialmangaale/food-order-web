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
    <section className="rounded-card border border-line bg-surface p-5 shadow-card">
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
      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-sm font-semibold text-ink-muted transition-colors hover:border-brand-300 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25"
    >
      <TrendingUp className="h-3.5 w-3.5 shrink-0 text-brand-700" aria-hidden="true" />
      {term}
    </button>
  );
}

function CardTitle({ children }: { children: string }) {
  return (
    <h2 className="text-eyebrow uppercase text-ink-subtle">{children}</h2>
  );
}
