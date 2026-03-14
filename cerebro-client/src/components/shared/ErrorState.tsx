import { Button } from '../ui/Button'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="glass-panel p-8 text-center">
      <h3 className="text-lg font-semibold text-status-error">Something went wrong</h3>
      <p className="mt-2 text-sm text-slate-700">{message}</p>
      {onRetry ? (
        <div className="mt-4">
          <Button onClick={onRetry}>Retry</Button>
        </div>
      ) : null}
    </div>
  )
}
