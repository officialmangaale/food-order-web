'use client';

import { HelpCircle, XCircle } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface OrderSupportActionsProps {
  cancellable: boolean;
}

export function OrderSupportActions({ cancellable }: OrderSupportActionsProps) {
  const { toast } = useToast();

  return (
    <div className="mt-5 space-y-3">
      <ButtonLink href="/help" variant="outline" size="md" fullWidth>
        <HelpCircle className="h-4 w-4" aria-hidden="true" />
        Contact support
      </ButtonLink>

      {cancellable && (
        <Button
          variant="ghost"
          size="md"
          fullWidth
          onClick={() => toast('Cancel order support is coming soon', 'info')}
        >
          <XCircle className="h-4 w-4" aria-hidden="true" />
          Cancel order
        </Button>
      )}
    </div>
  );
}
