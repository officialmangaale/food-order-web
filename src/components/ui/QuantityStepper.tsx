'use client';

import { Minus, Plus } from 'lucide-react';

type StepperSize = 'sm' | 'md';

/**
 * Both states share one box per size. The ADD button and the stepper that
 * replaces it occupy exactly the same space, so adding an item never reflows
 * the card or the row it sits in.
 *
 * `width` is separate from height because a 2-column card grid at 320-375px
 * cannot fit a price and a fixed-width button on one line — those call sites
 * use `responsive`, which goes full-width on phones and fixed from `sm` up.
 */
type StepperWidth = 'fixed' | 'full' | 'responsive';

const sizing: Record<StepperSize, { height: string; icon: string; label: string }> = {
  sm: { height: 'h-10', icon: 'h-4 w-4', label: 'text-sm' },
  md: { height: 'h-11', icon: 'h-[18px] w-[18px]', label: 'text-[15px]' },
};

const widths: Record<StepperSize, Record<StepperWidth, string>> = {
  sm: { fixed: 'w-[88px]', full: 'w-full', responsive: 'w-full sm:w-[88px]' },
  md: { fixed: 'w-[104px]', full: 'w-full', responsive: 'w-full sm:w-[104px]' },
};

interface QuantityStepperProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  size?: StepperSize;
  width?: StepperWidth;
  /** Item name, used to build accessible labels. */
  itemName: string;
  disabled?: boolean;
  className?: string;
}

export function QuantityStepper({
  quantity,
  onIncrease,
  onDecrease,
  size = 'sm',
  width = 'fixed',
  itemName,
  disabled,
  className = '',
}: QuantityStepperProps) {
  const { height, icon, label } = sizing[size];

  return (
    <div
      className={`inline-flex items-center justify-between rounded-full bg-brand-700 text-white shadow-brand ${height} ${widths[size][width]} ${className}`}
    >
      <button
        type="button"
        onClick={onDecrease}
        disabled={disabled}
        aria-label={quantity === 1 ? `Remove ${itemName}` : `Decrease quantity of ${itemName}`}
        className="flex h-full w-1/3 items-center justify-center rounded-l-full transition-colors duration-[var(--duration-fast)] hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70 disabled:opacity-50"
      >
        <Minus className={icon} aria-hidden="true" />
      </button>

      <span
        className={`flex-1 text-center font-extrabold tabular-nums ${label}`}
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="sr-only">{itemName} quantity: </span>
        {quantity}
      </span>

      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled}
        aria-label={`Increase quantity of ${itemName}`}
        className="flex h-full w-1/3 items-center justify-center rounded-r-full transition-colors duration-[var(--duration-fast)] hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70 disabled:opacity-50"
      >
        <Plus className={icon} aria-hidden="true" />
      </button>
    </div>
  );
}

interface AddToCartControlProps {
  quantity: number;
  onAdd: () => void;
  onIncrease?: () => void;
  onDecrease?: () => void;
  itemName: string;
  /** Item is out of stock or the restaurant is closed. */
  unavailable?: boolean;
  unavailableLabel?: string;
  /** Item has variants/add-ons, so every tap must open the customiser. */
  requiresCustomisation?: boolean;
  size?: StepperSize;
  width?: StepperWidth;
  className?: string;
}

/**
 * The single add-to-cart control used by every food card, menu row and search
 * result. Shows ADD, or a stepper once the item is in the cart — unless the
 * item needs customising, in which case it always opens the customiser.
 */
export function AddToCartControl({
  quantity,
  onAdd,
  onIncrease,
  onDecrease,
  itemName,
  unavailable,
  unavailableLabel = 'Unavailable',
  requiresCustomisation,
  size = 'sm',
  width = 'fixed',
  className = '',
}: AddToCartControlProps) {
  const { height, label } = sizing[size];
  const box = `${height} ${widths[size][width]}`;

  if (unavailable) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full border border-line-strong bg-surface-muted font-bold text-ink-subtle ${box} ${size === 'sm' ? 'text-xs' : 'text-sm'} ${className}`}
      >
        {unavailableLabel}
      </span>
    );
  }

  const showStepper = quantity > 0 && !requiresCustomisation && onIncrease && onDecrease;

  if (showStepper) {
    return (
      <QuantityStepper
        quantity={quantity}
        onIncrease={onIncrease}
        onDecrease={onDecrease}
        itemName={itemName}
        size={size}
        width={width}
        className={className}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label={`Add ${itemName} to cart`}
      className={[
        'relative inline-flex items-center justify-center rounded-full border border-brand-700 bg-surface font-extrabold uppercase tracking-[0.04em] text-brand-800',
        'transition-[color,background-color,border-color] duration-[var(--duration-fast)]',
        'hover:bg-brand-700 hover:text-white',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25',
        box,
        label,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      Add
      {/* Signals that tapping opens the customiser rather than adding directly. */}
      {requiresCustomisation && (
        <span
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-surface px-1 text-[9px] font-bold leading-none text-ink-subtle"
          aria-hidden="true"
        >
          +
        </span>
      )}
      {quantity > 0 && requiresCustomisation && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-700 px-1 text-[10px] font-bold text-white">
          {quantity}
        </span>
      )}
    </button>
  );
}
