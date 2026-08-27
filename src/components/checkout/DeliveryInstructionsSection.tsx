'use client';

import { MessageSquareText } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Input';

interface DeliveryInstructionsSectionProps {
  value: string;
  onChange: (value: string) => void;
}

const MAX_INSTRUCTIONS = 300;

export function DeliveryInstructionsSection({
  value,
  onChange,
}: DeliveryInstructionsSectionProps) {
  return (
    <Card as="section">
      <CardHeader
        title="Delivery instructions"
        description="Optional — anything the rider should know."
        icon={<MessageSquareText className="h-5 w-5" aria-hidden="true" />}
      />
      <div className="mt-4">
        <Textarea
          id="delivery-instructions"
          aria-label="Delivery instructions"
          value={value}
          maxLength={MAX_INSTRUCTIONS}
          rows={3}
          onChange={(event) => onChange(event.target.value)}
          placeholder="E.g., Leave at the front desk, call on arrival..."
        />
        <p className="mt-1.5 text-right text-xs font-semibold text-ink-subtle">
          {value.length}/{MAX_INSTRUCTIONS}
        </p>
      </div>
    </Card>
  );
}
