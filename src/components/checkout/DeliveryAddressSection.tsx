'use client';

import { MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { AddressCard } from '@/components/checkout/AddressCard';
import type { CheckoutAddress } from '@/components/checkout/checkoutTypes';

interface DeliveryAddressSectionProps {
  addresses: CheckoutAddress[];
  selectedAddress?: CheckoutAddress | null;
  loading?: boolean;
  notice?: string;
  error?: string;
  onSelect: (address: CheckoutAddress) => void;
  onAddNew: () => void;
}

export function DeliveryAddressSection({
  addresses,
  selectedAddress,
  loading,
  notice,
  error,
  onSelect,
  onAddNew,
}: DeliveryAddressSectionProps) {
  return (
    <section id="checkout-address" className="rounded-2xl border border-[#F0DADA] bg-white p-5 shadow-[0_12px_30px_rgba(123,35,35,0.05)] sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <MapPin className="h-6 w-6 text-[#B31317]" aria-hidden="true" />
        <h2 className="text-2xl font-extrabold tracking-normal text-[#1F1717]">Delivery Address</h2>
      </div>

      {notice && (
        <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
          {notice}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : addresses.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <AddressCard
              key={String(address.id)}
              address={address}
              selected={String(selectedAddress?.id) === String(address.id)}
              onSelect={() => onSelect(address)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[#E7B8B3] bg-[#FFF9F8]">
          <EmptyState
            icon="search"
            title="Add your delivery address"
            description="Save where this order should be delivered."
            actionLabel="Add New Address"
            onAction={onAddNew}
          />
        </div>
      )}

      {addresses.length > 0 && (
        <Button
          variant="outline"
          fullWidth
          className="mt-4 border-[#E7B8B3] py-3 text-[#A80F15] hover:bg-[#FFF0F0]"
          onClick={onAddNew}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add New Address
        </Button>
      )}

      {selectedAddress && selectedAddress.latitude == null && (
        <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
          GPS location helps the restaurant deliver faster.
        </p>
      )}
    </section>
  );
}
