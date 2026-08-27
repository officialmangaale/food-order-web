'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpDown, Check, ChevronDown } from 'lucide-react';

export interface SortOption {
  value: string;
  label: string;
}

interface SortMenuProps {
  options: SortOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

/**
 * Compact sort control matching the Chip geometry (40px pill), so a filter row
 * containing chips and a sort control stays on one baseline.
 */
export function SortMenu({
  options,
  value,
  onChange,
  label = 'Sort by',
  className = '',
}: SortMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const active = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 text-sm font-bold text-ink-muted transition-colors hover:border-brand-300 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25"
      >
        <ArrowUpDown className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="sr-only">{label}: </span>
        <span className="max-w-[9rem] truncate">{active?.label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className="absolute right-0 z-30 mt-2 min-w-[190px] overflow-hidden rounded-control border border-line bg-surface py-1 shadow-floating"
        >
          {options.map((option) => {
            const selected = option.value === active?.value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex min-h-11 w-full items-center justify-between gap-3 px-4 text-left text-sm font-semibold transition-colors hover:bg-brand-50 ${
                    selected ? 'text-brand-900' : 'text-ink-muted'
                  }`}
                >
                  {option.label}
                  {selected && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
