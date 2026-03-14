import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full rounded-lg border border-brand-blue/20 bg-white/80 px-3 py-2 text-sm text-text-main shadow-sm',
        className,
      )}
      {...props}
    />
  )
}
