'use client';

import { type FormEvent } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface SearchHeaderInputProps {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClear?: () => void;
  inputId?: string;
  className?: string;
  variant?: 'default' | 'hero';
  showFilter?: boolean;
}

export function SearchHeaderInput({
  value,
  placeholder,
  onChange,
  onSubmit,
  onClear,
  inputId = 'site-search',
  className = '',
  variant = 'default',
  showFilter = false,
}: SearchHeaderInputProps) {
  const isHero = variant === 'hero';

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className={`relative min-w-0 ${isHero ? '' : 'flex-1'} ${className}`}
    >
      <label htmlFor={inputId} className="sr-only">
        Search Mangaale
      </label>
      <Search
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink ${
          isHero ? 'left-5 h-[22px] w-[22px]' : 'left-4 h-5 w-5'
        }`}
        aria-hidden="true"
      />
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={
          isHero
            ? 'h-14 w-full rounded-[18px] border border-white/80 bg-white pl-14 pr-24 text-[15px] font-medium text-ink shadow-[0_12px_32px_rgba(23,32,34,0.12)] outline-none transition placeholder:font-normal placeholder:text-ink-subtle hover:border-brand-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 sm:h-[58px] sm:text-base'
            : 'h-11 w-full rounded-control border border-line bg-surface pl-12 pr-11 text-sm font-medium text-ink shadow-card outline-none transition placeholder:font-normal placeholder:text-ink-subtle hover:border-line-interactive focus:border-brand-500 focus:bg-surface focus:ring-4 focus:ring-brand-500/10 md:h-12 md:text-[15px] lg:rounded-full'
        }
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className={`absolute top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted transition hover:bg-brand-50 hover:text-brand-900 ${
            showFilter ? 'right-12' : 'right-3'
          }`}
          aria-label="Clear search"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
      {showFilter && (
        <button
          type="submit"
          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/30"
          aria-label="Search with filters"
        >
          <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </form>
  );
}
