'use client';

import { AlertCircle, ArrowRight } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatMoney } from '@/utils/money';

interface CartOrderSummaryProps {
  subtotal: number;
  totalItems: number;
  invalidPrice?: boolean;
  blockedReason?: string;
}

export function CartOrderSummary({
  subtotal,
  totalItems,
  invalidPrice,
  blockedReason,
}: CartOrderSummaryProps) {
  const checkoutDisabled = totalItems <= 0 || invalidPrice || Boolean(blockedReason);

  return (
    <Card as="aside" className="lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:self-start">
      <h2 className="text-section text-ink">Order summary</h2>

      {(invalidPrice || blockedReason) && (
        <div
          role="alert"
          className="mt-4 flex gap-2 rounded-control bg-warning-tint px-3 py-3 text-sm font-semibold text-warning"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            {blockedReason
              ? 'Please clear your mixed restaurant cart before checkout.'
              : 'Some item prices need to be checked before checkout.'}
          </p>
        </div>
      )}

      <dl className="mt-5 space-y-3 text-sm">
        <SummaryRow
          label={`Subtotal (${totalItems} ${totalItems === 1 ? 'item' : 'items'})`}
          value={formatMoney(subtotal)}
        />
        <SummaryRow label="Delivery fee" value="Calculated at checkout" muted />
        <SummaryRow label="Taxes & fees" value="Calculated at checkout" muted />
      </dl>

      <div className="my-5 h-px bg-line" />

      <div className="flex items-baseline justify-between gap-4">
        <span className="text-base font-extrabold text-ink">Estimated total</span>
        <span className="text-title text-ink">{formatMoney(subtotal)}</span>
      </div>

      <ButtonLink
        href="/checkout"
        variant="primary"
        size="lg"
        fullWidth
        disabled={checkoutDisabled}
        className="mt-6"
      >
        Proceed to checkout
        <ArrowRight className="h-5 w-5" aria-hidden="true" />
      </ButtonLink>

      <p className="mt-4 text-xs leading-5 text-ink-subtle">
        Taxes and delivery fees are calculated at checkout. No hidden charges.
      </p>
    </Card>
  );
}

function SummaryRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd
        className={
          muted ? 'shrink-0 text-xs font-semibold text-ink-subtle' : 'shrink-0 font-bold text-ink'
        }
      >
        {value}
      </dd>
    </div>
  );
}
