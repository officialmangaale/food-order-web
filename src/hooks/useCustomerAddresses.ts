'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  createAddress,
  getAddresses,
  type CustomerAddress,
  type CustomerAddressPayload,
} from '@/services/profileApi';
import { isAuthError } from '@/services/http';

const LOCAL_ADDRESSES_KEY = 'mangaale-checkout-addresses';

export function useCustomerAddresses(token: string | null, enabled: boolean) {
  const [localAddresses, setLocalAddresses] = useState<CustomerAddress[]>(readLocalAddresses);
  const [notice, setNotice] = useState('');

  const query = useQuery({
    queryKey: ['checkout-addresses', token],
    queryFn: () => getAddresses(token as string),
    enabled: Boolean(enabled && token),
    retry: (failureCount, error) => !isAuthError(error) && failureCount < 1,
  });

  const addresses = useMemo(
    () => mergeAddresses(query.data ?? [], localAddresses),
    [localAddresses, query.data]
  );
  const refetchAddresses = query.refetch;

  const saveAddress = useCallback(
    async (payload: CustomerAddressPayload) => {
      setNotice('');
      const fallback = payloadToAddress(payload, `local-${Date.now()}`);

      try {
        if (!token) throw new Error('Address service unavailable.');
        const saved = await createAddress(token, payload);
        setLocalAddresses((current) => persistLocalAddresses(upsertAddress(current, saved)));
        void refetchAddresses();
        return saved;
      } catch (error) {
        if (isAuthError(error)) throw error;
        setNotice('Address saved locally because the address service is unavailable.');
        setLocalAddresses((current) => persistLocalAddresses(upsertAddress(current, fallback)));
        return fallback;
      }
    },
    [refetchAddresses, token]
  );

  return {
    addresses,
    isLoading: query.isLoading,
    error: query.error,
    notice: notice || (query.error && !isAuthError(query.error) ? 'Address service is unavailable. You can still add an address locally.' : ''),
    saveAddress,
    refetch: refetchAddresses,
  };
}

function mergeAddresses(primary: CustomerAddress[], local: CustomerAddress[]) {
  const seen = new Set<string>();
  const merged: CustomerAddress[] = [];

  for (const address of [...local, ...primary]) {
    const key = String(address.id);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(address);
  }

  return merged.sort((a, b) => Number(Boolean(b.is_default)) - Number(Boolean(a.is_default)));
}

function upsertAddress(current: CustomerAddress[], next: CustomerAddress) {
  const existing = current.filter((address) => String(address.id) !== String(next.id));
  const normalized = next.is_default
    ? existing.map((address) => ({ ...address, is_default: false }))
    : existing;
  return [next, ...normalized];
}

function payloadToAddress(payload: CustomerAddressPayload, id: string): CustomerAddress {
  return {
    id,
    label: payload.label || 'Home',
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

function readLocalAddresses() {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(LOCAL_ADDRESSES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CustomerAddress[]) : [];
  } catch {
    return [];
  }
}

function persistLocalAddresses(addresses: CustomerAddress[]) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LOCAL_ADDRESSES_KEY, JSON.stringify(addresses));
  }
  return addresses;
}
