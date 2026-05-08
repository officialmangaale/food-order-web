'use client';

import { SearchX } from 'lucide-react';

const SUGGESTIONS = ['pizza', 'burger', 'cake', 'biryani'];

interface SearchEmptyStateProps {
  query?: string;
  onSearchSelect: (term: string) => void;
}

export function SearchEmptyState({ query, onSearchSelect }: SearchEmptyStateProps) {
  const title = query ? `No results found for "${query}"` : 'Start with a dish, cuisine, or restaurant';

  return (
    <div className="rounded-3xl border border-[#F0DADA] bg-white px-6 py-14 text-center shadow-[0_14px_34px_rgba(31,41,55,0.05)]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF0F0]">
        <SearchX className="h-8 w-8 text-[#A80F15]" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-xl font-extrabold text-[#1F1A1A]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7B6B6B]">
        Try searching pizza, burger, cake, biryani.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => onSearchSelect(term)}
            className="rounded-full border border-[#E9CBCB] bg-[#FFFDFD] px-4 py-2 text-sm font-bold capitalize text-[#4B3A3A] transition hover:border-[#B31317] hover:text-[#A80F15]"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
