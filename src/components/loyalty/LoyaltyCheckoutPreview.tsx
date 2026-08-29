'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Coins, LockKeyhole, Sparkles } from 'lucide-react';
import { features } from '@/config/features';
import { getLoyaltyWallet } from '@/services/loyaltyApi';
import { useAuthStore } from '@/store/authStore';

export function LoyaltyCheckoutPreview() {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const query = useQuery({
    queryKey: ['loyalty', 'wallet', token],
    queryFn: () => getLoyaltyWallet(token as string),
    enabled: Boolean(features.loyaltyUI && isAuthenticated && token),
    retry: 0,
  });

  if (!features.loyaltyUI || !isAuthenticated || !token) return null;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-brand-200 bg-[linear-gradient(135deg,#f0fdfa_0%,#ffffff_62%,#fffbeb_100%)] p-5 shadow-card" aria-labelledby="checkout-rewards-title">
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full border-[18px] border-brand-500/[0.05]" aria-hidden="true" />
      <div className="relative flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-900 text-amber-300 shadow-brand">
          <Coins className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.17em] text-brand-700"><Sparkles className="h-3.5 w-3.5" /> Mangaale Rewards</p>
              <h2 id="checkout-rewards-title" className="mt-1 text-lg font-extrabold text-ink">Your loyalty wallet</h2>
            </div>
            {query.data && (
              <span className="rounded-full bg-white px-3 py-1.5 text-sm font-extrabold text-brand-900 shadow-card">
                {new Intl.NumberFormat('en-IN').format(query.data.available_points)} coins
              </span>
            )}
          </div>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            {query.isLoading
              ? 'Securely checking your wallet…'
              : query.isError
                ? 'Your wallet could not refresh, but checkout is unaffected.'
                : query.data?.status === 'NOT_ENROLLED'
                  ? 'Your wallet will begin when an eligible loyalty event is processed.'
                  : 'Your live balance is shown here. Reward redemption remains protected until checkout integration is enabled.'}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-ink-muted"><LockKeyhole className="h-3.5 w-3.5 text-brand-700" /> Order total remains backend-authoritative</span>
            <Link href="/rewards" className="inline-flex items-center gap-1.5 text-xs font-extrabold text-brand-800 hover:text-brand-600">
              View activity <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
