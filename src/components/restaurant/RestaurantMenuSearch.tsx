'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';

interface RestaurantMenuSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function RestaurantMenuSearch({ value, onChange }: RestaurantMenuSearchProps) {
  return (
    <div className="relative w-[236px] shrink-0 sm:w-[300px]">
      <label htmlFor="restaurant-menu-search" className="sr-only">
        Search in menu
      </label>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#172033]"
        aria-hidden="true"
      />
      <input
        id="restaurant-menu-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search in menu"
        className="h-10 w-full rounded-xl border border-[#D8DDE3] bg-white pl-10 pr-10 text-[15px] text-[#172033] outline-none transition placeholder:text-[#9AA4B7] hover:border-[#AEB7C4] focus:border-[#14B8A6] focus:ring-4 focus:ring-[#14B8A6]/10 sm:h-12"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#7B8497] transition hover:bg-[#E8F8F5] hover:text-[#0F766E]"
          aria-label="Clear menu search"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
      {!value && (
        <SlidersHorizontal
          className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#0F5E58]"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
