'use client';

import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { Map, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { webMapsConfig } from '@/config/maps';
import {
  resolveAddressPlace,
  reverseGeocodeAddress,
  searchAddressPlaces,
  type AddressPlaceSuggestion,
  type CustomerAddressPayload,
  type ResolvedCustomerLocation,
} from '@/services/profileApi';

interface AddressLocationToolsProps {
  token: string | null;
  form: CustomerAddressPayload;
  disabled?: boolean;
  onChange: (patch: Partial<CustomerAddressPayload>) => void;
}

const MIN_QUERY = 3;
const SEARCH_DEBOUNCE_MS = 350;

export function AddressLocationTools({ token, form, disabled, onChange }: AddressLocationToolsProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AddressPlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [mapOpen, setMapOpen] = useState(false);
  const sessionRef = useRef<string>('');
  const searchAbortRef = useRef<AbortController | null>(null);

  const placesEnabled = Boolean(token && webMapsConfig.placesEnabled);
  const hasCoordinates = form.latitude != null && form.longitude != null;
  const mapAvailable = Boolean(
    token &&
      webMapsConfig.enabled &&
      webMapsConfig.keyConfigured &&
      webMapsConfig.pickerEnabled &&
      webMapsConfig.browserKey
  );

  useEffect(() => {
    if (!placesEnabled || query.trim().length < MIN_QUERY) {
      searchAbortRef.current?.abort();
      setSuggestions([]);
      setSearching(false);
      setError('');
      return;
    }
    if (!sessionRef.current) sessionRef.current = newSessionToken();
    const controller = new AbortController();
    searchAbortRef.current?.abort();
    searchAbortRef.current = controller;
    const timer = window.setTimeout(() => {
      setSearching(true);
      setError('');
      void searchAddressPlaces(
        token as string,
        {
          query: query.trim(),
          session_token: sessionRef.current,
          ...(hasCoordinates
            ? { bias: { latitude: form.latitude as number, longitude: form.longitude as number } }
            : {}),
        },
        controller.signal
      )
        .then((items) => {
          if (controller.signal.aborted) return;
          setSuggestions(items);
          setError(items.length ? '' : 'No matching places found.');
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setSuggestions([]);
          setError('Search is unavailable. You can enter the address manually.');
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [form.latitude, form.longitude, hasCoordinates, placesEnabled, query, token]);

  const selectSuggestion = async (suggestion: AddressPlaceSuggestion) => {
    if (!token) return;
    const sessionToken = sessionRef.current || newSessionToken();
    setSearching(true);
    setError('');
    try {
      const resolved = await resolveAddressPlace(
        token,
        { place_id: suggestion.place_id, session_token: sessionToken },
        searchAbortRef.current?.signal
      );
      applyResolved(form, resolved, onChange, true);
      setQuery(suggestion.full_text || suggestion.primary_text);
      setSuggestions([]);
      sessionRef.current = '';
      if (mapAvailable && resolved.latitude != null && resolved.longitude != null) {
        setMapOpen(true);
      }
    } catch {
      setError('Could not use that place. Try another result or enter it manually.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-3">
      {placesEnabled && (
        <div>
          <Input
            label="Search address"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            disabled={disabled}
            leftIcon={<Search className="h-4 w-4" aria-hidden="true" />}
            rightSlot={searching ? <span className="block h-4 w-4 animate-spin rounded-full border-2 border-brand-700 border-t-transparent" /> : undefined}
          />
          {error && <p className="mt-1.5 text-sm font-semibold text-warning">{error}</p>}
          {suggestions.length > 0 && (
            <div className="mt-2 overflow-hidden rounded-control border border-line-strong bg-surface">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.place_id}
                  type="button"
                  onClick={() => void selectSuggestion(suggestion)}
                  className="flex w-full items-start gap-3 border-b border-line px-3 py-3 text-left last:border-b-0 hover:bg-surface-sunken"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-sm font-extrabold text-ink">{suggestion.primary_text}</span>
                    {suggestion.secondary_text && (
                      <span className="block truncate text-xs font-semibold text-ink-muted">
                        {suggestion.secondary_text}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {mapAvailable && hasCoordinates && (
        <Button type="button" variant="outline" size="sm" onClick={() => setMapOpen(true)} disabled={disabled}>
          <Map className="h-4 w-4" aria-hidden="true" />
          Adjust on map
        </Button>
      )}

      {mapOpen && token && form.latitude != null && form.longitude != null && (
        <AddressMapPicker
          token={token}
          latitude={form.latitude}
          longitude={form.longitude}
          onClose={() => setMapOpen(false)}
          onConfirm={(result) => {
            onChange({ latitude: result.latitude, longitude: result.longitude });
            if (result.resolved) applyResolved(form, result.resolved, onChange, false);
            setMapOpen(false);
          }}
        />
      )}
    </div>
  );
}

interface AddressMapPickerProps {
  token: string;
  latitude: number;
  longitude: number;
  onClose: () => void;
  onConfirm: (result: { latitude: number; longitude: number; resolved?: ResolvedCustomerLocation }) => void;
}

function AddressMapPicker({ token, latitude, longitude, onClose, onConfirm }: AddressMapPickerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const selectedRef = useRef({ latitude, longitude });
  const reverseSeq = useRef(0);
  const reverseTimer = useRef<number | null>(null);
  const [resolved, setResolved] = useState<ResolvedCustomerLocation | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let disposed = false;
    let idleListener: { remove: () => void } | undefined;
    void loadGoogleMaps().then((google) => {
      if (disposed || !mapRef.current) return;
      const center = { lat: latitude, lng: longitude };
      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom: 17,
        disableDefaultUI: true,
        zoomControl: true,
      });
      idleListener = map.addListener('idle', () => {
        const center = map.getCenter();
        if (!center) return;
        selectedRef.current = { latitude: center.lat(), longitude: center.lng() };
        if (reverseTimer.current) window.clearTimeout(reverseTimer.current);
        reverseTimer.current = window.setTimeout(() => {
          void reverseSelected(token, selectedRef.current, reverseSeq, setLoading, setError, setResolved);
        }, 650);
      });
      void reverseSelected(token, selectedRef.current, reverseSeq, setLoading, setError, setResolved);
    }).catch(() => setError('Map could not load. You can still use the current pin.'));
    return () => {
      disposed = true;
      idleListener?.remove();
      if (reverseTimer.current) window.clearTimeout(reverseTimer.current);
    };
  }, [latitude, longitude, token]);

  return (
    <Sheet open onClose={onClose} title="Confirm location" size="lg">
      <div className="space-y-4">
        <div className="relative h-[420px] overflow-hidden rounded-card border border-line bg-surface-sunken">
          <div ref={mapRef} className="h-full w-full" />
          <MapPin className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-full fill-danger text-danger" aria-hidden="true" />
        </div>
        {loading && <div className="h-1 overflow-hidden rounded-full bg-brand-50"><div className="h-full w-1/2 animate-pulse bg-brand-700" /></div>}
        <p className="text-sm font-semibold text-ink-muted">
          {resolved?.formatted_address || resolved?.address_line1 || 'Pin selected. Add address details manually if needed.'}
        </p>
        {error && <p className="text-sm font-semibold text-warning">{error}</p>}
        <Button
          type="button"
          fullWidth
          onClick={() => onConfirm({ ...selectedRef.current, resolved })}
        >
          Confirm location
        </Button>
      </div>
    </Sheet>
  );
}

async function reverseSelected(
  token: string,
  coordinate: { latitude: number; longitude: number },
  seqRef: MutableRefObject<number>,
  setLoading: (value: boolean) => void,
  setError: (value: string) => void,
  setResolved: (value: ResolvedCustomerLocation | undefined) => void
) {
  const seq = ++seqRef.current;
  setLoading(true);
  setError('');
  try {
    const result = await reverseGeocodeAddress(token, coordinate);
    if (seq !== seqRef.current) return;
    setResolved(result);
  } catch {
    if (seq !== seqRef.current) return;
    setError('Address lookup failed. You can still confirm this pin.');
  } finally {
    if (seq === seqRef.current) setLoading(false);
  }
}

function applyResolved(
  current: CustomerAddressPayload,
  resolved: ResolvedCustomerLocation,
  onChange: (patch: Partial<CustomerAddressPayload>) => void,
  includeCoordinates: boolean
) {
  onChange({
    ...(includeCoordinates && resolved.latitude != null && resolved.longitude != null
      ? { latitude: resolved.latitude, longitude: resolved.longitude }
      : {}),
    ...(!current.address_line1?.trim() && resolved.address_line1 ? { address_line1: resolved.address_line1 } : {}),
    ...(!current.area?.trim() && resolved.area ? { area: resolved.area } : {}),
    ...(!current.city?.trim() && resolved.city ? { city: resolved.city } : {}),
    ...(!current.state?.trim() && resolved.state ? { state: resolved.state } : {}),
    ...(!current.pincode?.trim() && resolved.pincode ? { pincode: resolved.pincode } : {}),
  });
}

function newSessionToken() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

let mapsPromise: Promise<any> | null = null;

function loadGoogleMaps(): Promise<any> {
  const existing = (window as any).google?.maps;
  if (existing) return Promise.resolve((window as any).google);
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(webMapsConfig.browserKey)}`;
    script.async = true;
    script.onload = () => resolve((window as any).google);
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return mapsPromise;
}
