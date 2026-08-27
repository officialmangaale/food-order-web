'use client';

import { Banknote, Check, CreditCard, Smartphone, WalletCards } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader } from '@/components/ui/Card';

export function PaymentMethodSection() {
  return (
    <Card as="section">
      <CardHeader
        title="Payment method"
        description="Cash on delivery is the only method available right now."
        icon={<CreditCard className="h-5 w-5" aria-hidden="true" />}
      />

      <div className="mt-5 space-y-3">
        {/* Selected by default and not changeable — presented as a static
            confirmation rather than a fake radio the customer cannot alter. */}
        <div className="flex items-center gap-3 rounded-card border-2 border-brand-700 bg-brand-50 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-surface text-brand-800">
            <Banknote className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-ink">Cash on delivery</p>
            <p className="mt-0.5 text-sm text-ink-muted">Pay when your order arrives</p>
          </div>
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white"
            aria-hidden="true"
          >
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
          <span className="sr-only">Selected</span>
        </div>

        <ComingSoonMethod icon={<Smartphone className="h-5 w-5" aria-hidden="true" />} title="UPI" />
        <ComingSoonMethod icon={<CreditCard className="h-5 w-5" aria-hidden="true" />} title="Cards" />
        <ComingSoonMethod icon={<WalletCards className="h-5 w-5" aria-hidden="true" />} title="Wallets" />
      </div>
    </Card>
  );
}

function ComingSoonMethod({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-line bg-surface-sunken p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-surface text-ink-subtle">
        {icon}
      </span>
      <p className="min-w-0 flex-1 text-sm font-bold text-ink-muted">{title}</p>
      <Badge variant="default" size="sm">
        Coming soon
      </Badge>
    </div>
  );
}
