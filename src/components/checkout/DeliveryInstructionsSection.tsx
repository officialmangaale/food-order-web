'use client';

import { MessageSquareText } from 'lucide-react';

interface DeliveryInstructionsSectionProps {
  value: string;
  onChange: (value: string) => void;
}

const MAX_INSTRUCTIONS = 300;

export function DeliveryInstructionsSection({ value, onChange }: DeliveryInstructionsSectionProps) {
  return (
    <section className="rounded-2xl border border-[#F0DADA] bg-white p-5 shadow-[0_12px_30px_rgba(123,35,35,0.05)] sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <MessageSquareText className="h-6 w-6 text-[#B31317]" aria-hidden="true" />
        <h2 className="text-2xl font-extrabold tracking-normal text-[#1F1717]">Delivery Instructions</h2>
      </div>
      <label htmlFor="delivery-instructions" className="sr-only">
        Delivery Instructions
      </label>
      <textarea
        id="delivery-instructions"
        value={value}
        maxLength={MAX_INSTRUCTIONS}
        onChange={(event) => onChange(event.target.value)}
        placeholder="E.g., Leave at the front desk, call upon arrival..."
        className="min-h-28 w-full resize-none rounded-xl border border-[#E7B8B3] bg-[#FFF4F2] px-4 py-3 text-base text-[#2B2020] outline-none transition placeholder:text-[#B29B9B] focus:border-[#B31317] focus:bg-white focus:ring-4 focus:ring-[#B31317]/10"
      />
      <p className="mt-2 text-right text-xs font-semibold text-[#8A6B6B]">
        {value.length}/{MAX_INSTRUCTIONS}
      </p>
    </section>
  );
}
