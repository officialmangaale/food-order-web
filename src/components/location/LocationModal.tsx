'use client';

import { useCallback, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Clock, LocateFixed, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
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

  const hasRecentLocation = Boolean(
    label || addressText || savedArea || (latitude != null && longitude != null)
  );

  const handleClose = useCallback(() => {
    setError('');
    onClose();
  }, [onClose]);

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
    <Sheet
      open={open}
      onClose={handleClose}
      title="Choose where to deliver"
      description="We use this to show restaurants that deliver to you."
      size="md"
    >
      <div className="space-y-4">
        <LocationOption
          dataInitialFocus
          icon={<LocateFixed className="h-5 w-5" aria-hidden="true" />}
          title={locating ? 'Getting your location...' : 'Use current location'}
          description="We will ask your browser for permission."
          disabled={locating}
          onClick={handleCurrentLocation}
        />

        {hasRecentLocation && (
          <LocationOption
            icon={<Clock className="h-5 w-5" aria-hidden="true" />}
            title="Recent location"
            description={addressText || label || 'Current location'}
            onClick={handleClose}
          />
        )}

        <form
          onSubmit={handleManualSubmit}
          className="rounded-card border border-line bg-surface p-4"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-800">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-ink">Enter address manually</h3>
              <p className="text-sm text-ink-muted">Area and city are enough to get started.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Area" value={area} onChange={(event) => setArea(event.target.value)} required />
            <Input label="City" value={city} onChange={(event) => setCity(event.target.value)} required />
            <Input
              label="Pincode"
              hint="Optional"
              value={pincode}
              maxLength={6}
              inputMode="numeric"
              onChange={(event) => setPincode(event.target.value.replace(/\D/g, ''))}
            />
            <Input
              label="Landmark"
              hint="Optional"
              value={landmark}
              onChange={(event) => setLandmark(event.target.value)}
            />
          </div>

          {error && (
            <p
              role="alert"
              className="mt-3 rounded-control bg-danger-tint px-3 py-2 text-sm font-semibold text-danger"
            >
              {error}
            </p>
          )}

          <Button type="submit" fullWidth className="mt-4">
            Save location
          </Button>
        </form>
      </div>
    </Sheet>
  );
}

interface LocationOptionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  dataInitialFocus?: boolean;
}

function LocationOption({
  icon,
  title,
  description,
  onClick,
  disabled,
  dataInitialFocus,
}: LocationOptionProps) {
  return (
    <button
      type="button"
      data-dialog-initial-focus={dataInitialFocus ? '' : undefined}
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-4 rounded-card border border-line bg-surface p-4 text-left transition-colors hover:border-brand-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25 disabled:opacity-60"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-800">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold text-ink">{title}</span>
        <span className="mt-0.5 block truncate text-sm text-ink-muted">{description}</span>
      </span>
    </button>
  );
}
