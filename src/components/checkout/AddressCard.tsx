'use client';

import { BriefcaseBusiness, CheckCircle2, Home, MapPin, Phone } from 'lucide-react';
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
      onClick={onSelect}
      className={`relative min-h-[162px] rounded-xl border p-4 text-left transition ${
        selected
          ? 'border-[#B31317] bg-[#FFF0F0] shadow-[0_10px_24px_rgba(179,19,23,0.08)]'
          : 'border-[#E7B8B3] bg-white hover:border-[#B31317] hover:bg-[#FFF9F8]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {renderAddressIcon(address.label)}
          <span className="truncate text-sm font-extrabold tracking-[0.12em] text-[#A80F15]">
            {(address.label || 'Home').toUpperCase()}
          </span>
        </div>
        {selected && <CheckCircle2 className="h-5 w-5 shrink-0 text-[#B31317]" aria-hidden="true" />}
      </div>

      <div className="mt-3 space-y-2 text-sm leading-6 text-[#2B2020]">
        <p className="font-medium">{address.address_line1}</p>
        <p className="text-[#4F3838]">
          {[address.area, address.city, address.state, address.pincode].filter(Boolean).join(', ')}
        </p>
        {address.phone && (
          <p className="flex items-center gap-2 text-[#4F3838]">
            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
            {address.phone}
          </p>
        )}
      </div>
    </button>
  );
}

function renderAddressIcon(label?: string) {
  const normalized = label?.toLowerCase() ?? '';
  const className = 'h-4 w-4 shrink-0 text-[#A80F15]';
  if (normalized.includes('work') || normalized.includes('office')) {
    return <BriefcaseBusiness className={className} aria-hidden="true" />;
  }
  if (normalized.includes('home')) {
    return <Home className={className} aria-hidden="true" />;
  }
  return <MapPin className={className} aria-hidden="true" />;
}
