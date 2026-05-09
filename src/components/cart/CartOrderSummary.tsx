'use client';

import Link from 'next/link';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { formatMoney } from '@/utils/money';

interface CartOrderSummaryProps {
  subtotal: number;
  totalItems: number;
  invalidPrice?: boolean;
  blockedReason?: string;
}

export function CartOrderSummary({ subtotal, totalItems, invalidPrice, blockedReason }: CartOrderSummaryProps) {
  const checkoutDisabled = totalItems <= 0 || invalidPrice || Boolean(blockedReason);

  return (
    <aside className="rounded-2xl border border-[#F0DADA] bg-white p-5 shadow-[0_18px_42px_rgba(123,35,35,0.08)] lg:sticky lg:top-32 sm:p-6">
      <h2 className="text-2xl font-extrabold tracking-normal text-[#1F1717]">Order Summary</h2>
      <div className="mt-4 h-px bg-[#F1DEDE]" />

      {(invalidPrice || blockedReason) && (
        <div className="mt-5 flex gap-2 rounded-xl bg-amber-50 px-3 py-3 text-sm font-semibold text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            {blockedReason
              ? 'Please clear your mixed restaurant cart before checkout.'
              : 'Some item prices need to be checked before checkout.'}
          </p>
        </div>
      )}

      <div className="mt-6 space-y-4 text-base text-[#3A2727]">
        <SummaryRow label="Subtotal" value={formatMoney(subtotal)} />
        <SummaryRow label="Delivery Fee" value="At checkout" muted />
        <SummaryRow label="Taxes & Fees" value="At checkout" muted />
      </div>

      <div className="my-6 h-px bg-[#F1DEDE]" />

      <div className="flex items-end justify-between gap-4">
        <span className="text-xl font-extrabold text-[#1F1717]">Estimated Total</span>
        <span className="text-4xl font-extrabold tracking-normal text-[#1F1717]">
          {formatMoney(subtotal)}
        </span>
      </div>

      {checkoutDisabled ? (
        <button
          type="button"
          disabled
          className="mt-8 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[#C7B5B5] px-6 py-3.5 text-lg font-semibold text-white"
        >
          Proceed to Checkout
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </button>
      ) : (
        <Link
          href="/checkout"
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[#A80F15] px-6 py-3.5 text-lg font-semibold text-white shadow-[0_12px_22px_rgba(168,15,21,0.2)] transition hover:bg-[#8F0D12]"
        >
          Proceed to Checkout
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      )}

      <p className="mt-5 text-sm leading-6 text-[#6B4B4B]">
        Taxes and delivery fees are calculated at checkout.
      </p>
    </aside>
  );
}

function SummaryRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span>{label}</span>
      <span className={muted ? 'text-sm font-semibold text-[#8A6B6B]' : 'font-bold text-[#1F1717]'}>
        {value}
      </span>
    </div>
  );
}
