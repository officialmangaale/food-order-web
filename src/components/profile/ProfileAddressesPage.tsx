'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Edit3, MapPin, Navigation, Plus, Star, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
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
      <ProfilePageLayout title="Saved Addresses">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm leading-6 text-[#6B5B5B]">
              Keep your delivery details ready for faster checkout.
            </p>
            {notice && <p className="mt-2 text-sm font-semibold text-amber-700">{notice}</p>}
            {error && !isAuthError(error) && (
              <p className="mt-2 text-sm font-semibold text-[#A80F15]">
                Address service is unavailable right now. You can still add an address locally.
              </p>
            )}
          </div>
          <Button className="bg-[#A80F15] hover:bg-[#8F0D12]" onClick={openAddModal}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add New Address
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
          <div className="rounded-2xl border border-[#F0DADA] bg-white shadow-card">
            <EmptyState
              icon="search"
              title="No saved addresses"
              description="Add your home, work, or favorite delivery location."
              actionLabel="Add New Address"
              onAction={openAddModal}
            />
          </div>
        )}

        {modalOpen && (
          <AddressModal
            address={modalAddress}
            onClose={() => {
              setModalOpen(false);
              setModalAddress(null);
            }}
            onSave={handleSave}
          />
        )}
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
    <article className="rounded-2xl border border-[#F0DADA] bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF0F0] text-[#A80F15]">
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-extrabold text-[#1F1A1A]">{address.label || 'Address'}</h2>
              {address.is_default && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F8D6D2] px-2.5 py-1 text-xs font-bold text-[#A80F15]">
                  <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                  Default
                </span>
              )}
            </div>
            {(address.name || address.phone) && (
              <p className="mt-1 text-sm font-semibold text-[#6B5B5B]">
                {[address.name, address.phone].filter(Boolean).join(' - ')}
              </p>
            )}
            <p className="mt-3 text-sm leading-6 text-[#2B2020]">
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
        <Button
          variant="outline"
          size="sm"
          className="border-[#E7B8B3] text-[#A80F15] hover:bg-[#FFF0F0]"
          onClick={onEdit}
        >
          <Edit3 className="h-4 w-4" aria-hidden="true" />
          Edit
        </Button>
        <Button variant="ghost" size="sm" className="text-red-700 hover:bg-red-50" onClick={onDelete} loading={deleting}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Delete
        </Button>
      </div>
    </article>
  );
}

interface AddressModalProps {
  address: CustomerAddress | null;
  onClose: () => void;
  onSave: (payload: CustomerAddressPayload, editingAddress?: CustomerAddress | null) => Promise<void>;
}

function AddressModal({ address, onClose, onSave }: AddressModalProps) {
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

  const setField = (field: keyof CustomerAddressPayload, value: string | boolean | number | undefined) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const captureLocation = async () => {
    setLocating(true);
    const location = await requestBrowserLocation();
    setLocating(false);
    if (location) {
      setField('latitude', location.lat);
      setField('longitude', location.lng);
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
    <div className="fixed inset-0 z-[130]" role="dialog" aria-modal="true" aria-labelledby="address-modal-title">
      <button
        type="button"
        className="absolute inset-0 h-full w-full bg-black/35 backdrop-blur-[2px]"
        aria-label="Close address form"
        onClick={onClose}
      />
      <div className="absolute bottom-0 left-0 right-0 max-h-[92vh] overflow-y-auto rounded-t-3xl border border-[#F0DADA] bg-[#FFF7F5] shadow-2xl sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:w-[min(94vw,680px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E8DFDF] bg-[#FFF7F5] px-5 py-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#A80F15]">Delivery</p>
            <h2 id="address-modal-title" className="mt-1 text-xl font-extrabold text-[#1F1A1A]">
              {address ? 'Edit address' : 'Add new address'}
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

          <label className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#2B2020]">
            <input
              type="checkbox"
              checked={Boolean(form.is_default)}
              onChange={(event) => setField('is_default', event.target.checked)}
              className="h-4 w-4 accent-[#A80F15]"
            />
            Set as default address
          </label>

          {saveError && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{saveError}</p>}
          <Button type="submit" fullWidth loading={saving} className="bg-[#A80F15] hover:bg-[#8F0D12]">
            Save address
          </Button>
        </form>
      </div>
    </div>
  );
}

function AddressesSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Skeleton className="h-56 rounded-2xl" />
      <Skeleton className="h-56 rounded-2xl" />
      <Skeleton className="h-56 rounded-2xl" />
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

function parseOptionalNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
