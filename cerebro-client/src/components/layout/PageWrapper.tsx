import type { PropsWithChildren } from 'react'
import { cn } from '@/utils/cn'

interface PageWrapperProps {
  className?: string
}

export function PageWrapper({ className, children }: PropsWithChildren<PageWrapperProps>) {
  return <div className={cn('mx-auto w-full max-w-7xl p-4 md:p-6', className)}>{children}</div>
}
