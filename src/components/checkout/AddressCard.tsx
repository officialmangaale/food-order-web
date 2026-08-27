'use client';

import { BriefcaseBusiness, Check, Home, MapPin, Phone } from 'lucide-react';
import type { CheckoutAddress } from '@/components/checkout/checkoutTypes';

interface AddressCardProps {
  address: CheckoutAddress;
  selected: boolean;
  onSelect: () => void;
}

export function AddressCard({ address, selected, onSelect }: AddressCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`relative flex min-h-[168px] flex-col rounded-card border-2 p-4 text-left transition-[border-color,background-color] duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25 ${
        selected
          ? 'border-brand-700 bg-brand-50'
          : 'border-line-strong bg-surface hover:border-brand-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex min-w-0 items-center gap-1.5">
          <AddressIcon label={address.label} />
          <span className="truncate text-eyebrow uppercase text-brand-800">
            {address.label || 'Home'}
          </span>
        </span>
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
            selected ? 'border-brand-700 bg-brand-700 text-white' : 'border-line-strong'
          }`}
          aria-hidden="true"
        >
          {selected && <Check className="h-3 w-3" strokeWidth={3} />}
        </span>
      </div>

      <div className="mt-3 space-y-1.5 text-sm leading-6">
        <p className="font-semibold text-ink">{address.address_line1}</p>
        <p className="text-ink-muted">
          {[address.area, address.city, address.state, address.pincode].filter(Boolean).join(', ')}
        </p>
        {address.phone && (
          <p className="flex items-center gap-1.5 text-ink-muted">
            <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {address.phone}
          </p>
        )}
      </div>
    </button>
  );
}

function AddressIcon({ label }: { label?: string }) {
  const normalized = label?.toLowerCase() ?? '';
  const className = 'h-4 w-4 shrink-0 text-brand-800';

  if (normalized.includes('work') || normalized.includes('office')) {
    return <BriefcaseBusiness className={className} aria-hidden="true" />;
  }
  if (normalized.includes('home')) {
    return <Home className={className} aria-hidden="true" />;
  }
  return <MapPin className={className} aria-hidden="true" />;
}
