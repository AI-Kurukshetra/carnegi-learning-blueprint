import { AiBadge } from './AiBadge'

interface HintCardProps {
  hint: string
  level: number
}

export function HintCard({ hint, level }: HintCardProps) {
  return (
    <div className="glass-panel p-3">
      <div className="mb-2 flex items-center justify-between">
        <strong className="text-sm text-text-main">Hint Level {level}</strong>
        <AiBadge />
      </div>
      <p className="text-sm text-slate-700">{hint}</p>
    </div>
  )
}
