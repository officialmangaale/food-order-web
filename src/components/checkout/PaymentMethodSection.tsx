'use client';

import { Banknote, CheckCircle2, CreditCard, Smartphone, WalletCards } from 'lucide-react';

export function PaymentMethodSection() {
  return (
    <section className="rounded-2xl border border-[#F0DADA] bg-white p-5 shadow-[0_12px_30px_rgba(123,35,35,0.05)] sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <CreditCard className="h-6 w-6 text-[#B31317]" aria-hidden="true" />
        <h2 className="text-2xl font-extrabold tracking-normal text-[#1F1717]">Payment Method</h2>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl border-2 border-[#B31317] bg-[#FFF0F0] p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#A80F15]">
              <Banknote className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-[#1F1717]">Cash on Delivery</p>
              <p className="mt-0.5 text-sm text-[#6B4B4B]">Pay when your order arrives</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-[#16823A]" aria-hidden="true" />
          </div>
        </div>

        <ComingSoonMethod icon={<Smartphone className="h-5 w-5" aria-hidden="true" />} title="UPI" />
        <ComingSoonMethod icon={<CreditCard className="h-5 w-5" aria-hidden="true" />} title="Cards" />
        <ComingSoonMethod icon={<WalletCards className="h-5 w-5" aria-hidden="true" />} title="Wallets" />
      </div>
    </section>
  );
}

function ComingSoonMethod({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#E8D1D1] bg-[#FAF7F7] p-4 text-[#9A8585]">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#A89090]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold">{title}</p>
      </div>
      <span className="rounded-full bg-[#EFE7E7] px-2.5 py-1 text-xs font-extrabold text-[#8A7777]">
        Coming soon
      </span>
    </div>
  );
}
