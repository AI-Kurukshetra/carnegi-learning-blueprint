import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '../../utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning'
}

export function Button({
  variant = 'primary',
  className,
  children,
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
        variant === 'primary' && 'bg-brand-primary text-white shadow-sm hover:bg-blue-700 active:bg-blue-800',
        variant === 'secondary' &&
          'border border-brand-blue/25 bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/15',
        variant === 'ghost' && 'bg-transparent text-brand-blue hover:bg-brand-blue/10',
        variant === 'danger' && 'bg-status-error text-white hover:opacity-90',
        variant === 'warning' && 'bg-vivid-orange text-white hover:opacity-90',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
