'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { AddressFormModal } from '@/components/checkout/AddressFormModal';
import { CheckoutLoginPrompt } from '@/components/checkout/CheckoutLoginPrompt';
import { DeliveryAddressSection } from '@/components/checkout/DeliveryAddressSection';
import { DeliveryInstructionsSection } from '@/components/checkout/DeliveryInstructionsSection';
import { OrderSummaryCard } from '@/components/checkout/OrderSummaryCard';
import { PaymentMethodSection } from '@/components/checkout/PaymentMethodSection';
import { OtpLoginModal } from '@/components/auth/OtpLoginModal';
import { CouponInputCard } from '@/components/coupon/CouponInputCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PanelSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import {
  buildCartValidatePayload,
  toValidationResult,
  useCheckoutCartValidation,
} from '@/hooks/useCheckoutCartValidation';
import { useHasMounted } from '@/hooks/useHasMounted';
import { useCheckoutInstructions } from '@/hooks/useCheckoutInstructions';
import { useCustomerAddresses } from '@/hooks/useCustomerAddresses';
import { getErrorMessage, isAuthError } from '@/services/http';
import { validateCoupon } from '@/services/couponApi';
import { placeOrder, validateCart } from '@/services/customerWebApi';
import { useActiveOrderStore } from '@/store/activeOrderStore';
import { useAuthStore } from '@/store/authStore';
import {
  isCampaignContextExpired,
  normalizeCouponCode,
  useCampaignStore,
} from '@/store/campaignStore';
import { useCartStore } from '@/store/cartStore';
import { useLocationStore } from '@/store/locationStore';
import { buildCartItemsPayload, type CheckoutAddress, type CheckoutAddressPayload } from '@/components/checkout/checkoutTypes';
import { generateIdempotencyKey } from '@/utils/idempotency';
import { buildCouponCartPayload } from '@/utils/couponCartPayload';
import type { CampaignContext } from '@/types/marketing';
import type { PlaceOrderRequest } from '@/types/order';
import type { CartItem, ValidatedTotals } from '@/types/cart';

const EMPTY_CAMPAIGN_CONTEXTS: Record<string, CampaignContext> = {};
const EMPTY_CHECKOUT_COUPONS: ReturnType<typeof useCampaignStore.getState>['checkoutCoupons'] = {};
const EMPTY_TOTALS: ValidatedTotals = {
  snapshot_complete: false,
  missing_fields: [],
  subtotal: 0,
  cgst: 0,
  sgst: 0,
  tax_amount: 0,
  taxes: 0,
  platform_fee: 0,
  platform_fee_amount: 0,
  delivery_fee: 0,
  extra_charges: 0,
  discount: 0,
  discount_amount: 0,
  offer_discount_amount: 0,
  round_off_amount: 0,
  exact_total_amount: 0,
  grand_total: 0,
  total: 0,
};

/** Shared by the page, its skeleton and the recovery panel. */
const CHECKOUT_LAYOUT =
  'grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(340px,1fr)] lg:gap-8';

export function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const addressSectionRef = useRef<HTMLDivElement>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [addressError, setAddressError] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [couponDraft, setCouponDraft] = useState<string | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [invalidCouponNotice, setInvalidCouponNotice] = useState('');
  const { instructions, setInstructions, clearInstructions } = useCheckoutInstructions();
  const hasMounted = useHasMounted();

  const items = useCartStore((state) => Array.isArray(state.items) ? state.items : []);
  const restaurantId = useCartStore((state) => Number.isFinite(state.restaurantId) ? state.restaurantId : null);
  const restaurantName = useCartStore((state) => state.restaurantName);
  const clearCart = useCartStore((state) => state.clearCart);
  const setValidatedTotals = useCartStore((state) => state.setValidatedTotals);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const authPhone = useAuthStore((state) => state.phone);
  const logout = useAuthStore((state) => state.logout);
  const latitude = useLocationStore((state) => state.latitude);
  const longitude = useLocationStore((state) => state.longitude);
  const setActiveOrder = useActiveOrderStore((state) => state.setActiveOrder);
  const campaignContexts = useCampaignStore((state) => state.campaignContexts ?? EMPTY_CAMPAIGN_CONTEXTS);
  const checkoutCoupons = useCampaignStore((state) => state.checkoutCoupons ?? EMPTY_CHECKOUT_COUPONS);
  const syncCampaignCoupon = useCampaignStore((state) => state.syncCampaignCoupon);
  const setCheckoutCoupon = useCampaignStore((state) => state.setCheckoutCoupon);
  const removeCheckoutCoupon = useCampaignStore((state) => state.removeCheckoutCoupon);
  const setCouponValidation = useCampaignStore((state) => state.setCouponValidation);
  const clearCouponValidation = useCampaignStore((state) => state.clearCouponValidation);
  const clearCampaignForRestaurant = useCampaignStore((state) => state.clearForRestaurant);
  const purgeExpiredCampaigns = useCampaignStore((state) => state.purgeExpired);

  const {
    addresses,
    isLoading: addressesLoading,
    notice: addressNotice,
    saveAddress,
  } = useCustomerAddresses(token, isAuthenticated);

  const selectedAddress = useMemo(
    () => resolveSelectedAddress(addresses, selectedAddressId),
    [addresses, selectedAddressId]
  );
  const fallbackLocation = useMemo(
    () => ({ latitude, longitude }),
    [latitude, longitude]
  );
  const checkoutCouponState =
    restaurantId ? checkoutCoupons[String(restaurantId)] : undefined;
  const activeCouponCode = checkoutCouponState?.couponCode;
  const couponInput = couponDraft ?? activeCouponCode ?? '';
  const validCampaignContext = useMemo(() => {
    if (!restaurantId) return undefined;
    const context = campaignContexts[String(restaurantId)];
    return context && !isCampaignContextExpired(context) ? context : undefined;
  }, [campaignContexts, restaurantId]);
  const validation = useCheckoutCartValidation({
    restaurantId,
    items,
    couponCode: activeCouponCode,
    address: selectedAddress,
    fallbackLocation,
  });
  const validationResult = validation.data;
  const totals = validationResult?.totals ?? EMPTY_TOTALS;
  const validationError =
    validation.error
      ? getErrorMessage(validation.error)
      : validationResult?.valid === false
        ? validationResult.message || 'Cart validation failed.'
        : '';
  const totalInvalid = Boolean(
    items.length > 0 && validationResult && validationResult.totals.subtotal > 0 && validationResult.totals.total <= 0
  );
  const displayedCouponValidation =
    checkoutCouponState && checkoutCouponState.couponCode === normalizeCouponCode(couponInput)
      ? checkoutCouponState.validation
      : undefined;
  const addressProblems = getAddressProblems(selectedAddress, user?.name, user?.phone ?? authPhone);
  const placeDisabledReason = getPlaceDisabledReason({
    isAuthenticated,
    selectedAddress,
    addressProblems,
    validationLoading: validation.isLoading || validation.isFetching,
    validationError,
    totalInvalid,
    placing,
  });
  const placeDisabled = Boolean(placeDisabledReason);
  const fallbackReason = items.length > 0 && !restaurantId
    ? 'The restaurant for this saved cart could not be restored.'
    : '';

  useEffect(() => {
    if (!validationResult?.valid || totalInvalid) return;
    setValidatedTotals(validationResult.totals);
  }, [setValidatedTotals, totalInvalid, validationResult]);

  useEffect(() => {
    purgeExpiredCampaigns();
    if (restaurantId) syncCampaignCoupon(restaurantId);
  }, [purgeExpiredCampaigns, restaurantId, syncCampaignCoupon]);

  useEffect(() => {
    if (!restaurantId || !activeCouponCode || !validationResult || validation.isFetching) return;

    const backendCouponValidation =
      validationResult.couponValidation ??
      (validationResult.totals.discount > 0
        ? {
            valid: true,
            coupon: { couponId: 0, code: activeCouponCode },
            discountAmount: validationResult.totals.discount,
          }
        : undefined);

    if (!backendCouponValidation) return;

    setCouponValidation(restaurantId, backendCouponValidation);

    if (backendCouponValidation.valid === false) {
      const message = backendCouponValidation.reason || 'This coupon is not applicable.';
      removeCheckoutCoupon(restaurantId);
      window.setTimeout(() => {
        setInvalidCouponNotice(`${activeCouponCode} is not applicable: ${message}`);
        setCouponDraft('');
      }, 0);
    }
  }, [
    activeCouponCode,
    removeCheckoutCoupon,
    restaurantId,
    setCouponValidation,
    validation.isFetching,
    validationResult,
  ]);

  useEffect(() => {
    if (!hasMounted) return;
    debugCheckout('entry-state', {
      hasCartItems: items.length > 0,
      itemCount: items.length,
      hasRestaurantId: Boolean(restaurantId),
      hasSelectedAddress: Boolean(selectedAddress),
      isAuthenticated,
      fallbackReason: fallbackReason || undefined,
    });
  }, [fallbackReason, hasMounted, isAuthenticated, items.length, restaurantId, selectedAddress]);

  useEffect(() => {
    if (!hasMounted || !restaurantId || items.length === 0) return;
    debugCheckout('summary-status', {
      status: validation.isLoading || validation.isFetching
        ? 'loading'
        : validation.error
          ? 'failed'
          : validationResult
            ? 'loaded'
            : 'idle',
      failureReason: validation.error ? getErrorMessage(validation.error) : undefined,
    });
  }, [hasMounted, items.length, restaurantId, validation.error, validation.isFetching, validation.isLoading, validationResult]);

  if (!hasMounted) return <CheckoutPageSkeleton />;

  if (items.length === 0) {
    return (
      <main id="main-content" className="page-main page-container">
        <CheckoutHeading />
        <EmptyState
          icon="cart"
          title="Your cart is empty"
          description="Add items from nearby restaurants to continue."
          actionLabel="Browse restaurants"
          onAction={() => router.push('/')}
        />
      </main>
    );
  }

  if (fallbackReason) {
    return <CheckoutRecoveryPanel reason={fallbackReason} />;
  }

  const handleSaveAddress = async (payload: CheckoutAddressPayload) => {
    try {
      const saved = await saveAddress(payload);
      setSelectedAddressId(String(saved.id));
      setAddressError('');
      toast('Address saved', 'success');
    } catch (error) {
      if (isAuthError(error)) {
        logout();
        setLoginOpen(true);
        toast('Please log in again to save this address.', 'error');
        return;
      }
      toast(getErrorMessage(error), 'error');
    }
  };

  const handleCouponChange = (value: string) => {
    setCouponDraft(value);
    setCouponError('');
    setInvalidCouponNotice('');
    if (restaurantId) clearCouponValidation(restaurantId);
  };

  const handleCouponApply = async () => {
    const code = normalizeCouponCode(couponInput);
    if (!restaurantId || !code) return;

    setCheckoutCoupon(restaurantId, code, 'manual');
    setCouponDraft(code);
    setCouponChecking(true);
    setCouponError('');
    setInvalidCouponNotice('');

    try {
      const validationResult = await validateCoupon({
        restaurant_id: restaurantId,
        coupon_code: code,
        cart: buildCouponCartPayload(items),
        customer: getCustomerPhone(user?.phone ?? authPhone),
      });
      setCouponValidation(restaurantId, validationResult);
    } catch (error) {
      debugCheckout('coupon-api-failure', { failureReason: getErrorMessage(error) });
      setCouponError(getErrorMessage(error));
    } finally {
      setCouponChecking(false);
    }
  };

  const handleCouponRemove = () => {
    if (!restaurantId) return;
    removeCheckoutCoupon(restaurantId);
    setCouponDraft('');
    setCouponError('');
    setInvalidCouponNotice('');
  };

  const handlePlaceOrder = async () => {
    if (placing) return;

    setOrderError('');
    setAddressError('');

    if (!isAuthenticated || !token) {
      setLoginOpen(true);
      return;
    }

    const normalizedAddress = normalizeCheckoutAddressForSubmit(selectedAddress);
    const problems = getAddressProblems(normalizedAddress, user?.name, user?.phone ?? authPhone);
    if (problems.length > 0) {
      debugCheckout('address-validation-failure', {
        failureReason: problems[0],
        addressLine1Type: getValueType(selectedAddress?.address_line1),
        normalizedAddress: summarizeAddressForDebug(normalizedAddress),
      });
      setAddressError(problems[0]);
      addressSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (!restaurantId || !normalizedAddress) {
      setOrderError('Unable to prepare checkout. Please try again.');
      return;
    }

    setPlacing(true);
    try {
      let finalValidation = await validation.validateNow();
      setValidatedTotals(finalValidation.totals);
      let couponCodeForOrder = getValidatedCouponCode(
        useCampaignStore.getState().getCheckoutCouponForRestaurant(restaurantId)?.couponCode,
        finalValidation
      );

      if (activeCouponCode && finalValidation.couponValidation?.valid === false) {
        const message = finalValidation.couponValidation.reason || 'This coupon is not applicable.';
        removeCheckoutCoupon(restaurantId);
        setInvalidCouponNotice(`${activeCouponCode} is not applicable: ${message}`);
        const withoutCouponPayload = buildCartValidatePayload({
          restaurantId,
          items,
          address: selectedAddress,
          fallbackLocation,
        });
        finalValidation = toValidationResult(
          await validateCart(withoutCouponPayload as Parameters<typeof validateCart>[0])
        );
        setValidatedTotals(finalValidation.totals);
        couponCodeForOrder = undefined;
      }

      if (!finalValidation.valid) {
        throw new Error(finalValidation.message || 'Cart validation failed.');
      }

      if (finalValidation.totals.subtotal > 0 && finalValidation.totals.total <= 0) {
        throw new Error('Unable to calculate order total. Please retry.');
      }

      const orderKey = idempotencyKey || generateIdempotencyKey(restaurantId);
      if (!idempotencyKey) setIdempotencyKey(orderKey);
      const campaignContextForOrder =
        useCampaignStore.getState().getCampaignContextForRestaurant(restaurantId) ??
        validCampaignContext;

      const response = await placeOrder(
        buildPlaceOrderPayload({
          restaurantId,
          address: normalizedAddress,
          customerName: normalizedAddress.name || safeText(user?.name) || '',
          customerPhone: safeText(user?.phone) || safeText(authPhone) || normalizedAddress.phone || '',
          items,
          instructions,
          couponCode: couponCodeForOrder,
          campaignContext: campaignContextForOrder,
        }),
        token,
        orderKey
      );
      debugFinalBillingMismatch(finalValidation.totals, response);

      if (!response.order_id) {
        throw new Error('Order was placed but no order ID was returned.');
      }

      setActiveOrder({
        order_id: response.order_id,
        restaurant_id: restaurantId,
        restaurant_name: restaurantName,
        status: response.status ?? 'placed',
        total: response.grand_total ?? response.exact_total_amount ?? response.total ?? finalValidation.totals.total,
        created_at: new Date().toISOString(),
        customer_id: user?.id ?? user?.user_id,
        customer_phone: user?.phone ?? authPhone ?? normalizedAddress.phone,
      });
      clearCampaignForRestaurant(restaurantId);
      clearCart();
      clearInstructions();
      toast('Order placed successfully!', 'success');
      router.push(`/orders/${response.order_id}/track`);
    } catch (error) {
      if (isAuthError(error)) {
        logout();
        setLoginOpen(true);
        toast('Your session expired. Please log in again.', 'error');
      } else {
        const message = getErrorMessage(error);
        debugCheckout('place-order-failure', { failureReason: message });
        setOrderError(message);
        toast(message, 'error');
      }
    } finally {
      setPlacing(false);
    }
  };

  return (
    <main id="main-content" className="page-main page-container pb-28 lg:pb-[var(--page-block-end)]">
      <CheckoutHeading />

      <div className={CHECKOUT_LAYOUT}>
        <div className="space-y-6" ref={addressSectionRef}>
            {!isAuthenticated && <CheckoutLoginPrompt onLogin={() => setLoginOpen(true)} />}

            {orderError && (
              <div role="alert" className="flex gap-3 rounded-card border border-red-200 bg-danger-tint px-4 py-3 text-sm font-semibold text-danger">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p>{orderError}</p>
              </div>
            )}

            <DeliveryAddressSection
              addresses={addresses}
              selectedAddress={selectedAddress}
              loading={addressesLoading}
              notice={addressNotice}
              error={addressError}
              onSelect={(address) => {
                setSelectedAddressId(String(address.id));
                setAddressError('');
              }}
              onAddNew={() => setAddressModalOpen(true)}
            />

            <DeliveryInstructionsSection value={instructions} onChange={setInstructions} />
            <PaymentMethodSection />
            <CouponInputCard
              id="checkout-coupon-code"
              title="Coupon"
              description={
                validCampaignContext?.couponCode
                  ? `Campaign coupon ${validCampaignContext.couponCode} is ready for backend validation.`
                  : 'Apply a coupon and we will validate it with the restaurant.'
              }
              value={couponInput}
              onChange={handleCouponChange}
              onApply={handleCouponApply}
              onRemove={couponInput ? handleCouponRemove : undefined}
              validation={displayedCouponValidation}
              loading={
                couponChecking ||
                Boolean(activeCouponCode && (validation.isLoading || validation.isFetching))
              }
              error={couponError || invalidCouponNotice}
              disabled={!restaurantId || items.length === 0}
              idleText={
                activeCouponCode
                  ? `Coupon ${activeCouponCode} will be checked before order placement.`
                  : 'Discounts are applied only from backend validation.'
              }
            />
          </div>

        <OrderSummaryCard
          items={items}
          restaurantName={restaurantName}
          totals={totals}
          couponCode={getValidatedCouponCode(activeCouponCode, validationResult)}
          estimated={!validationResult}
          validating={validation.isLoading || validation.isFetching}
          validationError={validationError}
          totalInvalid={totalInvalid}
          placing={placing}
          placeDisabled={placeDisabled}
          placeDisabledReason={placeDisabledReason}
          onRetrySummary={() => void validation.refetch()}
          onPlaceOrder={handlePlaceOrder}
        />
      </div>

      {addressModalOpen && (
        <AddressFormModal
          open={addressModalOpen}
          initialName={user?.name}
          initialPhone={user?.phone ?? authPhone ?? undefined}
          onClose={() => setAddressModalOpen(false)}
          onSave={handleSaveAddress}
        />
      )}
      <OtpLoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onVerified={() => setLoginOpen(false)}
      />
    </main>
  );
}

function CheckoutPageSkeleton() {
  return (
    <main className="page-main page-container">
      <CheckoutHeading />
      <div className={CHECKOUT_LAYOUT}>
        <div className="space-y-6">
          <PanelSkeleton className="h-72" />
          <PanelSkeleton className="h-52" />
          <PanelSkeleton className="h-64" />
        </div>
        <PanelSkeleton className="h-[420px]" />
      </div>
    </main>
  );
}

function CheckoutRecoveryPanel({ reason }: { reason: string }) {
  return (
    <main className="page-main page-container">
      <CheckoutHeading />
      <ErrorState
        title="Checkout needs your cart again"
        message={`${reason} Please review your cart before continuing.`}
      >
        <ButtonLink href="/cart" variant="primary" size="md">
          Return to cart
        </ButtonLink>
        <ButtonLink href="/" variant="outline" size="md">
          Browse restaurants
        </ButtonLink>
      </ErrorState>
    </main>
  );
}

function CheckoutHeading() {
  return (
    <PageHeader
      eyebrow="Checkout"
      title="Confirm and pay"
      backHref="/cart"
      backLabel="Back to cart"
      meta="Step 2 of 2"
    />
  );
}

function resolveSelectedAddress(addresses: CheckoutAddress[], selectedId: string | null) {
  return (
    addresses.find((address) => String(address.id) === selectedId) ??
    addresses.find((address) => address.is_default) ??
    addresses[0] ??
    null
  );
}

function getAddressProblems(
  address: CheckoutAddress | null | undefined,
  userName?: string,
  authPhone?: string | null
) {
  const normalizedAddress = normalizeCheckoutAddressForSubmit(address);
  if (!normalizedAddress) return ['Add a delivery address to continue.'];

  const problems: string[] = [];
  const customerName = normalizedAddress.name || safeText(userName);
  const customerPhone = safeText(authPhone) || normalizedAddress.phone;

  if (!customerName) problems.push('Customer name is required.');
  if (!customerPhone || customerPhone.replace(/\D/g, '').length < 10) problems.push('Valid phone number is required.');
  if (!normalizedAddress.address_line1) problems.push('Address line is required.');
  if (!normalizedAddress.area) problems.push('Area is required.');
  if (!normalizedAddress.city) problems.push('City is required.');
  return problems;
}

function getPlaceDisabledReason({
  isAuthenticated,
  selectedAddress,
  addressProblems,
  validationLoading,
  validationError,
  totalInvalid,
  placing,
}: {
  isAuthenticated: boolean;
  selectedAddress: CheckoutAddress | null;
  addressProblems: string[];
  validationLoading: boolean;
  validationError: string;
  totalInvalid: boolean;
  placing: boolean;
}) {
  if (placing) return '';
  if (!isAuthenticated) return 'Login to place your order.';
  if (!selectedAddress) return 'Add a delivery address.';
  if (addressProblems.length > 0) return 'Complete your delivery address.';
  if (validationLoading) return 'Checking order total...';
  if (validationError) return validationError;
  if (totalInvalid) return 'Unable to calculate order total. Please retry.';
  return '';
}

function getValidatedCouponCode(
  couponCode: string | undefined,
  validationResult?: { couponValidation?: { valid: boolean }; totals: ValidatedTotals }
) {
  if (!couponCode || !validationResult) return undefined;

  if (validationResult.couponValidation?.valid) return couponCode;
  if (validationResult.couponValidation?.valid === false) return undefined;
  if (validationResult.totals.discount > 0) return couponCode;
  return undefined;
}

function getCustomerPhone(phone?: string | null) {
  const cleaned = phone?.replace(/\D/g, '');
  return cleaned ? { phone: cleaned } : undefined;
}

function debugCheckout(event: string, details: Record<string, unknown>) {
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[checkout]', event, details);
  }
}

function debugFinalBillingMismatch(
  preview: ValidatedTotals,
  placed: {
    subtotal?: number;
    discount_amount?: number;
    offer_discount_amount?: number;
    delivery_fee?: number;
    extra_charges?: number;
    cgst?: number;
    sgst?: number;
    tax_amount?: number;
    platform_fee_amount?: number;
    exact_total_amount?: number;
    round_off_amount?: number;
    grand_total?: number;
  }
) {
  if (process.env.NODE_ENV === 'production') return;

  const pairs: Record<string, [number, number | undefined]> = {
    subtotal: [preview.subtotal, placed.subtotal],
    discount_amount: [preview.discount_amount, placed.discount_amount],
    offer_discount_amount: [preview.offer_discount_amount, placed.offer_discount_amount],
    delivery_fee: [preview.delivery_fee, placed.delivery_fee],
    extra_charges: [preview.extra_charges, placed.extra_charges],
    cgst: [preview.cgst, placed.cgst],
    sgst: [preview.sgst, placed.sgst],
    tax_amount: [preview.tax_amount, placed.tax_amount],
    platform_fee_amount: [preview.platform_fee_amount, placed.platform_fee_amount],
    exact_total_amount: [preview.exact_total_amount, placed.exact_total_amount],
    round_off_amount: [preview.round_off_amount, placed.round_off_amount],
    grand_total: [preview.grand_total, placed.grand_total],
  };
  const mismatches = Object.fromEntries(
    Object.entries(pairs)
      .filter(([, [previewValue, placedValue]]) =>
        placedValue == null || Math.abs(previewValue - placedValue) >= 0.01
      )
      .map(([field, [previewValue, placedValue]]) => [
        field,
        { preview: previewValue, placed: placedValue },
      ])
  );

  debugCheckout('preview-place-billing-comparison', {
    matches: Object.keys(mismatches).length === 0,
    mismatches,
  });
}

function normalizeCheckoutAddressForSubmit(
  address: CheckoutAddress | null | undefined
): CheckoutAddress | null {
  if (!address) return null;

  debugCheckout('address-normalization', {
    addressLine1Type: getValueType(address.address_line1),
    addressLine1Preview: previewValue(address.address_line1),
  });

  const normalized = {
    ...address,
    label: safeText(address.label),
    name: safeText(address.name),
    phone: safeText(address.phone),
    address_line1: safeText(address.address_line1) ?? '',
    area: safeText(address.area),
    city: safeText(address.city),
    state: safeText(address.state),
    pincode: safeText(address.pincode),
    landmark: safeText(address.landmark),
  };

  debugCheckout('normalized-address-payload', summarizeAddressForDebug(normalized));
  return normalized;
}

function safeText(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    return (
      safeText(record.address_line1) ??
      safeText(record.line1) ??
      safeText(record.address) ??
      safeText(record.text) ??
      safeText(record.value) ??
      safeText(record.label) ??
      safeText(record.name) ??
      safeText(record.formatted_address)
    );
  }

  return undefined;
}

function getValueType(value: unknown) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function previewValue(value: unknown) {
  const text = safeText(value);
  if (!text) return undefined;
  return text.length > 16 ? `${text.slice(0, 16)}...` : text;
}

function summarizeAddressForDebug(address: CheckoutAddress | null) {
  if (!address) return { present: false };

  return {
    present: true,
    hasAddressLine1: Boolean(address.address_line1),
    hasArea: Boolean(address.area),
    hasCity: Boolean(address.city),
    hasPincode: Boolean(address.pincode),
    hasLandmark: Boolean(address.landmark),
    hasCoordinates: address.latitude != null && address.longitude != null,
  };
}

function buildPlaceOrderPayload({
  restaurantId,
  address,
  customerName,
  customerPhone,
  items,
  instructions,
  couponCode,
  campaignContext,
}: {
  restaurantId: number;
  address: CheckoutAddress;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  instructions: string;
  couponCode?: string;
  campaignContext?: CampaignContext | null;
}): PlaceOrderRequest {
  return {
    restaurant_id: restaurantId,
    payment_method: 'cash',
    ...(couponCode ? { coupon_code: couponCode } : {}),
    ...(campaignContext?.campaignId ? { campaign_id: campaignContext.campaignId } : {}),
    ...(campaignContext?.utmSource ? { utm_source: campaignContext.utmSource } : {}),
    ...(campaignContext?.utmCampaign ? { utm_campaign: campaignContext.utmCampaign } : {}),
    customer: {
      name: customerName,
      phone: customerPhone,
    },
    delivery_address: {
      address_line1: safeText(address.address_line1) ?? '',
      area: safeText(address.area) ?? '',
      city: safeText(address.city) ?? '',
      state: safeText(address.state),
      pincode: safeText(address.pincode) ?? '',
      landmark: safeText(address.landmark),
      latitude: address.latitude,
      longitude: address.longitude,
    },
    items: buildCartItemsPayload(items),
    special_instructions: instructions.trim() || undefined,
  };
}
