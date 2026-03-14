import type { HTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '../../utils/cn'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'default' | 'success' | 'warning' | 'danger'
}

export function Badge({
  children,
  className,
  tone = 'default',
  ...props
}: PropsWithChildren<BadgeProps>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold',
        tone === 'default' && 'bg-black/10 text-text-main',
        tone === 'success' && 'bg-green-100 text-green-800',
        tone === 'warning' && 'bg-amber-100 text-amber-800',
        tone === 'danger' && 'bg-red-100 text-red-800',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
