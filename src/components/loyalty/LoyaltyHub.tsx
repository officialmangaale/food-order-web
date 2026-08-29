'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Check,
  Clock3,
  Coins,
  Gift,
  History,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import { ProfileRouteGuard } from '@/components/profile/ProfileRouteGuard';
import { features } from '@/config/features';
import { getErrorMessage, isAuthError } from '@/services/http';
import {
  getLoyaltyRewards,
  getLoyaltyTransactions,
  getLoyaltyWallet,
} from '@/services/loyaltyApi';
import { useAuthStore } from '@/store/authStore';
import type { LoyaltyReward, LoyaltyTransaction } from '@/types/loyalty';

export function LoyaltyHub() {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const enabled = Boolean(features.loyaltyUI && isAuthenticated && token);

  const walletQuery = useQuery({
    queryKey: ['loyalty', 'wallet', token],
    queryFn: () => getLoyaltyWallet(token as string),
    enabled,
    retry: (count, error) => !isAuthError(error) && count < 1,
  });
  const rewardsQuery = useQuery({
    queryKey: ['loyalty', 'rewards', token],
    queryFn: () => getLoyaltyRewards(token as string),
    enabled,
    retry: (count, error) => !isAuthError(error) && count < 1,
  });
  const transactionsQuery = useInfiniteQuery({
    queryKey: ['loyalty', 'transactions', token],
    queryFn: ({ pageParam }) => getLoyaltyTransactions(token as string, pageParam, 20),
    initialPageParam: '',
    getNextPageParam: (page) => page.next_cursor || undefined,
    enabled,
    retry: (count, error) => !isAuthError(error) && count < 1,
  });

  const authError = [walletQuery.error, rewardsQuery.error, transactionsQuery.error].find(isAuthError);
  useEffect(() => {
    if (authError) logout();
  }, [authError, logout]);

  if (!features.loyaltyUI) return <LoyaltyUnavailable />;

  const wallet = walletQuery.data;
  const rewards = rewardsQuery.data?.rewards ?? [];
  const transactions = transactionsQuery.data?.pages.flatMap((page) => page.transactions) ?? [];
  const firstError = walletQuery.error || rewardsQuery.error || transactionsQuery.error;
  const isInitialLoading = walletQuery.isLoading || rewardsQuery.isLoading || transactionsQuery.isLoading;

  return (
    <ProfileRouteGuard>
      <main className="relative min-h-screen overflow-hidden bg-[#F4F8F7] pb-28">
        <div className="pointer-events-none absolute left-[-12rem] top-24 h-[30rem] w-[30rem] rounded-full bg-brand-200/30 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute right-[-10rem] top-[34rem] h-[26rem] w-[26rem] rounded-full bg-amber-100/60 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-11">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-brand-700">
                <Sparkles className="h-4 w-4" aria-hidden="true" /> Mangaale Rewards
              </div>
              <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.045em] text-ink sm:text-5xl">Every order moves you forward.</h1>
            </div>
            <Link href="/restaurants" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-white px-5 text-sm font-extrabold text-ink shadow-card transition hover:border-brand-300 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15">
              Find your next meal <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {firstError && !isAuthError(firstError) && (
            <ErrorBanner
              message={getErrorMessage(firstError)}
              onRetry={() => {
                void walletQuery.refetch();
                void rewardsQuery.refetch();
                void transactionsQuery.refetch();
              }}
            />
          )}

          {isInitialLoading ? (
            <LoyaltySkeleton />
          ) : (
            <>
              <WalletHero
                status={wallet?.status || 'NOT_ENROLLED'}
                available={wallet?.available_points ?? 0}
                pending={wallet?.pending_points ?? 0}
                reserved={wallet?.reserved_points ?? 0}
                lifetime={wallet?.lifetime_earned_points ?? 0}
              />

              <section className="mt-10" aria-labelledby="reward-catalog-title">
                <SectionHeading
                  eyebrow="Curated for your balance"
                  title="Rewards within reach"
                  description="Live catalog values come directly from Mangaale. Redemption stays protected inside the checkout service."
                  icon={<Gift className="h-5 w-5" aria-hidden="true" />}
                />
                {rewards.length ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {rewards.map((reward, index) => (
                      <RewardCard
                        key={reward.reward_id}
                        reward={reward}
                        balance={wallet?.available_points ?? 0}
                        featured={index === 0}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyPanel icon={<Gift className="h-6 w-6" />} title="New rewards are on the way" description="The live catalog has no active rewards right now. Your balance remains safe." />
                )}
              </section>

              <section className="mt-10" aria-labelledby="activity-title">
                <SectionHeading
                  eyebrow="Immutable history"
                  title="Coin activity"
                  description="Pending, earned, reserved, released, and reversed movements appear here in newest-first order."
                  icon={<History className="h-5 w-5" aria-hidden="true" />}
                />
                {transactions.length ? (
                  <div className="mt-5 overflow-hidden rounded-[28px] border border-line bg-white shadow-elevated">
                    <ol className="divide-y divide-line">
                      {transactions.map((transaction) => (
                        <TransactionRow key={transaction.ledger_id} transaction={transaction} />
                      ))}
                    </ol>
                    {transactionsQuery.hasNextPage && (
                      <div className="border-t border-line bg-surface-muted/40 p-4 text-center">
                        <button
                          type="button"
                          onClick={() => void transactionsQuery.fetchNextPage()}
                          disabled={transactionsQuery.isFetchingNextPage}
                          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-extrabold text-white transition hover:bg-brand-900 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
                        >
                          {transactionsQuery.isFetchingNextPage && <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />}
                          {transactionsQuery.isFetchingNextPage ? 'Loading activity' : 'Load more activity'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <EmptyPanel icon={<History className="h-6 w-6" />} title="Your coin story starts here" description="Eligible order activity will appear once the loyalty rollout is live for your account." />
                )}
              </section>

              <TrustStrip />
            </>
          )}
        </div>
      </main>
    </ProfileRouteGuard>
  );
}

function WalletHero({
  status,
  available,
  pending,
  reserved,
  lifetime,
}: {
  status: string;
  available: number;
  pending: number;
  reserved: number;
  lifetime: number;
}) {
  const enrolled = status !== 'NOT_ENROLLED';
  return (
    <section className="relative overflow-hidden rounded-[36px] bg-[radial-gradient(circle_at_80%_15%,rgba(251,191,36,0.22),transparent_24%),linear-gradient(135deg,#082f2b_0%,#0e4b47_46%,#0c7c72_100%)] p-6 text-white shadow-[0_35px_90px_-38px_rgba(8,47,43,0.95)] sm:p-9 lg:p-11">
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[46px] border-white/[0.045]" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-[-7rem] left-[38%] h-64 w-64 rounded-full bg-brand-300/10 blur-3xl" aria-hidden="true" />
      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)] lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand-100 backdrop-blur-xl">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Verified wallet
            </span>
            <span className="rounded-full bg-amber-300 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-950">
              {enrolled ? status.replaceAll('_', ' ') : 'Ready to begin'}
            </span>
          </div>
          <p className="mt-10 text-xs font-extrabold uppercase tracking-[0.22em] text-white/55">Available Mangaale Coins</p>
          <div className="mt-2 flex items-end gap-3">
            <span className="text-7xl font-extrabold leading-none tracking-[-0.08em] sm:text-8xl">{formatPoints(available)}</span>
            <span className="mb-2 inline-flex items-center gap-1.5 text-sm font-bold text-amber-200"><Coins className="h-5 w-5" aria-hidden="true" /> coins</span>
          </div>
          <p className="mt-5 max-w-xl text-sm font-medium leading-6 text-emerald-50/70">
            {enrolled
              ? 'Your ledger-backed balance is ready for eligible rewards. All financial effects are validated by Mangaale services.'
              : 'Your secure wallet is ready. It will enrol automatically when an eligible loyalty event is processed.'}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <WalletMetric icon={<Clock3 className="h-4 w-4" />} label="Pending" value={pending} />
          <WalletMetric icon={<LockKeyhole className="h-4 w-4" />} label="Reserved" value={reserved} />
          <WalletMetric icon={<TrendingUp className="h-4 w-4" />} label="Lifetime" value={lifetime} />
        </div>
      </div>
    </section>
  );
}

function WalletMetric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-3 backdrop-blur-xl sm:p-4">
      <div className="text-amber-200">{icon}</div>
      <p className="mt-4 text-xl font-extrabold tracking-tight text-white sm:text-2xl">{formatPoints(value)}</p>
      <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/50 sm:text-[10px]">{label}</p>
    </div>
  );
}

function RewardCard({ reward, balance, featured }: { reward: LoyaltyReward; balance: number; featured: boolean }) {
  const affordable = balance >= reward.points_cost;
  const pointsAway = Math.max(0, reward.points_cost - balance);
  return (
    <article className={`group relative overflow-hidden rounded-[28px] border p-5 transition duration-300 hover:-translate-y-1 hover:shadow-elevated ${featured ? 'border-amber-200 bg-[linear-gradient(145deg,#fffdf6,#fff8dc)]' : 'border-line bg-white'}`}>
      <div className="pointer-events-none absolute -right-9 -top-9 h-28 w-28 rounded-full border-[20px] border-brand-500/[0.045] transition duration-500 group-hover:scale-110" aria-hidden="true" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${featured ? 'bg-amber-300 text-emerald-950' : 'bg-brand-100 text-brand-800'}`}>
            <Gift className="h-6 w-6" aria-hidden="true" />
          </div>
          <span className="rounded-full border border-line bg-white/75 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.14em] text-ink-muted">
            {reward.scope === 'GLOBAL_MANGAALE' ? 'Across Mangaale' : 'At restaurant'}
          </span>
        </div>
        <h3 className="mt-5 text-xl font-extrabold tracking-tight text-ink">{reward.name}</h3>
        <p className="mt-2 min-h-12 text-sm leading-6 text-ink-muted">{reward.description || describeRewardEffect(reward)}</p>
        <div className="mt-5 flex items-end justify-between gap-3 border-t border-line/80 pt-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-subtle">Reward cost</p>
            <p className="mt-1 flex items-center gap-1.5 text-xl font-extrabold text-ink"><Coins className="h-4 w-4 text-amber-500" /> {formatPoints(reward.points_cost)}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-extrabold ${affordable ? 'bg-brand-100 text-brand-800' : 'bg-surface-muted text-ink-muted'}`}>
            {affordable ? <><Check className="h-3.5 w-3.5" /> In reach</> : `${formatPoints(pointsAway)} away`}
          </span>
        </div>
        <p className="mt-4 flex items-center gap-2 text-[11px] font-semibold leading-5 text-ink-muted"><LockKeyhole className="h-3.5 w-3.5 shrink-0 text-brand-700" /> Secure redemption will appear only at an eligible checkout.</p>
      </div>
    </article>
  );
}

function TransactionRow({ transaction }: { transaction: LoyaltyTransaction }) {
  const delta = primaryDelta(transaction);
  const positive = delta > 0;
  const neutral = delta === 0;
  return (
    <li className="flex items-center gap-4 px-4 py-4 sm:px-6 sm:py-5">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${positive ? 'bg-brand-100 text-brand-800' : neutral ? 'bg-surface-muted text-ink-muted' : 'bg-cherry-50 text-cherry-700'}`}>
        {positive ? <TrendingUp className="h-5 w-5" aria-hidden="true" /> : <WalletCards className="h-5 w-5" aria-hidden="true" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-extrabold text-ink">{transactionTitle(transaction.type)}</p>
        <p className="mt-1 truncate text-xs font-medium text-ink-muted">{transactionSubtitle(transaction)} · {formatDate(transaction.occurred_at)}</p>
      </div>
      <p className={`shrink-0 text-base font-extrabold ${positive ? 'text-brand-700' : neutral ? 'text-ink-muted' : 'text-cherry-700'}`}>
        {positive ? '+' : ''}{formatPoints(delta)}
      </p>
    </li>
  );
}

function SectionHeading({ eyebrow, title, description, icon }: { eyebrow: string; title: string; description: string; icon: ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink text-amber-300 shadow-card">{icon}</div>
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand-700">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.035em] text-ink sm:text-3xl">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-muted">{description}</p>
      </div>
    </div>
  );
}

function TrustStrip() {
  return (
    <section className="mt-10 grid gap-3 rounded-[28px] border border-brand-200 bg-brand-50 p-5 sm:grid-cols-3 sm:p-6" aria-label="Rewards safeguards">
      <TrustItem icon={<ShieldCheck className="h-5 w-5" />} title="Ledger backed" text="No client-calculated balances" />
      <TrustItem icon={<LockKeyhole className="h-5 w-5" />} title="Secure checkout" text="No public redemption endpoint" />
      <TrustItem icon={<RefreshCw className="h-5 w-5" />} title="Retry safe" text="Idempotent reward processing" />
    </section>
  );
}

function TrustItem({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <div className="flex gap-3 rounded-2xl bg-white/70 p-4"><div className="text-brand-700">{icon}</div><div><h3 className="text-sm font-extrabold text-ink">{title}</h3><p className="mt-1 text-xs leading-5 text-ink-muted">{text}</p></div></div>;
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between"><p><strong>Rewards could not refresh.</strong> {friendlyError(message)}</p><button type="button" onClick={onRetry} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-950 px-4 font-extrabold text-white"><RefreshCw className="h-4 w-4" /> Retry</button></div>;
}

function EmptyPanel({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return <div className="mt-5 rounded-[28px] border border-dashed border-line-strong bg-white/70 p-8 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-800">{icon}</div><h3 className="mt-4 text-lg font-extrabold text-ink">{title}</h3><p className="mx-auto mt-1 max-w-md text-sm leading-6 text-ink-muted">{description}</p></div>;
}

function LoyaltySkeleton() {
  return <div className="space-y-8" aria-label="Loading rewards"><div className="h-[360px] animate-pulse rounded-[36px] bg-brand-900/90" /><div className="grid gap-4 md:grid-cols-3"><div className="h-64 animate-pulse rounded-[28px] bg-white" /><div className="h-64 animate-pulse rounded-[28px] bg-white" /><div className="h-64 animate-pulse rounded-[28px] bg-white" /></div></div>;
}

function LoyaltyUnavailable() {
  return <main className="min-h-[70vh] bg-canvas px-4 py-16"><div className="mx-auto max-w-md rounded-[28px] border border-line bg-white p-8 text-center shadow-elevated"><Gift className="mx-auto h-10 w-10 text-brand-700" /><h1 className="mt-5 text-2xl font-extrabold text-ink">Rewards are being prepared</h1><p className="mt-2 text-sm leading-6 text-ink-muted">Mangaale will enable the new wallet after the controlled rollout checks are complete.</p><Link href="/restaurants" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-900 px-5 text-sm font-extrabold text-white">Explore restaurants <ArrowRight className="h-4 w-4" /></Link></div></main>;
}

function formatPoints(value: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
}

function describeRewardEffect(reward: LoyaltyReward) {
  const amount = reward.effect?.discount_minor;
  const currency = reward.effect?.currency;
  if (typeof amount === 'number' && typeof currency === 'string') {
    try {
      return `${new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount / 100)} off an eligible order.`;
    } catch {
      return 'A fixed discount on an eligible order.';
    }
  }
  return 'A verified reward for an eligible Mangaale order.';
}

function primaryDelta(transaction: LoyaltyTransaction) {
  if (transaction.available_delta) return transaction.available_delta;
  if (transaction.pending_delta) return transaction.pending_delta;
  if (transaction.reserved_delta) return transaction.reserved_delta;
  return transaction.debt_delta ? -transaction.debt_delta : 0;
}

function transactionTitle(type: string) {
  const labels: Record<string, string> = {
    PENDING_EARN: 'Coins pending',
    EARN: 'Coins earned',
    PENDING_RELEASE: 'Pending coins released',
    REDEEM_RESERVE: 'Reward reserved',
    REDEEM_CAPTURE: 'Reward redeemed',
    REDEEM_RELEASE: 'Reservation released',
    REVERSAL: 'Coin adjustment',
    EXPIRATION: 'Coins expired',
  };
  return labels[type] || type.toLowerCase().replaceAll('_', ' ').replace(/^./, (letter) => letter.toUpperCase());
}

function transactionSubtitle(transaction: LoyaltyTransaction) {
  if (transaction.order_id) return `Order ${transaction.order_id}`;
  if (transaction.restaurant_id) return `Restaurant ${transaction.restaurant_id}`;
  return transaction.funding_source === 'MANGAALE' ? 'Mangaale funded' : 'Loyalty wallet';
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function friendlyError(message: string) {
  if (message === 'temporarily_unavailable') return 'The loyalty service is temporarily unavailable. Your order flow is unaffected.';
  return message;
}
