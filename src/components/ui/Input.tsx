'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-bold text-ink">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              h-12 w-full rounded-control border bg-white px-4 py-3 text-[15px] font-medium text-ink shadow-card
              outline-none transition-[color,background-color,border-color,box-shadow] duration-150
              placeholder:font-normal placeholder:text-ink-subtle
              hover:border-line-interactive focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10
              disabled:border-line disabled:bg-surface-muted disabled:text-ink-muted disabled:shadow-none
              ${error ? 'border-danger focus:border-danger focus:ring-danger/10' : 'border-line'}
              ${leftIcon ? 'pl-11' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-sm font-medium text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
