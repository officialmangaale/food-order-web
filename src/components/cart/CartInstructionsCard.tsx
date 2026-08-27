'use client';

import { AlignLeft } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Input';

interface CartInstructionsCardProps {
  value: string;
  onChange: (value: string) => void;
}

const MAX_LENGTH = 300;

export function CartInstructionsCard({ value, onChange }: CartInstructionsCardProps) {
  return (
    <Card as="section">
      <CardHeader
        title="Special instructions"
        icon={<AlignLeft className="h-5 w-5" aria-hidden="true" />}
      />
      <div className="mt-4">
        <Textarea
          id="cart-special-instructions"
          aria-label="Special instructions"
          value={value}
          maxLength={MAX_LENGTH}
          rows={4}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Allergies? Extra napkins? Let us know..."
        />
        <p className="mt-1.5 text-right text-xs font-semibold text-ink-subtle">
          {value.length}/{MAX_LENGTH}
        </p>
      </div>
    </Card>
  );
}
