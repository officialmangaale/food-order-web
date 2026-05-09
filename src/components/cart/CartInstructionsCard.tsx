'use client';

import { AlignLeft } from 'lucide-react';

interface CartInstructionsCardProps {
  value: string;
  onChange: (value: string) => void;
}

const MAX_LENGTH = 300;

export function CartInstructionsCard({ value, onChange }: CartInstructionsCardProps) {
  return (
    <section className="rounded-2xl border border-[#F0DADA] bg-white p-5 shadow-[0_16px_40px_rgba(123,35,35,0.05)] sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <AlignLeft className="h-5 w-5 text-[#A80F15]" aria-hidden="true" />
        <h2 className="text-xl font-extrabold tracking-normal text-[#1F1717]">Special Instructions</h2>
      </div>
      <label htmlFor="cart-special-instructions" className="sr-only">
        Special Instructions
      </label>
      <textarea
        id="cart-special-instructions"
        value={value}
        maxLength={MAX_LENGTH}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Allergies? Extra napkins? Let us know..."
        className="min-h-32 w-full resize-none rounded-xl border border-[#E7B8B3] bg-[#FFF9F8] px-4 py-3 text-base leading-7 text-[#2B2020] outline-none transition placeholder:text-[#B29B9B] focus:border-[#B31317] focus:bg-white focus:ring-4 focus:ring-[#B31317]/10"
      />
      <p className="mt-2 text-right text-xs font-semibold text-[#8A6B6B]">
        {value.length}/{MAX_LENGTH}
      </p>
    </section>
  );
}
