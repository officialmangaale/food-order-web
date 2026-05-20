'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Minus, Plus, ShoppingBasket, Trash2 } from 'lucide-react';
import { LocationModal } from '@/components/location/LocationModal';
import {
  buildGroceryCartValidatePayload,
  getGroceryValidationMessage,
} from '@/components/rasan/groceryCartUtils';
import { Skeleton } from '@/components/ui/Skeleton';
import { useHasMounted } from '@/hooks/useHasMounted';
import { getErrorMessage } from '@/services/http';
import { validateGroceryCart } from '@/services/groceryApi';
import { useGroceryCartStore } from '@/store/groceryCartStore';
import { useLocationStore } from '@/store/locationStore';
import { formatMoney } from '@/utils/money';
import type { GroceryCartItem, GroceryCartTotals } from '@/types/grocery';

const EMPTY_TOTALS: GroceryCartTotals = {
  subtotal: 0,
  delivery_fee: 0,
  grand_total: 0,
};

export function RasanCartPage() {
  const hasMounted = useHasMounted();
  const [locationOpen, setLocationOpen] = useState(false);
  const merchantId = useGroceryCartStore((state) => state.groceryMerchantId);
  const merchantName = useGroceryCartStore((state) => state.merchantName);
  const items = useGroceryCartStore((state) => state.items);
  const updateQuantity = useGroceryCartStore((state) => state.updateQuantity);
  const removeItem = useGroceryCartStore((state) => state.removeItem);
  const clearCart = useGroceryCartStore((state) => state.clearCart);
  const setValidatedTotals = useGroceryCartStore((state) => state.setValidatedTotals);
  const estimatedSubtotal = useGroceryCartStore((state) => state.estimatedSubtotal());
  const totalItems = useGroceryCartStore((state) => state.totalItems());
  const latitude = useLocationStore((state) => state.latitude);
  const longitude = useLocationStore((state) => state.longitude);
  const hasLocation = latitude != null && longitude != null;

  const validationPayload = useMemo(() => {
    if (!merchantId || !hasLocation) return null;
    return buildGroceryCartValidatePayload({
      groceryMerchantId: merchantId,
      items,
      latitude: latitude as number,
      longitude: longitude as number,
    });
  }, [hasLocation, items, latitude, longitude, merchantId]);

  const validationQuery = useQuery({
    queryKey: ['grocery-cart-validation', JSON.stringify(validationPayload)],
    queryFn: () => validateGroceryCart(validationPayload as NonNullable<typeof validationPayload>),
    enabled: Boolean(validationPayload && items.length > 0),
    retry: false,
  });

  const validation = validationQuery.data;
  const totals = useMemo(
    () =>
      validation
        ? {
            subtotal: validation.subtotal,
            delivery_fee: validation.delivery_fee,
            grand_total: validation.grand_total,
          }
        : {
            ...EMPTY_TOTALS,
            subtotal: estimatedSubtotal,
            grand_total: estimatedSubtotal,
          },
    [estimatedSubtotal, validation]
  );
  const validationMessage = getGroceryValidationMessage(validation);
  const validationError = validationQuery.error ? getErrorMessage(validationQuery.error) : '';
  const checkoutDisabled =
    !hasLocation ||
    validationQuery.isLoading ||
    validationQuery.isFetching ||
    Boolean(validationError) ||
    validation?.valid === false;

  useEffect(() => {
    if (!validation?.valid || validation.grand_total < 0) return;
    setValidatedTotals(totals);
  }, [setValidatedTotals, totals, validation?.grand_total, validation?.valid]);

  if (!hasMounted) return <RasanCartSkeleton />;

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#F7FBF4]">
        <div className="mx-auto max-w-[1180px] px-4 py-12 sm:px-6 lg:px-8">
          <RasanCartHeading />
          <div className="mt-8 rounded-2xl border border-[#DCE8D4] bg-white p-8 text-center shadow-[0_14px_34px_rgba(47,74,27,0.08)]">
            <ShoppingBasket className="mx-auto h-12 w-12 text-[#3F7226]" aria-hidden="true" />
            <h2 className="mt-5 text-2xl font-extrabold text-[#1C2616]">Your Rasan cart is empty</h2>
            <p className="mt-2 text-[#66745E]">Add groceries from Mangaale Rasan or nearby kirana stores.</p>
            <Link
              href="/rasan"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#2F6B1F] px-6 text-sm font-extrabold text-white transition hover:bg-[#265719]"
            >
              Browse Rasan
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7FBF4] pb-16">
      <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <RasanCartHeading />
        <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
          <div className="space-y-5">
            {!hasLocation && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-900">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                    <div>
                      <p className="font-extrabold">Delivery location needed</p>
                      <p className="mt-1 text-sm font-medium">Set your location to validate grocery availability and totals.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLocationOpen(true)}
                    className="rounded-full bg-[#2F6B1F] px-5 py-2.5 text-sm font-extrabold text-white"
                  >
                    Set location
                  </button>
                </div>
              </div>
            )}

            {(validationMessage || validationError) && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                {validationMessage || validationError}
              </div>
            )}

            <section className="rounded-2xl border border-[#DCE8D4] bg-white shadow-[0_14px_34px_rgba(47,74,27,0.08)]">
              <div className="flex flex-col gap-3 border-b border-[#E6F0DF] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#5E7D2B]">Grocery store</p>
                  <h2 className="mt-1 text-2xl font-extrabold text-[#1C2616]">{merchantName || 'Rasan store'}</h2>
                </div>
                <div className="flex gap-2">
                  {merchantId && (
                    <Link
                      href={`/rasan/merchants/${merchantId}`}
                      className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#C9DDBA] px-4 text-sm font-extrabold text-[#2F4A1B] transition hover:bg-[#F3FAEF]"
                    >
                      Add more
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={clearCart}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-red-100 px-4 text-sm font-extrabold text-red-700 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Clear
                  </button>
                </div>
              </div>
              <div className="divide-y divide-[#EEF4EA]">
                {items.map((item) => (
                  <RasanCartItemRow
                    key={item.grocery_product_id}
                    item={item}
                    onIncrease={() => updateQuantity(item.grocery_product_id, item.quantity + 1)}
                    onDecrease={() => updateQuantity(item.grocery_product_id, item.quantity - 1)}
                    onRemove={() => removeItem(item.grocery_product_id)}
                  />
                ))}
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-2xl border border-[#DCE8D4] bg-white p-5 shadow-[0_14px_34px_rgba(47,74,27,0.08)] lg:sticky lg:top-28">
            <h2 className="text-xl font-extrabold text-[#1C2616]">Bill summary</h2>
            <p className="mt-1 text-sm text-[#66745E]">Final totals are checked by Mangaale before checkout.</p>
            <div className="mt-5 space-y-3 text-sm font-semibold text-[#53614B]">
              <SummaryRow label={`Items (${totalItems})`} value={formatMoney(totals.subtotal)} />
              <SummaryRow
                label="Delivery fee"
                value={
                  validation
                    ? totals.delivery_fee > 0
                      ? formatMoney(totals.delivery_fee)
                      : 'Free'
                    : 'After validation'
                }
              />
              <div className="border-t border-[#E6F0DF] pt-3">
                <SummaryRow
                  label="Grand total"
                  value={validation ? formatMoney(totals.grand_total) : formatMoney(estimatedSubtotal)}
                  strong
                />
              </div>
            </div>
            {validationQuery.isLoading || validationQuery.isFetching ? (
              <p className="mt-4 text-sm font-semibold text-[#66745E]">Checking availability and total...</p>
            ) : null}
            <Link
              href={checkoutDisabled ? '#' : '/rasan/checkout'}
              onClick={(event) => {
                if (checkoutDisabled) event.preventDefault();
              }}
              className={`mt-6 flex min-h-12 w-full items-center justify-center rounded-xl text-base font-extrabold transition ${
                checkoutDisabled
                  ? 'cursor-not-allowed bg-[#D8E4D0] text-[#7A8A72]'
                  : 'bg-[#2F6B1F] text-white hover:bg-[#265719]'
              }`}
            >
              Continue to checkout
            </Link>
            {checkoutDisabled && (
              <p className="mt-3 text-center text-xs font-semibold text-[#7A8A72]">
                {validation?.valid === false
                  ? 'Resolve cart availability before checkout.'
                  : !hasLocation
                    ? 'Set delivery location to continue.'
                    : validationError || 'Please wait for validation.'}
              </p>
            )}
          </aside>
        </div>
      </div>

      <LocationModal open={locationOpen} onClose={() => setLocationOpen(false)} />
    </main>
  );
}

function RasanCartItemRow({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}: {
  item: GroceryCartItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const canShowImage = Boolean(item.image_url && !imageFailed);
  const showMrp = item.mrp != null && item.mrp > item.selling_price;

  return (
    <div className="flex gap-3 p-4 sm:gap-4 sm:p-5">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#EEF7E8]">
        {canShowImage ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <ShoppingBasket className="h-7 w-7 text-[#7DA35B]" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-base font-extrabold text-[#1C2616]">{item.name}</h3>
        <p className="mt-1 text-sm font-semibold text-[#66745E]">
          {[item.brand, item.package_size].filter(Boolean).join(' - ') || item.category_name || 'Daily essentials'}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            {showMrp && <p className="text-xs font-semibold text-[#8B9982] line-through">{formatMoney(item.mrp)}</p>}
            <p className="text-base font-extrabold text-[#1C2616]">{formatMoney(item.selling_price)}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 items-center rounded-lg bg-[#2F6B1F] text-white">
              <button
                type="button"
                onClick={onDecrease}
                className="flex h-9 w-9 items-center justify-center rounded-l-lg hover:bg-white/10"
                aria-label={`Decrease ${item.name}`}
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="min-w-8 text-center text-sm font-extrabold">{item.quantity}</span>
              <button
                type="button"
                onClick={onIncrease}
                className="flex h-9 w-9 items-center justify-center rounded-r-lg hover:bg-white/10"
                aria-label={`Increase ${item.name}`}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-700 hover:bg-red-50"
              aria-label={`Remove ${item.name}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${strong ? 'text-lg text-[#1C2616]' : ''}`}>
      <span>{label}</span>
      <span className={strong ? 'font-extrabold' : 'font-bold text-[#1C2616]'}>{value}</span>
    </div>
  );
}

function RasanCartHeading() {
  return (
    <header>
      <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#5E7D2B]">Mangaale Rasan</p>
      <h1 className="mt-2 text-4xl font-extrabold leading-tight tracking-normal text-[#1C2616] sm:text-5xl">
        Grocery Cart
      </h1>
      <p className="mt-3 text-base leading-7 text-[#66745E]">
        One Rasan cart, one grocery merchant. Food cart remains separate.
      </p>
    </header>
  );
}

function RasanCartSkeleton() {
  return (
    <main className="min-h-screen bg-[#F7FBF4]">
      <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="h-12 w-72" />
        <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
          <Skeleton className="h-[420px] rounded-2xl" />
          <Skeleton className="h-[300px] rounded-2xl" />
        </div>
      </div>
    </main>
  );
}
