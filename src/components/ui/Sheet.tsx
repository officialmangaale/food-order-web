'use client';

import { useEffect, useId, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { useDialogFocus } from '@/hooks/useDialogFocus';

type SheetSize = 'sm' | 'md' | 'lg';

const sizeClasses: Record<SheetSize, string> = {
  sm: 'sm:max-w-[420px]',
  md: 'sm:max-w-[520px]',
  lg: 'sm:max-w-[680px]',
};

/** Locks background scroll while any sheet is open, without layout shift. */
function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const { body, documentElement } = document;
    const scrollBarWidth = window.innerWidth - documentElement.clientWidth;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;

    body.style.overflow = 'hidden';
    if (scrollBarWidth > 0) {
      body.style.paddingRight = `${scrollBarWidth}px`;
    }

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [active]);
}

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  /** Pinned to the bottom of the panel, outside the scroll area. */
  footer?: ReactNode;
  size?: SheetSize;
  /** Hides the default close button for flows that must be completed. */
  hideCloseButton?: boolean;
  className?: string;
}

/**
 * The single dialog surface: a bottom sheet on mobile, a centred modal from
 * `sm` up. Replaces six separately-styled overlays across auth, location,
 * item customisation, address entry, cart conflict and confirmation.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  hideCloseButton,
  className = '',
}: SheetProps) {
  const dialogRef = useDialogFocus<HTMLDivElement>({ open, onClose });
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const descriptionId = useId();

  useScrollLock(open);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : 'Dialog'}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: '100%' }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: '100%' }}
            transition={
              reduceMotion
                ? { duration: 0.15 }
                : { type: 'spring', stiffness: 380, damping: 34 }
            }
            className={[
              'absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col overflow-hidden',
              'rounded-t-sheet border border-line bg-surface shadow-floating',
              'sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[88dvh] sm:w-[calc(100vw-3rem)]',
              'sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-sheet',
              sizeClasses[size],
              className,
            ].join(' ')}
          >
            {/* Grab handle — mobile affordance only. */}
            <div className="flex justify-center pt-3 sm:hidden" aria-hidden="true">
              <span className="h-1 w-10 rounded-full bg-line-strong" />
            </div>

            {(title || !hideCloseButton) && (
              <header className="flex items-start justify-between gap-4 px-5 pb-4 pt-4 sm:px-6 sm:pt-6">
                <div className="min-w-0">
                  {title && (
                    <h2 id={titleId} className="text-lg font-extrabold text-ink sm:text-xl">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id={descriptionId} className="mt-1 text-sm leading-6 text-ink-muted">
                      {description}
                    </p>
                  )}
                </div>
                {!hideCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="-mr-1 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-700/25"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
              </header>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6">
              {children}
            </div>

            {footer && (
              <div className="safe-bottom border-t border-line bg-surface px-5 py-4 sm:px-6">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
