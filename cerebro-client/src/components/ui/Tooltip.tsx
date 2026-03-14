import type { PropsWithChildren } from 'react'
import { cn } from '@/utils/cn'

interface TooltipProps {
  text: string
  className?: string
}

export function Tooltip({ text, className, children }: PropsWithChildren<TooltipProps>) {
  return (
    <span className={cn('group relative inline-flex', className)}>
      {children}
      <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white group-hover:block">
        {text}
      </span>
    </span>
  )
}
