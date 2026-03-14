import { LoaderCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/utils/cn'

interface LoadingStateProps {
  message?: string
  className?: string
}

export function LoadingState({ message = 'Loading...', className }: LoadingStateProps) {
  return (
    <div className={cn('glass-panel flex items-center justify-center gap-2 p-6 text-sm text-slate-700', className)}>
      <LoaderCircle size={16} className="animate-spin text-brand-primary" />
      <span>{message}</span>
    </div>
  )
}

export function PageLoadingState() {
  return (
    <div className="space-y-3 p-4 md:p-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}
