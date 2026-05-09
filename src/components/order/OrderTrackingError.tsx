'use client';

import Link from 'next/link';
import { AlertTriangle, LogIn, RotateCcw } from 'lucide-react';

interface OrderTrackingErrorProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  showHomeLink?: boolean;
  login?: boolean;
}

export function OrderTrackingError({
  title,
  message,
  actionLabel = 'Retry',
  onAction,
  showHomeLink,
  login,
}: OrderTrackingErrorProps) {
  return (
    <main className="min-h-screen bg-[#FFF7F5]">
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-[720px] items-center px-4 py-12 sm:px-6">
        <section className="w-full rounded-2xl border border-[#F0DADA] bg-white p-8 text-center shadow-[0_18px_46px_rgba(123,35,35,0.08)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF0F0] text-[#A80F15]">
            {login ? <LogIn className="h-7 w-7" aria-hidden="true" /> : <AlertTriangle className="h-7 w-7" aria-hidden="true" />}
          </div>
          <h1 className="mt-5 text-3xl font-extrabold tracking-normal text-[#1F1717]">{title}</h1>
          <p className="mx-auto mt-3 max-w-md text-base font-medium text-[#6B4B4B]">{message}</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            {onAction && (
              <button
                type="button"
                onClick={onAction}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#A80F15] px-6 text-base font-bold text-white shadow-sm transition hover:bg-[#8F0D12]"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {actionLabel}
              </button>
            )}
            {showHomeLink && (
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#E8B9B9] bg-white px-6 text-base font-bold text-[#A80F15] transition hover:bg-[#FFF0F0]"
              >
                Back to Home
              </Link>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
