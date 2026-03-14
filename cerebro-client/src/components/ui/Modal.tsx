import type { PropsWithChildren, ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  title: string
  description?: ReactNode
  onClose: () => void
  className?: string
}

export function Modal({
  open,
  title,
  description,
  onClose,
  className,
  children,
}: PropsWithChildren<ModalProps>) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-blue/25 p-4 backdrop-blur-sm">
      <div
        className={cn(
          'w-full max-w-xl animate-slide-up rounded-xl border border-brand-blue/20 bg-white p-5 shadow-glass',
          className,
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-text-main">{title}</h2>
            {description ? <p className="mt-1 text-sm text-text-main/75">{description}</p> : null}
          </div>
          <Button type="button" variant="ghost" onClick={onClose} className="h-8 w-8 p-0" aria-label="Close modal">
            <X size={16} />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}
