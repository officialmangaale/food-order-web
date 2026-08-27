'use client';

import { type ReactNode } from 'react';
import { Sheet } from '@/components/ui/Sheet';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
}

/** Thin wrapper over Sheet, kept so existing call sites stay unchanged. */
export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  children,
}: ConfirmDialogProps) {
  return (
    <Sheet open={open} onClose={onClose} title={title} description={description} size="sm">
      {children}
    </Sheet>
  );
}
