'use client';

import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';

interface CheckoutLoginPromptProps {
  onLogin: () => void;
}

export function CheckoutLoginPrompt({ onLogin }: CheckoutLoginPromptProps) {
  return (
    <Card as="section" tone="brand">
      <CardHeader
        title="Log in to continue"
        description="Verify your phone number to place your order."
        icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
        action={
          <Button variant="primary" size="sm" onClick={onLogin}>
            Log in
          </Button>
        }
      />
    </Card>
  );
}
