'use client';

import { useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useLocationStore } from '@/store/locationStore';
import { useToast } from '@/components/ui/Toast';
import type { DeliveryAddress } from '@/types/order';

interface Props {
  initialName?: string;
  initialPhone?: string;
  onSubmit: (address: DeliveryAddress & { name: string; phone: string }) => void;
}

export function AddressForm({ initialName, initialPhone, onSubmit }: Props) {
  const [name, setName] = useState(initialName ?? '');
  const [phone, setPhone] = useState(initialPhone ?? '');
  const [line1, setLine1] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [locCaptured, setLocCaptured] = useState(false);
  const [capturingLoc, setCapturingLoc] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reqLoc = useLocationStore((s) => s.requestBrowserLocation);
  const lat = useLocationStore((s) => s.latitude);
  const lng = useLocationStore((s) => s.longitude);
  const { toast } = useToast();

  const captureLoc = async () => {
    setCapturingLoc(true);
    const loc = await reqLoc();
    setCapturingLoc(false);
    if (loc) { setLocCaptured(true); toast('Location captured', 'success'); }
    else toast('Could not get location. Please enter address manually.', 'error');
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!phone || phone.length < 10) e.phone = 'Valid phone required';
    if (!line1.trim()) e.line1 = 'Address is required';
    if (!area.trim()) e.area = 'Area is required';
    if (!city.trim()) e.city = 'City is required';
    if (!pincode || pincode.length < 5) e.pincode = 'Valid pincode required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      name, phone,
      address_line1: line1, area, city, pincode, landmark,
      latitude: lat ?? 0, longitude: lng ?? 0,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-cherry-600" /> Delivery Address
        </h3>
        <Button variant="outline" size="sm" onClick={captureLoc} loading={capturingLoc}>
          <Navigation className="w-3.5 h-3.5" /> {locCaptured ? 'Captured ✓' : 'Use GPS'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
        <Input label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/, ''))} error={errors.phone} maxLength={10} />
      </div>
      <Input label="Address Line 1" placeholder="House/flat, street" value={line1} onChange={(e) => setLine1(e.target.value)} error={errors.line1} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Area" value={area} onChange={(e) => setArea(e.target.value)} error={errors.area} />
        <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} error={errors.city} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Pincode" type="text" maxLength={6} value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/, ''))} error={errors.pincode} />
        <Input label="Landmark (optional)" value={landmark} onChange={(e) => setLandmark(e.target.value)} />
      </div>

      {!locCaptured && !lat && (
        <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
          📍 Tap &quot;Use GPS&quot; for accurate delivery. Without GPS, restaurant may call to confirm.
        </p>
      )}

      <Button fullWidth size="lg" onClick={handleSubmit}>Confirm Address</Button>
    </div>
  );
}
