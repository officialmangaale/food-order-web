'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  'aria-label'?: string;
}

const variantClasses: Record<Variant, string> = {
  primary: 'border border-transparent bg-brand-500 text-white shadow-brand hover:bg-brand-600 active:bg-brand-700',
  secondary: 'border border-brand-100 bg-brand-50 text-brand-900 hover:border-brand-200 hover:bg-brand-100 active:bg-brand-200',
  outline: 'border border-line-strong bg-white text-ink hover:border-brand-300 hover:bg-brand-50 hover:text-brand-900 active:bg-brand-100',
  ghost: 'border border-transparent text-ink-muted hover:bg-brand-50 hover:text-brand-900 active:bg-brand-100',
  danger: 'border border-transparent bg-danger text-white shadow-sm hover:bg-red-600 active:bg-red-700',
};

const sizeClasses: Record<Size, string> = {
  sm: 'min-h-10 rounded-full px-4 py-1.5 text-sm',
  md: 'min-h-11 rounded-full px-5 py-2.5 text-[15px]',
  lg: 'min-h-[52px] rounded-full px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, className = '', children, disabled, type = 'button', onClick, ...rest }, ref) => {
    return (
      <motion.button
        ref={ref}
        type={type}
        whileTap={{ scale: 0.97 }}
        className={`
          inline-flex cursor-pointer select-none items-center justify-center gap-2 font-bold
          transition-[color,background-color,border-color,box-shadow,transform] duration-150
          focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20
          disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        disabled={disabled || loading}
        onClick={onClick}
        aria-label={rest['aria-label']}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
