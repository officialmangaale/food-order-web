'use client';

import { type FormEvent } from 'react';
import { Search, X } from 'lucide-react';

interface SearchHeaderInputProps {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClear?: () => void;
  inputId?: string;
  className?: string;
}

export function SearchHeaderInput({
  value,
  placeholder,
  onChange,
  onSubmit,
  onClear,
  inputId = 'site-search',
  className = '',
}: SearchHeaderInputProps) {
  return (
    <form role="search" onSubmit={onSubmit} className={`relative min-w-0 flex-1 ${className}`}>
      <label htmlFor={inputId} className="sr-only">
        Search Mangaale
      </label>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink"
        aria-hidden="true"
      />
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-control border border-line bg-surface pl-12 pr-11 text-sm font-medium text-ink shadow-card outline-none transition placeholder:font-normal placeholder:text-ink-subtle hover:border-line-interactive focus:border-brand-500 focus:bg-surface focus:ring-4 focus:ring-brand-500/10 md:h-12 md:text-[15px] lg:rounded-full"
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted transition hover:bg-brand-50 hover:text-brand-900"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </form>
  );
}
