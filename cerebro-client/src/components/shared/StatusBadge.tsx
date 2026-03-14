interface StatusBadgeProps {
  value: string
}

export function StatusBadge({ value }: StatusBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
      {value}
    </span>
  )
}
