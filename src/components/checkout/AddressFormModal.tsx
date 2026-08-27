'use client';

import { useState, type FormEvent } from 'react';
import { Navigation } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { useLocationStore } from '@/store/locationStore';
import type { CheckoutAddressPayload } from '@/components/checkout/checkoutTypes';

interface AddressFormModalProps {
  open: boolean;
  initialName?: string;
  initialPhone?: string;
  onClose: () => void;
  onSave: (payload: CheckoutAddressPayload) => Promise<void>;
}

const LABEL_PRESETS = ['Home', 'Work', 'Other'];

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

  const setField = (
    field: keyof CheckoutAddressPayload,
    value: string | boolean | number | undefined
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const captureLocation = async () => {
    setLocating(true);
    const location = await requestBrowserLocation();
    setLocating(false);
    if (!location) return;

    setForm((current) => ({ ...current, latitude: location.lat, longitude: location.lng }));
    setLocationCaptured(true);
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name?.trim()) nextErrors.name = 'Name is required';
    if (!form.phone || form.phone.replace(/\D/g, '').length < 10)
      nextErrors.phone = 'Valid phone is required';
    if (!form.address_line1.trim()) nextErrors.address_line1 = 'Address line is required';
    if (!form.area?.trim()) nextErrors.area = 'Area is required';
    if (!form.city?.trim()) nextErrors.city = 'City is required';
    if (!form.pincode || form.pincode.replace(/\D/g, '').length < 5)
      nextErrors.pincode = 'Valid pincode is required';
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

  const hasCoordinates = locationCaptured || (form.latitude != null && form.longitude != null);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add delivery address"
      description="We use this to route your order to the right rider."
      size="lg"
      footer={
        <Button type="submit" form="address-form" fullWidth size="lg" loading={saving}>
          Save address
        </Button>
      }
    >
      <form id="address-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <span className="mb-1.5 block text-sm font-bold text-ink">Label</span>
          <div className="flex flex-wrap gap-2">
            {LABEL_PRESETS.map((preset) => {
              const active = form.label === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  data-dialog-initial-focus={preset === 'Home' ? '' : undefined}
                  onClick={() => setField('label', preset)}
                  aria-pressed={active}
                  className={`inline-flex h-10 items-center rounded-full border px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25 ${
                    active
                      ? 'border-brand-700 bg-brand-50 text-brand-900'
                      : 'border-line-strong bg-surface text-ink-muted hover:border-brand-300'
                  }`}
                >
                  {preset}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Name"
            required
            autoComplete="name"
            value={form.name ?? ''}
            onChange={(event) => setField('name', event.target.value)}
            error={errors.name}
          />
          <Input
            label="Phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            required
            maxLength={10}
            value={form.phone ?? ''}
            onChange={(event) => setField('phone', event.target.value.replace(/\D/g, ''))}
            error={errors.phone}
          />
        </div>

        <Input
          label="Address line"
          required
          autoComplete="address-line1"
          placeholder="House/flat, street"
          value={form.address_line1}
          onChange={(event) => setField('address_line1', event.target.value)}
          error={errors.address_line1}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Area / locality"
            required
            value={form.area ?? ''}
            onChange={(event) => setField('area', event.target.value)}
            error={errors.area}
          />
          <Input
            label="City"
            required
            autoComplete="address-level2"
            value={form.city ?? ''}
            onChange={(event) => setField('city', event.target.value)}
            error={errors.city}
          />
          <Input
            label="State"
            autoComplete="address-level1"
            value={form.state ?? ''}
            onChange={(event) => setField('state', event.target.value)}
          />
          <Input
            label="Pincode"
            required
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            value={form.pincode ?? ''}
            onChange={(event) => setField('pincode', event.target.value.replace(/\D/g, ''))}
            error={errors.pincode}
          />
        </div>

        <Input
          label="Landmark"
          hint="Optional — helps the rider find you"
          placeholder="Near gate, tower, or shop"
          value={form.landmark ?? ''}
          onChange={(event) => setField('landmark', event.target.value)}
        />

        {/* GPS pin. Presented as a single action rather than raw lat/lng fields,
            which customers cannot reasonably fill in by hand. */}
        <div
          className={`flex flex-col gap-3 rounded-card border p-4 sm:flex-row sm:items-center sm:justify-between ${
            hasCoordinates ? 'border-green-200 bg-success-tint' : 'border-line bg-surface-sunken'
          }`}
        >
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-ink">
              {hasCoordinates ? 'Location pinned' : 'Pin your exact location'}
            </p>
            <p className="mt-0.5 text-sm text-ink-muted">
              {hasCoordinates
                ? 'The rider will navigate straight to you.'
                : 'A GPS pin helps the restaurant deliver faster.'}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={captureLocation}
            loading={locating}
            className="shrink-0"
          >
            <Navigation className="h-4 w-4" aria-hidden="true" />
            {hasCoordinates ? 'Update pin' : 'Use current location'}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
