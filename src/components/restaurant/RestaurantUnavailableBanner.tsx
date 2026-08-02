'use client';

import { AlertCircle } from 'lucide-react';

interface RestaurantUnavailableBannerProps {
  messages: string[];
}

export function RestaurantUnavailableBanner({ messages }: RestaurantUnavailableBannerProps) {
  if (messages.length === 0) return null;

  return (
    <div className="border-b border-[#F1D7D7] bg-[#FFF7F5]">
      <div className="mx-auto flex max-w-[1280px] items-start gap-3 px-4 py-4 text-[#7A1F1F] sm:px-6 lg:px-8">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FBE3DF]">
          <AlertCircle className="h-4 w-4 text-[#EF4444]" aria-hidden="true" />
        </div>
        <div>
          <p className="font-bold">{messages[0]}</p>
          {messages.slice(1).map((message) => (
            <p key={message} className="mt-0.5 text-sm text-[#8A5555]">
              {message}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
