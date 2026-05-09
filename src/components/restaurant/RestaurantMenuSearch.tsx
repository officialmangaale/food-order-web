'use client';

import { Search, X } from 'lucide-react';

interface RestaurantMenuSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function RestaurantMenuSearch({ value, onChange }: RestaurantMenuSearchProps) {
  return (
    <div className="relative w-full sm:w-[260px]">
      <label htmlFor="restaurant-menu-search" className="sr-only">
        Search in menu
      </label>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6E5A5A]"
        aria-hidden="true"
      />
      <input
        id="restaurant-menu-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search in menu"
        className="h-12 w-full rounded-full border border-[#E8BDBD] bg-white px-11 text-[15px] text-[#2B2020] outline-none transition placeholder:text-[#7F7474] hover:border-[#D99A9A] focus:border-[#B31317] focus:ring-4 focus:ring-[#B31317]/10"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#7F7474] transition hover:bg-[#FCE9E9] hover:text-[#A80F15]"
          aria-label="Clear menu search"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
