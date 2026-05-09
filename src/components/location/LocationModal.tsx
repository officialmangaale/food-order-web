'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Clock, LocateFixed, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLocationStore } from '@/store/locationStore';
import { useToast } from '@/components/ui/Toast';

interface LocationModalProps {
  open: boolean;
  onClose: () => void;
}

export function LocationModal({ open, onClose }: LocationModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const requestBrowserLocation = useLocationStore((s) => s.requestBrowserLocation);
  const setManualLocation = useLocationStore((s) => s.setManualLocation);
  const label = useLocationStore((s) => s.label);
  const addressText = useLocationStore((s) => s.addressText);
  const savedArea = useLocationStore((s) => s.area ?? s.manualArea ?? '');
  const savedCity = useLocationStore((s) => s.city ?? '');
  const savedPincode = useLocationStore((s) => s.pincode ?? '');
  const savedLandmark = useLocationStore((s) => s.landmark ?? '');
  const latitude = useLocationStore((s) => s.latitude);
  const longitude = useLocationStore((s) => s.longitude);

  const [area, setArea] = useState(savedArea);
  const [city, setCity] = useState(savedCity);
  const [pincode, setPincode] = useState(savedPincode);
  const [landmark, setLandmark] = useState(savedLandmark);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  const hasRecentLocation = Boolean(label || addressText || savedArea || (latitude != null && longitude != null));

  const handleClose = useCallback(() => {
    setError('');
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleClose, open]);

  if (!open) return null;

  const refreshLocationQueries = () => {
    void queryClient.invalidateQueries({ queryKey: ['homeFeed'] });
    void queryClient.invalidateQueries({ queryKey: ['nearby'] });
    void queryClient.invalidateQueries({ queryKey: ['nearby-restaurants'] });
    void queryClient.invalidateQueries({ queryKey: ['search-restaurants'] });
    void queryClient.invalidateQueries({ queryKey: ['customer-web-categories'] });
    void queryClient.invalidateQueries({ queryKey: ['customer-web-category-items'] });
  };

  const handleCurrentLocation = async () => {
    setLocating(true);
    setError('');
    const loc = await requestBrowserLocation();
    setLocating(false);

    if (!loc) {
      setError('We could not access your location. You can still enter your address manually.');
      return;
    }

    refreshLocationQueries();
    toast('Location saved', 'success');
    handleClose();
  };

  const handleManualSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!area.trim() || !city.trim()) {
      setError('Area and city are required to save a manual location.');
      return;
    }

    setManualLocation({ area, city, pincode, landmark });
    refreshLocationQueries();
    toast('Delivery location saved', 'success');
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-[120]" role="dialog" aria-modal="true" aria-labelledby="location-modal-title">
      <button
        type="button"
        className="absolute inset-0 h-full w-full bg-black/35 backdrop-blur-[2px]"
        aria-label="Close location modal"
        onClick={handleClose}
      />
      <div className="absolute bottom-0 left-0 right-0 max-h-[92vh] overflow-y-auto rounded-t-3xl border border-[#F0DADA] bg-[#FFF7F5] shadow-2xl sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:w-[min(92vw,560px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E8DFDF] bg-[#FFF7F5]/95 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#A80F15]">
              Delivery Location
            </p>
            <h2 id="location-modal-title" className="mt-1 text-xl font-extrabold text-[#1F1A1A]">
              Choose where to deliver
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#4B3A3A] transition hover:bg-white hover:text-[#A80F15]"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <button
            type="button"
            onClick={handleCurrentLocation}
            disabled={locating}
            className="flex w-full items-center gap-4 rounded-2xl border border-[#E9CBCB] bg-white p-4 text-left shadow-[0_10px_28px_rgba(168,15,21,0.06)] transition hover:border-[#B31317] disabled:opacity-60"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF0F0] text-[#A80F15]">
              <LocateFixed className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-extrabold text-[#1F1A1A]">
                {locating ? 'Getting your location...' : 'Use current location'}
              </span>
              <span className="mt-1 block text-sm text-[#7B6B6B]">
                We will ask your browser for permission.
              </span>
            </span>
          </button>

          {hasRecentLocation && (
            <button
              type="button"
              onClick={handleClose}
              className="flex w-full items-center gap-4 rounded-2xl border border-[#E9CBCB] bg-white p-4 text-left transition hover:border-[#B31317]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF0F0] text-[#A80F15]">
                <Clock className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-extrabold text-[#1F1A1A]">Recent location</span>
                <span className="mt-1 block truncate text-sm text-[#7B6B6B]">
                  {addressText || label || 'Current location'}
                </span>
              </span>
            </button>
          )}

          <form onSubmit={handleManualSubmit} className="rounded-2xl border border-[#F0DADA] bg-white p-4 shadow-[0_10px_28px_rgba(168,15,21,0.05)]">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF0F0] text-[#A80F15]">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-[#1F1A1A]">Enter address manually</h3>
                <p className="text-sm text-[#7B6B6B]">Area and city are enough to get started.</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Area" value={area} onChange={(event) => setArea(event.target.value)} />
              <Input label="City" value={city} onChange={(event) => setCity(event.target.value)} />
              <Input
                label="Pincode (optional)"
                value={pincode}
                maxLength={6}
                onChange={(event) => setPincode(event.target.value.replace(/\D/g, ''))}
              />
              <Input
                label="Landmark (optional)"
                value={landmark}
                onChange={(event) => setLandmark(event.target.value)}
              />
            </div>

            {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <Button type="submit" fullWidth className="mt-4">
              Save location
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
