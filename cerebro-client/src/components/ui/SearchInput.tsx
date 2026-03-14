import { Search } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export function SearchInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
      <input
        className="w-full rounded-lg border border-brand-blue/20 bg-white/80 py-2 pl-9 pr-3 text-sm text-text-main"
        {...props}
      />
    </div>
  )
}
