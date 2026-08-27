'use client';

import { MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
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
    <Card as="section" className="scroll-mt-28">
      <div id="checkout-address" />
      <CardHeader
        title="Delivery address"
        description="Where should we deliver this order?"
        icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
      />

      {notice && (
        <p className="mt-4 rounded-control bg-warning-tint px-3 py-2 text-sm font-semibold text-warning">
          {notice}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-control bg-danger-tint px-3 py-2 text-sm font-semibold text-danger"
        >
          {error}
        </p>
      )}

      <div className="mt-5">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-[168px]" />
            <Skeleton className="h-[168px]" />
          </div>
        ) : addresses.length > 0 ? (
          <>
            <div
              role="radiogroup"
              aria-label="Delivery address"
              className="grid gap-4 md:grid-cols-2"
            >
              {addresses.map((address) => (
                <AddressCard
                  key={String(address.id)}
                  address={address}
                  selected={String(selectedAddress?.id) === String(address.id)}
                  onSelect={() => onSelect(address)}
                />
              ))}
            </div>
            <Button variant="outline" fullWidth className="mt-4" onClick={onAddNew}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add new address
            </Button>
          </>
        ) : (
          <EmptyState
            variant="plain"
            icon="location"
            title="Add your delivery address"
            description="Save where this order should be delivered."
            actionLabel="Add address"
            onAction={onAddNew}
            className="rounded-card border border-dashed border-line-strong"
          />
        )}
      </div>

      {selectedAddress && selectedAddress.latitude == null && (
        <p className="mt-4 rounded-control bg-warning-tint px-3 py-2 text-sm font-semibold text-warning">
          Adding a GPS pin helps the restaurant deliver faster.
        </p>
      )}
    </Card>
  );
}
