import type { PropsWithChildren } from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/utils/cn'

interface PublicLayoutProps {
  title: string
  subtitle: string
  className?: string
}

export function PublicLayout({ title, subtitle, className, children }: PropsWithChildren<PublicLayoutProps>) {
  return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className={cn('glass-card w-full max-w-md animate-slide-up p-6', className)}>
        <div className="mb-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-primary text-white">
              <Sparkles size={16} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Cerebro</p>
              <p className="text-sm font-semibold text-text-main">Assessment Platform</p>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-text-main">{title}</h1>
          <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  )
}
