import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-lg border border-brand-blue/20 bg-white/80 px-3 py-2 text-sm text-text-main shadow-sm',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}
