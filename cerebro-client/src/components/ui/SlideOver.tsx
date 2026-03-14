import type { PropsWithChildren } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from './Button'

interface SlideOverProps {
  open: boolean
  title: string
  onClose: () => void
  side?: 'left' | 'right'
  className?: string
}

export function SlideOver({
  open,
  title,
  onClose,
  side = 'right',
  className,
  children,
}: PropsWithChildren<SlideOverProps>) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35">
      <div
        className={cn(
          'absolute top-0 h-full w-full max-w-lg animate-slide-up overflow-y-auto glass-card p-4',
          side === 'right' ? 'right-0 border-l border-brand-blue/15' : 'left-0 border-r border-brand-blue/15',
          className,
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-main">{title}</h2>
          <Button type="button" variant="ghost" onClick={onClose} aria-label="Close panel" className="h-8 w-8 p-0">
            <X size={16} />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}
