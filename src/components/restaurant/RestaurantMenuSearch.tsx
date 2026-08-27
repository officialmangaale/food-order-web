'use client';

import { Search, X } from 'lucide-react';

interface RestaurantMenuSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function RestaurantMenuSearch({ value, onChange }: RestaurantMenuSearchProps) {
  return (
    <div className="relative w-full min-w-0 sm:w-[300px] sm:shrink-0">
      <label htmlFor="restaurant-menu-search" className="sr-only">
        Search in menu
      </label>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-subtle"
        aria-hidden="true"
      />
      <input
        id="restaurant-menu-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search in menu"
        className="h-10 w-full rounded-full border border-line-strong bg-surface pl-11 pr-10 text-sm font-medium text-ink outline-none transition-[border-color,box-shadow] duration-[var(--duration-fast)] placeholder:font-normal placeholder:text-ink-subtle hover:border-line-interactive focus:border-brand-700 focus:ring-4 focus:ring-brand-700/15"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-brand-50 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700/25"
          aria-label="Clear menu search"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
