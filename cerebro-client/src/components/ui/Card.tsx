import type { HTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '../../utils/cn'

export function Card({ children, className, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div className={cn('glass-card p-4', className)} {...props}>
      {children}
    </div>
  )
}
