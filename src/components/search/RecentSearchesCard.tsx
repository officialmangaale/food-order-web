'use client';

import { History } from 'lucide-react';

interface RecentSearchesCardProps {
  searches: string[];
  onSelect: (term: string) => void;
  compact?: boolean;
}

export function RecentSearchesCard({ searches, onSelect, compact }: RecentSearchesCardProps) {
  if (compact) {
    return (
      <div className="space-y-3">
        <CardTitle>Recent Searches</CardTitle>
        {searches.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible">
            {searches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => onSelect(term)}
                className="inline-flex h-10 shrink-0 items-center rounded-full border border-line-strong bg-surface px-4 text-sm font-semibold text-ink-muted transition-colors hover:border-brand-300 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25"
              >
                {term}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-subtle">Your recent searches will appear here.</p>
        )}
      </div>
    );
  }

  return (
    <section className="rounded-card border border-line bg-surface p-5 shadow-card">
      <CardTitle>Recent Searches</CardTitle>
      <div className="mt-4 space-y-1">
        {searches.length > 0 ? (
          searches.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => onSelect(term)}
              className="flex min-h-11 w-full items-center gap-3 rounded-control px-2 text-left text-sm font-medium text-ink-muted transition-colors hover:bg-brand-50 hover:text-brand-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25"
            >
              <History className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden="true" />
              <span className="truncate">{term}</span>
            </button>
          ))
        ) : (
          <p className="rounded-control bg-surface-sunken px-3 py-3 text-sm text-ink-subtle">
            Your recent searches will appear here.
          </p>
        )}
      </div>
    </section>
  );
}

function CardTitle({ children }: { children: string }) {
  return (
    <h2 className="text-eyebrow uppercase text-ink-subtle">{children}</h2>
  );
}
