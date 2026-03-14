import { cn } from '@/utils/cn'

export interface TabItem {
  value: string
  label: string
}

interface TabsProps {
  items: TabItem[]
  value: string
  onChange: (value: string) => void
}

export function Tabs({ items, value, onChange }: TabsProps) {
  return (
    <div className="inline-flex rounded-lg border border-brand-blue/20 bg-white/70 p-1">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            value === item.value ? 'bg-brand-primary text-white' : 'text-text-main hover:bg-brand-blue/10',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
