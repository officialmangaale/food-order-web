'use client';

import { forwardRef, useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

/** Shared field chrome so inputs, textareas and selects are visually identical. */
const fieldBase = [
  'w-full rounded-control border bg-surface text-[15px] font-medium text-ink',
  'outline-none transition-[color,background-color,border-color,box-shadow] duration-[var(--duration-fast)]',
  'placeholder:font-normal placeholder:text-ink-subtle',
  'hover:border-line-interactive',
  'focus:border-brand-700 focus:ring-4 focus:ring-brand-700/15',
  'disabled:border-line disabled:bg-surface-muted disabled:text-ink-subtle',
].join(' ');

function fieldTone(hasError: boolean) {
  return hasError
    ? 'border-danger focus:border-danger focus:ring-danger/15'
    : 'border-line-strong';
}

interface FieldShellProps {
  id: string;
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

function FieldShell({ id, label, error, hint, required, children }: FieldShellProps) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-ink">
          {label}
          {required && (
            <span className="ml-0.5 text-danger" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm font-semibold text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs leading-5 text-ink-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leftIcon, rightSlot, className = '', id, required, ...props },
  ref
) {
  const generatedId = useId();
  const inputId = id || `input-${generatedId}`;

  return (
    <FieldShell id={inputId} label={label} error={error} hint={hint} required={required}>
      <div className="relative">
        {leftIcon && (
          <span
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle"
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={`h-12 px-4 ${fieldBase} ${fieldTone(Boolean(error))} ${leftIcon ? 'pl-11' : ''} ${rightSlot ? 'pr-12' : ''} ${className}`}
          {...props}
        />
        {rightSlot && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">{rightSlot}</span>
        )}
      </div>
    </FieldShell>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className = '', id, required, rows = 3, ...props },
  ref
) {
  const generatedId = useId();
  const textareaId = id || `textarea-${generatedId}`;

  return (
    <FieldShell id={textareaId} label={label} error={error} hint={hint} required={required}>
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
        className={`resize-y px-4 py-3 leading-6 ${fieldBase} ${fieldTone(Boolean(error))} ${className}`}
        {...props}
      />
    </FieldShell>
  );
});
