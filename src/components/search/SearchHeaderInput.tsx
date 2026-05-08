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
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8B7B7B]"
        aria-hidden="true"
      />
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-full border border-[#E9CBCB] bg-[#FFFDFD] pl-12 pr-11 text-[15px] text-[#1F2937] shadow-[0_1px_0_rgba(179,19,23,0.03)] outline-none transition placeholder:text-[#9A8D8D] hover:border-[#D99A9A] focus:border-[#B31317] focus:bg-white focus:ring-4 focus:ring-[#B31317]/10 md:h-12"
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#7B6B6B] transition hover:bg-[#FBEAEA] hover:text-[#A80F15]"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </form>
  );
}
