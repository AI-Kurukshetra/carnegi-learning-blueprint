import type { PropsWithChildren, ReactNode } from 'react'

interface FormFieldProps {
  label: string
  error?: string
  hint?: ReactNode
}

export function FormField({ label, error, hint, children }: PropsWithChildren<FormFieldProps>) {
  return (
    <label className="flex w-full flex-col gap-2 text-sm font-medium text-text-main">
      <span>{label}</span>
      {children}
      {hint ? <span className="text-xs text-text-main/65">{hint}</span> : null}
      {error ? <span className="text-xs text-status-error">{error}</span> : null}
    </label>
  )
}
