import { Button } from '../ui/Button'

interface ConfirmDialogProps {
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ title, description, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="rounded-xl border border-brand-blue/20 bg-white p-4">
      <h3 className="text-base font-semibold text-text-main">{title}</h3>
      <p className="mt-2 text-sm text-text-main/75">{description}</p>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Confirm
        </Button>
      </div>
    </div>
  )
}
