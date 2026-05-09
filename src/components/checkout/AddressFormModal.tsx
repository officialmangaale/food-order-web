'use client';

import { useState, type FormEvent } from 'react';
import { Navigation, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLocationStore } from '@/store/locationStore';
import type { CheckoutAddressPayload } from '@/components/checkout/checkoutTypes';

interface AddressFormModalProps {
  open: boolean;
  initialName?: string;
  initialPhone?: string;
  onClose: () => void;
  onSave: (payload: CheckoutAddressPayload) => Promise<void>;
}

export function AddressFormModal({
  open,
  initialName,
  initialPhone,
  onClose,
  onSave,
}: AddressFormModalProps) {
  const requestBrowserLocation = useLocationStore((state) => state.requestBrowserLocation);
  const [form, setForm] = useState<CheckoutAddressPayload>({
    label: 'Home',
    name: initialName ?? '',
    phone: initialPhone ?? '',
    address_line1: '',
    area: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    latitude: undefined,
    longitude: undefined,
    is_default: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationCaptured, setLocationCaptured] = useState(false);

  if (!open) return null;

  const setField = (field: keyof CheckoutAddressPayload, value: string | boolean | number | undefined) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const captureLocation = async () => {
    setLocating(true);
    const location = await requestBrowserLocation();
    setLocating(false);
    if (!location) return;

    setField('latitude', location.lat);
    setField('longitude', location.lng);
    setLocationCaptured(true);
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name?.trim()) nextErrors.name = 'Name is required';
    if (!form.phone || form.phone.replace(/\D/g, '').length < 10) nextErrors.phone = 'Valid phone is required';
    if (!form.address_line1.trim()) nextErrors.address_line1 = 'Address line is required';
    if (!form.area?.trim()) nextErrors.area = 'Area is required';
    if (!form.city?.trim()) nextErrors.city = 'City is required';
    if (!form.pincode || form.pincode.replace(/\D/g, '').length < 5) nextErrors.pincode = 'Valid pincode is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      await onSave({
        ...form,
        label: form.label?.trim() || 'Home',
        name: form.name?.trim(),
        phone: form.phone?.trim(),
        address_line1: form.address_line1.trim(),
        area: form.area?.trim(),
        city: form.city?.trim(),
        state: form.state?.trim(),
        pincode: form.pincode?.trim(),
        landmark: form.landmark?.trim(),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130]" role="dialog" aria-modal="true" aria-labelledby="checkout-address-modal-title">
      <button
        type="button"
        className="absolute inset-0 h-full w-full bg-black/35 backdrop-blur-[2px]"
        aria-label="Close address form"
        onClick={onClose}
      />
      <div className="absolute bottom-0 left-0 right-0 max-h-[92vh] overflow-y-auto rounded-t-3xl border border-[#F0DADA] bg-[#FFF7F5] shadow-2xl sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:w-[min(94vw,720px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E8DFDF] bg-[#FFF7F5] px-5 py-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#A80F15]">Delivery</p>
            <h2 id="checkout-address-modal-title" className="mt-1 text-xl font-extrabold text-[#1F1A1A]">
              Add New Address
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#4B3A3A] transition hover:bg-white hover:text-[#A80F15]"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Label" value={form.label ?? ''} onChange={(event) => setField('label', event.target.value)} />
            <Input label="Name" value={form.name ?? ''} onChange={(event) => setField('name', event.target.value)} error={errors.name} />
            <Input
              label="Phone"
              type="tel"
              maxLength={10}
              value={form.phone ?? ''}
              onChange={(event) => setField('phone', event.target.value.replace(/\D/g, ''))}
              error={errors.phone}
            />
            <Input
              label="Pincode"
              maxLength={6}
              value={form.pincode ?? ''}
              onChange={(event) => setField('pincode', event.target.value.replace(/\D/g, ''))}
              error={errors.pincode}
            />
          </div>

          <Input
            label="Address Line 1"
            placeholder="House/flat, street"
            value={form.address_line1}
            onChange={(event) => setField('address_line1', event.target.value)}
            error={errors.address_line1}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Area / Locality" value={form.area ?? ''} onChange={(event) => setField('area', event.target.value)} error={errors.area} />
            <Input label="City" value={form.city ?? ''} onChange={(event) => setField('city', event.target.value)} error={errors.city} />
            <Input label="State" value={form.state ?? ''} onChange={(event) => setField('state', event.target.value)} />
          </div>

          <Input
            label="Landmark"
            placeholder="Near gate, tower, or shop"
            value={form.landmark ?? ''}
            onChange={(event) => setField('landmark', event.target.value)}
          />

          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Input
              label="Latitude"
              value={form.latitude ?? ''}
              onChange={(event) => setField('latitude', parseOptionalNumber(event.target.value))}
            />
            <Input
              label="Longitude"
              value={form.longitude ?? ''}
              onChange={(event) => setField('longitude', parseOptionalNumber(event.target.value))}
            />
            <Button
              type="button"
              variant="outline"
              className="border-[#E7B8B3] text-[#A80F15] hover:bg-[#FFF0F0]"
              onClick={captureLocation}
              loading={locating}
            >
              <Navigation className="h-4 w-4" aria-hidden="true" />
              Use current location
            </Button>
          </div>

          {(locationCaptured || (form.latitude != null && form.longitude != null)) ? (
            <p className="rounded-xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-700">
              Location captured
            </p>
          ) : (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
              GPS location helps the restaurant deliver faster.
            </p>
          )}

          <Button type="submit" fullWidth loading={saving} className="bg-[#A80F15] hover:bg-[#8F0D12]">
            Save Address
          </Button>
        </form>
      </div>
    </div>
  );
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
