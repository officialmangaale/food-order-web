'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, MapPin, Navigation, ShoppingBasket } from 'lucide-react';
import {
  buildGroceryCartValidatePayload,
  getGroceryValidationMessage,
  hasNoFulfillmentMessage,
} from '@/components/rasan/groceryCartUtils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useHasMounted } from '@/hooks/useHasMounted';
import { getErrorMessage, isAuthError } from '@/services/http';
import { placeGroceryOrder, validateGroceryCart } from '@/services/groceryApi';
import { useAuthStore } from '@/store/authStore';
import { useGroceryCartStore } from '@/store/groceryCartStore';
import { useLocationStore } from '@/store/locationStore';
import { generateIdempotencyKey } from '@/utils/idempotency';
import { formatMoney } from '@/utils/money';
import type { GroceryCartTotals, GroceryPlaceOrderRequest } from '@/types/grocery';

const EMPTY_TOTALS: GroceryCartTotals = {
  subtotal: 0,
  delivery_fee: 0,
  grand_total: 0,
};

export function RasanCheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const hasMounted = useHasMounted();
  const [customerName, setCustomerName] = useState(() => useAuthStore.getState().user?.name ?? '');
  const [customerPhone, setCustomerPhone] = useState(
    () => useAuthStore.getState().user?.phone ?? useAuthStore.getState().phone ?? ''
  );
  const [deliveryAddress, setDeliveryAddress] = useState(() => useLocationStore.getState().addressText ?? '');
  const [deliveryLandmark, setDeliveryLandmark] = useState(() => useLocationStore.getState().landmark ?? '');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [capturingLocation, setCapturingLocation] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState('');

  const merchantId = useGroceryCartStore((state) => state.groceryMerchantId);
  const merchantName = useGroceryCartStore((state) => state.merchantName);
  const items = useGroceryCartStore((state) => state.items);
  const clearCart = useGroceryCartStore((state) => state.clearCart);
  const estimatedSubtotal = useGroceryCartStore((state) => state.estimatedSubtotal());
  const setValidatedTotals = useGroceryCartStore((state) => state.setValidatedTotals);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const latitude = useLocationStore((state) => state.latitude);
  const longitude = useLocationStore((state) => state.longitude);
  const requestBrowserLocation = useLocationStore((state) => state.requestBrowserLocation);
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
    queryKey: ['grocery-checkout-validation', JSON.stringify(validationPayload)],
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

  useEffect(() => {
    if (!validation?.valid) return;
    setValidatedTotals(totals);
  }, [setValidatedTotals, totals, validation?.valid]);

  const handleUseGps = async () => {
    setCapturingLocation(true);
    const location = await requestBrowserLocation();
    setCapturingLocation(false);
    if (location) {
      toast('Delivery location captured', 'success');
    } else {
      toast('Could not capture location. Please allow location access.', 'error');
    }
  };

  const handlePlaceOrder = async () => {
    setFormError('');

    if (placing) return;
    if (!merchantId) {
      setFormError('Unable to prepare this grocery cart. Please add items again.');
      return;
    }

    const problem = getCheckoutProblem({
      customerName,
      customerPhone,
      deliveryAddress,
      hasLocation,
      validationLoading: validationQuery.isLoading || validationQuery.isFetching,
      validationError,
      validationValid: validation?.valid,
    });
    if (problem) {
      setFormError(problem);
      return;
    }

    setPlacing(true);
    try {
      const finalValidation = await validateGroceryCart(validationPayload as NonNullable<typeof validationPayload>);
      setValidatedTotals({
        subtotal: finalValidation.subtotal,
        delivery_fee: finalValidation.delivery_fee,
        grand_total: finalValidation.grand_total,
      });

      if (!finalValidation.valid) {
        throw new Error(
          hasNoFulfillmentMessage(finalValidation.message)
            ? 'Some items are not available near your location.'
            : finalValidation.message || 'Cart validation failed.'
        );
      }

      const orderKey = idempotencyKey || generateIdempotencyKey(merchantId);
      if (!idempotencyKey) setIdempotencyKey(orderKey);

      const response = await placeGroceryOrder(
        buildGroceryOrderPayload({
          groceryMerchantId: merchantId,
          customerName,
          customerPhone,
          deliveryAddress,
          deliveryLandmark,
          latitude: latitude as number,
          longitude: longitude as number,
          notes,
          items,
        }),
        {
          token: token ?? undefined,
          idempotencyKey: orderKey,
        }
      );

      if (!response.order_id) {
        throw new Error('Order was placed but no order ID was returned.');
      }

      clearCart();
      toast('Rasan order placed successfully', 'success');
      router.push(`/rasan/orders/${response.order_id}/track`);
    } catch (error) {
      if (isAuthError(error)) {
        logout();
        setFormError('Please log in again to place this order.');
        toast('Please log in again to place this order.', 'error');
      } else {
        const message = getErrorMessage(error);
        setFormError(message);
        toast(message, 'error');
      }
    } finally {
      setPlacing(false);
    }
  };

  if (!hasMounted) return <RasanCheckoutSkeleton />;

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#F7FBF4]">
        <div className="mx-auto max-w-[1180px] px-4 py-12 sm:px-6 lg:px-8">
          <CheckoutHeading />
          <div className="mt-8 rounded-2xl border border-[#DCE8D4] bg-white p-8 text-center shadow-[0_14px_34px_rgba(47,74,27,0.08)]">
            <ShoppingBasket className="mx-auto h-12 w-12 text-[#3F7226]" aria-hidden="true" />
            <h2 className="mt-5 text-2xl font-extrabold text-[#1C2616]">Your Rasan cart is empty</h2>
            <p className="mt-2 text-[#66745E]">Add groceries before checkout.</p>
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
        <CheckoutHeading />

        <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1.7fr)_minmax(340px,1fr)]">
          <div className="space-y-5">
            {(formError || validationMessage || validationError) && (
              <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p>{formError || validationMessage || validationError}</p>
              </div>
            )}

            <section className="rounded-2xl border border-[#DCE8D4] bg-white p-5 shadow-[0_14px_34px_rgba(47,74,27,0.08)]">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-[#1C2616]">Delivery details</h2>
                  <p className="mt-1 text-sm text-[#66745E]">COD only for this MVP.</p>
                </div>
                <span className="rounded-full bg-[#EEF7E8] px-3 py-1 text-xs font-extrabold text-[#2F6B1F]">
                  Cash
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Customer name"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Full name"
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10 digit mobile"
                  maxLength={10}
                />
              </div>

              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Delivery address</span>
                <textarea
                  value={deliveryAddress}
                  onChange={(event) => setDeliveryAddress(event.target.value)}
                  placeholder="House/flat, street, area, city"
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-cherry-500 focus:ring-2 focus:ring-cherry-500"
                />
              </label>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Input
                  label="Landmark"
                  value={deliveryLandmark}
                  onChange={(event) => setDeliveryLandmark(event.target.value)}
                  placeholder="Optional"
                />
                <div>
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Location</span>
                  <button
                    type="button"
                    onClick={handleUseGps}
                    disabled={capturingLocation}
                    className={`flex h-[50px] w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-extrabold transition ${
                      hasLocation
                        ? 'border-[#BBD4A8] bg-[#EEF7E8] text-[#2F6B1F]'
                        : 'border-amber-200 bg-amber-50 text-amber-800'
                    }`}
                  >
                    {hasLocation ? <MapPin className="h-4 w-4" aria-hidden="true" /> : <Navigation className="h-4 w-4" aria-hidden="true" />}
                    {capturingLocation ? 'Capturing...' : hasLocation ? 'Location captured' : 'Use GPS'}
                  </button>
                </div>
              </div>

              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Notes</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Optional delivery notes"
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-cherry-500 focus:ring-2 focus:ring-cherry-500"
                />
              </label>
            </section>
          </div>

          <aside className="h-fit rounded-2xl border border-[#DCE8D4] bg-white p-5 shadow-[0_14px_34px_rgba(47,74,27,0.08)] lg:sticky lg:top-28">
            <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#5E7D2B]">Order from</p>
            <h2 className="mt-1 text-2xl font-extrabold text-[#1C2616]">{merchantName || 'Rasan store'}</h2>
            <div className="mt-5 space-y-3">
              {items.map((item) => (
                <div key={item.grocery_product_id} className="flex justify-between gap-3 text-sm">
                  <div>
                    <p className="font-bold text-[#1C2616]">{item.name}</p>
                    <p className="mt-0.5 text-xs font-semibold text-[#66745E]">Qty {item.quantity}</p>
                  </div>
                  <p className="shrink-0 font-extrabold text-[#1C2616]">{formatMoney(item.selling_price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3 border-t border-[#E6F0DF] pt-4 text-sm font-semibold text-[#53614B]">
              <SummaryRow label="Subtotal" value={formatMoney(totals.subtotal)} />
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

            <Button
              fullWidth
              size="lg"
              loading={placing}
              disabled={placing}
              className="mt-6 bg-[#2F6B1F] hover:bg-[#265719]"
              onClick={handlePlaceOrder}
            >
              Place COD order
            </Button>
            <p className="mt-3 text-center text-xs font-semibold text-[#66745E]">
              Prices and availability are confirmed by backend validation.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}

function buildGroceryOrderPayload({
  groceryMerchantId,
  customerName,
  customerPhone,
  deliveryAddress,
  deliveryLandmark,
  latitude,
  longitude,
  notes,
  items,
}: {
  groceryMerchantId: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryLandmark: string;
  latitude: number;
  longitude: number;
  notes: string;
  items: { grocery_product_id: number; quantity: number }[];
}): GroceryPlaceOrderRequest {
  return {
    grocery_merchant_id: groceryMerchantId,
    customer_name: customerName.trim(),
    customer_phone: customerPhone.replace(/\D/g, ''),
    payment_method: 'cash',
    delivery_address: deliveryAddress.trim(),
    delivery_landmark: deliveryLandmark.trim() || undefined,
    delivery_latitude: latitude,
    delivery_longitude: longitude,
    notes: notes.trim() || undefined,
    items: items.map((item) => ({
      grocery_product_id: item.grocery_product_id,
      quantity: item.quantity,
    })),
  };
}

function getCheckoutProblem({
  customerName,
  customerPhone,
  deliveryAddress,
  hasLocation,
  validationLoading,
  validationError,
  validationValid,
}: {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  hasLocation: boolean;
  validationLoading: boolean;
  validationError: string;
  validationValid?: boolean;
}) {
  if (!customerName.trim()) return 'Customer name is required.';
  if (customerPhone.replace(/\D/g, '').length < 10) return 'Valid phone number is required.';
  if (!deliveryAddress.trim()) return 'Delivery address is required.';
  if (!hasLocation) return 'Capture delivery location to continue.';
  if (validationLoading) return 'Checking grocery availability. Please wait.';
  if (validationError) return validationError;
  if (validationValid === false) return 'Some items are not available near your location.';
  return '';
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${strong ? 'text-lg text-[#1C2616]' : ''}`}>
      <span>{label}</span>
      <span className={strong ? 'font-extrabold' : 'font-bold text-[#1C2616]'}>{value}</span>
    </div>
  );
}

function CheckoutHeading() {
  return (
    <header>
      <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#5E7D2B]">Mangaale Rasan</p>
      <h1 className="mt-2 text-4xl font-extrabold leading-tight tracking-normal text-[#1C2616] sm:text-5xl">
        Grocery Checkout
      </h1>
      <p className="mt-3 text-base leading-7 text-[#66745E]">Confirm address, location, and COD payment.</p>
    </header>
  );
}

function RasanCheckoutSkeleton() {
  return (
    <main className="min-h-screen bg-[#F7FBF4]">
      <div className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-12 w-72 animate-pulse rounded-xl bg-gray-200" />
        <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1.7fr)_minmax(340px,1fr)]">
          <div className="h-[540px] animate-pulse rounded-2xl bg-gray-200" />
          <div className="h-[420px] animate-pulse rounded-2xl bg-gray-200" />
        </div>
      </div>
    </main>
  );
}
