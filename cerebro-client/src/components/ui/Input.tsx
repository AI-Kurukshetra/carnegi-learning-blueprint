import type { InputHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-lg border border-brand-blue/20 bg-white/85 px-3 py-2 text-sm text-text-main',
        className,
      )}
      {...props}
    />
  )
}
