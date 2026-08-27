'use client';

import { type ReactNode } from 'react';

type Tone = 'surface' | 'sunken' | 'brand' | 'offer' | 'warning' | 'danger' | 'success';

const toneClasses: Record<Tone, string> = {
  surface: 'border-line bg-surface',
  sunken: 'border-line bg-surface-sunken',
  brand: 'border-brand-200 bg-brand-50',
  offer: 'border-cherry-200 bg-cherry-50',
  warning: 'border-amber-200 bg-warning-tint',
  danger: 'border-red-200 bg-danger-tint',
  success: 'border-green-200 bg-success-tint',
};

interface CardProps {
  children: ReactNode;
  className?: string;
  /** `true` uses the standard card padding; `false` opts out (media-first cards). */
  padding?: boolean;
  tone?: Tone;
  /** Adds elevation + hover lift. Use for cards that are themselves links. */
  interactive?: boolean;
  onClick?: () => void;
  as?: 'div' | 'article' | 'section' | 'aside';
}

/**
 * The one card surface. Radius, border, shadow and padding all come from
 * tokens so every card in the app matches.
 */
export function Card({
  children,
  className = '',
  padding = true,
  tone = 'surface',
  interactive,
  onClick,
  as: Tag = 'div',
}: CardProps) {
  const clickable = Boolean(onClick);

  return (
    <Tag
      className={[
        'rounded-card border shadow-card',
        toneClasses[tone],
        padding ? 'p-4 sm:p-5' : '',
        interactive || clickable ? 'card-hover hover:border-line-interactive' : '',
        clickable ? 'cursor-pointer' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  /** Optional leading icon slot, rendered in a tinted well. */
  icon?: ReactNode;
  className?: string;
}

/** Consistent card title block — used by every checkout/profile/cart section. */
export function CardHeader({ title, description, action, icon, className = '' }: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-800">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-extrabold leading-snug text-ink sm:text-lg">{title}</h2>
          {description && (
            <p className="mt-1 text-sm leading-6 text-ink-muted">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
