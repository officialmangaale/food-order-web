'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Clock, LocateFixed, MapPin, Navigation, ShoppingBasket, Store } from 'lucide-react';
import { LocationModal } from '@/components/location/LocationModal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useHasMounted } from '@/hooks/useHasMounted';
import { fetchGroceryMerchants } from '@/services/groceryApi';
import { useLocationStore } from '@/store/locationStore';
import { formatMoney } from '@/utils/money';
import type { GroceryMerchant } from '@/types/grocery';

const RASAN_RADIUS_KM = 7;

export function RasanHomePage() {
  const hasMounted = useHasMounted();
  const [locationOpen, setLocationOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const latitude = useLocationStore((state) => state.latitude);
  const longitude = useLocationStore((state) => state.longitude);
  const requestBrowserLocation = useLocationStore((state) => state.requestBrowserLocation);
  const hasLocation = latitude != null && longitude != null;

  const merchantsQuery = useQuery({
    queryKey: ['grocery-merchants', latitude, longitude, RASAN_RADIUS_KM],
    queryFn: () =>
      fetchGroceryMerchants({
        lat: latitude as number,
        lng: longitude as number,
        radiusKm: RASAN_RADIUS_KM,
      }),
    enabled: hasLocation,
    retry: 1,
  });

  const merchants = merchantsQuery.data ?? [];

  const handleUseCurrentLocation = async () => {
    setCapturing(true);
    await requestBrowserLocation();
    setCapturing(false);
  };

  if (!hasMounted) return <RasanHomeSkeleton />;

  return (
    <main className="min-h-screen bg-[#F7FBF4] pb-16">
      <section className="border-b border-[#DCE8D4] bg-[#F9FCF7]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#5E7D2B]">Mangaale Rasan</p>
            <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-normal text-[#1C2616] sm:text-5xl">
              Daily essentials nearby
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#526147]">
              Groceries from Mangaale Rasan and registered kirana stores around your delivery location.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setLocationOpen(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#C9DDBA] bg-white px-5 text-sm font-extrabold text-[#2F4A1B] shadow-sm transition hover:border-[#8BAE65] hover:bg-[#F3FAEF]"
          >
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Change location
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" aria-labelledby="rasan-merchants-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="rasan-merchants-heading" className="text-2xl font-extrabold text-[#1C2616]">
              Grocery stores
            </h2>
            <p className="mt-1 text-sm font-medium text-[#66745E]">Within {RASAN_RADIUS_KM} km of your location</p>
          </div>
        </div>

        {!hasLocation ? (
          <RasanLocationPrompt
            capturing={capturing}
            onUseCurrentLocation={handleUseCurrentLocation}
            onChooseLocation={() => setLocationOpen(true)}
          />
        ) : merchantsQuery.isLoading ? (
          <MerchantGridSkeleton />
        ) : merchantsQuery.error ? (
          <RasanError onRetry={() => merchantsQuery.refetch()} />
        ) : merchants.length === 0 ? (
          <RasanEmpty onChangeLocation={() => setLocationOpen(true)} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {merchants.map((merchant) => (
              <GroceryMerchantCard key={merchant.id} merchant={merchant} />
            ))}
          </div>
        )}
      </section>

      <LocationModal open={locationOpen} onClose={() => setLocationOpen(false)} />
    </main>
  );
}

function GroceryMerchantCard({ merchant }: { merchant: GroceryMerchant }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = merchant.banner_url || merchant.logo_url;
  const canShowImage = Boolean(imageUrl && !imageFailed);
  const deliveryFee =
    merchant.delivery_fee != null && merchant.delivery_fee > 0
      ? formatMoney(merchant.delivery_fee)
      : 'Free delivery';

  return (
    <Link
      href={`/rasan/merchants/${merchant.id}`}
      className="group block h-full overflow-hidden rounded-2xl border border-[#DCE8D4] bg-white shadow-[0_14px_34px_rgba(47,74,27,0.08)] transition hover:-translate-y-0.5 hover:border-[#BBD4A8] hover:shadow-[0_18px_44px_rgba(47,74,27,0.12)] focus:outline-none focus:ring-4 focus:ring-[#6F9C3C]/15"
    >
      <article className="flex h-full flex-col overflow-hidden">
        <div className="relative h-40 bg-[#EEF7E8]">
          {canShowImage ? (
            <img
              src={imageUrl}
              alt={merchant.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#E8F6D7_0%,#9BC46D_52%,#F9FCF7_100%)] text-[#2F4A1B]">
              <ShoppingBasket className="h-14 w-14" aria-hidden="true" />
            </div>
          )}
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-extrabold ${
              merchant.is_open === false
                ? 'bg-white text-[#7B5D1C]'
                : 'bg-[#2F6B1F] text-white'
            }`}
          >
            {merchant.is_open === false ? 'Closed' : 'Open'}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h3 className="text-xl font-extrabold leading-snug text-[#1C2616]">{merchant.name}</h3>
          <p className="mt-1 text-sm font-semibold text-[#66745E]">Daily essentials</p>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-[#53614B]">
            {merchant.distance && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {merchant.distance}
              </span>
            )}
            {merchant.delivery_time && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" aria-hidden="true" />
                {merchant.delivery_time}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Store className="h-4 w-4" aria-hidden="true" />
              {deliveryFee}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function RasanLocationPrompt({
  capturing,
  onUseCurrentLocation,
  onChooseLocation,
}: {
  capturing: boolean;
  onUseCurrentLocation: () => void;
  onChooseLocation: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[#DCE8D4] bg-white px-5 py-6 shadow-[0_12px_30px_rgba(47,74,27,0.06)]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEF7E8] text-[#3F7226]">
            <LocateFixed className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-lg font-extrabold text-[#1C2616]">Set delivery location</h3>
            <p className="mt-1 max-w-xl text-sm leading-6 text-[#66745E]">
              We need your latitude and longitude to show grocery delivery available near you.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onChooseLocation}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#C9DDBA] bg-white px-5 text-sm font-extrabold text-[#2F4A1B] transition hover:bg-[#F3FAEF]"
          >
            Choose location
          </button>
          <button
            type="button"
            onClick={onUseCurrentLocation}
            disabled={capturing}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#2F6B1F] px-5 text-sm font-extrabold text-white transition hover:bg-[#265719] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Navigation className="h-4 w-4" aria-hidden="true" />
            {capturing ? 'Locating...' : 'Use GPS'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RasanEmpty({ onChangeLocation }: { onChangeLocation: () => void }) {
  return (
    <div className="rounded-2xl border border-[#DCE8D4] bg-white px-6 py-10 text-center shadow-[0_12px_30px_rgba(47,74,27,0.06)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF7E8] text-[#3F7226]">
        <ShoppingBasket className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="mt-5 text-xl font-extrabold text-[#1C2616]">No grocery delivery available near you yet.</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#66745E]">Try another nearby delivery location.</p>
      <button
        type="button"
        onClick={onChangeLocation}
        className="mt-5 rounded-full bg-[#2F6B1F] px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#265719]"
      >
        Change location
      </button>
    </div>
  );
}

function RasanError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-white px-5 py-6 shadow-[0_12px_30px_rgba(47,74,27,0.06)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-extrabold text-[#1C2616]">Could not load grocery stores</h3>
            <p className="mt-1 text-sm text-[#66745E]">Please try again in a moment.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-[#2F6B1F] px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#265719]"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function MerchantGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div key={item} className="overflow-hidden rounded-2xl border border-[#DCE8D4] bg-white">
          <Skeleton className="h-40 rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function RasanHomeSkeleton() {
  return (
    <main className="min-h-screen bg-[#F7FBF4]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="mt-4 h-5 w-96 max-w-full" />
        <div className="mt-8">
          <MerchantGridSkeleton />
        </div>
      </div>
    </main>
  );
}
