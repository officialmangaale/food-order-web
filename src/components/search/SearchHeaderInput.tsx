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
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#172033]"
        aria-hidden="true"
      />
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-2xl border border-[#DDE3E7] bg-white pl-12 pr-11 text-sm font-medium text-[#172033] shadow-[0_8px_28px_rgba(23,32,51,0.035)] outline-none transition placeholder:font-normal placeholder:text-[#98A1B2] hover:border-[#B9DCD7] focus:border-[#16B8A6] focus:bg-white focus:ring-4 focus:ring-[#16B8A6]/10 md:h-12 md:text-[15px] lg:rounded-full"
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#737B8C] transition hover:bg-[#E8F8F5] hover:text-[#0E4B47]"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </form>
  );
}
