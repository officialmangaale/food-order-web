'use client';

import { useEffect, useState } from 'react';
import { CouponInputCard } from '@/components/coupon/CouponInputCard';
import { useToast } from '@/components/ui/Toast';
import { validateCoupon } from '@/services/couponApi';
import { getErrorMessage } from '@/services/http';
import { normalizeCouponCode, useCampaignStore } from '@/store/campaignStore';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { buildCouponCartPayload } from '@/utils/couponCartPayload';

export function CartPromoCard() {
  const restaurantId = useCartStore((state) => state.restaurantId);
  const items = useCartStore((state) => state.items);
  const couponState = useCampaignStore((state) =>
    restaurantId ? state.checkoutCoupons[String(restaurantId)] : undefined
  );
  const syncCampaignCoupon = useCampaignStore((state) => state.syncCampaignCoupon);
  const setCheckoutCoupon = useCampaignStore((state) => state.setCheckoutCoupon);
  const removeCheckoutCoupon = useCampaignStore((state) => state.removeCheckoutCoupon);
  const setCouponValidation = useCampaignStore((state) => state.setCouponValidation);
  const clearCouponValidation = useCampaignStore((state) => state.clearCouponValidation);
  const purgeExpired = useCampaignStore((state) => state.purgeExpired);
  const user = useAuthStore((state) => state.user);
  const authPhone = useAuthStore((state) => state.phone);
  const [promoDraft, setPromoDraft] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const promoCode = promoDraft ?? couponState?.couponCode ?? '';
  const displayedValidation =
    couponState && couponState.couponCode === normalizeCouponCode(promoCode)
      ? couponState.validation
      : undefined;

  useEffect(() => {
    purgeExpired();
    if (restaurantId) syncCampaignCoupon(restaurantId);
  }, [purgeExpired, restaurantId, syncCampaignCoupon]);

  const handleChange = (value: string) => {
    setPromoDraft(value);
    setError('');
    if (restaurantId) clearCouponValidation(restaurantId);
  };

  const handleApply = async () => {
    const code = normalizeCouponCode(promoCode);
    if (!restaurantId || !code) return;

    setCheckoutCoupon(restaurantId, code, 'manual');
    setPromoDraft(code);
    setChecking(true);
    setError('');

    try {
      const validation = await validateCoupon({
        restaurant_id: restaurantId,
        coupon_code: code,
        cart: buildCouponCartPayload(items),
        customer: getCustomerPhone(user?.phone ?? authPhone),
      });
      setCouponValidation(restaurantId, validation);
      toast(validation.valid ? 'Coupon applied' : 'Coupon is not applicable', validation.valid ? 'success' : 'error');
    } catch (applyError) {
      setError(getErrorMessage(applyError));
    } finally {
      setChecking(false);
    }
  };

  const handleRemove = () => {
    if (!restaurantId) return;
    removeCheckoutCoupon(restaurantId);
    setPromoDraft('');
    setError('');
  };

  return (
    <CouponInputCard
      id="cart-promo-code"
      title="Apply Promo Code"
      description={
        couponState?.source === 'campaign' && couponState.couponCode
          ? `Coupon ${couponState.couponCode} will be checked at checkout.`
          : undefined
      }
      value={promoCode}
      onChange={handleChange}
      onApply={handleApply}
      onRemove={promoCode ? handleRemove : undefined}
      validation={displayedValidation}
      loading={checking}
      error={error}
      disabled={!restaurantId || items.length === 0}
      idleText="Backend validation decides the final discount."
    />
  );
}

function getCustomerPhone(phone?: string | null) {
  const cleaned = phone?.replace(/\D/g, '');
  return cleaned ? { phone: cleaned } : undefined;
}
