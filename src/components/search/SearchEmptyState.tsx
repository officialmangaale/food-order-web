'use client';

import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';

const SUGGESTIONS = ['pizza', 'burger', 'cake', 'biryani'];

interface SearchEmptyStateProps {
  query?: string;
  onSearchSelect: (term: string) => void;
}

export function SearchEmptyState({ query, onSearchSelect }: SearchEmptyStateProps) {
  const title = query ? `No results found for "${query}"` : 'Start with a dish, cuisine, or restaurant';

  return (
    <EmptyState
      icon="search"
      title={title}
      description={query ? 'Try a different dish, cuisine or restaurant name.' : undefined}
    >
      {SUGGESTIONS.map((term) => (
        <Chip key={term} role="choice" onClick={() => onSearchSelect(term)} className="capitalize">
          {term}
        </Chip>
      ))}
    </EmptyState>
  );
}
