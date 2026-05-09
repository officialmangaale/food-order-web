'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CheckoutCouponState, CouponValidationResult } from '@/types/coupon';
import type { CampaignContext } from '@/types/marketing';

const CAMPAIGN_CONTEXT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface CampaignStoreState {
  campaignContexts: Record<string, CampaignContext>;
  checkoutCoupons: Record<string, CheckoutCouponState>;

  captureCampaignContext: (context: CampaignContext) => void;
  syncCampaignCoupon: (restaurantId: number) => void;
  setCheckoutCoupon: (
    restaurantId: number,
    couponCode: string,
    source?: CheckoutCouponState['source']
  ) => void;
  removeCheckoutCoupon: (restaurantId: number) => void;
  setCouponValidation: (restaurantId: number, validation: CouponValidationResult) => void;
  clearCouponValidation: (restaurantId: number) => void;
  clearForRestaurant: (restaurantId: number) => void;
  purgeExpired: () => void;
  getCampaignContextForRestaurant: (restaurantId: number | null | undefined) => CampaignContext | null;
  getCheckoutCouponForRestaurant: (restaurantId: number | null | undefined) => CheckoutCouponState | null;
}

export const useCampaignStore = create<CampaignStoreState>()(
  persist(
    (set, get) => ({
      campaignContexts: {},
      checkoutCoupons: {},

      captureCampaignContext: (context) => {
        const key = restaurantKey(context.restaurantId);
        const couponCode = normalizeCouponCode(context.couponCode);

        set((state) => {
          const existingCoupon = state.checkoutCoupons[key];
          const shouldHydrateCoupon =
            Boolean(couponCode) &&
            (!existingCoupon?.couponCode || existingCoupon.source === 'campaign') &&
            existingCoupon?.removedCouponCode !== couponCode;

          return {
            campaignContexts: purgeExpiredContexts({
              ...state.campaignContexts,
              [key]: {
                ...context,
                couponCode,
              },
            }),
            checkoutCoupons: shouldHydrateCoupon
              ? {
                  ...state.checkoutCoupons,
                  [key]: {
                    restaurantId: context.restaurantId,
                    couponCode,
                    source: 'campaign',
                    updatedAt: Date.now(),
                  },
                }
              : state.checkoutCoupons,
          };
        });
      },

      syncCampaignCoupon: (restaurantId) => {
        const key = restaurantKey(restaurantId);
        const context = get().getCampaignContextForRestaurant(restaurantId);
        const couponCode = normalizeCouponCode(context?.couponCode);
        if (!context || !couponCode) return;

        set((state) => {
          const existingCoupon = state.checkoutCoupons[key];
          if (existingCoupon?.couponCode || existingCoupon?.removedCouponCode === couponCode) {
            return state;
          }

          return {
            checkoutCoupons: {
              ...state.checkoutCoupons,
              [key]: {
                restaurantId,
                couponCode,
                source: 'campaign',
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      setCheckoutCoupon: (restaurantId, couponCode, source = 'manual') => {
        const normalized = normalizeCouponCode(couponCode);
        const key = restaurantKey(restaurantId);

        if (!normalized) {
          get().removeCheckoutCoupon(restaurantId);
          return;
        }

        set((state) => ({
          checkoutCoupons: {
            ...state.checkoutCoupons,
            [key]: {
              restaurantId,
              couponCode: normalized,
              source,
              updatedAt: Date.now(),
            },
          },
        }));
      },

      removeCheckoutCoupon: (restaurantId) => {
        const key = restaurantKey(restaurantId);

        set((state) => {
          const existing = state.checkoutCoupons[key];
          if (!existing) return state;

          return {
            checkoutCoupons: {
              ...state.checkoutCoupons,
              [key]: {
                restaurantId,
                source: existing.source,
                removedCouponCode: existing.couponCode ?? existing.removedCouponCode,
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      setCouponValidation: (restaurantId, validation) => {
        const key = restaurantKey(restaurantId);

        set((state) => {
          const existing = state.checkoutCoupons[key];
          if (!existing) return state;

          return {
            checkoutCoupons: {
              ...state.checkoutCoupons,
              [key]: {
                ...existing,
                validation,
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      clearCouponValidation: (restaurantId) => {
        const key = restaurantKey(restaurantId);

        set((state) => {
          const existing = state.checkoutCoupons[key];
          if (!existing?.validation) return state;
          const nextCoupon = { ...existing };
          delete nextCoupon.validation;

          return {
            checkoutCoupons: {
              ...state.checkoutCoupons,
              [key]: {
                ...nextCoupon,
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      clearForRestaurant: (restaurantId) => {
        const key = restaurantKey(restaurantId);

        set((state) => {
          const nextContexts = { ...state.campaignContexts };
          const nextCoupons = { ...state.checkoutCoupons };
          delete nextContexts[key];
          delete nextCoupons[key];
          return {
            campaignContexts: nextContexts,
            checkoutCoupons: nextCoupons,
          };
        });
      },

      purgeExpired: () => {
        set((state) => ({
          campaignContexts: purgeExpiredContexts(state.campaignContexts),
        }));
      },

      getCampaignContextForRestaurant: (restaurantId) => {
        if (!restaurantId) return null;
        const key = restaurantKey(restaurantId);
        const context = get().campaignContexts[key];
        if (!context) return null;
        if (isCampaignContextExpired(context)) {
          get().purgeExpired();
          return null;
        }
        return context.restaurantId === restaurantId ? context : null;
      },

      getCheckoutCouponForRestaurant: (restaurantId) => {
        if (!restaurantId) return null;
        const state = get().checkoutCoupons[restaurantKey(restaurantId)];
        return state?.restaurantId === restaurantId && state.couponCode ? state : null;
      },
    }),
    {
      name: 'mangaale-campaign-context',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        campaignContexts: state.campaignContexts,
        checkoutCoupons: state.checkoutCoupons,
      }),
      onRehydrateStorage: () => (state) => {
        state?.purgeExpired();
      },
    }
  )
);

export function normalizeCouponCode(value: string | null | undefined) {
  return value?.trim().toUpperCase() || undefined;
}

export function isCampaignContextExpired(context: CampaignContext, now = Date.now()) {
  return now - context.capturedAt > CAMPAIGN_CONTEXT_TTL_MS;
}

function purgeExpiredContexts(contexts: Record<string, CampaignContext>) {
  const now = Date.now();
  return Object.fromEntries(
    Object.entries(contexts).filter(([, context]) => !isCampaignContextExpired(context, now))
  );
}

function restaurantKey(restaurantId: number) {
  return String(restaurantId);
}
