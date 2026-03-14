interface MasteryBarProps {
  value: number
}

export function MasteryBar({ value }: MasteryBarProps) {
  const normalized = Math.max(0, Math.min(1, value))
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div className="h-full rounded-full bg-brand-secondary transition-all" style={{ width: `${normalized * 100}%` }} />
    </div>
  )
}
