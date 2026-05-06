'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Banknote, CheckCircle } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { OtpLoginCard } from '@/components/checkout/OtpLoginCard';
import { AddressForm } from '@/components/checkout/AddressForm';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useActiveOrderStore } from '@/store/activeOrderStore';
import { useLocationStore } from '@/store/locationStore';
import { useToast } from '@/components/ui/Toast';
import { validateCart, placeOrder } from '@/services/customerWebApi';
import { getErrorMessage } from '@/services/http';
import { generateIdempotencyKey } from '@/utils/idempotency';
import { formatMoney } from '@/utils/money';
import type { DeliveryAddress } from '@/types/order';
import type { ValidatedTotals } from '@/types/cart';

type Step = 'auth' | 'address' | 'review';

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const items = useCartStore((s) => s.items);
  const restaurantId = useCartStore((s) => s.restaurantId);
  const restaurantName = useCartStore((s) => s.restaurantName);
  const clearCart = useCartStore((s) => s.clearCart);
  const validatedTotals = useCartStore((s) => s.validatedTotals);
  const setValidatedTotals = useCartStore((s) => s.setValidatedTotals);
  const setActiveOrder = useActiveOrderStore((s) => s.setActiveOrder);
  const lat = useLocationStore((s) => s.latitude);
  const lng = useLocationStore((s) => s.longitude);

  const [step, setStep] = useState<Step>(isAuth ? 'address' : 'auth');
  const [address, setAddress] = useState<(DeliveryAddress & { name: string; phone: string }) | null>(null);
  const [validating, setValidating] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [idempKey, setIdempKey] = useState('');

  if (items.length === 0) {
    return <PageShell><EmptyState icon="cart" title="Cart is empty" actionLabel="Go Home" onAction={() => router.push('/')} /></PageShell>;
  }

  const handleVerified = () => setStep('address');

  const handleAddressSubmit = async (addr: DeliveryAddress & { name: string; phone: string }) => {
    setAddress(addr);
    setValidating(true); setError('');
    try {
      const res = await validateCart({
        restaurant_id: restaurantId!,
        customer_location: { latitude: addr.latitude || lat || 0, longitude: addr.longitude || lng || 0 },
        items: items.map(i => ({
          item_id: i.item_id, quantity: i.quantity,
          variant_id: i.variant_id,
          addons: i.addons.map(a => ({ addon_id: a.addon_id, quantity: a.quantity })),
        })),
      });
      if (res.valid === false) {
        setError(res.message || 'Cart validation failed');
        toast(res.message || 'Some items may be unavailable', 'error');
      } else {
        const totals: ValidatedTotals = {
          subtotal: res.subtotal ?? 0, taxes: res.taxes ?? 0,
          delivery_fee: res.delivery_fee ?? 0, discount: res.discount ?? 0,
          total: res.total ?? 0,
        };
        setValidatedTotals(totals);
        setStep('review');
        setIdempKey(generateIdempotencyKey(restaurantId!));
      }
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setValidating(false); }
  };

  const handlePlaceOrder = async () => {
    if (!token || !address || !restaurantId) return;
    setPlacing(true); setError('');
    try {
      const key = idempKey || generateIdempotencyKey(restaurantId);
      const res = await placeOrder({
        restaurant_id: restaurantId,
        payment_method: 'cash',
        customer: { name: address.name, phone: address.phone },
        delivery_address: {
          address_line1: address.address_line1, area: address.area,
          city: address.city, pincode: address.pincode,
          landmark: address.landmark, latitude: address.latitude, longitude: address.longitude,
        },
        items: items.map(i => ({
          item_id: i.item_id, quantity: i.quantity, variant_id: i.variant_id,
          addons: i.addons.map(a => ({ addon_id: a.addon_id, quantity: a.quantity })),
        })),
      }, token, key);

      setActiveOrder({
        order_id: res.order_id, restaurant_id: restaurantId,
        restaurant_name: restaurantName, status: res.status ?? 'placed',
        total: res.total, created_at: new Date().toISOString(),
      });
      clearCart();
      toast('Order placed successfully!', 'success');
      router.push(`/orders/${res.order_id}/track`);
    } catch (err) { setError(getErrorMessage(err)); toast(getErrorMessage(err), 'error'); }
    finally { setPlacing(false); }
  };

  return (
    <PageShell>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
      </div>

      {/* Steps indicator */}
      <div className="flex gap-2 mb-6">
        {(['auth', 'address', 'review'] as Step[]).map((s, i) => (
          <div key={s} className={`flex-1 h-1 rounded-full ${
            (['auth','address','review'].indexOf(step) >= i) ? 'bg-cherry-600' : 'bg-gray-200'
          }`} />
        ))}
      </div>

      {step === 'auth' && <OtpLoginCard onVerified={handleVerified} />}

      {step === 'address' && (
        <AddressForm initialName={user?.name} initialPhone={user?.phone}
          onSubmit={handleAddressSubmit} />
      )}

      {step === 'review' && validatedTotals && (
        <div className="space-y-4">
          {/* Bill summary */}
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Bill Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>{formatMoney(validatedTotals.subtotal)}</span></div>
              {validatedTotals.taxes > 0 && <div className="flex justify-between"><span className="text-gray-600">Taxes</span><span>{formatMoney(validatedTotals.taxes)}</span></div>}
              {validatedTotals.delivery_fee > 0 && <div className="flex justify-between"><span className="text-gray-600">Delivery Fee</span><span>{formatMoney(validatedTotals.delivery_fee)}</span></div>}
              {validatedTotals.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatMoney(validatedTotals.discount)}</span></div>}
              <div className="flex justify-between pt-2 border-t border-gray-100 font-bold text-base">
                <span>Total</span><span>{formatMoney(validatedTotals.total)}</span>
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Cash on Delivery</p>
              <p className="text-xs text-gray-500">Pay when your order arrives</p>
            </div>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>}

          <Button fullWidth size="lg" onClick={handlePlaceOrder} loading={placing} disabled={placing}>
            Place Order — {formatMoney(validatedTotals.total)}
          </Button>
        </div>
      )}

      {validating && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-3 border-cherry-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-500">Validating your cart...</p>
        </div>
      )}

      {error && step !== 'review' && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl mt-4">{error}</p>
      )}
    </PageShell>
  );
}
