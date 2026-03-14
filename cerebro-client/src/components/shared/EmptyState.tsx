interface EmptyStateProps {
  title: string
  description?: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="glass-panel p-8 text-center">
      <h3 className="text-lg font-semibold text-text-main">{title}</h3>
      {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
    </div>
  )
}
