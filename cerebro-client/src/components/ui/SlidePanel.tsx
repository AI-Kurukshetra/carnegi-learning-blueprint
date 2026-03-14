import { useEffect, type PropsWithChildren } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from './Button'

interface SlidePanelProps {
  open: boolean
  title: string
  onClose: () => void
  className?: string
}

export function SlidePanel({
  open,
  title,
  onClose,
  className,
  children,
}: PropsWithChildren<SlidePanelProps>) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [open])

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-brand-blue/20 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-brand-blue/15 bg-white shadow-xl transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-text-main">{title}</h2>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8 p-0"
            aria-label="Close panel"
          >
            <X size={16} />
          </Button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
      </aside>
    </>
  )
}
