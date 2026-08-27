'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Edit3, MapPin, Navigation, Plus, Star, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { PanelSkeleton } from '@/components/ui/Skeleton';
import { ProfilePageLayout } from '@/components/profile/ProfilePageLayout';
import { ProfileRouteGuard } from '@/components/profile/ProfileRouteGuard';
import { getErrorMessage, isAuthError } from '@/services/http';
import {
  createAddress,
  deleteAddress,
  getAddresses,
  updateAddress,
  type CustomerAddress,
  type CustomerAddressPayload,
} from '@/services/profileApi';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';

export function ProfileAddressesPage() {
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const [localAddresses, setLocalAddresses] = useState<CustomerAddress[] | null>(null);
  const [modalAddress, setModalAddress] = useState<CustomerAddress | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [savingId, setSavingId] = useState<string | number | null>(null);
  const [notice, setNotice] = useState('');

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['profile-addresses', token],
    queryFn: () => getAddresses(token as string),
    enabled: Boolean(isAuthenticated && token),
    retry: (failureCount, err) => !isAuthError(err) && failureCount < 1,
  });

  useEffect(() => {
    if (error && isAuthError(error)) logout();
  }, [error, logout]);

  const addresses = localAddresses ?? data ?? [];

  const openAddModal = () => {
    setModalAddress(null);
    setModalOpen(true);
  };

  const handleSave = async (payload: CustomerAddressPayload, editingAddress?: CustomerAddress | null) => {
    if (!token) return;
    setNotice('');
    const fallbackAddress = toAddress(payload, editingAddress?.id ?? `local-${Date.now()}`);

    try {
      const saved = editingAddress
        ? await updateAddress(token, editingAddress.id, payload)
        : await createAddress(token, payload);
      setLocalAddresses((current) => upsertAddress(current ?? data ?? [], saved));
      setModalOpen(false);
      setModalAddress(null);
      void refetch();
    } catch (err) {
      if (isAuthError(err)) {
        logout();
        return;
      }

      setLocalAddresses((current) => upsertAddress(current ?? data ?? [], fallbackAddress));
      setNotice('Address saved locally because the address service is unavailable.');
      setModalOpen(false);
      setModalAddress(null);
    }
  };

  const handleDelete = async (address: CustomerAddress) => {
    if (!token) return;
    setSavingId(address.id);
    setNotice('');

    try {
      if (!String(address.id).startsWith('local-')) {
        await deleteAddress(token, address.id);
      }
      setLocalAddresses((current) => (current ?? data ?? []).filter((item) => item.id !== address.id));
      void refetch();
    } catch (err) {
      if (isAuthError(err)) {
        logout();
        return;
      }
      setLocalAddresses((current) => (current ?? data ?? []).filter((item) => item.id !== address.id));
      setNotice('Address removed locally. The address service could not be reached.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <ProfileRouteGuard>
      <ProfilePageLayout title="Saved addresses">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm leading-6 text-ink-muted">
              Keep your delivery details ready for faster checkout.
            </p>
            {notice && (
              <p className="mt-2 rounded-control bg-warning-tint px-3 py-2 text-sm font-semibold text-warning">
                {notice}
              </p>
            )}
            {error && !isAuthError(error) && (
              <p className="mt-2 rounded-control bg-warning-tint px-3 py-2 text-sm font-semibold text-warning">
                Address service is unavailable right now. You can still add an address locally.
              </p>
            )}
          </div>
          <Button onClick={openAddModal} className="shrink-0">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add address
          </Button>
        </div>

        {isLoading ? (
          <AddressesSkeleton />
        ) : addresses.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {addresses.map((address) => (
              <AddressCard
                key={String(address.id)}
                address={address}
                deleting={savingId === address.id}
                onEdit={() => {
                  setModalAddress(address);
                  setModalOpen(true);
                }}
                onDelete={() => void handleDelete(address)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="location"
            title="No saved addresses"
            description="Add your home, work, or favourite delivery location."
            actionLabel="Add address"
            onAction={openAddModal}
          />
        )}

        <AddressModal
          key={modalAddress ? String(modalAddress.id) : 'new'}
          open={modalOpen}
          address={modalAddress}
          onClose={() => {
            setModalOpen(false);
            setModalAddress(null);
          }}
          onSave={handleSave}
        />
      </ProfilePageLayout>
    </ProfileRouteGuard>
  );
}

function AddressCard({
  address,
  deleting,
  onEdit,
  onDelete,
}: {
  address: CustomerAddress;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card as="article">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-800">
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-extrabold text-ink">{address.label || 'Address'}</h2>
              {address.is_default && (
                <Badge variant="brand" size="sm" icon={<Star className="h-3 w-3 fill-current" aria-hidden="true" />}>
                  Default
                </Badge>
              )}
            </div>
            {(address.name || address.phone) && (
              <p className="mt-1 text-sm font-semibold text-ink-muted">
                {[address.name, address.phone].filter(Boolean).join(' · ')}
              </p>
            )}
            <p className="mt-3 text-sm leading-6 text-ink-muted">
              {address.address_line1}
              {(address.area || address.city || address.pincode) && (
                <>
                  <br />
                  {[address.area, address.city, address.pincode].filter(Boolean).join(', ')}
                </>
              )}
              {address.state && (
                <>
                  <br />
                  {address.state}
                </>
              )}
              {address.landmark && (
                <>
                  <br />
                  Landmark: {address.landmark}
                </>
              )}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit3 className="h-4 w-4" aria-hidden="true" />
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} loading={deleting}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Delete
        </Button>
      </div>
    </Card>
  );
}

interface AddressModalProps {
  open: boolean;
  address: CustomerAddress | null;
  onClose: () => void;
  onSave: (payload: CustomerAddressPayload, editingAddress?: CustomerAddress | null) => Promise<void>;
}

function AddressModal({ open, address, onClose, onSave }: AddressModalProps) {
  const requestBrowserLocation = useLocationStore((s) => s.requestBrowserLocation);
  const [form, setForm] = useState<CustomerAddressPayload>({
    label: address?.label ?? '',
    name: address?.name ?? '',
    phone: address?.phone ?? '',
    address_line1: address?.address_line1 ?? '',
    area: address?.area ?? '',
    city: address?.city ?? '',
    state: address?.state ?? '',
    pincode: address?.pincode ?? '',
    landmark: address?.landmark ?? '',
    latitude: address?.latitude,
    longitude: address?.longitude,
    is_default: Boolean(address?.is_default),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [saveError, setSaveError] = useState('');
  const hasCoordinates = form.latitude != null && form.longitude != null;

  const setField = (field: keyof CustomerAddressPayload, value: string | boolean | number | undefined) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const captureLocation = async () => {
    setLocating(true);
    const location = await requestBrowserLocation();
    setLocating(false);
    if (location) {
      setForm((current) => ({ ...current, latitude: location.lat, longitude: location.lng }));
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.address_line1?.trim()) nextErrors.address_line1 = 'Address line is required';
    if (!form.area?.trim()) nextErrors.area = 'Area is required';
    if (!form.city?.trim()) nextErrors.city = 'City is required';
    if (form.phone && form.phone.replace(/\D/g, '').length < 10) nextErrors.phone = 'Enter a valid phone number';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setSaveError('');
    try {
      await onSave(
        {
          ...form,
          label: form.label?.trim() || 'Address',
          name: form.name?.trim() || undefined,
          phone: form.phone?.trim() || undefined,
          address_line1: form.address_line1.trim(),
          area: form.area?.trim(),
          city: form.city?.trim(),
          state: form.state?.trim(),
          pincode: form.pincode?.trim(),
          landmark: form.landmark?.trim(),
        },
        address
      );
    } catch (err) {
      setSaveError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={address ? 'Edit address' : 'Add new address'}
      description="Used to route your orders to the right place."
      size="lg"
      footer={
        <Button type="submit" form="profile-address-form" fullWidth size="lg" loading={saving}>
          Save address
        </Button>
      }
    >
      <form id="profile-address-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input data-dialog-initial-focus label="Label" value={form.label ?? ''} onChange={(event) => setField('label', event.target.value)} />
            <Input label="Name" value={form.name ?? ''} onChange={(event) => setField('name', event.target.value)} />
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
            />
          </div>

          <Input
            label="Address Line 1"
            value={form.address_line1}
            onChange={(event) => setField('address_line1', event.target.value)}
            error={errors.address_line1}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Area" value={form.area ?? ''} onChange={(event) => setField('area', event.target.value)} error={errors.area} />
            <Input label="City" value={form.city ?? ''} onChange={(event) => setField('city', event.target.value)} error={errors.city} />
            <Input label="State" value={form.state ?? ''} onChange={(event) => setField('state', event.target.value)} />
          </div>

          <Input
            label="Landmark"
            value={form.landmark ?? ''}
            onChange={(event) => setField('landmark', event.target.value)}
          />

          {/* GPS pin, presented as one action rather than raw lat/lng inputs. */}
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

          <label className="flex min-h-12 items-center gap-3 rounded-control border border-line bg-surface px-4 text-sm font-bold text-ink">
            <input
              type="checkbox"
              checked={Boolean(form.is_default)}
              onChange={(event) => setField('is_default', event.target.checked)}
              className="h-4 w-4 shrink-0"
            />
            Set as default address
          </label>

          {saveError && (
            <p
              role="alert"
              className="rounded-control bg-danger-tint px-3 py-2 text-sm font-semibold text-danger"
            >
              {saveError}
            </p>
          )}
      </form>
    </Sheet>
  );
}

function AddressesSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <PanelSkeleton className="h-56" />
      <PanelSkeleton className="h-56" />
      <PanelSkeleton className="h-56" />
    </div>
  );
}

function upsertAddress(current: CustomerAddress[], nextAddress: CustomerAddress) {
  const withoutExisting = current.filter((address) => address.id !== nextAddress.id);
  const normalized = nextAddress.is_default
    ? withoutExisting.map((address) => ({ ...address, is_default: false }))
    : withoutExisting;
  return [nextAddress, ...normalized];
}

function toAddress(payload: CustomerAddressPayload, id: string | number): CustomerAddress {
  return {
    id,
    label: payload.label,
    name: payload.name,
    phone: payload.phone,
    address_line1: payload.address_line1,
    area: payload.area,
    city: payload.city,
    state: payload.state,
    pincode: payload.pincode,
    landmark: payload.landmark,
    latitude: payload.latitude,
    longitude: payload.longitude,
    is_default: payload.is_default,
  };
}

