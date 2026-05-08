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
                className="shrink-0 rounded-full border border-[#E9CBCB] bg-white px-4 py-2 text-sm font-medium text-[#4B3A3A] transition hover:border-[#B31317] hover:text-[#A80F15]"
              >
                {term}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#8B7B7B]">Your recent searches will appear here.</p>
        )}
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-[#F0DADA] bg-white p-5 shadow-[0_12px_32px_rgba(168,15,21,0.06)]">
      <CardTitle>Recent Searches</CardTitle>
      <div className="mt-4 space-y-1">
        {searches.length > 0 ? (
          searches.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => onSelect(term)}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm font-medium text-[#4B3A3A] transition hover:bg-[#FFF7F5] hover:text-[#A80F15]"
            >
              <History className="h-4 w-4 shrink-0 text-[#B9A2A2]" aria-hidden="true" />
              <span className="truncate">{term}</span>
            </button>
          ))
        ) : (
          <p className="rounded-xl bg-[#FFF7F5] px-3 py-3 text-sm text-[#8B7B7B]">
            Your recent searches will appear here.
          </p>
        )}
      </div>
    </section>
  );
}

function CardTitle({ children }: { children: string }) {
  return (
    <h2 className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#A80F15]">
      {children}
    </h2>
  );
}
